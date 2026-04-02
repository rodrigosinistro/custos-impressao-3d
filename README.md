# Custos de Impressão 3D (GitHub Pages + Supabase)

**Versão atual:** `v1.1.8`

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
- compartilhamento manual apenas no orçamento salvo
- mensagem de compartilhamento amigável com o **valor final ao cliente**
- compartilhamento da logo da **Perfeitos Presentes** quando suportado pelo navegador

## Requisitos

- 1 projeto no Supabase
- schema já executado no SQL Editor
- pelo menos 1 usuário em **Authentication > Users** no Supabase
- `config.js` preenchido

## Configuração atual do projeto

```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://lvmnwvxdjknfcbiypwpd.supabase.co',
  SUPABASE_ANON_KEY: 'SUA_CHAVE_PUBLISHABLE',
  APP_NAME: 'Perfeitos Presentes',
  REPOSITORY_URL: 'https://github.com/rodrigosinistro/custos-impressao-3d',
  PAGES_URL: 'https://rodrigosinistro.github.io/custos-impressao-3d/'
};
```

## Observações

- Ao salvar um orçamento, o sistema **não compartilha automaticamente**.
- O botão **Compartilhar** envia a mensagem somente quando você clicar no orçamento salvo.
- Se o navegador suportar compartilhamento de arquivos, a logo da Perfeitos Presentes acompanha a mensagem.
