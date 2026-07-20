-- Custos de Impressão 3D - schema Supabase
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'manager', 'staff')),
  account_owner_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists account_owner_id uuid;

update public.profiles
set account_owner_id = id
where account_owner_id is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_account_owner_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_account_owner_id_fkey
      foreign key (account_owner_id) references public.profiles(id) on delete cascade;
  end if;
end;
$$;

alter table public.profiles alter column account_owner_id set not null;

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

alter table public.site_settings add column if not exists default_printer_id uuid;
alter table public.site_settings add column if not exists default_material_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_settings_default_printer_id_fkey'
  ) then
    alter table public.site_settings
      add constraint site_settings_default_printer_id_fkey
      foreign key (default_printer_id) references public.printers(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'site_settings_default_material_id_fkey'
  ) then
    alter table public.site_settings
      add constraint site_settings_default_material_id_fkey
      foreign key (default_material_id) references public.materials(id) on delete set null;
  end if;
end;
$$;

update public.site_settings as settings
set
  default_printer_id = coalesce(
    settings.default_printer_id,
    (
      select printer.id
      from public.printers as printer
      where printer.owner_id = settings.owner_id
      order by printer.is_active desc, printer.created_at asc
      limit 1
    )
  ),
  default_material_id = coalesce(
    settings.default_material_id,
    (
      select material.id
      from public.materials as material
      where material.owner_id = settings.owner_id
      order by material.created_at asc
      limit 1
    )
  );

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text,
  piece_name text not null,
  project_link text,
  project_image_url text,
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
  quote_mode text not null default 'full' check (quote_mode in ('full', 'easy')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.quotes add column if not exists calculated_final_price numeric(12,2) not null default 0;
alter table public.quotes add column if not exists adjusted_price numeric(12,2) not null default 0;
alter table public.quotes add column if not exists manual_adjusted_price numeric(12,2);
alter table public.quotes add column if not exists discount_amount numeric(12,2) not null default 0;
alter table public.quotes add column if not exists project_link text;
alter table public.quotes add column if not exists project_image_url text;
alter table public.quotes add column if not exists quote_mode text not null default 'full';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quotes_quote_mode_check'
  ) then
    alter table public.quotes
      add constraint quotes_quote_mode_check check (quote_mode in ('full', 'easy'));
  end if;
end;
$$;

update public.quotes
set
  calculated_final_price = coalesce(nullif(calculated_final_price, 0), final_price),
  adjusted_price = coalesce(nullif(adjusted_price, 0), final_price),
  discount_amount = coalesce(discount_amount, 0)
where calculated_final_price = 0 or adjusted_price = 0 or discount_amount is null;

create table if not exists public.production_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  client_name text,
  piece_name text not null,
  printer_id uuid references public.printers(id) on delete set null,
  printer_name text,
  material_id uuid references public.materials(id) on delete set null,
  material_name text,
  quantity integer not null default 1 check (quantity > 0),
  weight_g numeric(12,2) not null default 0,
  print_time_minutes integer not null default 0,
  final_price numeric(12,2) not null default 0,
  expected_profit numeric(12,2) not null default 0,
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'finished', 'delivered', 'canceled')),
  queued_at timestamptz not null default timezone('utc', now()),
  due_date date not null default (current_date + 7),
  completed_at timestamptz,
  delivered_at timestamptz,
  notes text,
  production_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_production_items_owner_id on public.production_items(owner_id);
create index if not exists idx_production_items_owner_status on public.production_items(owner_id, status);
create index if not exists idx_production_items_owner_queue on public.production_items(owner_id, queued_at);
create index if not exists idx_production_items_owner_due_date on public.production_items(owner_id, due_date);
create unique index if not exists idx_production_items_owner_quote_unique
  on public.production_items(owner_id, quote_id)
  where quote_id is not null;

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

create or replace function public.current_account_owner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(account_owner_id, id)
  from public.profiles
  where id = (select auth.uid())
  limit 1;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_account_owner_id() from public;
revoke all on function public.current_app_role() from public;
grant execute on function public.current_account_owner_id() to authenticated;
grant execute on function public.current_app_role() to authenticated;

create or replace function public.list_client_directory()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select client.id, client.name
  from public.clients as client
  where client.owner_id = public.current_account_owner_id()
  order by client.name asc;
$$;

revoke all on function public.list_client_directory() from public;
grant execute on function public.list_client_directory() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if exists (select 1 from public.profiles where role = 'admin') then
    v_role := 'staff';
  else
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, role, account_owner_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role,
    new.id
  )
  on conflict (id) do nothing;

  if v_role = 'admin' then
    insert into public.site_settings (owner_id)
    values (new.id)
    on conflict (owner_id) do nothing;
  end if;

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

