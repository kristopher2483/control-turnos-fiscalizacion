import { EstadoDisponibilidad, RoutePoint } from '../../types';

export interface RoutePointRow {
  id: string;
  fecha: string;
  dia_programado: string;
  sector: string;
  direccion: string;
  empresa_responsable: string;
  tipo_exigencia: string;
  descripcion_exigencia: string;
  ventana_entrada: string;
  ventana_salida: string;
  vigencia_desde: string;
  vigencia_hasta: string;
  estado_disponibilidad: string;
  assigned_inspector_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function toRoutePoint(row: RoutePointRow): RoutePoint {
  return {
    id: row.id,
    fecha: row.fecha,
    diaProgramado: row.dia_programado,
    sector: row.sector,
    direccion: row.direccion,
    empresaResponsable: row.empresa_responsable,
    tipoExigencia: row.tipo_exigencia,
    descripcionExigencia: row.descripcion_exigencia,
    ventanaEntrada: row.ventana_entrada,
    ventanaSalida: row.ventana_salida,
    vigenciaDesde: row.vigencia_desde,
    vigenciaHasta: row.vigencia_hasta,
    estadoDisponibilidad: row.estado_disponibilidad as EstadoDisponibilidad,
    assignedInspectorId: row.assigned_inspector_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
