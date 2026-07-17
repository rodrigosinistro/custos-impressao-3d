# Changelog

## v1.2.0
- Adicionado o módulo **Orçamento Fácil** com Cliente, Nome da peça, Peso e Tempo de produção.
- O Orçamento Fácil usa a mesma regra de precificação do orçamento completo, com impressora, material, taxas e margens definidos pelo administrador.
- Adicionadas ações para salvar, compartilhar e enviar o orçamento fácil diretamente para a fila de produção.
- Criado o perfil **Orçamentista**, com acesso somente ao Orçamento Fácil e à visualização da Produção.
- A Produção passa a ser exibida em modo somente leitura para orçamentistas, sem edição, exclusão ou alteração de status.
- Adicionada a tela **Usuários**, exclusiva do administrador, para convidar orçamentistas por e-mail.
- Adicionado o fluxo para o convidado definir a própria senha ao aceitar o convite.
- Os registros da equipe passam a compartilhar o mesmo proprietário da conta, mantendo clientes, parâmetros, orçamentos e produção centralizados.
- Reestruturadas as políticas RLS para aplicar as permissões de Administrador e Orçamentista diretamente no Supabase.
- Removida a antiga possibilidade de um usuário alterar o próprio perfil e promover a si mesmo pelo banco.
- Adicionada a Edge Function segura `invite-user`; a chave administrativa não é exposta no navegador.
- Adicionada a migração `supabase/migrations/v1.2.0-easy-quotes-and-users.sql`.

## v1.1.14
- Adicionados os campos **Link Projeto** e **Link Imagem do Projeto** logo abaixo de Cliente e Nome da peça no formulário de orçamento.
- Os dois links passam a ser salvos e restaurados ao editar um orçamento.
- Adicionados atalhos **Projeto** e **Imagem** no histórico para abrir rapidamente as referências cadastradas.
- Quando há uma imagem de projeto cadastrada, o compartilhamento inclui o aviso de imagem de referência e o endereço da imagem abaixo da mensagem atual.
- O sistema tenta anexar a imagem do projeto ao compartilhamento; caso o servidor da imagem bloqueie o download externo, o link permanece na mensagem como alternativa.
- Adicionada a migração `supabase/migrations/v1.1.14-project-links.sql`.

## v1.1.13
- Alterada a sugestão automática para sempre arredondar o valor calculado para cima, usando o próximo preço terminado em `X,99`. Exemplo: `R$ 32,02` passa a `R$ 32,99`.
- Mão de obra e pintura agora são calculadas automaticamente como 10% do valor calculado, antes do arredondamento para `X,99`.
- Removidos os campos manuais de mão de obra e acabamento/pintura da tela de orçamento e das configurações, evitando divergências com a nova regra automática.
- O resumo do orçamento agora mostra separadamente o valor antes de mão de obra e pintura, os 10% automáticos e o preço calculado antes do arredondamento.
- Após um orçamento ser enviado à fila, o botão passa a exibir `ENVIADO PARA A PRODUÇÃO` e permanece assim ao retornar à tela de Orçamentos.
- Nenhuma alteração no banco de dados é necessária para esta versão.

## v1.1.12
- Interface atualizada para funcionar corretamente em computadores, tablets e celulares.
- Menu lateral transformado em menu retrátil no celular, com botão de abertura, fundo de bloqueio e fechamento por toque ou tecla Esc.
- Tabelas convertidas automaticamente em cartões no celular, mantendo os rótulos de cada informação e os botões de ação acessíveis.
- Grades, formulários, indicadores e painel de orçamento ajustados para diferentes larguras de tela.
- Melhorados espaçamento, quebra de textos longos, tamanho mínimo dos botões e campos para uso por toque.
- Adicionados ajustes para barra segura do celular, prevenção de rolagem horizontal e suporte a movimento reduzido.
- Nenhuma alteração no banco de dados é necessária para esta versão.

## v1.1.11
- Adicionado o novo módulo **Produção** no menu lateral.
- Criada fila de produção em ordem de chegada, com prazo padrão de 7 dias.
- Adicionado botão **Aprovar e produzir** no histórico de orçamentos.
- Ao aprovar um orçamento, o item é enviado para a fila de produção com cliente, peça, material, impressora, peso, tempo, valor e observações.
- Evita duplicar o mesmo orçamento na produção.
- Adicionado cadastro de produção avulsa para itens que não vieram de orçamento.
- Adicionados status de produção: Na fila, Em produção, Concluído, Entregue e Cancelado.
- Adicionados indicadores de itens ativos, itens na fila, itens em produção e itens atrasados.
- Adicionada migração `supabase/migrations/v1.1.11-production.sql` e atualização do `supabase/schema.sql`.
- Atualizado README e versão do pacote para `v1.1.11`.

## v1.1.10
- Texto de compartilhamento ajustado exatamente para o formato solicitado pelo usuário, incluindo "Nossa Loja:" e o valor do campo Preço final ao cliente.

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
