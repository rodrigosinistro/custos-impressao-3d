# Deploy e publicação

## Repositório alvo

- GitHub: https://github.com/rodrigosinistro/custos-impressao-3d
- Pages: https://rodrigosinistro.github.io/custos-impressao-3d/

## Atualização para v1.2.0

### Vindo da v1.1.14

1. Abra o Supabase do projeto.
2. Vá em **SQL Editor**.
3. Execute `supabase/migrations/v1.2.0-easy-quotes-and-users.sql`.
4. Em **Authentication > URL Configuration > Redirect URLs**, adicione:

   `https://rodrigosinistro.github.io/custos-impressao-3d/?invite=1`

5. Publique a Edge Function de convite pelo terminal:

```bash
npx supabase login
npx supabase functions deploy invite-user --project-ref lvmnwvxdjknfcbiypwpd --use-api
```

6. Suba todos os arquivos da v1.2.0 para a branch `main`.
7. Aguarde o GitHub Pages publicar a nova versão.
8. Entre como administrador, abra **Configurações** e confirme a impressora e o material do Orçamento Fácil.

As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidas automaticamente à Edge Function pelo Supabase. A chave `service_role` não deve ser copiada para nenhum arquivo do site.

### Vindo de uma versão anterior à v1.1.14

1. Abra o Supabase do projeto.
2. Vá em **SQL Editor**.
3. Execute, nesta ordem, as migrações que ainda não foram aplicadas:
   - `supabase/migrations/v1.1.11-production.sql`
   - `supabase/migrations/v1.1.14-project-links.sql`
   - `supabase/migrations/v1.2.0-easy-quotes-and-users.sql`
4. Continue a partir do passo 4 da seção anterior.

## Instalação nova

1. Execute `supabase/schema.sql` completo no SQL Editor do Supabase.
2. Crie o primeiro usuário em `Authentication > Users`; ele será o administrador.
3. Edite `config.js` com a URL e a chave anon/publishable.
4. Configure a URL de redirecionamento e publique a Edge Function conforme os passos 4 e 5 da atualização.
5. Suba os arquivos para a branch `main` do repositório.
6. Ative o GitHub Pages pela raiz da branch `main`, ou use o workflow já incluído.

## Observação importante

O arquivo `config.js` deve ficar publicado junto do site, porque o frontend precisa da URL do Supabase e da chave anon/publishable. Nunca use `service_role` nesse arquivo.
