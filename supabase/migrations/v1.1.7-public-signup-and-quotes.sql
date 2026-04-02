-- Custos de Impressão 3D - Migração v1.1.7
-- Rode este arquivo no SQL Editor do Supabase.

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

alter table public.clients enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_select" on public.site_settings;
create policy "site_settings_public_select"
on public.site_settings
for select
to anon
using (allow_public_client_signup = true);

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
