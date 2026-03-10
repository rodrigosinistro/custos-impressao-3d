# Custos de Impressão 3D (BambuLab) — Web App (GitHub Pages)

Este repositório é um **app web 100% estático** (HTML/CSS/JS), feito para rodar no navegador e ser publicado no **GitHub Pages**.

Ele foi criado a partir da planilha:
**Planilha_Custos_Impressao_3D_BambuLab.xlsx**  
e replica as fórmulas principais (Parâmetros, Materiais, Trabalhos e Resumo).

## Como usar


## Controle de acesso (v0.12)

- A área pública agora é a aba **Cadastro**, com um formulário simples para o cliente se registrar.
- O envio público salva diretamente no cadastro interno de **Clientes** e mostra a mensagem **Cadastrado com Sucesso**.
- **Clientes, Trabalhos, Parâmetros, Materiais, Fornecedores, Projetos e Resumo** só aparecem após login de administrador.
- **Exportar JSON** e **Importar JSON** também ficam restritos ao administrador.

> Importante: como este projeto roda 100% no navegador e pode ser publicado no **GitHub Pages**, esse login é um **bloqueio de interface no front-end**. Ele não substitui uma autenticação real de servidor.

---

- **Trabalhos**: lance cada impressão (cliente, projeto, peso, tempo, material). O app calcula custos, “Preço sugerido” e “Preço final”.
  - **Particular**: aplica 100% de desconto e marca como pago (não entra em recebíveis).
  - **Não cobrar Mão-de-Obra**: remove apenas o custo de mão-de-obra do cálculo do preço (os demais custos permanecem).
- **Parâmetros**: configure energia, custo do equipamento, vida útil, mão de obra, manutenção, overhead, lucro e embalagem.
  - Alterações de parâmetros valem **somente para novos trabalhos** (os trabalhos antigos ficam “congelados” com snapshot).
- **Materiais**: cadastre filamentos (preço/kg, potência média e desperdício padrão).
- **Fornecedores**: registre onde comprou (última compra, avaliação, prazo, frete…).
- **Clientes**: cadastro simples (nome/endereço) + total automático (soma do preço final dos trabalhos do cliente).
- **Projetos**: cadastro simples (nome/descrição/link) para selecionar no dropdown.
- **Resumo**: totais e gráfico mensal (custo sem mão-de-obra, total devido e total recebido).

> Os dados ficam salvos no **localStorage** do navegador (no seu dispositivo).  
> Use **Exportar JSON** para backup, e **Importar JSON** para restaurar.


---

## Rodar localmente

Você pode abrir o `index.html` diretamente no navegador.

Se preferir, rode um servidor local (ex.: VS Code “Live Server”).

---

## Publicar no GitHub Pages (sem build)

1. Crie um repositório no GitHub (ex.: `custos-impressao-3d`).
2. Envie estes arquivos para a branch `main` (root do repositório).
3. No GitHub: **Settings → Pages**
4. Em **Build and deployment**:
   - **Source**: *Deploy from a branch*
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Salve. Em seguida o GitHub vai mostrar a URL do seu site.

Pronto: o app estará no ar pelo Pages.

---

## Ajustes / Evoluções comuns

Se você quiser, eu posso evoluir o app para:
- Exportar/importar XLSX
- Relatórios por cliente/projeto
- Gráficos e dashboards
- Campos adicionais (pintura, pós-processamento, frete, impostos, etc.)
- “Modo planilha”: mais colunas e visual idêntico ao Excel



## Atualização v0.12

- Área pública convertida em formulário de cadastro do cliente.
- Aba **Clientes** agora fica disponível apenas para o administrador.
- Cadastro público salva diretamente na base local do app e mostra confirmação **Cadastrado com Sucesso**.
- Todas as abas internas continuam protegidas por login ADM (`ADM` / `Rod@301613`).
