-- ===================================================================
-- SCRIPT DE INICIALIZACIÓN COMPLETO PARA SUPABASE
-- Copia y pega este script en: Supabase Dashboard -> SQL Editor -> Run
-- ===================================================================

-- 1. Tabla de Hogares / Proyectos Compartidos
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Miembros del Hogar (asocia cuentas de Google con el hogar)
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text,
  user_name text,
  role text default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(household_id, user_id)
);

-- 3. Tabla de Productos de la Alacena y Mercado
create table if not exists public.products (
  id text not null,
  household_id text not null,
  name text not null,
  category text not null,
  status text not null default 'ok',
  in_cart boolean not null default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id, household_id)
);

-- 4. Habilitar Replicación en Tiempo Real (Realtime)
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.household_members;
alter publication supabase_realtime add table public.households;

-- 5. Configurar Seguridad a Nivel de Fila (Row Level Security - RLS)
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.products enable row level security;

drop policy if exists "Acceso total a hogares para usuarios autenticados" on public.households;
drop policy if exists "Acceso total a miembros para usuarios autenticados" on public.household_members;
drop policy if exists "Acceso total a productos para usuarios autenticados" on public.products;

create or replace function public.is_household_member(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hid and user_id = auth.uid());
$$;

create policy "households_select" on public.households for select to authenticated
  using (created_by = auth.uid() or public.is_household_member(id));
create policy "households_insert" on public.households for insert to authenticated
  with check (created_by = auth.uid());
create policy "households_update" on public.households for update to authenticated
  using (created_by = auth.uid());
create policy "households_delete" on public.households for delete to authenticated
  using (created_by = auth.uid());

create policy "members_select" on public.household_members for select to authenticated
  using (user_id = auth.uid() or public.is_household_member(household_id));
create policy "members_insert_owner" on public.household_members for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from households h where h.id = household_id and h.created_by = auth.uid()));
create policy "members_delete_self" on public.household_members for delete to authenticated
  using (user_id = auth.uid());

create policy "products_all" on public.products for all to authenticated
  using (exists (select 1 from household_members m
                 where m.household_id::text = products.household_id and m.user_id = auth.uid()))
  with check (exists (select 1 from household_members m
                 where m.household_id::text = products.household_id and m.user_id = auth.uid()));

-- 6. Unirse a un hogar por código (sin exponer la lista de hogares)
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
