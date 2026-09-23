import { v4 as uuid } from 'uuid';
import { supabase } from '../../db/supabase';
import { AuthenticatedUser, DailyRouteAssignment } from '../../types';
import { CatalogService } from '../catalog/catalog.service';
import { badRequest, conflict, forbidden, notFound } from '../../utils/http-error';
import { AdminListQuery, TakeRoutePointInput, UpdateAssignmentInput } from './daily-routes.schemas';
import { DailyRouteAssignmentRow, toAssignment } from './daily-routes.mapper';

const FOTOS_BUCKET = 'fiscalizacion-fotos';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour — plenty for a single page view; regenerated on every fetch.

export class DailyRoutesService {
  constructor(private readonly catalogService: CatalogService) {}

  async listMine(inspectorId: string, fecha: string): Promise<DailyRouteAssignment[]> {
    const { data, error } = await supabase
      .from('daily_route_assignments')
      .select('*')
      .eq('inspector_id', inspectorId)
      .eq('fecha', fecha)
      .order('created_at');
    if (error) throw error;
    return this.withSignedUrlsMany(((data ?? []) as DailyRouteAssignmentRow[]).map(toAssignment));
  }

  async take(input: TakeRoutePointInput, user: AuthenticatedUser): Promise<DailyRouteAssignment> {
    const routePoint = await this.catalogService.findById(input.routePointId);
    if (!routePoint || routePoint.fecha !== input.fecha) {
      throw notFound('El punto de ruta no existe para la fecha indicada');
    }
    if (routePoint.estadoDisponibilidad !== 'disponible') {
      throw conflict('Este punto de ruta ya fue tomado por otro inspector');
    }
    if (routePoint.assignedInspectorId && routePoint.assignedInspectorId !== user.id) {
      throw forbidden('Este punto fue asignado por el administrador a otro inspector');
    }

    await this.catalogService.markAsTomado(routePoint.id);

    const { data, error } = await supabase
      .from('daily_route_assignments')
      .insert({
        route_point_id: routePoint.id,
        inspector_id: user.id,
        inspector_username: user.username,
        fecha: input.fecha,
        snapshot: {
          sector: routePoint.sector,
          direccion: routePoint.direccion,
          empresaResponsable: routePoint.empresaResponsable,
          tipoExigencia: routePoint.tipoExigencia,
          descripcionExigencia: routePoint.descripcionExigencia,
          ventanaEntrada: routePoint.ventanaEntrada,
          ventanaSalida: routePoint.ventanaSalida
        },
        estado: 'pendiente',
        observaciones: '',
        fiscalizaciones: [],
        updated_by: user.id
      })
      .select()
      .single();
    if (error) throw error;
    return toAssignment(data as DailyRouteAssignmentRow);
  }

  private async findById(id: string): Promise<DailyRouteAssignment | undefined> {
    const { data, error } = await supabase.from('daily_route_assignments').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toAssignment(data as DailyRouteAssignmentRow) : undefined;
  }

  async update(id: string, user: AuthenticatedUser, input: UpdateAssignmentInput): Promise<DailyRouteAssignment> {
    const assignment = await this.findById(id);
    if (!assignment) {
      throw notFound('Registro de ruta diaria no encontrado');
    }
    if (assignment.inspectorId !== user.id) {
      throw forbidden('No puede modificar un registro que no le pertenece');
    }
    if (assignment.estado === 'liberado') {
      throw conflict('Esta ruta ya fue liberada y no puede editarse. Debe volver a tomarla para continuar.');
    }
    if (assignment.estado === 'fiscalizado') {
      throw conflict('Esta ruta ya fue fiscalizada y no puede editarse.');
    }

    const { nuevaFiscalizacion, ...fields } = input;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user.id };
    if (fields.estado !== undefined) patch.estado = fields.estado;
    if (fields.observaciones !== undefined) patch.observaciones = fields.observaciones;
    if (fields.horaLlegada !== undefined) patch.hora_llegada = fields.horaLlegada;
    if (fields.horaSalida !== undefined) patch.hora_salida = fields.horaSalida;

    if (nuevaFiscalizacion) {
      const nextNumero = assignment.fiscalizaciones.length + 1;
      patch.fiscalizaciones = [
        ...assignment.fiscalizaciones,
        { numero: nextNumero, horaRegistro: new Date().toISOString(), comentario: nuevaFiscalizacion.comentario, fotos: [] }
      ];
    }

