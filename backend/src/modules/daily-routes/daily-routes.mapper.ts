import { DailyRouteAssignment, EstadoDailyRoute, Fiscalizacion } from '../../types';

export interface DailyRouteAssignmentRow {
  id: string;
  route_point_id: string;
  inspector_id: string;
  inspector_username: string;
  fecha: string;
  snapshot: DailyRouteAssignment['snapshot'];
  estado: string;
  observaciones: string;
  fiscalizaciones: (Omit<Fiscalizacion, 'fotos'> & { fotos?: string[] })[] | null;
  hora_llegada: string | null;
  hora_salida: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export function toAssignment(row: DailyRouteAssignmentRow): DailyRouteAssignment {
  return {
    id: row.id,
    routePointId: row.route_point_id,
    inspectorId: row.inspector_id,
    inspectorUsername: row.inspector_username,
    fecha: row.fecha,
    snapshot: row.snapshot,
    estado: row.estado as EstadoDailyRoute,
    observaciones: row.observaciones,
    // .fotos defaults to [] for rows created before the photo feature existed.
    fiscalizaciones: (row.fiscalizaciones ?? []).map((f) => ({ ...f, fotos: f.fotos ?? [] })),
    horaLlegada: row.hora_llegada ?? undefined,
    horaSalida: row.hora_salida ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  };
}
