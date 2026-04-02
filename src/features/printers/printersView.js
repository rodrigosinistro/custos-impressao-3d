import { printersRepository } from '../../data/repositories/printersRepository.js';
import { qs, on, escapeHtml } from '../../core/utils/dom.js';
import { formatCurrency } from '../../core/utils/format.js';
import { toNumber } from '../../core/utils/parse.js';

export async function renderPrintersView() {
  const printers = await printersRepository.getAll();

  return `
    <div class="grid grid-2">
      <section class="card section-card">
        <h3>Nova impressora</h3>
        <form id="printerForm">
          <div class="form-grid">
            <div class="field"><label>Nome</label><input name="name" required /></div>
            <div class="field"><label>Potência média (W)</label><input name="powerWatts" inputmode="decimal" /></div>
            <div class="field"><label>Custo da impressora</label><input name="purchaseCost" inputmode="decimal" /></div>
            <div class="field"><label>Vida útil (horas)</label><input name="usefulLifeHours" inputmode="decimal" /></div>
            <div class="field"><label>Manutenção mensal</label><input name="monthlyMaintenanceCost" inputmode="decimal" /></div>
            <div class="field checkbox-field"><label><input name="isActive" type="checkbox" checked /> Impressora ativa</label></div>
          </div>
          <div id="printerFeedback"></div>
          <div class="button-row"><button class="btn btn-primary" type="submit">Salvar impressora</button></div>
        </form>
      </section>

      <section class="card section-card">
        <h3>Impressoras cadastradas</h3>
        ${printers.length ? `
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Potência</th><th>Custo</th><th></th></tr></thead>
              <tbody>
                ${printers.map((printer) => `
                  <tr>
                    <td>${escapeHtml(printer.name)}</td>
                    <td>${Number(printer.power_watts || 0)} W</td>
                    <td>${formatCurrency(printer.purchase_cost)}</td>
                    <td><button class="btn btn-danger" data-remove-printer="${printer.id}">Excluir</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-state">Nenhuma impressora cadastrada.</div>'}
      </section>
    </div>
  `;
}

export function attachPrintersEvents(refresh) {
  const form = qs('#printerForm');
  const feedback = qs('#printerFeedback');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    try {
      await printersRepository.save({
        name: formData.get('name'),
        power_watts: toNumber(formData.get('powerWatts')),
        purchase_cost: toNumber(formData.get('purchaseCost')),
        useful_life_hours: toNumber(formData.get('usefulLifeHours')),
        monthly_maintenance_cost: toNumber(formData.get('monthlyMaintenanceCost')),
        is_active: formData.get('isActive') === 'on',
      });
      feedback.innerHTML = '<div class="notice success">Impressora salva com sucesso.</div>';
      form.reset();
      qs('[name="isActive"]', form).checked = true;
      refresh();
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível salvar a impressora.'}</div>`;
    }
  });

  on('[data-remove-printer]', 'click', async (_, button) => {
    try {
      await printersRepository.remove(button.dataset.removePrinter);
      refresh();
    } catch (error) {
      alert(error.message || 'Não foi possível excluir a impressora.');
    }
  });
}