    const { data, error } = await supabase.from('daily_route_assignments').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return this.withSignedUrls(toAssignment(data as DailyRouteAssignmentRow));
  }

  async release(id: string, user: AuthenticatedUser): Promise<DailyRouteAssignment> {
    const assignment = await this.findById(id);
    if (!assignment) {
      throw notFound('Registro de ruta diaria no encontrado');
    }
    if (assignment.inspectorId !== user.id) {
      throw forbidden('No puede liberar un registro que no le pertenece');
    }
    if (assignment.estado === 'liberado') {
      throw conflict('Esta ruta ya fue liberada');
    }
    if (assignment.estado === 'fiscalizado' || assignment.estado === 'no_corresponde') {
      throw conflict('No se puede liberar una ruta que ya fue cerrada (fiscalizada o marcada como no corresponde)');
    }

    const { data, error } = await supabase
      .from('daily_route_assignments')
      .update({ estado: 'liberado', updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await this.catalogService.markAsDisponible(assignment.routePointId);

    return toAssignment(data as DailyRouteAssignmentRow);
  }

  async listAll(filters: AdminListQuery): Promise<DailyRouteAssignment[]> {
    let query = supabase.from('daily_route_assignments').select('*').order('fecha', { ascending: false });
    if (filters.fecha) {
      query = query.eq('fecha', filters.fecha);
    }
    if (filters.inspectorId) {
      query = query.eq('inspector_id', filters.inspectorId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return this.withSignedUrlsMany(((data ?? []) as DailyRouteAssignmentRow[]).map(toAssignment));
  }

  /**
   * Attaches one or more photos (already validated/parsed by the upload middleware) to a specific
   * fiscalización entry. Additive only — like everything else about a fiscalización, photos are
   * never replaced or removed here, only appended. Allowed regardless of the assignment's current
   * estado (even 'fiscalizado'/'liberado'): a photo is supplementary evidence for a visit that
   * already happened, not a change to any decision field, so the "cierre definitivo" lock on
   * `update()` deliberately doesn't apply to it.
   */
  async addFotos(
    id: string,
    numero: number,
    user: AuthenticatedUser,
    files: Express.Multer.File[]
  ): Promise<DailyRouteAssignment> {
    if (files.length === 0) {
      throw badRequest('Debes adjuntar al menos una foto');
    }

    const assignment = await this.findById(id);
    if (!assignment) {
      throw notFound('Registro de ruta diaria no encontrado');
    }
    if (assignment.inspectorId !== user.id) {
      throw forbidden('No puede modificar un registro que no le pertenece');
    }
    const target = assignment.fiscalizaciones.find((f) => f.numero === numero);
    if (!target) {
      throw notFound(`No existe la fiscalización #${numero} en este registro`);
    }

    const uploadedPaths: string[] = [];
    for (const file of files) {
      const extension = file.originalname.includes('.') ? file.originalname.split('.').pop() : undefined;
      const objectPath = `${id}/${numero}/${uuid()}${extension ? `.${extension}` : ''}`;
      const { error } = await supabase.storage
        .from(FOTOS_BUCKET)
        .upload(objectPath, file.buffer, { contentType: file.mimetype });
      if (error) throw error;
      uploadedPaths.push(objectPath);
    }

    const updatedFiscalizaciones = assignment.fiscalizaciones.map((f) =>
      f.numero === numero ? { ...f, fotos: [...f.fotos, ...uploadedPaths] } : f
    );

    const { data, error } = await supabase
      .from('daily_route_assignments')
      .update({ fiscalizaciones: updatedFiscalizaciones, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.withSignedUrls(toAssignment(data as DailyRouteAssignmentRow));
  }

  /** Replaces each fiscalización's stored photo paths with fresh, short-lived signed URLs the client can render directly. */
  private async withSignedUrls(assignment: DailyRouteAssignment): Promise<DailyRouteAssignment> {
    const paths = assignment.fiscalizaciones.flatMap((f) => f.fotos);
    if (paths.length === 0) {
      return assignment;
    }

    const { data, error } = await supabase.storage.from(FOTOS_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    if (error) throw error;

    // Each entry can fail independently (e.g. an object that was deleted out-of-band from the
    // Supabase dashboard) even when the batch call itself succeeds — drop those rather than error.
    const urlByPath = new Map(
      data.filter((entry): entry is typeof entry & { path: string } => Boolean(entry.path) && !entry.error).map((entry) => [entry.path, entry.signedUrl])
    );
    return {
      ...assignment,
      fiscalizaciones: assignment.fiscalizaciones.map((f) => ({
        ...f,
        fotos: f.fotos.map((path) => urlByPath.get(path)).filter((url): url is string => Boolean(url))
      }))
    };
  }

  private async withSignedUrlsMany(assignments: DailyRouteAssignment[]): Promise<DailyRouteAssignment[]> {
    return Promise.all(assignments.map((assignment) => this.withSignedUrls(assignment)));
  }
}
