-- Custos de Impressão 3D - Migração v1.1.11
-- Módulo Produção: fila de itens aprovados com prazo padrão de 7 dias.
-- Rode este arquivo no SQL Editor do Supabase antes de publicar a nova versão do app.

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

drop trigger if exists handle_production_items_updated_at on public.production_items;
create trigger handle_production_items_updated_at
  before update on public.production_items
  for each row execute procedure public.handle_updated_at();

alter table public.production_items enable row level security;

-- Production items
drop policy if exists "production_items_owner_all" on public.production_items;
create policy "production_items_owner_all"
on public.production_items
for all
 to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
