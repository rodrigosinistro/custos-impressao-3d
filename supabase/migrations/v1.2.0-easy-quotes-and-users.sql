-- Custos de Impressão 3D - Migração v1.2.0
-- Orçamento Fácil, equipe com perfil Orçamentista e permissões compartilhadas.
-- Execute este arquivo no SQL Editor antes de publicar a v1.2.0.

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

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.clients enable row level security;
alter table public.printers enable row level security;
alter table public.materials enable row level security;
alter table public.quotes enable row level security;
alter table public.production_items enable row level security;

-- Profiles: o usuário consulta o próprio perfil; o administrador também vê a equipe.
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

-- Configurações: equipe consulta, somente administrador modifica.
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

-- Clientes: orçamentista consulta nomes; somente administrador gerencia o cadastro.
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

-- Impressoras e materiais: equipe consulta; somente administrador modifica.
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

-- Orçamentos: equipe consulta; orçamentista cria apenas no modo fácil.
drop policy if exists "quotes_owner_all" on public.quotes;
drop policy if exists "quotes_team_select" on public.quotes;
drop policy if exists "quotes_staff_insert" on public.quotes;
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

-- Produção: equipe consulta; orçamentista envia apenas Orçamento Fácil.
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
