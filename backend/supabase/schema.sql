-- Control de Turnos y Fiscalización — esquema inicial para Supabase.
--
-- Cómo usarlo:
--   1. Entra a tu proyecto en https://supabase.com/dashboard
--   2. Ve a "SQL Editor" (menú lateral) → "New query"
--   3. Pega TODO este archivo y presiona "Run"
--   4. Verifica en "Table Editor" que aparecen las 4 tablas: roles, users,
--      route_points, daily_route_assignments
--   5. Verifica en "Storage" que aparece el bucket "fiscalizacion-fotos"
--
-- Es seguro volver a correrlo (usa IF NOT EXISTS / OR REPLACE / ON CONFLICT
-- donde aplica), así que si ya lo corriste antes y solo quieres tomar los
-- cambios nuevos (por ejemplo, el bucket de fotos), simplemente vuelve a
-- pegar todo el archivo y dale "Run" de nuevo — no borra ni duplica nada de
-- lo que ya existe.

create extension if not exists pgcrypto;

-- ==================== roles ====================

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (name in ('admin', 'inspector')),
  label text not null,
  description text not null
);

-- ==================== users ====================

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  full_name text not null,
  email text not null,
  role_id uuid not null references roles(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_role_id_idx on users(role_id);

-- ==================== route_points ====================
-- El "catálogo": puntos de fiscalización disponibles para una fecha dada.

create table if not exists route_points (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  dia_programado text not null,
  sector text not null,
  direccion text not null,
  empresa_responsable text not null,
  tipo_exigencia text not null,
  descripcion_exigencia text not null,
  ventana_entrada text not null,
  ventana_salida text not null,
  vigencia_desde date not null,
  vigencia_hasta date not null,
  estado_disponibilidad text not null default 'disponible' check (estado_disponibilidad in ('disponible', 'tomado')),
  assigned_inspector_id uuid references users(id),
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint route_points_vigencia_check check (vigencia_hasta >= vigencia_desde)
);

create index if not exists route_points_fecha_idx on route_points(fecha);
create index if not exists route_points_assigned_inspector_idx on route_points(assigned_inspector_id);

-- ==================== daily_route_assignments ====================
-- La "ruta del día" de cada inspector: un punto que tomó, con su historial
-- de fiscalizaciones (guardado como JSON, igual que el snapshot del punto
-- al momento de tomarlo — así el registro no cambia si el catálogo se edita
-- después).

create table if not exists daily_route_assignments (
  id uuid primary key default gen_random_uuid(),
  route_point_id uuid not null references route_points(id),
  inspector_id uuid not null references users(id),
  inspector_username text not null,
  fecha date not null,
  snapshot jsonb not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_progreso', 'fiscalizado', 'no_corresponde', 'liberado')),
  observaciones text not null default '',
  fiscalizaciones jsonb not null default '[]'::jsonb,
  hora_llegada text,
  hora_salida text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references users(id)
);

create index if not exists daily_route_assignments_fecha_idx on daily_route_assignments(fecha);
create index if not exists daily_route_assignments_inspector_idx on daily_route_assignments(inspector_id);
create index if not exists daily_route_assignments_route_point_idx on daily_route_assignments(route_point_id);

-- ==================== fotos de fiscalización ====================
-- Bucket privado (no público): nadie puede acceder a una foto solo con su
-- URL — el backend genera URLs firmadas de corta duración (1 hora) bajo
-- pedido, siempre validando primero que quien pregunta tiene permiso para
-- ver ese registro. Las fotos en sí se guardan dentro de cada fiscalización
-- (columna fiscalizaciones de daily_route_assignments), como rutas de
-- archivo — nunca se borran desde la app, solo se agregan (igual que el
-- resto de la app: se puede crear y actualizar, nunca eliminar).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fiscalizacion-fotos', 'fiscalizacion-fotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

alter table storage.objects enable row level security;

-- ==================== seguridad ====================
-- El backend se conecta con la Service Role Key, que siempre puede leer y
-- escribir sin importar estas políticas (las "bypassea" por diseño). Row
-- Level Security se deja habilitado y SIN políticas para que, si alguna vez
-- se usa la clave pública (anon) por error, nadie pueda leer ni escribir
-- nada directamente desde el navegador — todo el acceso real pasa por
-- nuestra API (que ya valida el JWT propio y los roles).

alter table roles enable row level security;
alter table users enable row level security;
alter table route_points enable row level security;
alter table daily_route_assignments enable row level security;

-- El backend usa la Service Role Key, que está pensada para bypassear RLS,
-- pero igual necesita permisos de tabla explícitos a nivel de Postgres.
-- Esto se lo da (y hace que cualquier tabla nueva que crees después también
-- lo tenga automáticamente).
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;

-- Mismo tema para el bucket de fotos (Storage vive en el esquema "storage").
grant usage on schema storage to service_role;
grant select, insert, update, delete on storage.objects to service_role;
grant select, insert, update, delete on storage.buckets to service_role;
