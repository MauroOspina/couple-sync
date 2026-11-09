-- =====================================================================
-- COUPLE SYNC · ESQUEMA COMPLETO DE SUPABASE
-- Se puede ejecutar varias veces sin romper nada (idempotente).
-- Supabase Dashboard → SQL Editor → pegar todo → Run.
-- Si cambias algo aquí, vuelve a ejecutarlo completo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  user_name text,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Productos de la despensa. household_id es texto por compatibilidad con la v1.
create table if not exists public.products (
  id text not null,
  household_id text not null,
  name text not null,
  category text not null,
  status text not null default 'ok',
  in_cart boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (id, household_id)
);

create table if not exists public.chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  emoji text not null default '🧹',
  assigned_to uuid references auth.users(id) on delete set null,
  frequency text not null default 'once' check (frequency in ('once', 'daily', 'weekly', 'monthly')),
  due_date date,
  done boolean not null default false,
  last_done_at timestamptz,
  last_done_by uuid references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chores_household_idx on public.chores (household_id);

create table if not exists public.chore_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  chore_id uuid references public.chores(id) on delete set null,
  chore_title text not null,
  done_by uuid references auth.users(id) on delete set null,
  done_at timestamptz not null default now()
);
create index if not exists chore_logs_household_idx on public.chore_logs (household_id, done_at desc);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  emoji text not null default '🍲',
  servings smallint check (servings between 1 and 50),
  prep_minutes smallint check (prep_minutes between 1 and 1440),
  ingredients jsonb not null default '[]'::jsonb,
  steps text not null default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recipes_household_idx on public.recipes (household_id);

-- Buzón de sugerencias. La app solo puede escribir; se leen en el panel (Table Editor → suggestions).
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 5 and 2000),
  app_version text check (char_length(app_version) <= 60),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Tiempo real
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['households', 'household_members', 'products', 'chores', 'chore_logs', 'recipes'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. Seguridad (RLS): cada hogar solo ve lo suyo
-- ---------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.products enable row level security;
alter table public.chores enable row level security;
alter table public.chore_logs enable row level security;
alter table public.recipes enable row level security;
alter table public.suggestions enable row level security;

-- Borra cualquier política que no sea de este archivo (p. ej. creadas a mano en el panel).
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('households', 'household_members', 'products', 'chores', 'chore_logs', 'recipes', 'suggestions')
      and policyname not in (
        'households_select', 'households_insert', 'households_update', 'households_delete',
        'members_select', 'members_insert_owner', 'members_delete_self',
        'products_all', 'chores_all', 'chore_logs_all', 'recipes_all', 'suggestions_insert'
      )
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- security definer evita la recursión al consultar household_members desde sus propias políticas.
create or replace function public.is_household_member(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hid and user_id = auth.uid());
$$;

drop policy if exists "households_select" on public.households;
create policy "households_select" on public.households for select to authenticated
  using (created_by = auth.uid() or public.is_household_member(id));
drop policy if exists "households_insert" on public.households;
create policy "households_insert" on public.households for insert to authenticated
  with check (created_by = auth.uid());
drop policy if exists "households_update" on public.households;
create policy "households_update" on public.households for update to authenticated
  using (created_by = auth.uid());
drop policy if exists "households_delete" on public.households;
create policy "households_delete" on public.households for delete to authenticated
  using (created_by = auth.uid());

drop policy if exists "members_select" on public.household_members;
create policy "members_select" on public.household_members for select to authenticated
  using (user_id = auth.uid() or public.is_household_member(household_id));
drop policy if exists "members_insert_owner" on public.household_members;
create policy "members_insert_owner" on public.household_members for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from households h where h.id = household_id and h.created_by = auth.uid()));
drop policy if exists "members_delete_self" on public.household_members;
create policy "members_delete_self" on public.household_members for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "products_all" on public.products;
create policy "products_all" on public.products for all to authenticated
  using (exists (select 1 from household_members m
                 where m.household_id::text = products.household_id and m.user_id = auth.uid()))
  with check (exists (select 1 from household_members m
                 where m.household_id::text = products.household_id and m.user_id = auth.uid()));

drop policy if exists "chores_all" on public.chores;
create policy "chores_all" on public.chores for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "chore_logs_all" on public.chore_logs;
create policy "chore_logs_all" on public.chore_logs for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "recipes_all" on public.recipes;
create policy "recipes_all" on public.recipes for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- Cualquiera puede enviar (también sin cuenta) y nadie puede leer desde la app.
-- user_id debe ser el propio o vacío: nadie puede firmar a nombre de otra persona.
drop policy if exists "suggestions_insert" on public.suggestions;
create policy "suggestions_insert" on public.suggestions for insert to anon, authenticated
  with check (user_id is not distinct from auth.uid());

-- ---------------------------------------------------------------------
-- 4. Funciones que llama la app
-- ---------------------------------------------------------------------

-- Unirse por código sin poder listar los hogares de otros.
create or replace function public.join_household(code text)
returns public.households language plpgsql security definer set search_path = public as $$
declare
  c text := upper(trim(code));
  h households;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select * into h from households where invite_code in (c, 'HOGAR-' || c) limit 1;
  if h.id is null then raise exception 'Código inválido'; end if;
  insert into household_members (household_id, user_id, user_email, user_name, role)
  values (h.id, auth.uid(), auth.jwt()->>'email',
          coalesce(auth.jwt()->'user_metadata'->>'full_name', split_part(auth.jwt()->>'email', '@', 1)),
          'member')
  on conflict (household_id, user_id) do nothing;
  return h;
end $$;
revoke execute on function public.join_household(text) from public, anon;
grant execute on function public.join_household(text) to authenticated;

-- Eliminar la cuenta (requisito de Google Play). Si la persona era la única del hogar,
-- se borra el hogar con todo su contenido; si no, el hogar sigue para su pareja.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'No autenticado'; end if;

  delete from products p
  where p.household_id in (
    select h.id::text from households h
    where exists (select 1 from household_members m where m.household_id = h.id and m.user_id = uid)
      and not exists (select 1 from household_members m where m.household_id = h.id and m.user_id <> uid));

  delete from households h
  where exists (select 1 from household_members m where m.household_id = h.id and m.user_id = uid)
    and not exists (select 1 from household_members m where m.household_id = h.id and m.user_id <> uid);

  delete from household_members where user_id = uid;
  delete from auth.users where id = uid;
end $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
