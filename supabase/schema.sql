-- Custos de Impressão 3D - schema Supabase
-- Execute este arquivo no SQL Editor do Supabase.
-- Se já estiver em produção, você também pode rodar apenas: supabase/migrations/v1.1.7-public-signup-and-quotes.sql

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'manager', 'staff')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_settings (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  public_app_name text not null default 'Custos de Impressão 3D',
  company_name text not null default 'Minha Impressão 3D',
  company_whatsapp text,
  currency text not null default 'BRL',
  energy_cost_kwh numeric(12,4) not null default 1.15,
  default_failure_rate numeric(8,2) not null default 8,
  default_profit_margin numeric(8,2) not null default 40,
  default_tax_rate numeric(8,2) not null default 6,
  default_card_fee_rate numeric(8,2) not null default 4.99,
  default_labor_cost numeric(12,2) not null default 0,
  default_finishing_cost numeric(12,2) not null default 0,
  default_packaging_cost numeric(12,2) not null default 0,
  allow_public_client_signup boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  whatsapp text,
  notes text,
  source text not null default 'admin' check (source in ('admin', 'public_form')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.printers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  power_watts numeric(12,2) not null default 0,
  purchase_cost numeric(12,2) not null default 0,
  useful_life_hours numeric(12,2) not null default 0,
  monthly_maintenance_cost numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  brand text,
  type text,
  spool_weight_g numeric(12,2) not null default 0,
  spool_cost numeric(12,2) not null default 0,
  cost_per_g numeric(12,6) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text,
  piece_name text not null,
  printer_id uuid references public.printers(id) on delete set null,
  printer_name text,
  material_id uuid references public.materials(id) on delete set null,
  material_name text,
  weight_g numeric(12,2) not null default 0,
  print_time_minutes integer not null default 0,
  energy_cost_kwh numeric(12,4) not null default 0,
  failure_rate numeric(8,2) not null default 0,
  labor_cost numeric(12,2) not null default 0,
  finishing_cost numeric(12,2) not null default 0,
  packaging_cost numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  profit_margin numeric(8,2) not null default 0,
  tax_rate numeric(8,2) not null default 0,
  card_fee_rate numeric(8,2) not null default 0,
  notes text,
  cost_material numeric(12,2) not null default 0,
  cost_energy numeric(12,2) not null default 0,
  cost_depreciation numeric(12,2) not null default 0,
  cost_maintenance numeric(12,2) not null default 0,
  base_cost numeric(12,2) not null default 0,
  cost_with_failure numeric(12,2) not null default 0,
  price_with_profit numeric(12,2) not null default 0,
  price_with_tax numeric(12,2) not null default 0,
  final_price numeric(12,2) not null default 0,
  expected_profit numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.quotes add column if not exists calculated_final_price numeric(12,2) not null default 0;
alter table public.quotes add column if not exists adjusted_price numeric(12,2) not null default 0;
alter table public.quotes add column if not exists manual_adjusted_price numeric(12,2);
alter table public.quotes add column if not exists discount_amount numeric(12,2) not null default 0;

update public.quotes
set
  calculated_final_price = coalesce(nullif(calculated_final_price, 0), final_price),
  adjusted_price = coalesce(nullif(adjusted_price, 0), final_price),
  discount_amount = coalesce(discount_amount, 0)
where calculated_final_price = 0 or adjusted_price = 0 or discount_amount is null;

create index if not exists idx_clients_owner_id on public.clients(owner_id);
create index if not exists idx_printers_owner_id on public.printers(owner_id);
create index if not exists idx_materials_owner_id on public.materials(owner_id);
create index if not exists idx_quotes_owner_id on public.quotes(owner_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin'
  )
  on conflict (id) do nothing;

  insert into public.site_settings (owner_id)
  values (new.id)
  on conflict (owner_id) do nothing;

  return new;
end;
$$;

create or replace function public.register_public_client(
  p_owner_id uuid,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_whatsapp text default null,
  p_notes text default null
)
returns public.clients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.site_settings;
  v_client public.clients;
begin
  select *
    into v_settings
  from public.site_settings
  where owner_id = p_owner_id
    and allow_public_client_signup = true
  limit 1;

  if v_settings.owner_id is null then
    raise exception 'Cadastro público indisponível para esta conta.';
  end if;

  insert into public.clients (
    owner_id,
    name,
    email,
    phone,
    whatsapp,
    notes,
    source
  ) values (
    p_owner_id,
    trim(p_name),
    nullif(trim(p_email), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_whatsapp), ''),
    nullif(trim(p_notes), ''),
    'public_form'
  )
  returning * into v_client;

  return v_client;
end;
$$;

grant execute on function public.register_public_client(uuid, text, text, text, text, text) to anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_site_settings_updated_at on public.site_settings;
create trigger handle_site_settings_updated_at
  before update on public.site_settings
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_clients_updated_at on public.clients;
create trigger handle_clients_updated_at
  before update on public.clients
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_printers_updated_at on public.printers;
create trigger handle_printers_updated_at
  before update on public.printers
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_materials_updated_at on public.materials;
create trigger handle_materials_updated_at
  before update on public.materials
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_quotes_updated_at on public.quotes;
create trigger handle_quotes_updated_at
  before update on public.quotes
  for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.clients enable row level security;
alter table public.printers enable row level security;
alter table public.materials enable row level security;
alter table public.quotes enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
 to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
 to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Site settings

drop policy if exists "site_settings_public_select" on public.site_settings;
create policy "site_settings_public_select"
on public.site_settings
for select
 to anon
using (allow_public_client_signup = true);

drop policy if exists "site_settings_owner_all" on public.site_settings;
create policy "site_settings_owner_all"
on public.site_settings
for all
 to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

-- Clients

drop policy if exists "clients_owner_select" on public.clients;
create policy "clients_owner_select"
on public.clients
for select
 to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "clients_owner_insert" on public.clients;
create policy "clients_owner_insert"
on public.clients
for insert
 to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "clients_owner_update" on public.clients;
create policy "clients_owner_update"
on public.clients
for update
 to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "clients_owner_delete" on public.clients;
create policy "clients_owner_delete"
on public.clients
for delete
 to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "clients_public_insert" on public.clients;
create policy "clients_public_insert"
on public.clients
for insert
 to anon
with check (
  source = 'public_form'
  and owner_id in (
    select owner_id from public.site_settings where allow_public_client_signup = true
  )
);

-- Printers
drop policy if exists "printers_owner_all" on public.printers;
create policy "printers_owner_all"
on public.printers
for all
 to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

-- Materials
drop policy if exists "materials_owner_all" on public.materials;
create policy "materials_owner_all"
on public.materials
for all
 to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

-- Quotes
drop policy if exists "quotes_owner_all" on public.quotes;
create policy "quotes_owner_all"
on public.quotes
for all
 to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
