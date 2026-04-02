# Deploy e publicação

## Repositório alvo

- GitHub: https://github.com/rodrigosinistro/custos-impressao-3d
- Pages: https://rodrigosinistro.github.io/custos-impressao-3d/

## Passos

1. Execute `supabase/schema.sql` no seu projeto Supabase.
2. Crie o primeiro usuário em `Authentication > Users`.
3. Edite `config.js` com a URL e a chave anon/publishable.
4. Suba os arquivos para a branch `main` do repositório.
5. Ative o GitHub Pages pela raiz da branch `main`, ou use o workflow já incluído.

## Observação importante

O arquivo `config.js` deve ficar publicado junto do site, porque o frontend precisa da URL do Supabase e da chave anon/publishable. Nunca use `service_role` nesse arquivo.


## Migração recomendada para a v1.1.7
Se o banco já estava em uso antes desta versão, rode também o arquivo `supabase/migrations/v1.1.7-public-signup-and-quotes.sql` no SQL Editor do Supabase para habilitar o cadastro público e persistir os novos campos de ajuste/desconto dos orçamentos.
