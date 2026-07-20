# Custos de Impressão 3D — Perfeitos Presentes

**Versão atual:** `v1.2.2`

Sistema web estático para calcular custos e orçamentos de impressão 3D, com banco real no Supabase, autenticação, RLS e publicação pelo GitHub Pages.

## Links do projeto

- Repositório: `https://github.com/rodrigosinistro/custos-impressao-3d`
- GitHub Pages: `https://rodrigosinistro.github.io/custos-impressao-3d/`
- Supabase: `https://lvmnwvxdjknfcbiypwpd.supabase.co`
- Manifest/PWA: `https://rodrigosinistro.github.io/custos-impressao-3d/manifest.webmanifest`

## O que o sistema faz

- Login simplificado para Administradores e Orçamentistas com **Supabase Auth**.
- Proteção dos dados com **Row Level Security (RLS)**.
- Administração de equipe com convite por e-mail, reenvio de acesso, redefinição de senha e exclusão de Orçamentistas.
- Módulo **Orçamento Fácil**, que calcula o valor final usando cliente, peça, link do projeto, observações, peso e tempo.
- Impressora e material padrão do Orçamento Fácil definidos pelo administrador nas Configurações.
- Orçamentistas podem criar, editar, salvar, compartilhar e enviar orçamentos fáceis para a produção.
- Orçamentistas visualizam a fila de produção em modo consulta, sem editar itens ou alterar status.
- Cadastro e gerenciamento de clientes, impressoras e materiais.
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
- Para usar a `v1.2.0`, execute também `supabase/migrations/v1.2.0-easy-quotes-and-users.sql` e publique a Edge Function `invite-user`.
- Para atualizar para a `v1.2.1`, não há nova migração SQL; publique novamente a Edge Function `invite-user`.
- Para usar a `v1.2.2`, execute também `supabase/migrations/v1.2.2-easy-quote-editing.sql`; a Edge Function não mudou em relação à v1.2.1.

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

1. **Atualizando a v1.2.1:** execute `supabase/migrations/v1.2.2-easy-quote-editing.sql` no SQL Editor e envie os arquivos da v1.2.2. Não é necessário republicar a Edge Function.
2. **Atualizando a v1.2.0:** republique a Edge Function `invite-user`, execute a migração da v1.2.2 e envie os arquivos atuais.
3. **Atualizando a v1.1.14:** execute, na ordem, `v1.2.0-easy-quotes-and-users.sql` e `v1.2.2-easy-quote-editing.sql`.
4. **Vindo de uma versão anterior:** execute primeiro as migrações anteriores necessárias e deixe `v1.2.2-easy-quote-editing.sql` por último.
5. **Instalação nova:** execute somente o `supabase/schema.sql` completo.
6. Em **Authentication > URL Configuration**, adicione `https://rodrigosinistro.github.io/custos-impressao-3d/?invite=1` às URLs de redirecionamento permitidas.
7. Publique `supabase/functions/invite-user` como Edge Function autenticada do Supabase quando estiver vindo de uma versão anterior à v1.2.1.
8. Nas Configurações do sistema, confirme a impressora e o material usados pelo Orçamento Fácil.
9. Suba os arquivos para o repositório e publique pelo GitHub Pages.

## Observações de uso

- Salvar um orçamento não compartilha automaticamente.
- O botão **Compartilhar** copia/envia a mensagem somente quando acionado no orçamento salvo. Quando houver Link Imagem do Projeto, inclui o aviso de referência, o link e tenta anexar a imagem.
- O botão **Aprovar e produzir** cria um item de produção com prazo de 7 dias, evita duplicação e passa a mostrar **ENVIADO PARA A PRODUÇÃO**.
- A fila de produção é exibida em ordem de chegada para facilitar o controle do que deve ser produzido primeiro.
- O perfil Orçamentista não altera cadastros, configurações ou status da produção; essas restrições também são aplicadas no banco pelo RLS.
- O perfil Orçamentista pode editar somente registros do Orçamento Fácil da própria equipe; não pode excluir orçamentos.
- A chave administrativa do Supabase fica somente dentro da Edge Function e nunca deve ser adicionada ao `config.js`.
