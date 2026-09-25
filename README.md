# Control de Turnos y Fiscalización

MVP web para reemplazar la planilla Excel de control de turnos y fiscalización
("Copia de planilla turnos.xlsx", incluida en esta carpeta como referencia del
formato original). Cada fiscalizador registra su propia ruta del día desde el
celular o notebook; el administrador ve todo el equipo y saca estadísticas.

## Arquitectura

```
APP_Control_de_Turnos/
├── backend/     API REST — Node.js + TypeScript + Express
└── frontend/    SPA — React + TypeScript + Vite + Tailwind
```

Proyectos **totalmente separados** (frontend y backend son dos aplicaciones
independientes, cada una con su propio `package.json`, se pueden desplegar por
separado) que se comunican por HTTP/JSON según el contrato documentado abajo.

### Backend

- **Node.js + Express + TypeScript**, capas `routes → controller → service`
  por módulo (`auth`, `users`, `roles`, `catalog`, `daily-routes`, `reports`).
- **Autenticación**: JWT + bcrypt. Middleware de rol (`admin` / `inspector`).
  El login sigue siendo el sistema propio (no se usa Supabase Auth).
- **Validación**: zod en cada endpoint.
- **Base de datos: Supabase (PostgreSQL)**. Cuatro tablas relacionales reales
  (`roles`, `users`, `route_points`, `daily_route_assignments`) — ver el
  esquema completo en [`backend/supabase/schema.sql`](backend/supabase/schema.sql)
  y cómo activarlo en [Configurar Supabase](#configurar-supabase) abajo. El
  backend se conecta con `@supabase/supabase-js` usando la **Service Role
  Key** (clave de servidor, nunca se expone al frontend); cada servicio
  (`catalog.service.ts`, `daily-routes.service.ts`, etc.) mapea entre las
  filas de la tabla (snake_case) y los tipos de dominio de la app (camelCase)
  mediante funciones `toRoutePoint`, `toAssignment`, etc. — el resto del
  código (controllers, rutas, frontend) no sabe ni le importa que la base de
  datos sea Postgres.

### Frontend

- **React + TypeScript + Vite + TailwindCSS**, React Router, TanStack Query
  (cache y refetch automático), react-hook-form + zod (formularios), axios,
  recharts (gráficos del dashboard admin).
- Diseño responsivo mobile-first (el fiscalizador trabaja desde el celular en
  terreno): sidebar en escritorio, menú inferior/drawer en móvil.
- Estructura por capas: `api/` (cliente HTTP), `components/ui/` (primitivas
  visuales reutilizables sin lógica de negocio), `components/` (componentes de
  dominio), `pages/` (una por ruta, delgadas), `hooks/`, `context/`.

## Módulos funcionales

| Módulo | Quién | Qué hace |
|---|---|---|
| **Login** | todos | autenticación con usuario/contraseña, redirige según rol |
| **Usuarios y roles** | admin | crear/editar usuarios, asignar rol (admin/inspector), resetear contraseña, activar/desactivar |
| **Catálogo de rutas** | admin | crea los puntos de fiscalización disponibles del día (sector, dirección, empresa, exigencia, horario) |
| **Mi ruta del día** | inspector | ve los puntos disponibles, los **toma**, y **edita/actualiza** (nunca elimina) estado, observaciones y visitas de fiscalización con hora automática, adjuntando fotos de evidencia. También puede **liberar** un punto tomado por error para que otro inspector lo tome |
| **Registros y reportes** | admin | ve la ruta de todos los inspectores, filtra por fecha/inspector, exporta CSV, dashboard con gráficos |

**Regla de negocio deliberada**: no existe ningún endpoint ni botón de
eliminar en toda la aplicación — ni para catálogo, ni para registros de ruta.
Solo se crea, se toma y se actualiza. Esto preserva la trazabilidad completa
para las estadísticas (igual que pediste: "puede editar y actualizar, nunca
eliminar").

**Liberar ruta (por equivocación)**: si un inspector toma un punto por error,
puede liberarlo desde el modal "Actualizar" (con confirmación) mientras esté
en estado `pendiente` o `en_progreso`. Al liberar:
- El punto vuelve a aparecer en "Puntos disponibles para tomar" para
  cualquier inspector (incluido el mismo).
- El registro original **no se borra**: queda visible en "Mi ruta de hoy"
  del inspector que lo liberó, marcado como `Liberada` y de solo lectura
  ("Ver detalle"), y sigue apareciendo en los reportes del admin — así se
  mantiene la trazabilidad de quién tomó y liberó cada punto.
- No se puede liberar un punto ya `fiscalizado` o marcado `no_corresponde`
  (esos estados son cierres definitivos de la visita).

**Cierre definitivo al fiscalizar**: una vez que un registro pasa a estado
`fiscalizado`, queda bloqueado para el inspector — el formulario se muestra
en modo solo lectura ("Ver detalle") y el backend rechaza cualquier intento
de editarlo (igual que con los registros `liberado`). Solo un registro
`pendiente` o `en_progreso` puede seguir editándose o liberarse.

**"Mi ruta de hoy" solo muestra rutas activas**: un registro liberado deja de
aparecer en la vista del inspector que lo liberó (el punto ya no es
responsabilidad suya), aunque el registro sigue existiendo para trazabilidad
y es visible para el admin en Registros/Reportes.

**Campos obligatorios al actualizar una visita**: en el modal "Actualizar",
Estado, Hora de llegada, Hora de salida y Observaciones generales son
obligatorios — no se puede guardar sin completarlos. Solo el campo para
agregar una nueva fiscalización es opcional.

**Asignación directa por el administrador y vigencia de la ETO**: cada punto
del catálogo ahora tiene:
- **Vigencia ETO (desde/hasta)**: el periodo de validez del permiso de
  intervención de espacio público, visible en la tarjeta del inspector y en
  la tabla del admin.
- **Inspector asignado (opcional)**: el admin puede asignar (o reasignar)
  un punto directamente a un inspector específico desde "Nuevo punto" o
  "Editar punto" — el nombre aparece en la tarjeta del punto ("Asignado a")
  tanto para el inspector como en la tabla de Catálogo del admin. Solo se
  puede asignar a usuarios con rol Inspector.
- **La asignación es exclusiva**: si un punto tiene inspector asignado,
  **solo ese inspector puede tomarlo** — para el resto ni siquiera aparece
  en "Puntos disponibles para tomar", y el backend rechaza con 403 cualquier
  intento de otro inspector de tomarlo (incluso llamando la API
  directamente). Un punto sin asignar sigue siendo de libre toma, como
  antes. La asignación no crea automáticamente un registro de ruta diaria —
  el inspector asignado igual debe "tomarlo" para empezar a registrar la
  visita.

**Importar puntos desde Excel/CSV**: en Catálogo → "Importar Excel/CSV" el
admin sube un archivo `.csv` o `.xlsx` con varios puntos a la vez, en lugar de
crearlos uno por uno. La plantilla descargable desde el mismo modal trae los
encabezados esperados (`fecha`, `diaProgramado`, `sector`, `direccion`,
`empresaResponsable`, `tipoExigencia`, `descripcionExigencia`,
`ventanaEntrada`, `ventanaSalida`, `vigenciaDesde`, `vigenciaHasta`,
`inspectorAsignado`). Cada fila se valida y crea de forma independiente: las
filas válidas se importan aunque otras tengan errores, y el resultado muestra
cuántas se crearon y el detalle fila por fila de las que fallaron, para
corregirlas y volver a subir solo esas. `inspectorAsignado` acepta el
username o el nombre completo del inspector, y es opcional igual que
`descripcionExigencia`. Las fechas/horas se aceptan tanto en formato texto
(`AAAA-MM-DD`, `HH:MM`) como en celdas de fecha/hora reales de Excel.

**Fotos de evidencia en cada fiscalización**: al agregar una nueva
fiscalización, el inspector puede adjuntar hasta 3 fotos (JPG/PNG/WEBP) como
evidencia de la visita — se comprimen automáticamente en el navegador antes de
subirse para ahorrar espacio.
- Se guardan en **Supabase Storage**, en un bucket privado
  (`fiscalizacion-fotos`) — no son públicas ni accesibles por URL directa.
- **Cómo se ven**: cada vez que la app pide los registros de un inspector (o
  el admin pide todos), el backend genera **URLs firmadas** de corta
  duración (1 hora) para cada foto y las incluye en la respuesta — el
  frontend simplemente las muestra como miniaturas clicleables (clic = ver
  en tamaño completo en una pestaña nueva). El admin puede verlas desde
  **Registros** con el botón "Ver" en la columna Fotos; el inspector, desde
  el historial dentro del modal "Actualizar".
- **Nunca se pueden borrar desde la app** (igual que el resto de los
  registros) — solo se agregan. Si necesitas liberar espacio, puedes
  borrar archivos directamente desde **Supabase → Storage** (panel del
  proyecto) sin que eso afecte el registro de texto de la fiscalización
  (el comentario queda igual, solo desaparecería la miniatura de esa foto).
- **Capacidad**: el plan gratuito de Supabase incluye 1 GB de Storage — con
  fotos de celular comprimidas (unos cientos de KB cada una) alcanza para
  miles de fotos, de sobra para 7 inspectores. Si algún día se llena, sí
  puedes borrar fotos viejas manualmente desde el dashboard (Storage →
  seleccionar archivos → Delete) para liberar espacio, sin perder ningún
  registro de la base de datos.

## Cómo correrlo

**Paso 0 — Supabase (obligatorio, una sola vez)**: sigue
[Configurar Supabase](#configurar-supabase) abajo antes de arrancar el
backend por primera vez — la app no funciona sin esto, la base de datos ya
no es un archivo local.

**Backend** (puerto 4000):
```bash
cd backend
npm install
npm run dev
```
La primera vez que arranca (con la base de datos ya vacía), siembra datos de
ejemplo automáticamente: roles, 2 usuarios demo y 6 puntos de fiscalización
para el día de hoy.

**Frontend** (puerto 5173):
```bash
cd frontend
npm install
npm run dev
```
Abre `http://localhost:5173`. El proxy de Vite ya está configurado para
reenviar `/api` a `http://localhost:4000`, no necesitas tocar nada.

**Usuarios demo:**
| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador |
| `inspector1` | `Inspector123!` | Inspector |

⚠️ Cambia estas contraseñas antes de usar la app con datos reales (desde
`Admin → Usuarios → Restablecer contraseña`).

## Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) → crea una cuenta (o inicia
   sesión) → **"New project"**.
   - Ponle un nombre (ej. `control-turnos-fiscalizacion`).
   - Elige una contraseña para la base de datos y **guárdala** (no es la que
     usa la app, es la de administración de Postgres — rara vez se necesita,
     pero consérvala por si acaso).
   - Elige la región más cercana (ej. `South America (São Paulo)`).
   - Espera 1-2 minutos a que el proyecto termine de aprovisionarse.

2. **Crea las tablas**: en el menú lateral del proyecto, entra a
   **"SQL Editor"** → **"New query"**. Abre el archivo
   [`backend/supabase/schema.sql`](backend/supabase/schema.sql) de este
   repositorio, copia **todo** su contenido, pégalo en el editor y presiona
   **"Run"**. Deberías ver "Success. No rows returned". Ve a **"Table
   Editor"** y confirma que aparecen 4 tablas: `roles`, `users`,
   `route_points`, `daily_route_assignments`.

3. **Copia las credenciales**: en el menú lateral, ve a
   **Project Settings → API**. Necesitas dos valores:
   - **Project URL** (algo como `https://xxxxxxxxxxxx.supabase.co`)
   - **service_role key** (bajo "Project API keys" — es la secreta, **no**
     la `anon`/`public`. ⚠️ Esta clave tiene acceso total a la base de
     datos sin restricciones — trátala como una contraseña: nunca la subas
     a git, nunca la pongas en código del frontend, nunca la compartas en un
     chat o captura de pantalla pública)

4. Pégalas en `backend/.env`:
   ```
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

5. Arranca el backend (`npm run dev` dentro de `backend/`) — la primera vez
   va a sembrar los datos de ejemplo automáticamente en tus tablas nuevas de
   Supabase. Puedes verlos en **Table Editor** en cualquier momento, y
   también correr SQL directo ahí (`select * from daily_route_assignments`)
   para explorar los datos o armar reportes ad-hoc.

## Desplegar en producción (Render + Vercel, gratis)

Para ~7 usuarios el tráfico es mínimo — no hace falta AWS ni nada elaborado.
Backend y frontend se despliegan por separado, cada uno apuntando al mismo
repo de GitHub.

### Backend en Render

1. Ve a [render.com](https://render.com) → crea una cuenta (puedes entrar
   con tu cuenta de GitHub) → **"New +" → "Web Service"**.
2. Conecta el repo `control-turnos-fiscalizacion`.
3. Configura:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. En **Environment Variables**, agrega las mismas que tienes en
   `backend/.env` (usa un `JWT_SECRET` nuevo y distinto al de tu máquina
   local — genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`):
   ```
   JWT_SECRET=<genera uno nuevo>
   JWT_EXPIRES_IN=12h
   FRONTEND_URL=https://tu-app.vercel.app   (lo actualizas después de desplegar el frontend)
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu-key-secreta
   ```
   No necesitas configurar `PORT` — Render lo inyecta automáticamente y el
   backend ya lo usa (`process.env.PORT`).
5. Presiona **"Create Web Service"**. Cuando termine el build, Render te da
   una URL tipo `https://control-turnos-backend.onrender.com` — pruébala
   entrando a `https://control-turnos-backend.onrender.com/api/health`,
   debería responder `{"status":"ok","database":"supabase"}`.

⚠️ **El plan free de Render "duerme" el servicio tras 15 min sin uso** — la
primera petición después de eso tarda ~30-50 seg en responder mientras
despierta. Para 7 usuarios internos es aceptable, pero si molesta hay dos
soluciones gratis: (a) un servicio como [UptimeRobot](https://uptimerobot.com)
que haga ping a `/api/health` cada 10 min para mantenerlo despierto en
horario laboral, o (b) pasar al plan pago de Render (~US$7/mes) que no
duerme.

### Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com) → crea una cuenta (con GitHub) →
   **"Add New" → "Project"** → importa el mismo repo.
2. Configura:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (Vercel lo detecta solo)
   - Build Command y Output Directory: déjalos por defecto
     (`npm run build` / `dist`)
3. En **Environment Variables**, agrega:
   ```
   VITE_API_URL=https://control-turnos-backend.onrender.com/api
   ```
   (usa la URL real que te dio Render en el paso anterior)
4. **Deploy**. Vercel te da una URL tipo
   `https://control-turnos-fiscalizacion.vercel.app`.
5. **Vuelve a Render** y actualiza la variable `FRONTEND_URL` con esta URL
   de Vercel (si no, el backend va a rechazar las peticiones del frontend
   por CORS). Guarda — Render redeploya solo.

Desde ahí, cada `git push` a `main` redespliega ambos automáticamente. Los
usuarios entran directo a la URL de Vercel — nada que instalar.

## Verificación realizada

Backend y frontend se prueban en cada cambio (`npm install`, `npm run build`
sin errores de TypeScript, lint limpio) y además se verifican en un
navegador real (Chromium vía Playwright) contra tu proyecto real de
Supabase — no contra datos de prueba locales. Entre lo verificado así:
login de admin e inspector, tomar/actualizar/liberar una ruta, asignación de
puntos por el admin, y el flujo completo de subir una foto y volver a verla
mediante su URL firmada — cada vez que una prueba crea datos de prueba en tu
base de datos real, se eliminan al terminar (incluyendo los objetos subidos
a Storage) para no dejar residuos en tu ambiente.

## Recomendaciones para siguientes iteraciones

1. **Geolocalización real** en cada fiscalización (lat/lng del celular al
   guardar), para verificar que el inspector efectivamente estuvo en el
   punto — hoy el campo existe en el diseño de datos pero no se capturó.
2. **Modo offline / PWA**: los inspectores pueden estar en zonas sin señal;
   guardar en IndexedDB local y sincronizar al recuperar conexión evitaría
   pérdida de registros.
3. **Notificaciones** (email o push) al admin cuando un punto queda
   "no_corresponde" o pasa mucho tiempo "pendiente".
4. **Auditoría**: hoy cada registro guarda `updatedBy` y `updatedAt`, pero no
   un historial de cambios previos — si se necesita trazar "quién cambió qué y
   cuándo" más allá del último estado, conviene una tabla `audit_log`
   append-only (o las extensiones de auditoría que trae Postgres/Supabase).
5. **Row Level Security más fino**: hoy el backend usa la Service Role Key
   (bypassea RLS) y hace toda la autorización en código — funciona bien, pero
   si en el futuro algo llega a consultar Supabase directamente desde el
   frontend (ej. un dashboard con Supabase Realtime), conviene escribir
   políticas RLS reales en vez de depender solo del backend.
