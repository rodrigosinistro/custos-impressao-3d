import { productionRepository } from '../../data/repositories/productionRepository.js';
import { authService } from '../../domain/services/authService.js';
import { formatCurrency, formatDateTime, formatMinutes } from '../../core/utils/format.js';
import { qs, on, escapeHtml } from '../../core/utils/dom.js';
import { toInt, toNumber } from '../../core/utils/parse.js';

const STATUS_OPTIONS = [
  { value: 'queued', label: 'Na fila' },
  { value: 'in_progress', label: 'Em produção' },
  { value: 'finished', label: 'Concluído' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'canceled', label: 'Cancelado' },
];

const ACTIVE_STATUSES = ['queued', 'in_progress'];

function statusLabel(status) {
  return STATUS_OPTIONS.find((entry) => entry.value === status)?.label || status || '-';
}

function statusClass(status) {
  if (status === 'finished' || status === 'delivered') return 'status-done';
  if (status === 'canceled') return 'status-canceled';
  if (status === 'in_progress') return 'status-progress';
  return 'status-queued';
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysDateString(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateOnly(value) {
  if (!value) return '-';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return '-';
  return `${day}/${month}/${year}`;
}

function daysUntil(value) {
  if (!value) return null;
  const today = new Date(`${todayDateString()}T00:00:00`);
  const due = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Math.round((due - today) / 86400000);
}

function deadlineText(item) {
  const diff = daysUntil(item.due_date);
  if (diff === null) return '-';
  if (!ACTIVE_STATUSES.includes(item.status)) return formatDateOnly(item.due_date);
  if (diff < 0) return `${formatDateOnly(item.due_date)} • atrasado ${Math.abs(diff)} dia(s)`;
  if (diff === 0) return `${formatDateOnly(item.due_date)} • vence hoje`;
  return `${formatDateOnly(item.due_date)} • faltam ${diff} dia(s)`;
}

function isOverdue(item) {
  const diff = daysUntil(item.due_date);
  return ACTIVE_STATUSES.includes(item.status) && diff !== null && diff < 0;
}

function buildStatusOptions(selected) {
  return STATUS_OPTIONS.map(
    (entry) => `<option value="${entry.value}" ${selected === entry.value ? 'selected' : ''}>${entry.label}</option>`,
  ).join('');
}

function setFormValue(form, name, value) {
  const field = qs(`[name="${name}"]`, form);
  if (!field) return;
  field.value = value ?? '';
}

function renderNextAction(item) {
  if (item.status === 'queued') {
    return `<button class="btn btn-secondary" data-status-item="${item.id}" data-next-status="in_progress">Iniciar</button>`;
  }
  if (item.status === 'in_progress') {
    return `<button class="btn btn-success" data-status-item="${item.id}" data-next-status="finished">Concluir</button>`;
  }
  if (item.status === 'finished') {
    return `<button class="btn btn-success" data-status-item="${item.id}" data-next-status="delivered">Entregar</button>`;
  }
  return '';
}

function renderProductionRows(items, canManage = true) {
  return items.map((item, index) => `
    <tr class="${isOverdue(item) ? 'row-overdue' : ''}">
      <td><b>#${index + 1}</b></td>
      <td>
        <b>${escapeHtml(item.piece_name)}</b>
        <div class="small-text">Qtd.: ${Number(item.quantity || 1)} • Material: ${escapeHtml(item.material_name || '-')}</div>
      </td>
      <td>${escapeHtml(item.client_name || '-')}</td>
      <td><span class="badge status-badge ${statusClass(item.status)}">${statusLabel(item.status)}</span></td>
      <td>${formatDateTime(item.queued_at || item.created_at)}</td>
      <td>${escapeHtml(deadlineText(item))}</td>
      <td>${formatMinutes(item.print_time_minutes)}</td>
      <td>${formatCurrency(item.final_price)}</td>
      ${canManage ? `
        <td>
          <div class="button-row compact-row">
            ${renderNextAction(item)}
            <button class="btn btn-secondary" data-edit-production="${item.id}">Editar</button>
            <button class="btn btn-danger" data-remove-production="${item.id}">Excluir</button>
          </div>
        </td>
      ` : ''}
    </tr>
  `).join('');
}

function productionKpis(items) {
  const queued = items.filter((item) => item.status === 'queued').length;
  const inProgress = items.filter((item) => item.status === 'in_progress').length;
  const overdue = items.filter(isOverdue).length;
  const active = items.filter((item) => ACTIVE_STATUSES.includes(item.status)).length;
  return { queued, inProgress, overdue, active };
}

export async function renderProductionView() {
  const items = await productionRepository.getAll();
  const kpis = productionKpis(items);
  const activeItems = items.filter((item) => item.status !== 'delivered' && item.status !== 'canceled');
  const canManage = authService.isAdmin();

  return `
    <div class="grid grid-4">
      <section class="card kpi-card"><small>Itens ativos</small><strong>${kpis.active}</strong></section>
      <section class="card kpi-card"><small>Na fila</small><strong>${kpis.queued}</strong></section>
      <section class="card kpi-card"><small>Em produção</small><strong>${kpis.inProgress}</strong></section>
      <section class="card kpi-card"><small>Atrasados</small><strong>${kpis.overdue}</strong></section>
    </div>

    <section class="card section-card" style="margin-top:18px;">
      <h3>Controle de produção</h3>
      <div class="notice">A fila abaixo é exibida em <b>ordem de chegada</b>. Ao aprovar um orçamento, o item entra automaticamente com prazo de <b>7 dias</b> para produção.${canManage ? '' : ' Seu acesso a esta tela é somente para consulta.'}</div>
    </section>

    <div class="${canManage ? 'two-column' : ''}" style="margin-top:18px;">
      <section class="card section-card">
        <h3>Fila de produção</h3>
        ${activeItems.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Ordem</th><th>Peça</th><th>Cliente</th><th>Status</th><th>Entrada</th><th>Prazo</th><th>Tempo</th><th>Valor</th>${canManage ? '<th></th>' : ''}</tr>
              </thead>
              <tbody>${renderProductionRows(activeItems, canManage)}</tbody>
            </table>
          </div>
        ` : `<div class="empty-state">${canManage ? 'Nenhum item na fila. Aprove um orçamento ou cadastre uma produção avulsa.' : 'Nenhum item na fila de produção.'}</div>`}
      </section>

      ${canManage ? `<section class="card section-card">
        <h3 id="productionFormTitle">Produção avulsa</h3>
        <form id="productionForm">
          <input type="hidden" name="id" />
          <div class="form-grid">
            <div class="field"><label>Nome da peça</label><input name="pieceName" required /></div>
            <div class="field"><label>Cliente</label><input name="clientName" /></div>
          </div>
          <div class="form-grid">
            <div class="field"><label>Quantidade</label><input name="quantity" inputmode="numeric" value="1" /></div>
            <div class="field"><label>Status</label><select name="status">${buildStatusOptions('queued')}</select></div>
          </div>
          <div class="form-grid">
            <div class="field"><label>Material</label><input name="materialName" /></div>
            <div class="field"><label>Impressora</label><input name="printerName" /></div>
          </div>
          <div class="form-grid">
            <div class="field"><label>Peso (g)</label><input name="weightG" inputmode="decimal" value="0" /></div>
            <div class="field"><label>Tempo de impressão (min)</label><input name="printTimeMinutes" inputmode="numeric" value="0" /></div>
          </div>
          <div class="form-grid">
            <div class="field"><label>Valor final (R$)</label><input name="finalPrice" inputmode="decimal" value="0" /></div>
            <div class="field"><label>Prazo</label><input name="dueDate" type="date" value="${addDaysDateString(7)}" max="${addDaysDateString(7)}" /></div>
          </div>
          <div class="field"><label>Observações de produção</label><textarea name="productionNotes" placeholder="Cor, acabamento, prioridade, detalhes de entrega..."></textarea></div>
          <div id="productionFeedback"></div>
          <div class="button-row">
            <button class="btn btn-primary" type="submit" id="saveProductionButton">Salvar produção</button>
            <button class="btn btn-ghost" type="button" id="cancelEditProductionButton" hidden>Cancelar edição</button>
          </div>
        </form>
      </section>` : ''}
    </div>

    <section class="card section-card" style="margin-top:18px;">
      <h3>Histórico finalizado</h3>
      ${items.filter((item) => item.status === 'delivered' || item.status === 'canceled').length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Peça</th><th>Cliente</th><th>Status</th><th>Entrada</th><th>Prazo</th><th>Valor</th>${canManage ? '<th></th>' : ''}</tr></thead>
            <tbody>
              ${items.filter((item) => item.status === 'delivered' || item.status === 'canceled').map((item) => `
                <tr>
                  <td>${escapeHtml(item.piece_name)}</td>
                  <td>${escapeHtml(item.client_name || '-')}</td>
                  <td><span class="badge status-badge ${statusClass(item.status)}">${statusLabel(item.status)}</span></td>
                  <td>${formatDateTime(item.queued_at || item.created_at)}</td>
                  <td>${formatDateOnly(item.due_date)}</td>
                  <td>${formatCurrency(item.final_price)}</td>
                  ${canManage ? `<td><button class="btn btn-secondary" data-edit-production="${item.id}">Editar</button></td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state">Nenhum item entregue ou cancelado ainda.</div>'}
    </section>
  `;
}

export async function attachProductionEvents(refresh) {
  if (!authService.isAdmin()) return;
  const form = qs('#productionForm');
  const feedback = qs('#productionFeedback');
  const formTitle = qs('#productionFormTitle');
  const saveButton = qs('#saveProductionButton');
  const cancelButton = qs('#cancelEditProductionButton');

  const resetForm = () => {
    if (!form) return;
    form.reset();
    setFormValue(form, 'id', '');
    setFormValue(form, 'quantity', '1');
    setFormValue(form, 'status', 'queued');
    setFormValue(form, 'weightG', '0');
    setFormValue(form, 'printTimeMinutes', '0');
    setFormValue(form, 'finalPrice', '0');
    setFormValue(form, 'dueDate', addDaysDateString(7));
    feedback.innerHTML = '';
    formTitle.textContent = 'Produção avulsa';
    saveButton.textContent = 'Salvar produção';
    cancelButton.hidden = true;
  };

  const fillForm = (item) => {
    if (!form) return;
    setFormValue(form, 'id', item.id);
    setFormValue(form, 'pieceName', item.piece_name || '');
    setFormValue(form, 'clientName', item.client_name || '');
    setFormValue(form, 'quantity', item.quantity || 1);
    setFormValue(form, 'status', item.status || 'queued');
    setFormValue(form, 'materialName', item.material_name || '');
    setFormValue(form, 'printerName', item.printer_name || '');
    setFormValue(form, 'weightG', item.weight_g ?? 0);
    setFormValue(form, 'printTimeMinutes', item.print_time_minutes ?? 0);
    setFormValue(form, 'finalPrice', item.final_price ?? 0);
    setFormValue(form, 'dueDate', String(item.due_date || '').slice(0, 10) || addDaysDateString(7));
    setFormValue(form, 'productionNotes', item.production_notes || '');
    feedback.innerHTML = '<div class="notice">Você está editando um item de produção.</div>';
    formTitle.textContent = `Editando produção: ${item.piece_name}`;
    saveButton.textContent = 'Salvar alterações';
    cancelButton.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    qs('[name="pieceName"]', form)?.focus();
  };

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const productionId = String(formData.get('id') || '').trim();
    const maxDueDate = addDaysDateString(7);
    const requestedDueDate = String(formData.get('dueDate') || maxDueDate);
    const dueDate = !productionId && requestedDueDate > maxDueDate ? maxDueDate : requestedDueDate;

    try {
      await productionRepository.save({
        ...(productionId ? { id: productionId } : { queued_at: new Date().toISOString() }),
        piece_name: String(formData.get('pieceName') || '').trim(),
        client_name: String(formData.get('clientName') || '').trim(),
        quantity: Math.max(1, toInt(formData.get('quantity'), 1)),
        status: formData.get('status') || 'queued',
        material_name: String(formData.get('materialName') || '').trim(),
        printer_name: String(formData.get('printerName') || '').trim(),
        weight_g: toNumber(formData.get('weightG')),
        print_time_minutes: toInt(formData.get('printTimeMinutes')),
        final_price: toNumber(formData.get('finalPrice')),
        due_date: dueDate,
        production_notes: String(formData.get('productionNotes') || '').trim(),
      });
      feedback.innerHTML = `<div class="notice success">${productionId ? 'Item de produção atualizado.' : 'Item de produção criado.'}</div>`;
      await refresh();
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível salvar o item de produção.'}</div>`;
    }
  });

  cancelButton?.addEventListener('click', resetForm);

  on('[data-edit-production]', 'click', async (_, button) => {
    try {
      const item = await productionRepository.getById(button.dataset.editProduction);
      if (item) fillForm(item);
    } catch (error) {
      alert(error.message || 'Não foi possível carregar o item de produção.');
    }
  });

  on('[data-remove-production]', 'click', async (_, button) => {
    try {
      await productionRepository.remove(button.dataset.removeProduction);
      refresh();
    } catch (error) {
      alert(error.message || 'Não foi possível excluir o item de produção.');
    }
  });

  on('[data-status-item]', 'click', async (_, button) => {
    try {
      await productionRepository.updateStatus(button.dataset.statusItem, button.dataset.nextStatus);
      refresh();
    } catch (error) {
      alert(error.message || 'Não foi possível atualizar o status.');
    }
  });
}
