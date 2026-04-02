# Changelog

## v1.1.1 - 2026-04-02
- Corrigido erro de sintaxe em `src/domain/services/quoteCalculator.js` que deixava a tela em branco no GitHub Pages.
- Ajustado o texto de compartilhamento do orçamento para usar quebra de linha válida (`\n`).

## v1.1.0 - 2026-04-01
- migração da persistência local para **Supabase**
- autenticação real via **Supabase Auth**
- criação de schema SQL completo com **RLS**
- cadastro público de clientes salvo no banco
- telas administrativas para clientes, impressoras, materiais, orçamentos e configurações
- exportação de snapshot JSON a partir do banco
- adaptação do projeto para o repositório `rodrigosinistro/custos-impressao-3d`
- manutenção da publicação via **GitHub Pages** com frontend estático
