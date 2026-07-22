# Deploy e publicação

## Repositório alvo

- GitHub: https://github.com/rodrigosinistro/custos-impressao-3d
- Pages: https://rodrigosinistro.github.io/custos-impressao-3d/

## Atualização da v1.2.2 para v1.2.3

Esta atualização altera somente o texto compartilhado dos orçamentos. Não é necessário executar SQL nem republicar a Edge Function.

1. Extraia o pacote da v1.2.3.
2. Envie todos os arquivos para a branch `main` do GitHub.
3. Aguarde o GitHub Pages publicar e pressione `Ctrl + F5` ao abrir o sistema pela primeira vez.

## Atualização da v1.2.1 para v1.2.2

Esta atualização exige somente uma nova política no banco. A Edge Function `invite-user` não mudou em relação à v1.2.1.

1. Extraia o pacote da v1.2.2.
2. Abra o Supabase do projeto e vá em **SQL Editor**.
3. Abra o arquivo `supabase/migrations/v1.2.2-easy-quote-editing.sql`, copie todo o conteúdo e execute no SQL Editor.
4. Envie todos os arquivos da v1.2.2 para a branch `main` do GitHub.
5. Aguarde o GitHub Pages publicar e pressione `Ctrl + F5` ao abrir o sistema pela primeira vez.

## Atualização da v1.2.0 para v1.2.2

Esta atualização exige a correção da Edge Function introduzida na v1.2.1 e a nova política da v1.2.2.

1. Extraia o pacote da v1.2.2.
2. Execute `supabase/migrations/v1.2.2-easy-quote-editing.sql` no SQL Editor do Supabase.
3. Abra um terminal na pasta que contém `supabase/functions/invite-user/index.ts`.
4. No Windows PowerShell, autentique a ferramenta caso seja necessário:

```powershell
npx.cmd --yes supabase@latest login
```

5. Republique a Edge Function atualizada:

```powershell
npx.cmd --yes supabase@latest functions deploy invite-user --project-ref lvmnwvxdjknfcbiypwpd --use-api
```

6. Envie todos os arquivos da v1.2.2 para a branch `main` do GitHub.
7. Aguarde o GitHub Pages publicar e pressione `Ctrl + F5` ao abrir o sistema pela primeira vez.

## Atualização da v1.1.14 para v1.2.2

1. Abra o Supabase do projeto.
2. Vá em **SQL Editor**.
3. Execute `supabase/migrations/v1.2.0-easy-quotes-and-users.sql`.
4. Execute `supabase/migrations/v1.2.2-easy-quote-editing.sql`.
5. Em **Authentication > URL Configuration > Redirect URLs**, adicione:

   `https://rodrigosinistro.github.io/custos-impressao-3d/?invite=1`

6. Publique a Edge Function usando os comandos da seção anterior.
7. Envie todos os arquivos da v1.2.2 para a branch `main`.
8. Entre como administrador e confirme a impressora e o material do Orçamento Fácil em **Configurações**.

## Vindo de uma versão anterior à v1.1.14

Execute, nesta ordem, as migrações que ainda não foram aplicadas:

1. `supabase/migrations/v1.1.11-production.sql`
2. `supabase/migrations/v1.1.14-project-links.sql`
3. `supabase/migrations/v1.2.0-easy-quotes-and-users.sql`
4. `supabase/migrations/v1.2.2-easy-quote-editing.sql`

Depois configure a URL de redirecionamento, publique a Edge Function e envie os arquivos conforme a seção anterior.

## Instalação nova

1. Execute `supabase/schema.sql` completo no SQL Editor do Supabase.
2. Crie o primeiro usuário em **Authentication > Users**; ele será o administrador.
3. Edite `config.js` com a URL e a chave anon/publishable.
4. Adicione a URL de redirecionamento indicada acima.
5. Publique a Edge Function `invite-user`.
6. Envie os arquivos para a branch `main` e ative o GitHub Pages.
7. Confirme a impressora e o material do Orçamento Fácil em **Configurações**.

## Edge Function

A função `invite-user`, atualizada na v1.2.1 e mantida sem alterações nas versões v1.2.2 e v1.2.3, executa três operações protegidas:

- convidar um Orçamentista;
- enviar um link para definição de nova senha;
- excluir o acesso de um Orçamentista.

Todas as operações verificam a sessão, exigem o perfil Administrador e validam se o usuário pertence à equipe. A conta administradora não pode ser excluída pela tela.

As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidas automaticamente à Edge Function pelo Supabase. A chave `service_role` nunca deve ser copiada para arquivos do site.

## Observação importante

O arquivo `config.js` deve ficar publicado junto do site, pois o frontend precisa da URL do Supabase e da chave anon/publishable. Nunca use `service_role` nesse arquivo.
