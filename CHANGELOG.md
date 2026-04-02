# Changelog

## v1.1.5
- Corrigido travamento na tela "Sincronizando com o banco..." causado pela inicialização assíncrona do auth no callback do Supabase.
- Ajustado o listener de autenticação para evitar bloqueio na primeira leitura de sessão.
- Mantido o projeto completo pronto para GitHub Pages + Supabase.

## v1.1.4
- Corrigido travamento em “Sincronizando com o banco...” com inicialização do auth mais estável.
- Evitado loop de renderização causado por múltiplos eventos iniciais do Supabase Auth.
- Atualizado `config.js` do projeto com a URL do Supabase, repositório e Pages informados pelo usuário.
- Mantida a versão completa do projeto pronta para GitHub Pages.

## v1.1.3
- Corrigido `authService.getState is not a function`.
- Declarada a versão em README, changelog e VERSION.txt.
