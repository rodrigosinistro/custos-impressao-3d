# Deploy e publicação

## Repositório alvo

- GitHub: https://github.com/rodrigosinistro/custos-impressao-3d
- Pages: https://rodrigosinistro.github.io/custos-impressao-3d/

## Atualização para v1.1.13

### Vindo da v1.1.11 ou v1.1.12

1. Suba todos os arquivos deste pacote para a branch `main` do repositório.
2. Aguarde o GitHub Pages publicar a nova versão.
3. Não é necessário executar nenhuma migração no Supabase.

### Vindo de uma versão anterior à v1.1.11

1. Abra o Supabase do projeto.
2. Vá em **SQL Editor**.
3. Execute `supabase/migrations/v1.1.11-production.sql`.
4. Suba todos os arquivos deste pacote para a branch `main` do repositório.
5. Aguarde o GitHub Pages publicar a nova versão.

## Instalação nova

1. Execute `supabase/schema.sql` completo no SQL Editor do Supabase.
2. Crie o primeiro usuário em `Authentication > Users`.
3. Edite `config.js` com a URL e a chave anon/publishable.
4. Suba os arquivos para a branch `main` do repositório.
5. Ative o GitHub Pages pela raiz da branch `main`, ou use o workflow já incluído.

## Observação importante

O arquivo `config.js` deve ficar publicado junto do site, porque o frontend precisa da URL do Supabase e da chave anon/publishable. Nunca use `service_role` nesse arquivo.
