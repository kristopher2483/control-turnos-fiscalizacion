import { supabase } from '../../db/supabase';
import { RoutePoint, RoutePointWithAssignee } from '../../types';
import { badRequest, conflict, notFound } from '../../utils/http-error';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { CreateRoutePointInput, createRoutePointSchema, UpdateRoutePointInput } from './catalog.schemas';
import { RoutePointRow, toRoutePoint } from './catalog.mapper';
import { isRowBlank, mapRowToFields, parseWorkbookRows } from './catalog-import.util';

export type ImportRowError = { row: number; message: string };
export type ImportResult = { insertedCount: number; errors: ImportRowError[] };

export class CatalogService {
  constructor(private readonly usersService: UsersService, private readonly rolesService: RolesService) {}

  async listByFecha(fecha: string): Promise<RoutePoint[]> {
    const { data, error } = await supabase.from('route_points').select('*').eq('fecha', fecha).order('sector');
    if (error) throw error;
    return ((data ?? []) as RoutePointRow[]).map(toRoutePoint);
  }

  async listByFechaEnriched(fecha: string): Promise<RoutePointWithAssignee[]> {
    const points = await this.listByFecha(fecha);
    return Promise.all(points.map((point) => this.enrich(point)));
  }

  async listByRange(
    fechaDesde: string,
    fechaHasta: string,
    estadoDisponibilidad?: RoutePoint['estadoDisponibilidad']
  ): Promise<RoutePoint[]> {
    let query = supabase
      .from('route_points')
      .select('*')
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha')
      .order('sector');
    if (estadoDisponibilidad) {
      query = query.eq('estado_disponibilidad', estadoDisponibilidad);
    }
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as RoutePointRow[]).map(toRoutePoint);
  }

  async listByRangeEnriched(
    fechaDesde: string,
    fechaHasta: string,
    estadoDisponibilidad?: RoutePoint['estadoDisponibilidad']
  ): Promise<RoutePointWithAssignee[]> {
    const points = await this.listByRange(fechaDesde, fechaHasta, estadoDisponibilidad);
    return Promise.all(points.map((point) => this.enrich(point)));
  }

  private async enrich(point: RoutePoint): Promise<RoutePointWithAssignee> {
    if (!point.assignedInspectorId) {
      return { ...point, assignedInspectorName: null };
    }
    const user = await this.usersService.findUserById(point.assignedInspectorId);
    return { ...point, assignedInspectorName: user?.fullName ?? null };
  }

  private async assertValidAssignee(inspectorId: string | null | undefined): Promise<void> {
    if (!inspectorId) return;
    const user = await this.usersService.findUserById(inspectorId);
    if (!user) {
      throw badRequest('El inspector asignado no existe');
    }
    const role = await this.rolesService.findRoleById(user.roleId);
    if (!role || role.name !== 'inspector') {
      throw badRequest('Solo se puede asignar un punto a un usuario con rol inspector');
    }
  }

  async create(input: CreateRoutePointInput, createdBy: string): Promise<RoutePointWithAssignee> {
    await this.assertValidAssignee(input.assignedInspectorId);

    const { data, error } = await supabase
      .from('route_points')
      .insert({
        fecha: input.fecha,
        dia_programado: input.diaProgramado,
        sector: input.sector,
        direccion: input.direccion,
        empresa_responsable: input.empresaResponsable,
        tipo_exigencia: input.tipoExigencia,
        descripcion_exigencia: input.descripcionExigencia ?? '',
        ventana_entrada: input.ventanaEntrada,
        ventana_salida: input.ventanaSalida,
        vigencia_desde: input.vigenciaDesde,
        vigencia_hasta: input.vigenciaHasta,
        estado_disponibilidad: 'disponible',
        assigned_inspector_id: input.assignedInspectorId ?? null,
        created_by: createdBy
      })
      .select()
      .single();
    if (error) throw error;
    return this.enrich(toRoutePoint(data as RoutePointRow));
  }

  /**
   * Bulk-creates catalog points from an uploaded CSV/XLSX file. Never aborts the whole batch on a
   * bad row — each row is validated and inserted independently, so the admin gets one clean pass:
   * every valid row lands, and every invalid one comes back with a row-numbered reason to fix and
   * re-upload (no partial success left ambiguous, no all-or-nothing rollback wasting the good rows).
   */
  async importFromFile(buffer: Buffer, createdBy: string): Promise<ImportResult> {
    let rawRows: Record<string, unknown>[];
    try {
      rawRows = parseWorkbookRows(buffer);
    } catch (error) {
      throw badRequest(error instanceof Error ? error.message : 'No se pudo leer el archivo');
    }
    if (rawRows.length === 0) {
      throw badRequest('El archivo no contiene filas de datos');
    }

    const users = await this.usersService.listUsers();
    const byUsername = new Map(users.map((u) => [u.username.toLowerCase(), u]));
    const byFullName = new Map(users.map((u) => [u.fullName.toLowerCase(), u]));

    const errors: ImportRowError[] = [];
    let insertedCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const spreadsheetRow = i + 2; // row 1 is the header
      const fields = mapRowToFields(rawRows[i]);
      if (isRowBlank(fields)) continue;

      let assignedInspectorId: string | null = null;
      const inspectorRef = fields.inspectorAsignado?.trim();
      if (inspectorRef) {
        const match = byUsername.get(inspectorRef.toLowerCase()) ?? byFullName.get(inspectorRef.toLowerCase());
        if (!match) {
          errors.push({ row: spreadsheetRow, message: `Inspector "${inspectorRef}" no existe (usa su username o nombre completo)` });
          continue;
        }
        assignedInspectorId = match.id;
      }

      const parsed = createRoutePointSchema.safeParse({
        fecha: fields.fecha,
        diaProgramado: fields.diaProgramado,
        sector: fields.sector,
        direccion: fields.direccion,
        empresaResponsable: fields.empresaResponsable,
        tipoExigencia: fields.tipoExigencia,
        descripcionExigencia: fields.descripcionExigencia,
        ventanaEntrada: fields.ventanaEntrada,
        ventanaSalida: fields.ventanaSalida,
        vigenciaDesde: fields.vigenciaDesde,
        vigenciaHasta: fields.vigenciaHasta,
        assignedInspectorId
      });
      if (!parsed.success) {
        errors.push({ row: spreadsheetRow, message: parsed.error.issues.map((issue) => issue.message).join('; ') });
        continue;
      }

      try {
        await this.create(parsed.data, createdBy);
        insertedCount += 1;
      } catch (error) {
        errors.push({ row: spreadsheetRow, message: error instanceof Error ? error.message : 'Error desconocido al crear el punto' });
      }
    }

    return { insertedCount, errors };
  }

  async findById(id: string): Promise<RoutePoint | undefined> {
    const { data, error } = await supabase.from('route_points').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toRoutePoint(data as RoutePointRow) : undefined;
  }

  async update(id: string, input: UpdateRoutePointInput): Promise<RoutePointWithAssignee> {
    const existing = await this.findById(id);
    if (!existing) {
      throw notFound('Punto de ruta no encontrado');
    }

    if (Object.prototype.hasOwnProperty.call(input, 'assignedInspectorId')) {
      await this.assertValidAssignee(input.assignedInspectorId);
    }

    const vigenciaDesde = input.vigenciaDesde ?? existing.vigenciaDesde;
    const vigenciaHasta = input.vigenciaHasta ?? existing.vigenciaHasta;
    if (vigenciaHasta < vigenciaDesde) {
      throw badRequest('vigenciaHasta no puede ser anterior a vigenciaDesde');
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.fecha !== undefined) patch.fecha = input.fecha;
    if (input.diaProgramado !== undefined) patch.dia_programado = input.diaProgramado;
    if (input.sector !== undefined) patch.sector = input.sector;
    if (input.direccion !== undefined) patch.direccion = input.direccion;
    if (input.empresaResponsable !== undefined) patch.empresa_responsable = input.empresaResponsable;
    if (input.tipoExigencia !== undefined) patch.tipo_exigencia = input.tipoExigencia;
    if (input.descripcionExigencia !== undefined) patch.descripcion_exigencia = input.descripcionExigencia;
    if (input.ventanaEntrada !== undefined) patch.ventana_entrada = input.ventanaEntrada;
    if (input.ventanaSalida !== undefined) patch.ventana_salida = input.ventanaSalida;
    if (input.vigenciaDesde !== undefined) patch.vigencia_desde = input.vigenciaDesde;
    if (input.vigenciaHasta !== undefined) patch.vigencia_hasta = input.vigenciaHasta;
    if (Object.prototype.hasOwnProperty.call(input, 'assignedInspectorId')) {
      patch.assigned_inspector_id = input.assignedInspectorId;
    }

    const { data, error } = await supabase.from('route_points').update(patch).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) {
      throw notFound('Punto de ruta no encontrado');
    }
    return this.enrich(toRoutePoint(data as RoutePointRow));
  }

  async markAsTomado(id: string): Promise<RoutePoint> {
    const existing = await this.findById(id);
    if (!existing) {
      throw notFound('Punto de ruta no encontrado');
    }
    if (existing.estadoDisponibilidad === 'tomado') {
      throw conflict('Este punto de ruta ya fue tomado por otro inspector');
    }
    return this.setDisponibilidad(id, 'tomado');
  }

  async markAsDisponible(id: string): Promise<RoutePoint> {
    const existing = await this.findById(id);
    if (!existing) {
      throw notFound('Punto de ruta no encontrado');
    }
    return this.setDisponibilidad(id, 'disponible');
  }

  private async setDisponibilidad(
    id: string,
    estadoDisponibilidad: RoutePoint['estadoDisponibilidad']
  ): Promise<RoutePoint> {
    const { data, error } = await supabase
      .from('route_points')
      .update({ estado_disponibilidad: estadoDisponibilidad, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toRoutePoint(data as RoutePointRow);
  }
}
