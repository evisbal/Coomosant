-- Coomosant — esquema Supabase
-- Basado en design_handoff_backend/BACKEND.md
-- Reemplaza la capa simulada de data-store.js (localStorage) por Postgres real.

-- =========================================================
-- Extensiones
-- =========================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid(), si se necesita en el futuro

-- =========================================================
-- Tabla: afiliados
-- =========================================================
create table if not exists public.afiliados (
  cedula          text primary key check (cedula ~ '^[0-9]{6,}$'),
  nombre          text not null check (btrim(nombre) <> ''),
  tipo_servicio   text not null check (tipo_servicio in ('domiciliario', 'mototaxista', 'ambos')),
  estado          text not null default 'activo' check (estado in ('activo', 'inactivo', 'suspendido')),
  foto_url        text, -- URL pública en Supabase Storage (bucket 'afiliados-fotos'), no base64
  fecha_registro  date not null default (now() at time zone 'utc')::date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.afiliados is 'Afiliados de la cooperativa (domiciliarios/mototaxistas). PK = cédula, sin puntos.';
comment on column public.afiliados.foto_url is 'URL pública del archivo en Supabase Storage. El frontend hace .toUpperCase() al mostrar el nombre, no forzar mayúsculas acá.';

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_afiliados_updated_at on public.afiliados;
create trigger trg_afiliados_updated_at
  before update on public.afiliados
  for each row execute function public.set_updated_at();

-- =========================================================
-- Tabla: admin_users
-- =========================================================
-- Nota: si se usa Supabase Auth para el login del panel (recomendado),
-- esta tabla pasa a ser un perfil 1:1 con auth.users (ver comentario abajo)
-- en vez de guardar password acá. Se deja el modelo de BACKEND.md como base,
-- pero SIN columna de password en texto plano.
create table if not exists public.admin_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  usuario     text not null unique,
  nombre      text not null,
  created_at  timestamptz not null default now()
);

comment on table public.admin_users is 'Perfil de administradores del panel. La autenticación (password hasheado, sesión) la maneja Supabase Auth; esta tabla solo guarda el nombre para mostrar y el "usuario" de login si se usa distinto al email.';

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.afiliados enable row level security;
alter table public.admin_users enable row level security;

-- Lectura pública de un afiliado por cédula (para Perfil.dc.html, sin login)
drop policy if exists "afiliados: lectura pública" on public.afiliados;
create policy "afiliados: lectura pública"
  on public.afiliados
  for select
  using (true);

-- Escritura (insert/update/delete) solo para administradores autenticados
drop policy if exists "afiliados: escritura solo admin" on public.afiliados;
create policy "afiliados: escritura solo admin"
  on public.afiliados
  for all
  using (exists (select 1 from public.admin_users au where au.id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.id = auth.uid()));

-- admin_users: cada admin puede ver su propia fila; nadie la puede editar desde el cliente
drop policy if exists "admin_users: ver propio perfil" on public.admin_users;
create policy "admin_users: ver propio perfil"
  on public.admin_users
  for select
  using (id = auth.uid());

-- =========================================================
-- Índices
-- =========================================================
create index if not exists idx_afiliados_estado on public.afiliados (estado);
create index if not exists idx_afiliados_tipo_servicio on public.afiliados (tipo_servicio);

-- =========================================================
-- Seed (SOLO para entorno de desarrollo — no correr en producción)
-- =========================================================
-- insert into public.afiliados (cedula, nombre, tipo_servicio, estado, fecha_registro) values
--   ('1085234567', 'Carlos Andrés Pérez Rodríguez', 'domiciliario', 'activo', '2023-03-14'),
--   ('1082967341', 'Luisa Fernanda Ríos Camargo', 'mototaxista', 'activo', '2022-11-02'),
--   ('1120453298', 'Jhon Edward Martínez Bru', 'ambos', 'suspendido', '2024-01-20'),
--   ('1069845213', 'María José Torres Núñez', 'domiciliario', 'inactivo', '2021-07-09')
-- on conflict (cedula) do nothing;
--
-- El usuario admin semilla ('admin' / 'coomosant2026') NO se crea acá:
-- se crea con Supabase Auth (auth.users) desde el dashboard o `supabase auth`,
-- y después se inserta su fila correspondiente en admin_users con ese mismo id.
