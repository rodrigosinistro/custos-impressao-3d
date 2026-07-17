# Deploy e publicação

## Repositório alvo

- GitHub: https://github.com/rodrigosinistro/custos-impressao-3d
- Pages: https://rodrigosinistro.github.io/custos-impressao-3d/

## Atualização da v1.2.0 para v1.2.1

Esta atualização não exige nenhuma nova migração SQL.

1. Extraia o pacote da v1.2.1.
2. Abra um terminal na pasta que contém `supabase/functions/invite-user/index.ts`.
3. No Windows PowerShell, autentique a ferramenta caso seja necessário:

```powershell
npx.cmd --yes supabase@latest login
```

4. Republique a Edge Function atualizada:

```powershell
npx.cmd --yes supabase@latest functions deploy invite-user --project-ref lvmnwvxdjknfcbiypwpd --use-api
```

5. Envie todos os arquivos da v1.2.1 para a branch `main` do GitHub.
6. Aguarde o GitHub Pages publicar e pressione `Ctrl + F5` ao abrir o sistema pela primeira vez.

## Atualização da v1.1.14 para v1.2.1

1. Abra o Supabase do projeto.
2. Vá em **SQL Editor**.
3. Execute `supabase/migrations/v1.2.0-easy-quotes-and-users.sql`.
4. Em **Authentication > URL Configuration > Redirect URLs**, adicione:

   `https://rodrigosinistro.github.io/custos-impressao-3d/?invite=1`

5. Publique a Edge Function usando os comandos da seção anterior.
6. Envie todos os arquivos da v1.2.1 para a branch `main`.
7. Entre como administrador e confirme a impressora e o material do Orçamento Fácil em **Configurações**.

## Vindo de uma versão anterior à v1.1.14

Execute, nesta ordem, as migrações que ainda não foram aplicadas:

1. `supabase/migrations/v1.1.11-production.sql`
2. `supabase/migrations/v1.1.14-project-links.sql`
3. `supabase/migrations/v1.2.0-easy-quotes-and-users.sql`

Depois configure a URL de redirecionamento, publique a Edge Function e envie os arquivos conforme a seção anterior.

## Instalação nova

1. Execute `supabase/schema.sql` completo no SQL Editor do Supabase.
2. Crie o primeiro usuário em **Authentication > Users**; ele será o administrador.
3. Edite `config.js` com a URL e a chave anon/publishable.
4. Adicione a URL de redirecionamento indicada acima.
5. Publique a Edge Function `invite-user`.
6. Envie os arquivos para a branch `main` e ative o GitHub Pages.
7. Confirme a impressora e o material do Orçamento Fácil em **Configurações**.

## O que mudou na Edge Function

A mesma função `invite-user` agora executa três operações protegidas:

- convidar um Orçamentista;
- enviar um link para definição de nova senha;
- excluir o acesso de um Orçamentista.

Todas as operações verificam a sessão, exigem o perfil Administrador e validam se o usuário pertence à equipe. A conta administradora não pode ser excluída pela tela.

As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidas automaticamente à Edge Function pelo Supabase. A chave `service_role` nunca deve ser copiada para arquivos do site.

## Observação importante

O arquivo `config.js` deve ficar publicado junto do site, pois o frontend precisa da URL do Supabase e da chave anon/publishable. Nunca use `service_role` nesse arquivo.
