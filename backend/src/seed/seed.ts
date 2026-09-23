import { supabase } from '../db/supabase';
import { usersService } from '../services';
import { hashPassword } from '../utils/password';

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

  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .insert([
      { name: 'admin', label: 'Administrador', description: 'Administra usuarios, catálogo de puntos de ruta y reportes' },
      {
        name: 'inspector',
        label: 'Inspector / Fiscalizador',
        description: 'Toma puntos de ruta y registra visitas de fiscalización'
      }
    ])
    .select();
  if (rolesError) throw rolesError;

  const adminRole = roles.find((role) => role.name === 'admin');
  const inspectorRole = roles.find((role) => role.name === 'inspector');
  if (!adminRole || !inspectorRole) {
    throw new Error('[seed] No se pudieron crear los roles iniciales');
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .insert([
      {
        username: 'admin',
        password_hash: await hashPassword('Admin123!'),
        full_name: 'Administrador General',
        email: 'admin@controlturnos.local',
        role_id: adminRole.id,
        active: true
      },
      {
        username: 'inspector1',
        password_hash: await hashPassword('Inspector123!'),
        full_name: 'Inspector Demo Uno',
        email: 'inspector1@controlturnos.local',
        role_id: inspectorRole.id,
        active: true
      }
    ])
    .select();
  if (usersError) throw usersError;

  const adminUser = users.find((user) => user.username === 'admin');
  const inspectorUser = users.find((user) => user.username === 'inspector1');
  if (!adminUser || !inspectorUser) {
    throw new Error('[seed] No se pudieron crear los usuarios iniciales');
  }

  const fecha = todayFecha();
  const diaProgramado = diaProgramadoFor(fecha);

  const seedPointDefinitions = [
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
      assignedInspectorId: inspectorUser.id as string | null
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
      vigenciaHasta: addDays(fecha, 18),
      assignedInspectorId: null as string | null
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
      vigenciaHasta: addDays(fecha, 14),
      assignedInspectorId: null as string | null
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
      vigenciaHasta: addDays(fecha, 10),
      assignedInspectorId: null as string | null
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
      vigenciaHasta: addDays(fecha, 29),
      assignedInspectorId: null as string | null
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
      vigenciaHasta: addDays(fecha, 7),
      assignedInspectorId: null as string | null
    }
  ];

  const { error: pointsError } = await supabase.from('route_points').insert(
    seedPointDefinitions.map((definition) => ({
      fecha,
      dia_programado: diaProgramado,
      sector: definition.sector,
      direccion: definition.direccion,
      empresa_responsable: definition.empresaResponsable,
      tipo_exigencia: definition.tipoExigencia,
      descripcion_exigencia: definition.descripcionExigencia,
      ventana_entrada: definition.ventanaEntrada,
      ventana_salida: definition.ventanaSalida,
      vigencia_desde: definition.vigenciaDesde,
      vigencia_hasta: definition.vigenciaHasta,
      estado_disponibilidad: 'disponible',
      assigned_inspector_id: definition.assignedInspectorId,
      created_by: adminUser.id
    }))
  );
  if (pointsError) throw pointsError;

  // eslint-disable-next-line no-console
  console.log(`[seed] Datos iniciales creados: ${seedPointDefinitions.length} puntos de ruta para ${fecha}`);
}
