Versão atual: v1.1.6

# Custos de Impressão 3D (GitHub Pages + Supabase)

**Versão atual:** `v1.1.6`

Projeto preparado para:

- Repositório: `https://github.com/rodrigosinistro/custos-impressao-3d`
- Pages: `https://rodrigosinistro.github.io/custos-impressao-3d/`
- Supabase: `https://lvmnwvxdjknfcbiypwpd.supabase.co`

## O que esta versão faz

- login real com **Supabase Auth**
- proteção com **Row Level Security (RLS)**
- cadastro público de clientes indo para o banco
- CRUD de clientes, impressoras e materiais
- cálculo de orçamento com histórico salvo no banco
- preço final ao cliente com ajuste automático para baixo no padrão **x9,99**
- campo de **preço manual** e campo de **desconto em reais**
- botão para **editar orçamento** no histórico
- exportação de snapshot JSON dos dados do usuário logado

## Importante nesta versão

Depois de subir esta versão, rode novamente no **SQL Editor** do Supabase o arquivo:

```text
supabase/schema.sql
```

Isso é necessário para:

- criar a função `register_public_client`
- atualizar a tabela `quotes` com os novos campos de ajuste e desconto

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

### 2) Crie o primeiro usuário admin

No Supabase:

- `Authentication`
- `Users`
- `Add user`

### 3) Confira o `config.js`

```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://lvmnwvxdjknfcbiypwpd.supabase.co',
  SUPABASE_ANON_KEY: 'SUA_CHAVE_ANON_OU_PUBLISHABLE',
  APP_NAME: 'Custos de Impressão 3D',
  REPOSITORY_URL: 'https://github.com/rodrigosinistro/custos-impressao-3d',
  PAGES_URL: 'https://rodrigosinistro.github.io/custos-impressao-3d/'
};
```

## Observações de segurança

A chave **anon/publishable** pode ficar no frontend quando o projeto usa **RLS** corretamente. A **service_role** nunca deve ser exposta no navegador.
