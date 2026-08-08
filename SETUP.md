# Puesta en marcha — Coomosant

Sitio 100% estático (sin servidor propio). El navegador habla directo con
Supabase (Postgres + Auth + Storage) usando la librería `@supabase/supabase-js`
por CDN, protegido por Row Level Security.

## 1. Crear el proyecto en Supabase
1. Entrá a https://supabase.com y creá un proyecto nuevo (o usá uno existente).
2. Dashboard → **SQL Editor** → pegá y corré, en este orden:
   - `_handoff/supabase/schema.sql`
   - `_handoff/supabase/storage.sql`

## 2. Crear el primer administrador
Supabase Auth identifica usuarios por **email**, así que el "usuario" de
login del panel es el correo del admin.

1. Dashboard → **Authentication → Users → Add user** → cargá email + contraseña.
2. Copiá el `id` (UUID) del usuario creado.
3. SQL Editor → corré:
   ```sql
   insert into public.admin_users (id, usuario, nombre)
   values ('<uuid-del-usuario>', '<email-del-usuario>', 'Nombre a mostrar');
   ```
Repetí esto por cada administrador adicional.

## 3. Configurar el frontend
Editá [`assets/js/config.js`](assets/js/config.js) con los datos de
Dashboard → **Project Settings → API**:
```js
window.COOMOSANT_CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...', // la "anon public" key — NUNCA la "service_role"
};
```
La `anon key` es pública por diseño (viaja en el navegador); la protección real
la dan las políticas RLS de `schema.sql`.

## 4. Deploy
No hace falta backend propio. Cualquier hosting estático sirve, por ejemplo
**GitHub Pages** (el repo ya vive en `evisbal/Coomosant`):
Settings → Pages → Deploy from branch → `main` / `/ (root)`.

## Páginas
| Página | Descripción | Acceso |
|---|---|---|
| `index.html` | Landing pública | público |
| `nosotros.html` | Sobre Coomosant | público |
| `perfil.html?cc=<cedula>` | Verificación de afiliado (QR apunta acá) | público |
| `admin.html` | Alta/edición/baja de afiliados | requiere login |
