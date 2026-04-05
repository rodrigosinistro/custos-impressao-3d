# Changelog

## v1.1.9
- Atualizado o texto de compartilhamento do orçamento com a mensagem exata solicitada pela Perfeitos Presentes.
- Adicionado o link da loja e o Instagram `@perfeitos.presentes` na mensagem compartilhada.
- Mantido o compartilhamento focado apenas no valor final ao cliente.

## v1.1.8
- Removido o compartilhamento automático ao salvar orçamento.
- Ajustada a mensagem de compartilhamento para um texto mais amigável e focado no valor final ao cliente.
- Adicionado compartilhamento com a imagem/logo da Perfeitos Presentes quando o navegador suportar envio de arquivos.
- Aplicada a logo da Perfeitos Presentes na interface do sistema.
- Atualizado `config.js` para a configuração atual do projeto no GitHub Pages + Supabase.

## v1.1.7
- Corrigido o cadastro público e o fallback de salvamento de orçamento para schemas antigos.
- Adicionado arquivo de migração `supabase/migrations/v1.1.7-public-signup-and-quotes.sql`.

## v1.1.6
- Corrigido o cadastro público de clientes usando a função RPC `register_public_client` no Supabase.
- Adicionado arredondamento automático do preço final para baixo no padrão `x9,99`.
- Adicionados os campos de preço manual ao cliente e desconto em reais no orçamento.
- O valor mostrado como `Preço final ao cliente` agora é o valor salvo e compartilhado com o cliente.
- Adicionado botão de editar no histórico de orçamentos.
- Atualizado `supabase/schema.sql` com a função de cadastro público e com novas colunas em `quotes` para preço calculado, preço ajustado e desconto.
