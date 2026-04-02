Versão atual: v1.1.5

# Custos de Impressão 3D (BambuLab) — Web App com Supabase (v1.1.3)

**Versão atual:** `v1.1.3`
Este projeto foi preparado para o repositório **rodrigosinistro/custos-impressao-3d** e para publicação em:

- Repositório: `https://github.com/rodrigosinistro/custos-impressao-3d`
- Pages: `https://rodrigosinistro.github.io/custos-impressao-3d/`

Agora o app usa **GitHub Pages no frontend** e **Supabase no banco/auth**, sem armazenamento local como base principal.

## O que esta versão faz

- login real com **Supabase Auth**
- proteção dos dados com **Row Level Security (RLS)**
- cadastro público de clientes indo para o banco
- CRUD de clientes, impressoras e materiais
- cálculo de orçamento com histórico salvo no banco
- exportação de snapshot JSON dos dados do usuário logado
- estrutura em camadas simples: `app / core / data / domain / features`

## Requisitos

- 1 projeto no Supabase
- executar o arquivo `supabase/schema.sql`
- criar pelo menos 1 usuário em **Authentication > Users** no Supabase
- preencher o arquivo `config.js`

## Configuração rápida

### 1) Execute o schema

No painel do Supabase, abra o **SQL Editor** e rode o conteúdo de:

```text
supabase/schema.sql
```

Esse arquivo cria:

- `profiles`
- `site_settings`
- `clients`
- `printers`
- `materials`
- `quotes`
- índices
- triggers
- políticas RLS

### 2) Crie o primeiro usuário admin

No Supabase:

- `Authentication`
- `Users`
- `Add user`

Crie um usuário com e-mail e senha.

O trigger do schema cria automaticamente:

- o registro em `profiles`
- o registro inicial em `site_settings`

O schema deixa novos usuários com role padrão `admin`, porque este projeto foi montado para uso administrativo direto. Se no futuro você criar mais contas, ajuste a coluna `role` na tabela `profiles` conforme necessário.

### 3) Preencha o `config.js`

Abra o arquivo `config.js` e troque os placeholders:

```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
  SUPABASE_ANON_KEY: 'SUA_CHAVE_ANON_OU_PUBLISHABLE',
  APP_NAME: 'Custos de Impressão 3D',
  REPOSITORY_URL: 'https://github.com/rodrigosinistro/custos-impressao-3d',
  PAGES_URL: 'https://rodrigosinistro.github.io/custos-impressao-3d/'
};
```

### 4) Publique no GitHub Pages

Você pode usar uma destas duas formas:

#### Opção A — Deploy from branch

- envie os arquivos para a branch `main`
- em **Settings > Pages**:
  - Source: `Deploy from a branch`
  - Branch: `main`
  - Folder: `/ (root)`

#### Opção B — GitHub Actions

Já existe um workflow em:

```text
.github/workflows/pages.yml
```

## Observações de segurança

A chave **anon/publishable** pode ficar no frontend quando o projeto usa **RLS** corretamente, mas a **service_role** nunca deve ir para o navegador. Como o GitHub Pages hospeda apenas arquivos estáticos, o banco e a autenticação ficam fora dele, no Supabase.

## Estrutura do projeto

```text
assets/
  favicon.svg
  styles.css
src/
  app/
  core/
  data/
  domain/
  features/
  lib/
supabase/
  schema.sql
config.js
index.html
README.md
changelog.md
```

## Migração do repositório atual

Se o seu repositório ainda tiver arquivos antigos como `app.js` e `app-main.js`, você pode removê-los depois de subir esta nova versão. O novo `index.html` já aponta para `src/main.js`.

## Próximas melhorias sugeridas

- edição de registros existentes
- exclusão com confirmação modal
- geração de PDF do orçamento
- status do orçamento (`aberto`, `aprovado`, `entregue`)
- upload de imagens/projetos no Supabase Storage
