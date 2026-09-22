import { v4 as uuid } from 'uuid';
import { dataStore, usersService } from '../services';
import { hashPassword } from '../utils/password';
import { Role, RoutePoint, User } from '../types';

function todayFecha(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function diaProgramadoFor(fecha: string): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const date = new Date(`${fecha}T12:00:00`);
  return dias[date.getDay()];
}

function addDays(fecha: string, days: number): string {
  const date = new Date(`${fecha}T12:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function seedIfNeeded(): Promise<void> {
  const existingUsers = await usersService.listUsers();
  if (existingUsers.length > 0) {
    return;
  }

  const now = new Date().toISOString();

  const adminRole: Role = {
    id: uuid(),
    name: 'admin',
    label: 'Administrador',
    description: 'Administra usuarios, catálogo de puntos de ruta y reportes'
  };
  const inspectorRole: Role = {
    id: uuid(),
    name: 'inspector',
    label: 'Inspector / Fiscalizador',
    description: 'Toma puntos de ruta y registra visitas de fiscalización'
  };
  await dataStore.writeJson<Role[]>('roles', [adminRole, inspectorRole]);

  const adminUser: User = {
    id: uuid(),
    username: 'admin',
    passwordHash: await hashPassword('Admin123!'),
    fullName: 'Administrador General',
    email: 'admin@controlturnos.local',
    roleId: adminRole.id,
    active: true,
    createdAt: now,
    updatedAt: now
  };
  const inspectorUser: User = {
    id: uuid(),
    username: 'inspector1',
    passwordHash: await hashPassword('Inspector123!'),
    fullName: 'Inspector Demo Uno',
    email: 'inspector1@controlturnos.local',
    roleId: inspectorRole.id,
    active: true,
    createdAt: now,
    updatedAt: now
  };
  await dataStore.writeJson<User[]>('users', [adminUser, inspectorUser]);

  const fecha = todayFecha();
  const diaProgramado = diaProgramadoFor(fecha);

  const seedPointDefinitions: Array<
    Omit<
      RoutePoint,
      'id' | 'fecha' | 'diaProgramado' | 'estadoDisponibilidad' | 'assignedInspectorId' | 'createdBy' | 'createdAt' | 'updatedAt'
    > & { assignedInspectorId?: string | null }
  > = [
    {
      sector: 'Centro',
      direccion: "Av. Libertador Bernardo O'Higgins 1234",
      empresaResponsable: 'Aguas Cordillera S.A.',
      tipoExigencia: 'Instalación de arranque de agua potable',
      descripcionExigencia: 'Verificar instalación de arranque domiciliario según proyecto aprobado',
      ventanaEntrada: '09:00',
      ventanaSalida: '11:00',
      vigenciaDesde: addDays(fecha, -5),
      vigenciaHasta: addDays(fecha, 25),
      assignedInspectorId: inspectorUser.id
    },
    {
      sector: 'Los Dominicos',
      direccion: 'Camino Los Trapenses 5678',
      empresaResponsable: 'ENEL Distribución Chile S.A.',
      tipoExigencia: 'Instalación de ductos para redes eléctricas',
      descripcionExigencia: 'Fiscalizar zanja y ductos para tendido eléctrico subterráneo',
      ventanaEntrada: '10:30',
      ventanaSalida: '12:30',
      vigenciaDesde: addDays(fecha, -2),
      vigenciaHasta: addDays(fecha, 18)
    },
    {
      sector: 'La Reina Alta',
      direccion: 'Príncipe de Gales 890',
      empresaResponsable: 'Metrogas S.A.',
      tipoExigencia: 'Instalación de red de gas natural',
      descripcionExigencia: 'Revisar instalación de cañería de polietileno para red de gas',
      ventanaEntrada: '08:30',
      ventanaSalida: '10:00',
      vigenciaDesde: fecha,
      vigenciaHasta: addDays(fecha, 14)
    },
    {
      sector: 'Peñalolén',
      direccion: 'Av. Tobalaba 3456',
      empresaResponsable: 'Constructora Bravo y Cía. Ltda.',
      tipoExigencia: 'Corte de vereda',
      descripcionExigencia: 'Fiscalizar corte y reposición de vereda por obra de conexión domiciliaria',
      ventanaEntrada: '14:00',
      ventanaSalida: '15:30',
      vigenciaDesde: addDays(fecha, -10),
      vigenciaHasta: addDays(fecha, 10)
    },
    {
      sector: 'Vitacura',
      direccion: 'Av. Vitacura 7890',
      empresaResponsable: 'Telefónica Chile S.A.',
      tipoExigencia: 'Instalación de cámaras subterráneas de telecomunicaciones',
      descripcionExigencia: 'Verificar instalación de cámara y ductería para fibra óptica',
      ventanaEntrada: '11:00',
      ventanaSalida: '13:00',
      vigenciaDesde: addDays(fecha, -1),
      vigenciaHasta: addDays(fecha, 29)
    },
    {
      sector: 'Providencia',
      direccion: 'Av. Providencia 2222',
      empresaResponsable: 'Aguas Andinas S.A.',
      tipoExigencia: 'Reparación de colector de aguas servidas',
      descripcionExigencia: 'Fiscalizar excavación y reparación de colector según permiso municipal',
      ventanaEntrada: '15:30',
      ventanaSalida: '17:00',
      vigenciaDesde: addDays(fecha, -7),
      vigenciaHasta: addDays(fecha, 7)
    }
  ];

  const routePoints: RoutePoint[] = seedPointDefinitions.map((definition) => ({
    id: uuid(),
    fecha,
    diaProgramado,
    ...definition,
    assignedInspectorId: definition.assignedInspectorId ?? null,
    estadoDisponibilidad: 'disponible',
    createdBy: adminUser.id,
    createdAt: now,
    updatedAt: now
  }));

  await dataStore.writeJson<RoutePoint[]>(`catalog/${fecha}`, routePoints);

  // eslint-disable-next-line no-console
  console.log(`[seed] Datos iniciales creados: ${routePoints.length} puntos de ruta para ${fecha}`);
}
