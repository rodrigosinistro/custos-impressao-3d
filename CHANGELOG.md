# Changelog

## v0.12 - 2026-03-09

- Criada a aba pública **Cadastro** para o cliente se registrar sem acessar o painel interno.
- A aba **Clientes** passou a ser restrita ao administrador, junto das demais abas internas.
- Novo formulário público salva nome, endereço, contato e observações direto no cadastro de clientes.
- Adicionada mensagem de confirmação **Cadastrado com Sucesso** após envio do formulário.
- Mantido o login administrativo com usuário `ADM` e senha `Rod@301613`.

## v0.11
- Aba **Clientes** permanece pública.
- Abas **Trabalhos, Parâmetros, Materiais, Fornecedores, Projetos** e **Resumo** agora só aparecem após login de administrador.
- Adicionado botão de **Login ADM / Sair** no topo da interface.
- No modo público, a aba **Clientes** fica em **somente leitura**.
- No modo público, **endereço, contato e observações** dos clientes ficam ocultos.
- Ferramentas administrativas de **Exportar/Importar JSON** ficam visíveis apenas para administrador.
- Sessão administrativa persiste durante a aba aberta/reloads via `sessionStorage`.

## Observação importante
Este projeto continua sendo um **site estático** para GitHub Pages. O login implementado é um **bloqueio de interface no front-end**, não uma autenticação segura de servidor.
