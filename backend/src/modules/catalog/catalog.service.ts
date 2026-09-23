import { supabase } from '../../db/supabase';
import { RoutePoint, RoutePointWithAssignee } from '../../types';
import { badRequest, conflict, notFound } from '../../utils/http-error';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { CreateRoutePointInput, UpdateRoutePointInput } from './catalog.schemas';
import { RoutePointRow, toRoutePoint } from './catalog.mapper';

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
        descripcion_exigencia: input.descripcionExigencia,
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
