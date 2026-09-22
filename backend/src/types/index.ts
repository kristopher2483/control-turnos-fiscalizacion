export type RoleName = 'admin' | 'inspector';

export interface Role {
  id: string;
  name: RoleName;
  label: string;
  description: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string;
  roleId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'> & { role: Role };

export type EstadoDisponibilidad = 'disponible' | 'tomado';

export interface RoutePoint {
  id: string;
  fecha: string;
  diaProgramado: string;
  sector: string;
  direccion: string;
  empresaResponsable: string;
  tipoExigencia: string;
  descripcionExigencia: string;
  ventanaEntrada: string;
  ventanaSalida: string;
  /** Validity period of the ETO (work permit) this point belongs to. */
  vigenciaDesde: string;
  vigenciaHasta: string;
  estadoDisponibilidad: EstadoDisponibilidad;
  /** Inspector the admin pre-assigned this point to, or null if unassigned. Id only — never persist the name here, it's joined at read time so it can't go stale. */
  assignedInspectorId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** API-facing shape of a RoutePoint: the stored record plus the assigned inspector's current name, joined at read time. */
export type RoutePointWithAssignee = RoutePoint & { assignedInspectorName: string | null };

export interface Fiscalizacion {
  numero: number;
  horaRegistro: string;
  comentario: string;
}

export type EstadoDailyRoute = 'pendiente' | 'en_progreso' | 'fiscalizado' | 'no_corresponde' | 'liberado';

export interface DailyRouteAssignment {
  id: string;
  routePointId: string;
  inspectorId: string;
  inspectorUsername: string;
  fecha: string;
  snapshot: {
    sector: string;
    direccion: string;
    empresaResponsable: string;
    tipoExigencia: string;
    descripcionExigencia: string;
    ventanaEntrada: string;
    ventanaSalida: string;
  };
  estado: EstadoDailyRoute;
  observaciones: string;
  fiscalizaciones: Fiscalizacion[];
  horaLlegada?: string;
  horaSalida?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  roleId: string;
  roleName: RoleName;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
