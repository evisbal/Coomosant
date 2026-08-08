-- Coomosant — Storage bucket para fotos de afiliados
-- Correr después de schema.sql.

insert into storage.buckets (id, name, public)
values ('afiliados-fotos', 'afiliados-fotos', true)
on conflict (id) do nothing;

-- Lectura pública (las fotos se muestran en Perfil.html sin login)
drop policy if exists "afiliados-fotos: lectura pública" on storage.objects;
create policy "afiliados-fotos: lectura pública"
  on storage.objects for select
  using (bucket_id = 'afiliados-fotos');

-- Solo admins autenticados pueden subir/reemplazar/borrar fotos
drop policy if exists "afiliados-fotos: escritura solo admin" on storage.objects;
create policy "afiliados-fotos: escritura solo admin"
  on storage.objects for insert
  with check (
    bucket_id = 'afiliados-fotos'
    and exists (select 1 from public.admin_users au where au.id = auth.uid())
  );

drop policy if exists "afiliados-fotos: actualizar solo admin" on storage.objects;
create policy "afiliados-fotos: actualizar solo admin"
  on storage.objects for update
  using (
    bucket_id = 'afiliados-fotos'
    and exists (select 1 from public.admin_users au where au.id = auth.uid())
  );

drop policy if exists "afiliados-fotos: borrar solo admin" on storage.objects;
create policy "afiliados-fotos: borrar solo admin"
  on storage.objects for delete
  using (
    bucket_id = 'afiliados-fotos'
    and exists (select 1 from public.admin_users au where au.id = auth.uid())
  );
