import { materialsRepository } from '../../data/repositories/materialsRepository.js';
import { qs, on, escapeHtml } from '../../core/utils/dom.js';
import { formatCurrency } from '../../core/utils/format.js';
import { toNumber } from '../../core/utils/parse.js';

export async function renderMaterialsView() {
  const materials = await materialsRepository.getAll();

  return `
    <div class="grid grid-2">
      <section class="card section-card">
        <h3>Novo material</h3>
        <form id="materialForm">
          <div class="form-grid">
            <div class="field"><label>Nome</label><input name="name" required /></div>
            <div class="field"><label>Marca</label><input name="brand" /></div>
            <div class="field"><label>Tipo</label><input name="type" placeholder="PLA, PETG, ABS..." /></div>
            <div class="field"><label>Peso do rolo (g)</label><input name="spoolWeightG" inputmode="decimal" value="1000" /></div>
            <div class="field"><label>Custo do rolo</label><input name="spoolCost" inputmode="decimal" /></div>
          </div>
          <div id="materialFeedback"></div>
          <div class="button-row"><button class="btn btn-primary" type="submit">Salvar material</button></div>
        </form>
      </section>

      <section class="card section-card">
        <h3>Materiais cadastrados</h3>
        ${materials.length ? `
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Tipo</th><th>Custo/g</th><th></th></tr></thead>
              <tbody>
                ${materials.map((material) => `
                  <tr>
                    <td>${escapeHtml(material.name)}</td>
                    <td>${escapeHtml(material.type || '-')}</td>
                    <td>${formatCurrency(material.cost_per_g)}</td>
                    <td><button class="btn btn-danger" data-remove-material="${material.id}">Excluir</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-state">Nenhum material cadastrado.</div>'}
      </section>
    </div>
  `;
}

export function attachMaterialsEvents(refresh) {
  const form = qs('#materialForm');
  const feedback = qs('#materialFeedback');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    try {
      const spoolWeightG = toNumber(formData.get('spoolWeightG'));
      const spoolCost = toNumber(formData.get('spoolCost'));
      await materialsRepository.save({
        name: formData.get('name'),
        brand: formData.get('brand'),
        type: formData.get('type'),
        spool_weight_g: spoolWeightG,
        spool_cost: spoolCost,
        cost_per_g: spoolWeightG > 0 ? spoolCost / spoolWeightG : 0,
      });
      feedback.innerHTML = '<div class="notice success">Material salvo com sucesso.</div>';
      form.reset();
      qs('[name="spoolWeightG"]', form).value = '1000';
      refresh();
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível salvar o material.'}</div>`;
    }
  });

  on('[data-remove-material]', 'click', async (_, button) => {
    try {
      await materialsRepository.remove(button.dataset.removeMaterial);
      refresh();
    } catch (error) {
      alert(error.message || 'Não foi possível excluir o material.');
    }
  });
}
