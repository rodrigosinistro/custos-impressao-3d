-- Custos de Impressão 3D - Migração v1.1.14
-- Adiciona links de referência aos orçamentos.
-- Rode este arquivo no SQL Editor do Supabase antes de publicar a nova versão do app.

alter table public.quotes add column if not exists project_link text;
alter table public.quotes add column if not exists project_image_url text;
