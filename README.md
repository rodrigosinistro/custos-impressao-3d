# Custos de Impressão 3D — Perfeitos Presentes

**Versão atual:** `v1.1.14`

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
- Cálculo de orçamento com custo de material, energia, depreciação, manutenção, falha, embalagem, frete, impostos, taxa de cartão e margem.
- Mão de obra e pintura calculadas automaticamente como **10% do valor calculado**, antes do arredondamento.
- Preço final ao cliente com sugestão automática sempre arredondada **para cima** no padrão **X,99**, além de preço manual e desconto em reais.
- Histórico de orçamentos salvos no Supabase, com links para o projeto e para a imagem de referência.
- Edição, exclusão e compartilhamento de orçamentos.
- Mensagem de compartilhamento personalizada para a **Perfeitos Presentes**, com loja, Instagram e imagem de referência do projeto quando cadastrada.
- Novo módulo **Produção**, com fila em ordem de chegada, status do item e prazo padrão de até **7 dias**.
- Botão **Aprovar e produzir** no histórico de orçamentos, enviando o orçamento direto para a fila e mudando para **ENVIADO PARA A PRODUÇÃO** após o envio.
- Cadastro de produção avulsa para itens que não vieram de orçamento.
- Interface responsiva para computador, tablet e celular, incluindo menu retrátil e tabelas em formato de cartões no telefone.

## Requisitos

- Projeto Supabase ativo.
- Tabelas e políticas executadas no SQL Editor.
- Pelo menos 1 usuário criado em **Authentication > Users**.
- Arquivo `config.js` preenchido com URL e chave anon/publishable.
- Para atualizar uma instalação anterior à `v1.1.11`, execute a migração `supabase/migrations/v1.1.11-production.sql` no SQL Editor do Supabase.
- Para usar a `v1.1.14`, execute também a migração `supabase/migrations/v1.1.14-project-links.sql`.

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

1. **Atualizando a v1.1.13:** execute `supabase/migrations/v1.1.14-project-links.sql` no SQL Editor do Supabase.
2. **Vindo de uma versão anterior à v1.1.11:** execute primeiro `supabase/migrations/v1.1.11-production.sql` e depois `supabase/migrations/v1.1.14-project-links.sql`.
3. **Instalação nova:** execute somente o `supabase/schema.sql` completo.
4. Suba todos os arquivos deste pacote para o repositório `rodrigosinistro/custos-impressao-3d`.
5. Publique pelo GitHub Pages usando a raiz da branch `main` ou o workflow incluído em `.github/workflows/pages.yml`.

## Observações de uso

- Salvar um orçamento não compartilha automaticamente.
- O botão **Compartilhar** copia/envia a mensagem somente quando acionado no orçamento salvo. Quando houver Link Imagem do Projeto, inclui o aviso de referência, o link e tenta anexar a imagem.
- O botão **Aprovar e produzir** cria um item de produção com prazo de 7 dias, evita duplicação e passa a mostrar **ENVIADO PARA A PRODUÇÃO**.
- A fila de produção é exibida em ordem de chegada para facilitar o controle do que deve ser produzido primeiro.
