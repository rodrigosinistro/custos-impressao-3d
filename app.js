// Custos de Impressão 3D (BambuLab) — Web App
// Baseado na planilha XLSX fornecida. Tudo roda no navegador (GitHub Pages).

const STORAGE_KEY = "custos-impressao-3d-bambulab:v1";

const DEFAULTS = {
  "version": 3,
  "params": {
    "tarifa_energia": 0.87,
    "custo_impressora": 4999.0,
    "custo_ams": 0.0,
    "vida_util_h": 2000.0,
    "valor_revenda": 4500.0,
    "mao_de_obra_h": 30.0,
    "manutencao_h": 2.0,
    "overhead_pct": 0.1,
    "lucro_pct": 0.3,
    "energia_extra_kwh": 0.0,
    "embalagem_padrao": 1.0,
    "custo_total_equip": 4999.0,
    "depreciacao_h": 0.2495
  },
  "materials": [
    {
      "material": "PLA",
      "marca": "",
      "preco_kg": 129.0,
      "custo_g": 0.129,
      "potencia_w": 95.0,
      "desperdicio_pct": 0.05
    },
    {
      "material": "PETG",
      "marca": "",
      "preco_kg": 69.0,
      "custo_g": 0.069,
      "potencia_w": 200.0,
      "desperdicio_pct": 0.07
    },
    {
      "material": "TPU",
      "marca": "",
      "preco_kg": 230.0,
      "custo_g": 0.23,
      "potencia_w": 120.0,
      "desperdicio_pct": 0.08
    },
    {
      "material": "PVA",
      "marca": "",
      "preco_kg": 300.0,
      "custo_g": 0.3,
      "potencia_w": 150.0,
      "desperdicio_pct": 0.1
    }
  ],
  "jobs": [
    {
      "id": 1,
      "data": "2026-03-03",
      "projeto": "Issac / Espada Tanjirou",
      "material": "PLA",
      "peso_g": 125.0,
      "tempo_h": 5.0,
      "desconto_factor": 0.8,
      "pago": "NÃO",
      "incluir": true,
      "data_entrega": "",
      "data_pagamento": ""
    },
    {
      "id": 2,
      "data": "2026-03-03",
      "projeto": "Rodrigo / Coletor",
      "material": "PLA",
      "peso_g": 100.0,
      "tempo_h": 4.0,
      "desconto_factor": 1.0,
      "pago": "NÃO",
      "incluir": true,
      "data_entrega": "",
      "data_pagamento": ""
    },
    {
      "id": 3,
      "data": "2026-03-03",
      "projeto": "Rodrigo / Defletor",
      "material": "PLA",
      "peso_g": 11.0,
      "tempo_h": 0.5,
      "desconto_factor": 1.0,
      "pago": "NÃO",
      "incluir": true,
      "data_entrega": "",
      "data_pagamento": ""
    }
  ]
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function clampNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function fmtBRL(value) {
  const n = clampNumber(value, 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function fmtNum(value, digits = 2) {
  const n = clampNumber(value, 0);
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

function dateISOToInput(value) {
  if (!value) return "";
  // value is ISO YYYY-MM-DD
  return value;
}

function inputToDateISO(value) {
  return value || "";
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function addDaysISO(dateISO, days) {
  if (!dateISO) return "";
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function floorToMultiple(value, multiple) {
  const m = clampNumber(multiple, 1);
  const v = clampNumber(value, 0);
  if (m === 0) return v;
  return Math.floor(v / m) * m;
}

function normalizePercentInputToDecimal(percentValue) {
  // UI recebe "10" para 10% => 0.10
  return clampNumber(percentValue, 0) / 100;
}

function decimalToPercentInput(decimalValue) {
  return clampNumber(decimalValue, 0) * 100;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(DEFAULTS);
    const parsed = JSON.parse(raw);

    // Migração leve/defensiva
    if (!parsed || typeof parsed !== "object") return deepClone(DEFAULTS);
    if (!parsed.params || !parsed.materials || !parsed.jobs) return deepClone(DEFAULTS);

    // Migração v1 -> v2 (ajustes da planilha)
    const v = Number(parsed.version || 1);
    if (v < 2) {
      // Se o usuário ainda está com o valor antigo/default, corrige para o valor atualizado da planilha
      if (parsed.params && Number(parsed.params.mao_de_obra_h) === 30) {
        parsed.params.mao_de_obra_h = 10;
      }
      parsed.version = 2;
    }


    // Migração v2 -> v3 (Incluir -> Particular)
    if (Number(parsed.version || 1) < 3) {
      if (Array.isArray(parsed.jobs)) {
        parsed.jobs.forEach(j => {
          if (j && typeof j === "object") {
            if (typeof j.particular !== "boolean") {
              // Se antes o usuário marcava "Incluir = NÃO", consideramos como "Particular"
              if ("incluir" in j) {
                j.particular = (j.incluir === false);
              } else {
                j.particular = false;
              }
            }
            if ("incluir" in j) delete j.incluir;
          }
        });
      }
      parsed.version = 3;
    }
    return parsed;
  } catch {
    return deepClone(DEFAULTS);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

let state = loadState();

function buildMaterialMap(materials) {
  const map = new Map();
  for (const m of materials) {
    if (!m.material) continue;
    map.set(String(m.material).trim(), m);
  }
  return map;
}

function recomputeDerivedParams(params) {
  const custo_total_equip = clampNumber(params.custo_impressora, 0) + clampNumber(params.custo_ams, 0);
  const vida = Math.max(1, clampNumber(params.vida_util_h, 1));
  const revenda = clampNumber(params.valor_revenda, 0);
  const depreciacao_h = (custo_total_equip - revenda) / vida;

  return {
    ...params,
    custo_total_equip,
    depreciacao_h
  };
}

function computeJob(job, params, materialMap) {
  const material = materialMap.get(job.material) || null;

  const peso_g = clampNumber(job.peso_g, 0);
  const tempo_h = clampNumber(job.tempo_h, 0);

  const custo_g = material ? clampNumber(material.custo_g, 0) : 0;
  const potencia_w = material ? clampNumber(material.potencia_w, 0) : 0;

  const perda_pct = job.perda_pct_override != null
    ? clampNumber(job.perda_pct_override, 0)
    : (material ? clampNumber(material.desperdicio_pct, 0) : 0);

  const embalagem = job.embalagem_override != null
    ? clampNumber(job.embalagem_override, 0)
    : clampNumber(params.embalagem_padrao, 0);

  const custo_material = (peso_g * custo_g) * (1 + perda_pct);

  const energia_extra = clampNumber(params.energia_extra_kwh, 0);
  const energia_kwh = (tempo_h * potencia_w / 1000) + energia_extra;

  const custo_energia = energia_kwh * clampNumber(params.tarifa_energia, 0);

  const mao_de_obra = job.particular ? 0 : (tempo_h * clampNumber(params.mao_de_obra_h, 0));
  const depreciacao = tempo_h * clampNumber(params.depreciacao_h, 0);
  const manutencao = tempo_h * clampNumber(params.manutencao_h, 0);

  // Replicando a planilha: Subtotal soma H:M + S (inclui energia_kwh no somatório, como no XLSX)
  const subtotal = (custo_material + energia_kwh + custo_energia + mao_de_obra + depreciacao + manutencao) + embalagem;

  const overhead = subtotal * clampNumber(params.overhead_pct, 0);
  const preco_sugerido = (subtotal + overhead) * (1 + clampNumber(params.lucro_pct, 0));

  const custo_por_hora = tempo_h > 0 ? (subtotal / tempo_h) : 0;
  const preco_por_g = peso_g > 0 ? (preco_sugerido / peso_g) : 0;

  const desconto_factor = clampNumber(job.desconto_factor, 0); // mesma coluna T
  const valor_desconto = preco_sugerido * desconto_factor;     // coluna U = P*T
  const preco_final = floorToMultiple(preco_sugerido - valor_desconto, 10); // W = FLOOR.MATH(P-U,10)

  const data = job.data || "";
  const data_entrega = job.data_entrega || (data ? addDaysISO(data, 7) : "");
  const data_pagamento = job.data_pagamento || (data_entrega ? addDaysISO(data_entrega, 15) : "");

  // Custo sem mão de obra (planilha: H + I + J + L + M + O)
  const custo_sem_mao = (custo_material + energia_kwh + custo_energia + depreciacao + manutencao + overhead);

  return {
    ...job,
    derived: {
      perda_pct,
      embalagem,
      custo_material,
      energia_kwh,
      custo_energia,
      mao_de_obra,
      depreciacao,
      manutencao,
      subtotal,
      overhead,
      preco_sugerido,
      custo_por_hora,
      preco_por_g,
      valor_desconto,
      preco_final,
      data_entrega,
      data_pagamento,
      custo_sem_mao,
    }
  };
}

function computeAll() {
  state.params = recomputeDerivedParams(state.params);

  // Normaliza materiais (custo_g calculado)
  state.materials = state.materials.map(m => {
    const preco_kg = clampNumber(m.preco_kg, 0);
    return {
      ...m,
      material: String(m.material || "").trim(),
      marca: String(m.marca || ""),
      preco_kg,
      custo_g: preco_kg / 1000,
      potencia_w: clampNumber(m.potencia_w, 0),
      desperdicio_pct: clampNumber(m.desperdicio_pct, 0),
    };
  });

  const materialMap = buildMaterialMap(state.materials);

  state.jobs = state.jobs.map(j => {
    const job = {
      ...j,
      id: clampNumber(j.id, 0),
      data: j.data || "",
      projeto: String(j.projeto || ""),
      material: String(j.material || ""),
      peso_g: clampNumber(j.peso_g, 0),
      tempo_h: clampNumber(j.tempo_h, 0),
      desconto_factor: clampNumber(j.desconto_factor, 0),
      pago: String(j.pago || "NÃO"),
      incluir: j.incluir ?? (j.ativo ? (String(j.ativo).toUpperCase() === "SIM") : true),
      perda_pct_override: (j.perda_pct_override != null) ? clampNumber(j.perda_pct_override, 0) : null,
      embalagem_override: (j.embalagem_override != null) ? clampNumber(j.embalagem_override, 0) : null,
      data_entrega: j.data_entrega || "",
      data_pagamento: j.data_pagamento || "",
    };
    return computeJob(job, state.params, materialMap);
  });

  // Mantém a mesma ordem da planilha: crescente por ID
  state.jobs.sort((a, b) => clampNumber(a.id, 0) - clampNumber(b.id, 0));

  return materialMap;
}

function computeSummary() {
  const all = Array.isArray(state.jobs) ? state.jobs : [];
  const billable = all.filter(j => !j.particular);

  const sum = (rows, fn) => rows.reduce((acc, j) => acc + clampNumber(fn(j), 0), 0);

  const totalJobs = all.length;

  // Totais de custo/precificação (inclui também trabalhos particulares)
  const totalSubtotal = sum(all, j => j.derived.subtotal);
  const totalOverhead = sum(all, j => j.derived.overhead);
  const totalSuggested = sum(all, j => j.derived.preco_sugerido);
  const totalNoLabor = sum(all, j => j.derived.custo_sem_mao);

  // Recebíveis (apenas trabalhos NÃO particulares)
  const totalDue = sum(billable, j => j.derived.preco_final);

  const totalPaid = billable
    .filter(j => String(j.pago).toUpperCase() === "SIM")
    .reduce((a, j) => a + clampNumber(j.derived.preco_final, 0), 0);

  const totalLate = billable
    .filter(j => String(j.pago).toUpperCase() === "ATRASADO")
    .reduce((a, j) => a + clampNumber(j.derived.preco_final, 0), 0);

  return {
    totalJobs,
    totalSubtotal,
    totalOverhead,
    totalSuggested,
    totalNoLabor,
    totalDue,
    totalPaid,
    totalLate,
  };
}

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }


function setTab(tabId) {
  $all(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
  $all(".panel").forEach(p => p.classList.toggle("active", p.id === `tab-${tabId}`));
}

function renderParams() {
  const p = state.params;
  // Inputs
  $all("[data-param]").forEach(inp => {
    const key = inp.dataset.param;
    if (!(key in p)) return;

    if (key.endsWith("_pct")) {
      inp.value = String(decimalToPercentInput(p[key]));
    } else {
      inp.value = String(p[key] ?? "");
    }
  });

  $("#kpiEquipTotal").textContent = fmtBRL(p.custo_total_equip);
  $("#kpiDepHora").textContent = fmtBRL(p.depreciacao_h) + " /h";
}

function renderMaterials() {
  const tbody = $("#materialsTable tbody");
  tbody.innerHTML = "";

  state.materials.forEach((m, idx) => {
    const tr = document.createElement("tr");
    tr.dataset.idx = String(idx);

    tr.innerHTML = `
      <td><input class="cell-input" data-m="material" value="${escapeHtml(m.material)}" placeholder="Ex.: PLA" /></td>
      <td><input class="cell-input" data-m="marca" value="${escapeHtml(m.marca)}" placeholder="Opcional" /></td>
      <td class="num"><input class="cell-input" data-m="preco_kg" type="number" step="0.01" min="0" value="${m.preco_kg}" /></td>
      <td class="num"><span class="pill">${fmtNum(m.custo_g, 3)}</span></td>
      <td class="num"><input class="cell-input" data-m="potencia_w" type="number" step="1" min="0" value="${m.potencia_w}" /></td>
      <td class="num"><input class="cell-input" data-m="desperdicio_pct" type="number" step="0.1" min="0" value="${decimalToPercentInput(m.desperdicio_pct)}" /></td>
      <td class="num">
        <button class="btn danger" data-action="rm-material" title="Remover">Remover</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderJobs(materialMap) {
  const search = ($("#jobSearch").value || "").trim().toLowerCase();
  const tbody = $("#jobsTable tbody");
  const tbody2 = $("#jobsDetailsTable tbody");
  tbody.innerHTML = "";
  tbody2.innerHTML = "";

  const materials = state.materials.filter(m => m.material);
  const materialOptions = materials.map(m => `<option value="${escapeHtml(m.material)}">${escapeHtml(m.material)}</option>`).join("");

  const jobsFiltered = state.jobs
    .slice()
    .sort((a, b) => clampNumber(a.id, 0) - clampNumber(b.id, 0))
    .filter(j => !search || String(j.projeto || "").toLowerCase().includes(search));

  for (const j of jobsFiltered) {
    const d = j.derived;

    const tr = document.createElement("tr");
    tr.dataset.id = String(j.id);

    const perdaPctInput = (j.perda_pct_override != null) ? decimalToPercentInput(j.perda_pct_override) : "";
    const embInput = (j.embalagem_override != null) ? j.embalagem_override : "";
    const descontoPct = decimalToPercentInput(j.desconto_factor);

    tr.innerHTML = `
      <td class="sticky-left"><span class="pill">#${j.id}</span></td>
      <td><input class="cell-input" data-j="data" type="date" value="${dateISOToInput(j.data)}" /></td>
      <td><input class="cell-input" data-j="projeto" value="${escapeHtml(j.projeto)}" placeholder="Ex.: Cliente / Projeto" /></td>
      <td>
        <select class="cell-input" data-j="material">
          <option value="">—</option>
          ${materialOptions}
        </select>
      </td>
      <td class="num"><input class="cell-input" data-j="peso_g" type="number" step="0.1" min="0" value="${j.peso_g}" /></td>
      <td class="num"><input class="cell-input" data-j="tempo_h" type="number" step="0.01" min="0" value="${j.tempo_h}" /></td>
      <td class="num" title="Vazio = usa o desperdício padrão do material">
        <input class="cell-input" data-j="perda_override" type="number" step="0.1" min="0" placeholder="${fmtNum(decimalToPercentInput(d.perda_pct), 2)}" value="${perdaPctInput}" />
      </td>
      <td class="num" title="Vazio = usa a embalagem padrão">
        <input class="cell-input" data-j="embalagem_override" type="number" step="0.1" min="0" placeholder="${fmtNum(d.embalagem, 2)}" value="${embInput}" />
      </td>
      <td class="num">
        <input class="cell-input" data-j="desconto_factor" type="number" step="0.1" min="0" value="${descontoPct}" />
      </td>
      <td>
        <select class="cell-input" data-j="pago">
          <option value="NÃO">NÃO</option>
          <option value="SIM">SIM</option>
          <option value="ATRASADO">ATRASADO</option>
        </select>
      </td>
      <td class="num" title="Marque se for um trabalho particular (não entra nos recebíveis)">
        <input class="cell-check" data-j="particular" type="checkbox" ${j.particular ? "checked" : ""} />
      </td>
      <td class="num"><span class="pill">${fmtBRL(d.preco_final)}</span></td>
      <td class="num"><span class="small">${fmtBRL(d.subtotal)}</span></td>
      <td class="num"><span class="small">${fmtBRL(d.preco_sugerido)}</span></td>
      <td class="num sticky-right">
        <button class="btn" data-action="dup-job" title="Duplicar">Duplicar</button>
        <button class="btn danger" data-action="rm-job" title="Remover">Remover</button>
      </td>
    `;

    tbody.appendChild(tr);

    // set selected options
    tr.querySelector('[data-j="material"]').value = j.material || "";
    tr.querySelector('[data-j="pago"]').value = j.pago || "NÃO";

    // Details
    const tr2 = document.createElement("tr");
    tr2.innerHTML = `
      <td class="sticky-left"><span class="pill">#${j.id}</span></td>
      <td class="num">${fmtBRL(d.custo_material)}</td>
      <td class="num">${fmtNum(d.energia_kwh, 3)}</td>
      <td class="num">${fmtBRL(d.custo_energia)}</td>
      <td class="num">${fmtBRL(d.mao_de_obra)}</td>
      <td class="num">${fmtBRL(d.depreciacao)}</td>
      <td class="num">${fmtBRL(d.manutencao)}</td>
      <td class="num">${fmtBRL(d.overhead)}</td>
      <td class="num">${fmtBRL(d.custo_por_hora)}</td>
      <td class="num">${fmtBRL(d.preco_por_g)}</td>
      <td><input class="cell-input" data-j2="data_entrega" type="date" value="${dateISOToInput(d.data_entrega)}" /></td>
      <td><input class="cell-input" data-j2="data_pagamento" type="date" value="${dateISOToInput(d.data_pagamento)}" /></td>
    `;
    tr2.dataset.id = String(j.id);
    tbody2.appendChild(tr2);
  }
}

function renderSummary() {
  const s = computeSummary();
  $("#sumJobs").textContent = String(s.totalJobs);
  $("#sumSubtotal").textContent = fmtBRL(s.totalSubtotal);
  $("#sumOverhead").textContent = fmtBRL(s.totalOverhead);
  $("#sumSuggested").textContent = fmtBRL(s.totalSuggested);
  $("#sumNoLabor").textContent = fmtBRL(s.totalNoLabor);
  $("#sumDue").textContent = fmtBRL(s.totalDue);
  $("#sumPaid").textContent = fmtBRL(s.totalPaid);
  $("#sumLate").textContent = fmtBRL(s.totalLate);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rerender() {
  const materialMap = computeAll();
  renderParams();
  renderMaterials();
  renderJobs(materialMap);
  renderSummary();
  saveState();
}

function nextJobId() {
  const maxId = state.jobs.reduce((m, j) => Math.max(m, clampNumber(j.id, 0)), 0);
  return maxId + 1;
}

function addMaterial() {
  state.materials.push({
    material: "NOVO",
    marca: "",
    preco_kg: 0,
    custo_g: 0,
    potencia_w: 0,
    desperdicio_pct: 0.05
  });
  rerender();
}

function removeMaterial(idx) {
  state.materials.splice(idx, 1);
  rerender();
}

function addJob() {
  const firstMaterial = state.materials.find(m => m.material)?.material || "";
  state.jobs.push({
    id: nextJobId(),
    data: todayISO(),
    projeto: "",
    material: firstMaterial,
    peso_g: 0,
    tempo_h: 0,
    perda_pct_override: null,
    embalagem_override: null,
    desconto_factor: 0, // 0% por padrão
    pago: "NÃO",
    particular: false,
    data_entrega: "",
    data_pagamento: "",
  });
  rerender();
}

function removeJob(id) {
  const i = state.jobs.findIndex(j => j.id === id);
  if (i >= 0) {
    state.jobs.splice(i, 1);
    rerender();
  }
}

function duplicateJob(id) {
  const i = state.jobs.findIndex(j => j.id === id);
  if (i < 0) return;
  const copy = deepClone(state.jobs[i]);
  copy.id = nextJobId();
  copy.projeto = (copy.projeto || "") + " (cópia)";
  state.jobs.splice(i + 1, 0, copy);
  rerender();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "custos-impressao-3d-bambulab.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      if (!parsed || typeof parsed !== "object") throw new Error("Arquivo inválido.");
      state = parsed;
      rerender();
    } catch (err) {
      alert("Não consegui importar esse JSON.\n\nDetalhe: " + (err?.message || err));
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm("Isso vai apagar os dados salvos no seu navegador. Continuar?")) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  state = deepClone(DEFAULTS);
  rerender();
}

function wireEvents() {
  // Tabs
  $all(".tab").forEach(btn => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  // Params
  $all("[data-param]").forEach(inp => {
    inp.addEventListener("input", () => {
      const key = inp.dataset.param;
      if (!(key in state.params)) return;

      if (key.endsWith("_pct")) {
        state.params[key] = normalizePercentInputToDecimal(inp.value);
      } else {
        state.params[key] = clampNumber(inp.value, 0);
      }
      rerender();
    });
  });

  // Materials table (delegation)
  $("#materialsTable").addEventListener("change", (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    const tr = target.closest("tr");
    if (!tr) return;
    const idx = clampNumber(tr.dataset.idx, -1);
    if (idx < 0) return;

    const key = target.getAttribute("data-m");
    if (!key) return;

    const m = state.materials[idx];
    if (!m) return;

    if (key === "material" || key === "marca") {
      m[key] = target.value;
    } else if (key === "desperdicio_pct") {
      m[key] = normalizePercentInputToDecimal(target.value);
    } else {
      m[key] = clampNumber(target.value, 0);
    }
    rerender();
  });

  

  // UX: Enter confirma e salva (dispara change via blur)
  $("#materialsTable").addEventListener("keydown", (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (ev.key === "Enter" && (target.matches("input") || target.matches("select"))) {
      ev.preventDefault();
      target.blur();
    }
  });
$("#materialsTable").addEventListener("click", (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action !== "rm-material") return;
    const tr = target.closest("tr");
    if (!tr) return;
    const idx = clampNumber(tr.dataset.idx, -1);
    if (idx < 0) return;
    if (!confirm("Remover este material?")) return;
    removeMaterial(idx);
  });

  // Jobs table (delegation)
  $("#jobsTable").addEventListener("change", (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    const tr = target.closest("tr");
    if (!tr) return;
    const id = clampNumber(tr.dataset.id, 0);
    const job = state.jobs.find(j => j.id === id);
    if (!job) return;

    const key = target.getAttribute("data-j");
    if (!key) return;

    if (key === "data") job.data = inputToDateISO(target.value);
    if (key === "projeto") job.projeto = target.value;
    if (key === "material") job.material = target.value;
    if (key === "peso_g") job.peso_g = clampNumber(target.value, 0);
    if (key === "tempo_h") job.tempo_h = clampNumber(target.value, 0);

    if (key === "perda_override") {
      const v = String(target.value || "").trim();
      job.perda_pct_override = v === "" ? null : normalizePercentInputToDecimal(v);
    }

    if (key === "embalagem_override") {
      const v = String(target.value || "").trim();
      job.embalagem_override = v === "" ? null : clampNumber(v, 0);
    }

    if (key === "desconto_factor") {
      job.desconto_factor = normalizePercentInputToDecimal(target.value);
    }

    if (key === "pago") job.pago = target.value;
    if (key === "particular") job.particular = !!target.checked;

    rerender();
  });

  

  // UX: Enter confirma e salva (dispara change via blur)
  $("#jobsTable").addEventListener("keydown", (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (ev.key === "Enter" && (target.matches("input") || target.matches("select"))) {
      ev.preventDefault();
      target.blur();
    }
  });
$("#jobsTable").addEventListener("click", (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (!action) return;
    const tr = target.closest("tr");
    if (!tr) return;
    const id = clampNumber(tr.dataset.id, 0);
    if (action === "rm-job") {
      if (!confirm("Remover este trabalho?")) return;
      removeJob(id);
    }
    if (action === "dup-job") {
      duplicateJob(id);
    }
  });

  // Jobs details (delivery/payment date overrides)
  $("#jobsDetailsTable").addEventListener("change", (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    const tr = target.closest("tr");
    if (!tr) return;
    const id = clampNumber(tr.dataset.id, 0);
    const job = state.jobs.find(j => j.id === id);
    if (!job) return;

    const key = target.getAttribute("data-j2");
    if (!key) return;

    if (key === "data_entrega") job.data_entrega = inputToDateISO(target.value);
    if (key === "data_pagamento") job.data_pagamento = inputToDateISO(target.value);

    rerender();
  });

  // Search
  $("#jobSearch").addEventListener("input", () => rerender());

  // Buttons
  $("#btnAddMaterial").addEventListener("click", addMaterial);
  $("#btnAddJob").addEventListener("click", addJob);
  $("#btnExportJson").addEventListener("click", exportJson);

  $("#importJsonFile").addEventListener("change", (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    importJson(file);
    ev.target.value = "";
  });

  const resetBtn = $("#btnReset");
  if (resetBtn) resetBtn.addEventListener("click", resetAll);
}

wireEvents();
rerender();
