# Handoff: Backend para Coomosant (verificación de afiliados)

## Resumen
El frontend (HTML/DC) ya está construido y funcional con un almacenamiento simulado en el navegador (`data-store.js`, usando `localStorage`/`sessionStorage`). Esta guía describe la lógica exacta que ese archivo implementa, para reconstruirla como backend real (API + base de datos) sin cambiar el contrato que el frontend espera.

**Archivos de referencia en el proyecto de diseño:**
- `data-store.js` — capa de datos actual (simulada), es el contrato a replicar.
- `Admin.dc.html` — consume todas las funciones de `data-store.js`.
- `Perfil.dc.html` — consume `getAfiliadoByCedula` y `qrImageUrl`.
- `Index.dc.html` — redirige a `Perfil.dc.html?cc=<cedula>`.

## Modelo de datos

### Tabla/colección: `afiliados`
| Campo | Tipo | Notas |
|---|---|---|
| `cedula` | string (PK) | Solo dígitos, sin puntos. Única. |
| `nombre` | string | Nombre completo, tal como se muestra (no forzar mayúsculas en BD; el frontend hace `.toUpperCase()` al mostrar). |
| `tipoServicio` | enum: `domiciliario` \| `mototaxista` \| `ambos` | Se deriva en el formulario de dos checkboxes (Domiciliario / Mototaxista); si ambos están marcados, guardar `ambos`. |
| `estado` | enum: `activo` \| `inactivo` \| `suspendido` | `suspendido` = temporal, `inactivo` = baja definitiva. |
| `foto` | string (URL o base64) | En el prototipo se guarda como data-URL (base64) tomada de un `<input type="file">` + `FileReader`. En producción: subir a storage (S3/Supabase Storage/etc.) y guardar la URL pública, no el base64. |
| `fechaRegistro` | date (ISO `YYYY-MM-DD`) | Se fija al crear/editar con `new Date().toISOString().slice(0,10)`. |

### Tabla/colección: `admin_users`
| Campo | Tipo | Notas |
|---|---|---|
| `usuario` | string (PK) | Login. |
| `password` | string | En el prototipo es texto plano (`coomosant2026`) — **en producción hashear con bcrypt/argon2**, nunca texto plano. |
| `nombre` | string | Nombre para mostrar en el header del panel ("Administrador Coomosant"). |

Seed inicial usado en el prototipo (para referencia, no son datos reales):
```json
[
  { "cedula": "1085234567", "nombre": "Carlos Andrés Pérez Rodríguez", "tipoServicio": "domiciliario", "estado": "activo" },
  { "cedula": "1082967341", "nombre": "Luisa Fernanda Ríos Camargo", "tipoServicio": "mototaxista", "estado": "activo" },
  { "cedula": "1120453298", "nombre": "Jhon Edward Martínez Bru", "tipoServicio": "ambos", "estado": "suspendido" },
  { "cedula": "1069845213", "nombre": "María José Torres Núñez", "tipoServicio": "domiciliario", "estado": "inactivo" }
]
```
Un único admin: `usuario: "admin"`, `password: "coomosant2026"`.

## Endpoints a construir (equivalentes a las funciones de `data-store.js`)

### Autenticación
- `POST /api/auth/login` — body `{ usuario, password }`. Verifica contra `admin_users` (password hasheado). Devuelve un token de sesión (JWT o cookie de sesión) + `{ usuario, nombre }`. Equivale a `login(usuario, password)`.
- `POST /api/auth/logout` — invalida la sesión. Equivale a `logout()`.
- `GET /api/auth/me` — devuelve la sesión activa o 401. Equivale a `getSession()`.
- Todas las rutas de administración (`/api/afiliados` en métodos de escritura) deben requerir sesión válida vía middleware.

### Afiliados (CRUD)
- `GET /api/afiliados` — lista completa. Equivale a `getAfiliados()`. Requiere sesión (uso interno del panel).
- `GET /api/afiliados/:cedula` — devuelve un afiliado o 404. Equivale a `getAfiliadoByCedula(cc)`. **Pública, sin autenticación** — es la que consume `Perfil.dc.html` para cualquier usuario que escanea el QR.
- `POST /api/afiliados` — crea un afiliado nuevo. Body: `{ cedula, nombre, tipoServicio, estado, foto }`. Reglas de validación (ver abajo). Requiere sesión.
- `PUT /api/afiliados/:cedula` — actualiza un afiliado existente. Equivale a `saveAfiliado(afiliado)` cuando la cédula ya existe. Requiere sesión.
- `PATCH /api/afiliados/:cedula/estado` — cambia solo el estado (`activo`/`inactivo`/`suspendido`). Equivale a `setEstado(cc, estado)`. Es lo que dispara el `<select>` de estado en cada tarjeta del listado sin abrir el formulario completo. Requiere sesión.
- `DELETE /api/afiliados/:cedula` — elimina el afiliado. Equivale a `deleteAfiliado(cc)`. El frontend pide confirmación antes de llamar (`confirm(...)` en el navegador); el backend no necesita paso de confirmación adicional, pero sí debe ser un borrado real (no soft-delete, salvo que el negocio lo pida).

