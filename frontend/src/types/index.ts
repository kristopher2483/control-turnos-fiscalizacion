export type Role = {
  id: string
  name: 'admin' | 'inspector'
  label: string
  description: string
}

export type User = {
  id: string
  username: string
  fullName: string
  email: string
  roleId: string
  role: Role
  active: boolean
  createdAt: string
  updatedAt: string
}

export type EstadoDisponibilidad = 'disponible' | 'tomado'

export type RoutePoint = {
  id: string
  fecha: string
  diaProgramado: string
  sector: string
  direccion: string
  empresaResponsable: string
  tipoExigencia: string
  descripcionExigencia: string
  ventanaEntrada: string
  ventanaSalida: string
  vigenciaDesde: string
  vigenciaHasta: string
  estadoDisponibilidad: EstadoDisponibilidad
  assignedInspectorId: string | null
  assignedInspectorName: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type Fiscalizacion = {
  numero: number
  horaRegistro: string
  comentario: string
  /** Ready-to-use signed URLs (expire ~1h after the API response that returned them). */
  fotos: string[]
}

export type EstadoAsignacion = 'pendiente' | 'en_progreso' | 'fiscalizado' | 'no_corresponde' | 'liberado'

export type DailyRouteAssignment = {
  id: string
  routePointId: string
  inspectorId: string
  inspectorUsername: string
  fecha: string
  snapshot: {
    sector: string
    direccion: string
    empresaResponsable: string
    tipoExigencia: string
    descripcionExigencia: string
    ventanaEntrada: string
    ventanaSalida: string
  }
  estado: EstadoAsignacion
  observaciones: string
  fiscalizaciones: Fiscalizacion[]
  horaLlegada?: string
  horaSalida?: string
  createdAt: string
  updatedAt: string
  updatedBy: string
}

export type ReportSummary = {
  totalPuntos: number
  porEstado: Record<string, number>
  porSector: Record<string, number>
  porInspector: Record<string, { total: number; completados: number }>
}

export type LoginResponse = {
  token: string
  user: {
    id: string
    username: string
    fullName: string
    email: string
    role: Role
  }
}