drop trigger if exists handle_production_items_updated_at on public.production_items;
create trigger handle_production_items_updated_at
  before update on public.production_items
  for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.clients enable row level security;
alter table public.printers enable row level security;
alter table public.materials enable row level security;
alter table public.quotes enable row level security;
alter table public.production_items enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_team_select" on public.profiles;
create policy "profiles_team_select"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (
    (select public.current_app_role()) = 'admin'
    and account_owner_id = (select public.current_account_owner_id())
  )
);

-- Site settings
drop policy if exists "site_settings_public_select" on public.site_settings;
create policy "site_settings_public_select"
on public.site_settings
for select
to anon
using (allow_public_client_signup = true);

drop policy if exists "site_settings_owner_all" on public.site_settings;
drop policy if exists "site_settings_team_select" on public.site_settings;
drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_team_select"
on public.site_settings
for select
to authenticated
using (owner_id = (select public.current_account_owner_id()));

create policy "site_settings_admin_all"
on public.site_settings
for all
to authenticated
using (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
)
with check (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
);

-- Clients
drop policy if exists "clients_owner_select" on public.clients;
drop policy if exists "clients_owner_insert" on public.clients;
drop policy if exists "clients_owner_update" on public.clients;
drop policy if exists "clients_owner_delete" on public.clients;
drop policy if exists "clients_team_select" on public.clients;
drop policy if exists "clients_admin_all" on public.clients;
create policy "clients_admin_all"
on public.clients
for all
to authenticated
using (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
)
with check (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
);

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
drop policy if exists "printers_team_select" on public.printers;
drop policy if exists "printers_admin_all" on public.printers;
create policy "printers_team_select"
on public.printers
for select
to authenticated
using (owner_id = (select public.current_account_owner_id()));

create policy "printers_admin_all"
on public.printers
for all
to authenticated
using (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
)
with check (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
);

-- Materials
drop policy if exists "materials_owner_all" on public.materials;
drop policy if exists "materials_team_select" on public.materials;
drop policy if exists "materials_admin_all" on public.materials;
create policy "materials_team_select"
on public.materials
for select
to authenticated
using (owner_id = (select public.current_account_owner_id()));

create policy "materials_admin_all"
on public.materials
for all
to authenticated
using (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
)
with check (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
);

-- Quotes
drop policy if exists "quotes_owner_all" on public.quotes;
drop policy if exists "quotes_team_select" on public.quotes;
drop policy if exists "quotes_staff_insert" on public.quotes;
drop policy if exists "quotes_staff_update" on public.quotes;
drop policy if exists "quotes_admin_all" on public.quotes;
create policy "quotes_team_select"
on public.quotes
for select
to authenticated
using (
  owner_id = (select public.current_account_owner_id())
  and (
    (select public.current_app_role()) = 'admin'
    or quote_mode = 'easy'
  )
);

create policy "quotes_staff_insert"
on public.quotes
for insert
to authenticated
with check (
  (select public.current_app_role()) = 'staff'
  and owner_id = (select public.current_account_owner_id())
  and quote_mode = 'easy'
);

create policy "quotes_staff_update"
on public.quotes
for update
to authenticated
using (
  (select public.current_app_role()) = 'staff'
  and owner_id = (select public.current_account_owner_id())
  and quote_mode = 'easy'
)
with check (
  (select public.current_app_role()) = 'staff'
  and owner_id = (select public.current_account_owner_id())
  and quote_mode = 'easy'
);

create policy "quotes_admin_all"
on public.quotes
for all
to authenticated
using (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
)
with check (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
);

-- Production items
drop policy if exists "production_items_owner_all" on public.production_items;
drop policy if exists "production_items_team_select" on public.production_items;
drop policy if exists "production_items_staff_insert" on public.production_items;
drop policy if exists "production_items_admin_all" on public.production_items;
create policy "production_items_team_select"
on public.production_items
for select
to authenticated
using (owner_id = (select public.current_account_owner_id()));

create policy "production_items_staff_insert"
on public.production_items
for insert
to authenticated
with check (
  (select public.current_app_role()) = 'staff'
  and owner_id = (select public.current_account_owner_id())
  and status = 'queued'
  and exists (
    select 1
    from public.quotes as quote
    where quote.id = production_items.quote_id
      and quote.owner_id = (select public.current_account_owner_id())
      and quote.quote_mode = 'easy'
  )
);

create policy "production_items_admin_all"
on public.production_items
for all
to authenticated
using (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
)
with check (
  (select public.current_app_role()) = 'admin'
  and owner_id = (select public.current_account_owner_id())
);
