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
- **Validación**: zod en cada endpoint.
- **Almacenamiento — la pieza clave de la arquitectura**: todos los módulos
  dependen únicamente de una interfaz `DataStore` (`readJson` / `writeJson` /
  `listChildren`), nunca directamente de `fs` ni de la API de Google. Hay dos
  implementaciones intercambiables por variable de entorno
  (`STORAGE_PROVIDER=local|drive`):
  - `LocalJsonStore` (por defecto): guarda cada "registro" como archivo JSON
    en `backend/data/`, replicando exactamente la misma estructura de
    carpetas que se usará en Drive. Funciona sin configurar nada.
  - `GoogleDriveStore`: la misma estructura, pero escrita como carpetas y
    archivos JSON reales en Google Drive vía `googleapis` (Drive API v3, cuenta
    de servicio). Ver [Activar Google Drive](#activar-google-drive) abajo.

  Esto significa que **hoy la app funciona 100% sin credenciales de Google**,
  y el día que tengas el proyecto en Google Cloud, activar Drive es cambiar
  una variable de entorno — no reescribir código.

- **Estructura de datos "en Drive"** (carpetas → archivos JSON):
  ```
  roles.json
  users.json
  catalog/2026-09-22.json                  ← puntos de fiscalización del día
  registros/2026-09-22/<idInspector>.json  ← ruta tomada/actualizada por cada inspector
  ```

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
| **Mi ruta del día** | inspector | ve los puntos disponibles, los **toma**, y **edita/actualiza** (nunca elimina) estado, observaciones y visitas de fiscalización con hora automática. También puede **liberar** un punto tomado por error para que otro inspector lo tome |
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

## Cómo correrlo

**Backend** (puerto 4000):
```bash
cd backend
npm install
npm run dev
```
La primera vez que arranca, siembra datos de ejemplo automáticamente: roles,
2 usuarios demo y 6 puntos de fiscalización para el día de hoy.

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

## Activar Google Drive

Cuando tengas el proyecto en Google Cloud:

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/),
   habilita la **Google Drive API**.
2. Crea una **cuenta de servicio** (Service Account), descarga su archivo JSON
   de credenciales.
3. Comparte (en Google Drive, como cualquier carpeta) la carpeta raíz que
   quieras usar con el **email de la cuenta de servicio** (permiso Editor),
   o deja que la app cree su propia carpeta raíz automáticamente.
4. En `backend/.env`:
   ```
   STORAGE_PROVIDER=drive
   GOOGLE_APPLICATION_CREDENTIALS=./ruta/a/tu-credencial.json
   GOOGLE_DRIVE_ROOT_FOLDER_NAME=ControlTurnos_Data
   ```
5. Reinicia el backend. Todo lo que antes se guardaba en `backend/data/` ahora
   se guarda en Google Drive, con la misma estructura de carpetas — sin migrar
   ni reescribir nada.

## Verificación realizada

Backend y frontend se construyeron y probaron por separado (`npm install`,
`npm run build` sin errores de TypeScript, arranque del servidor) y luego se
levantaron **juntos** para confirmar la integración real: login de admin e
inspector a través del proxy del frontend, toma de un punto de ruta,
actualización de estado + observaciones + nueva fiscalización, y agregación
correcta en `reports/summary` — todo verificado con las mismas rutas HTTP que
usa la interfaz.

No se pudo verificar visualmente en un navegador real (este entorno no tiene
un navegador headless disponible), así que **antes de usarla en producción,
ábrela tú mismo y recórrela** — el diseño (Tailwind, cards, gráficos,
responsive) no fue verificado con captura de pantalla.

## Recomendaciones para siguientes iteraciones

1. **Geolocalización real** en cada fiscalización (lat/lng del celular al
   guardar), para verificar que el inspector efectivamente estuvo en el
   punto — hoy el campo existe en el diseño de datos pero no se capturó.
2. **Modo offline / PWA**: los inspectores pueden estar en zonas sin señal;
   guardar en IndexedDB local y sincronizar al recuperar conexión evitaría
   pérdida de registros.
3. **Fotografías** adjuntas a cada fiscalización (evidencia visual), subidas
   también a Drive junto al JSON del registro.
4. **Notificaciones** (email o push) al admin cuando un punto queda
   "no_corresponde" o pasa mucho tiempo "pendiente".
5. **Migrar a una base de datos relacional** (PostgreSQL) como fuente de
   verdad cuando el volumen de datos crezca, manteniendo Drive como respaldo/
   exportación periódica — la capa `DataStore` ya está diseñada para que este
   cambio no toque la lógica de negocio, solo se agrega un tercer proveedor.
6. **Auditoría**: hoy cada registro guarda `updatedBy` y `updatedAt`, pero no
   un historial de cambios previos — si se necesita trazar "quién cambió qué y
   cuándo" más allá del último estado, conviene loggear cada actualización
   como evento append-only.
