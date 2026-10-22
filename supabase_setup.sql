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

-- Políticas permisivas para usuarios autenticados
create policy "Acceso total a hogares para usuarios autenticados"
  on public.households for all
  using (true)
  with check (true);

create policy "Acceso total a miembros para usuarios autenticados"
  on public.household_members for all
  using (true)
  with check (true);

create policy "Acceso total a productos para usuarios autenticados"
  on public.products for all
  using (true)
  with check (true);
