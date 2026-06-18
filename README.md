# Custos de Impressão 3D — Perfeitos Presentes

**Versão atual:** `v1.1.12`

Sistema web estático para calcular custos e orçamentos de impressão 3D, com banco real no Supabase, autenticação, RLS e publicação pelo GitHub Pages.

## Links do projeto

- Repositório: `https://github.com/rodrigosinistro/custos-impressao-3d`
- GitHub Pages: `https://rodrigosinistro.github.io/custos-impressao-3d/`
- Supabase: `https://lvmnwvxdjknfcbiypwpd.supabase.co`
- Manifest/PWA: `https://rodrigosinistro.github.io/custos-impressao-3d/manifest.webmanifest`

## O que o sistema faz

- Login administrativo com **Supabase Auth**.
- Proteção dos dados com **Row Level Security (RLS)**.
- Cadastro e gerenciamento de clientes, impressoras e materiais.
- Cadastro público de cliente, salvando direto no banco.
- Cálculo de orçamento com custo de material, energia, depreciação, manutenção, falha, mão de obra, acabamento, embalagem, frete, impostos, taxa de cartão e margem.
- Preço final ao cliente com sugestão automática terminada em **9,99**, além de preço manual e desconto em reais.
- Histórico de orçamentos salvos no Supabase.
- Edição, exclusão e compartilhamento de orçamentos.
- Mensagem de compartilhamento personalizada para a **Perfeitos Presentes**, com loja e Instagram.
- Novo módulo **Produção**, com fila em ordem de chegada, status do item e prazo padrão de até **7 dias**.
- Botão **Aprovar e produzir** no histórico de orçamentos, enviando o orçamento direto para a fila de produção.
- Cadastro de produção avulsa para itens que não vieram de orçamento.
- Interface responsiva para computador, tablet e celular, incluindo menu retrátil e tabelas em formato de cartões no telefone.

## Requisitos

- Projeto Supabase ativo.
- Tabelas e políticas executadas no SQL Editor.
- Pelo menos 1 usuário criado em **Authentication > Users**.
- Arquivo `config.js` preenchido com URL e chave anon/publishable.
- Para atualizar uma instalação anterior à `v1.1.11`, execute a migração `supabase/migrations/v1.1.11-production.sql` no SQL Editor do Supabase.
- A atualização da `v1.1.11` para a `v1.1.12` não exige nenhuma alteração no banco de dados.

## Configuração

O arquivo `config.js` deve ficar publicado junto com o site. Use apenas chave **anon/publishable**. Nunca coloque chave `service_role` no frontend.

```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://lvmnwvxdjknfcbiypwpd.supabase.co',
  SUPABASE_ANON_KEY: 'SUA_CHAVE_ANON_OU_PUBLISHABLE',
  APP_NAME: 'Perfeitos Presentes',
  REPOSITORY_URL: 'https://github.com/rodrigosinistro/custos-impressao-3d',
  PAGES_URL: 'https://rodrigosinistro.github.io/custos-impressao-3d/'
};
```

## Como publicar

1. Caso esteja vindo de uma versão anterior à `v1.1.11`, execute a migração `supabase/migrations/v1.1.11-production.sql`.
2. Se for uma instalação nova, execute `supabase/schema.sql` completo.
3. Para atualizar da `v1.1.11` para a `v1.1.12`, apenas substitua os arquivos do site; não há migração nova.
4. Suba todos os arquivos deste pacote para o repositório `rodrigosinistro/custos-impressao-3d`.
5. Publique pelo GitHub Pages usando a raiz da branch `main` ou o workflow incluído em `.github/workflows/pages.yml`.

## Observações de uso

- Salvar um orçamento não compartilha automaticamente.
- O botão **Compartilhar** copia/envia a mensagem somente quando acionado no orçamento salvo.
- O botão **Aprovar e produzir** cria um item de produção com prazo de 7 dias e evita duplicar o mesmo orçamento na fila.
- A fila de produção é exibida em ordem de chegada para facilitar o controle do que deve ser produzido primeiro.
