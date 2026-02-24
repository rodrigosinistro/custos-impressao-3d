# Custos de Impressão 3D (BambuLab) — Web App (GitHub Pages)

Este repositório é um **app web 100% estático** (HTML/CSS/JS), feito para rodar no navegador e ser publicado no **GitHub Pages**.

Ele foi criado a partir da planilha:
**Planilha_Custos_Impressao_3D_BambuLab.xlsx**  
e replica as fórmulas principais (Parâmetros, Materiais, Trabalhos e Resumo).

## Como usar

- **Parâmetros**: energia, custo do equipamento, vida útil, mão de obra, manutenção, overhead, lucro e embalagem.
- **Materiais**: cadastre filamentos (preço/kg, potência média e desperdício padrão).
- **Trabalhos**: lance cada impressão (peso, tempo, material). O app calcula custos e sugere preço.
- **Resumo**: soma apenas os trabalhos marcados como **Incluir = SIM**.

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

