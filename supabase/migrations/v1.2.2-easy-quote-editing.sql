-- Custos de Impressão 3D - Migração v1.2.2
-- Permite que o perfil Orçamentista edite somente Orçamentos Fáceis da própria equipe.
-- Execute este arquivo no SQL Editor antes de publicar a v1.2.2.

drop policy if exists "quotes_staff_update" on public.quotes;

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
