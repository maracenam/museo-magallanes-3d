-- =========================================================
-- Endurecimiento de seguridad (ejecutar en Supabase -> SQL Editor)
--
-- Se puede ejecutar más de una vez sin problema. Ejecutarlo ANTES de
-- desplegar esta versión del sitio: el panel exige la función es_admin().
-- =========================================================

-- ---------------------------------------------------------
-- 1. Lista blanca de administradores
--    Antes, CUALQUIER cuenta de Supabase Auth tenía acceso total a la
--    tabla. Si el registro público está activo (lo está por defecto),
--    cualquiera podía crearse una cuenta con la anon key y editar o
--    borrar el catálogo. Ahora solo las cuentas listadas aquí.
-- ---------------------------------------------------------
create table if not exists public.administradores (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  creado_en  timestamptz not null default now()
);

-- Sin políticas: nadie la lee ni la modifica desde la API pública; solo
-- desde el SQL Editor o con la service role.
alter table public.administradores enable row level security;
revoke all on public.administradores from anon, authenticated;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.administradores a where a.user_id = auth.uid()
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

-- ---------------------------------------------------------
-- 2. Políticas de la tabla piezas
-- ---------------------------------------------------------
alter table public.piezas enable row level security;

-- Políticas antiguas creadas a mano en el panel de Supabase. Las
-- políticas permisivas se suman (OR), así que estas anulaban todo lo
-- demás: "Visión pública" dejaba leer también las piezas OCULTAS y
-- "Solo admin puede modificar" dejaba editar a cualquier usuario con
-- sesión.
drop policy if exists "Visión pública" on public.piezas;
drop policy if exists "Solo admin puede modificar" on public.piezas;

-- El público (con o sin sesión) solo puede LEER piezas publicadas.
drop policy if exists "publico_lee_publicadas" on public.piezas;
create policy "publico_lee_publicadas"
  on public.piezas for select
  to anon, authenticated
  using (estado = 'publicada');

-- Solo los administradores de la lista blanca: ver todo, crear, editar,
-- ocultar y eliminar.
drop policy if exists "admin_acceso_total" on public.piezas;
create policy "admin_acceso_total"
  on public.piezas for all
  to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- ---------------------------------------------------------
-- 3. Restricciones de datos (segunda barrera además de la API)
--    NOT VALID: se aplican a filas nuevas o editadas sin rechazar las
--    que ya existen. Para comprobar las existentes, ver el paso 5.
-- ---------------------------------------------------------
alter table public.piezas drop constraint if exists piezas_sketchfab_id_formato;
alter table public.piezas add constraint piezas_sketchfab_id_formato
  check (sketchfab_model_id ~ '^[0-9a-f]{32}$') not valid;

alter table public.piezas drop constraint if exists piezas_urls_https;
alter table public.piezas add constraint piezas_urls_https
  check (
    surdoc_url ~ '^https://(www\.)?surdoc\.cl/'
    and sketchfab_url ~ '^https://(www\.)?sketchfab\.com/'
    and (imagen_url is null or imagen_url ~ '^https://')
  ) not valid;

alter table public.piezas drop constraint if exists piezas_tamanos;
alter table public.piezas add constraint piezas_tamanos
  check (
    char_length(coalesce(titulo, '')) <= 300
    and pg_column_size(ficha) <= 200000
    and jsonb_typeof(ficha) = 'object'
  ) not valid;

-- La función del trigger con search_path fijo (recomendación de Supabase).
create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

-- =========================================================
-- 4. Dar de alta al administrador (reemplaza el correo):
--
--   insert into public.administradores (user_id)
--   select id from auth.users where email = 'correo-del-admin@ejemplo.cl'
--   on conflict do nothing;
--
-- Ver quiénes son administradores:
--   select u.email from public.administradores a join auth.users u on u.id = a.user_id;
--
-- 5. (Opcional) Validar las filas existentes contra las restricciones:
--   alter table public.piezas validate constraint piezas_sketchfab_id_formato;
--   alter table public.piezas validate constraint piezas_urls_https;
--   alter table public.piezas validate constraint piezas_tamanos;
-- =========================================================