### Reglas de validación (replican `onGuardar` en `Admin.dc.html`)
1. `nombre` no vacío (trim) y `cedula` con al menos 6 dígitos.
2. Al menos uno de `tipoServicio` debe estar seleccionado (no permitir guardar sin tipo de servicio).
3. Al crear (no editar): la `cedula` debe ser única — rechazar con error si ya existe.
4. Al editar, la `cedula` es inmutable (el campo se deshabilita en el formulario) — el backend debe ignorar o rechazar cambios de `cedula` en `PUT`.

## Generación del código QR
`qrImageUrl(cedula)` arma la URL pública del perfil:
```
<origen-del-sitio>/Perfil.dc.html?cc=<cedula>
```
y genera la imagen QR llamando a un servicio externo (`api.qrserver.com`) solo para el prototipo. En producción:
- Generar el QR del lado del servidor con una librería (`qrcode` en Node, `qrcode.react` si se prefiere en cliente) apuntando a la URL pública real de verificación (`https://<dominio>/perfiles/<cedula>` o el equivalente en la app real).
- Devolver la imagen (PNG/SVG) para mostrar y para el botón "Descargar QR" — no depender de un servicio de terceros en producción.
- El QR se debe (re)generar cada vez que se guarda un afiliado, y mantenerse estable mientras la cédula no cambie (la URL codificada depende únicamente de la cédula, no del estado).

## Estados y su significado (regla de negocio)
- **Activo**: el afiliado presta servicio con respaldo de Coomosant. Es el único estado en el que `Perfil.dc.html` muestra el sello "Miembro Verificado".
- **Suspendido**: baja temporal — el afiliado no debe prestar servicio hasta nuevo aviso, pero conserva su registro y puede reactivarse a `activo` sin perder historial. Visualmente usa color ámbar y aviso de "temporalmente fuera de servicio".
- **Inactivo**: baja definitiva — ya no pertenece a la cooperativa. Usa color rojo y el nombre se muestra tachado en el perfil público.
- El cambio de estado no debe requerir pasar por el formulario completo: en el listado del panel cada tarjeta tiene un `<select>` de estado que llama directamente al endpoint de cambio de estado.

## Página de verificación pública (`Perfil.dc.html`)
- Recibe `?cc=<cedula>` por query string.
- Si `cedula` no viene en la URL → mostrar estado "sin búsqueda" (en el prototipo se listan enlaces de ejemplo; en producción quitar ese bloque de demo).
- Si `cedula` no existe en la base → mostrar "Este carnet no está registrado" (estado `notFound`), con tono de advertencia — importante para que el usuario del servicio sospeche de un carnet falso.
- Si existe → mostrar tarjeta con foto, nombre, cédula, tipo de servicio, badge de estado y el QR (el QR mostrado en el perfil es el mismo que apunta a esa misma página — sirve para reforzar la verificación, no es información nueva).
- Esta ruta **no requiere autenticación** — es pública por diseño (cualquier persona que escanea un QR debe poder consultarla).

## Sesión / seguridad (pendiente de definir con el negocio)
El prototipo pidió explícitamente "usuario y contraseña por persona" para el panel admin — actualmente solo hay un usuario semilla. El backend debe soportar múltiples cuentas de administrador desde el día uno (tabla `admin_users` ya contempla esto). Recomendado:
- Contraseñas hasheadas (bcrypt/argon2), nunca texto plano.
- Sesión vía JWT de corta duración + refresh, o cookie de sesión httpOnly.
- Rate-limiting en `/api/auth/login`.
- CORS restringido al dominio del frontend.

## Lo que NO debe cambiar del comportamiento actual
- Los nombres/formas de los campos (`cedula`, `nombre`, `tipoServicio`, `estado`, `foto`, `fechaRegistro`) — el frontend ya está programado contra ese contrato exacto.
- Los tres valores de `estado` y los tres de `tipoServicio` (incluyendo el valor compuesto `ambos`).
- El flujo del panel: login → listado con búsqueda/filtros → alta o edición → pantalla de confirmación con credencial + QR → volver al listado.
