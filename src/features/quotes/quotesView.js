import { clientsRepository } from '../../data/repositories/clientsRepository.js';
import { printersRepository } from '../../data/repositories/printersRepository.js';
import { materialsRepository } from '../../data/repositories/materialsRepository.js';
import { quotesRepository } from '../../data/repositories/quotesRepository.js';
import { settingsRepository } from '../../data/repositories/settingsRepository.js';
import { calculateQuote, buildQuoteShareText } from '../../domain/services/quoteCalculator.js';
import { formatCurrency, formatDateTime, formatMinutes } from '../../core/utils/format.js';
import { qs, on, escapeHtml } from '../../core/utils/dom.js';
import { toNumber, toInt } from '../../core/utils/parse.js';

function buildSelectOptions(items, placeholder, mapper) {
  return [`<option value="">${placeholder}</option>`]
    .concat(items.map((item) => `<option value="${item.id}">${escapeHtml(mapper(item))}</option>`))
    .join('');
}

export async function renderQuotesView() {
  const [clients, printers, materials, quotes, settings] = await Promise.all([
    clientsRepository.getAll(),
    printersRepository.getAll(),
    materialsRepository.getAll(),
    quotesRepository.getAll(),
    settingsRepository.getMine(),
  ]);

  return `
    <div class="two-column">
      <section class="card section-card">
        <h3>Novo orçamento</h3>
        <form id="quoteForm">
          <div class="form-grid">
            <div class="field"><label>Cliente</label><select name="clientId">${buildSelectOptions(clients, 'Selecione', (item) => item.name)}</select></div>
            <div class="field"><label>Nome da peça</label><input name="pieceName" required /></div>
            <div class="field"><label>Impressora</label><select name="printerId" required>${buildSelectOptions(printers, 'Selecione', (item) => item.name)}</select></div>
            <div class="field"><label>Material</label><select name="materialId" required>${buildSelectOptions(materials, 'Selecione', (item) => item.name)}</select></div>
          </div>

          <div class="form-grid-3">
            <div class="field"><label>Peso (g)</label><input name="weightG" inputmode="decimal" value="100" /></div>
            <div class="field"><label>Tempo de impressão (min)</label><input name="printTimeMinutes" inputmode="numeric" value="180" /></div>
            <div class="field"><label>Energia (R$/kWh)</label><input name="energyCostKwh" inputmode="decimal" value="${settings.energy_cost_kwh}" /></div>
          </div>

          <div class="form-grid-3">
            <div class="field"><label>Taxa de falha (%)</label><input name="failureRate" inputmode="decimal" value="${settings.default_failure_rate}" /></div>
            <div class="field"><label>Mão de obra</label><input name="laborCost" inputmode="decimal" value="${settings.default_labor_cost}" /></div>
            <div class="field"><label>Acabamento / pintura</label><input name="finishingCost" inputmode="decimal" value="${settings.default_finishing_cost}" /></div>
          </div>

          <div class="form-grid-3">
            <div class="field"><label>Embalagem</label><input name="packagingCost" inputmode="decimal" value="${settings.default_packaging_cost}" /></div>
            <div class="field"><label>Frete</label><input name="shippingCost" inputmode="decimal" value="0" /></div>
            <div class="field"><label>Margem de lucro (%)</label><input name="profitMargin" inputmode="decimal" value="${settings.default_profit_margin}" /></div>
          </div>

          <div class="form-grid-3">
            <div class="field"><label>Impostos (%)</label><input name="taxRate" inputmode="decimal" value="${settings.default_tax_rate}" /></div>
            <div class="field"><label>Taxa de cartão (%)</label><input name="cardFeeRate" inputmode="decimal" value="${settings.default_card_fee_rate}" /></div>
            <div class="field"><label>Observações</label><input name="notes" /></div>
          </div>

          <div id="quoteFeedback"></div>
          <div class="button-row">
            <button class="btn btn-primary" type="submit">Salvar orçamento</button>
            <button class="btn btn-secondary" id="previewQuoteButton" type="button">Atualizar prévia</button>
          </div>
        </form>
      </section>

      <section class="card section-card">
        <h3>Resumo calculado</h3>
        <div id="quotePreview" class="summary-box">
          <div class="summary-line"><span>Material</span><b>${formatCurrency(0)}</b></div>
          <div class="summary-line"><span>Energia</span><b>${formatCurrency(0)}</b></div>
          <div class="summary-line"><span>Depreciação</span><b>${formatCurrency(0)}</b></div>
          <div class="summary-line"><span>Manutenção</span><b>${formatCurrency(0)}</b></div>
          <div class="separator"></div>
          <div class="summary-line"><span>Custo base</span><b>${formatCurrency(0)}</b></div>
          <div class="summary-line"><span>Custo com falha</span><b>${formatCurrency(0)}</b></div>
          <div class="summary-line"><span>Preço final</span><b>${formatCurrency(0)}</b></div>
          <div class="summary-line"><span>Lucro estimado</span><b>${formatCurrency(0)}</b></div>
        </div>
      </section>
    </div>

    <section class="card section-card" style="margin-top:18px;">
      <h3>Histórico de orçamentos</h3>
      ${quotes.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Peça</th><th>Cliente</th><th>Tempo</th><th>Valor</th><th>Data</th><th></th></tr></thead>
            <tbody>
              ${quotes.map((quote) => `
                <tr>
                  <td>${escapeHtml(quote.piece_name)}</td>
                  <td>${escapeHtml(quote.client_name || '-')}</td>
                  <td>${formatMinutes(quote.print_time_minutes)}</td>
                  <td>${formatCurrency(quote.final_price)}</td>
                  <td>${formatDateTime(quote.created_at)}</td>
                  <td>
                    <div class="button-row">
                      <button class="btn btn-secondary" data-share-quote="${quote.id}">Compartilhar</button>
                      <button class="btn btn-danger" data-remove-quote="${quote.id}">Excluir</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state">Nenhum orçamento salvo.</div>'}
    </section>
  `;
}

export async function attachQuotesEvents(refresh) {
  const form = qs('#quoteForm');
  const previewBox = qs('#quotePreview');
  const feedback = qs('#quoteFeedback');
  const previewButton = qs('#previewQuoteButton');

  const [clients, printers, materials] = await Promise.all([
    clientsRepository.getAll(),
    printersRepository.getAll(),
    materialsRepository.getAll(),
  ]);

  const updatePreview = () => {
    if (!form || !previewBox) return null;
    const formData = new FormData(form);
    const printer = printers.find((item) => item.id === formData.get('printerId')) || {};
    const material = materials.find((item) => item.id === formData.get('materialId')) || {};

    const result = calculateQuote({
      weightG: toNumber(formData.get('weightG')),
      printTimeMinutes: toInt(formData.get('printTimeMinutes')),
      powerWatts: Number(printer.power_watts || 0),
      purchaseCost: Number(printer.purchase_cost || 0),
      usefulLifeHours: Number(printer.useful_life_hours || 0),
      monthlyMaintenanceCost: Number(printer.monthly_maintenance_cost || 0),
      costPerG: Number(material.cost_per_g || 0),
      energyCostKwh: toNumber(formData.get('energyCostKwh')),
      failureRate: toNumber(formData.get('failureRate')),
      laborCost: toNumber(formData.get('laborCost')),
      finishingCost: toNumber(formData.get('finishingCost')),
      packagingCost: toNumber(formData.get('packagingCost')),
      shippingCost: toNumber(formData.get('shippingCost')),
      profitMargin: toNumber(formData.get('profitMargin')),
      taxRate: toNumber(formData.get('taxRate')),
      cardFeeRate: toNumber(formData.get('cardFeeRate')),
    });

    previewBox.innerHTML = `
      <div class="summary-line"><span>Material</span><b>${formatCurrency(result.costMaterial)}</b></div>
      <div class="summary-line"><span>Energia</span><b>${formatCurrency(result.costEnergy)}</b></div>
      <div class="summary-line"><span>Depreciação</span><b>${formatCurrency(result.costDepreciation)}</b></div>
      <div class="summary-line"><span>Manutenção</span><b>${formatCurrency(result.costMaintenance)}</b></div>
      <div class="separator"></div>
      <div class="summary-line"><span>Custo base</span><b>${formatCurrency(result.baseCost)}</b></div>
      <div class="summary-line"><span>Custo com falha</span><b>${formatCurrency(result.costWithFailure)}</b></div>
      <div class="summary-line"><span>Preço final</span><b>${formatCurrency(result.finalPrice)}</b></div>
      <div class="summary-line"><span>Lucro estimado</span><b>${formatCurrency(result.expectedProfit)}</b></div>
    `;

    return { result, printer, material, formData };
  };

  previewButton?.addEventListener('click', updatePreview);
  form?.addEventListener('input', () => updatePreview());

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = updatePreview();
    if (!payload) return;
    const client = clients.find((item) => item.id === payload.formData.get('clientId')) || {};

    try {
      const saved = await quotesRepository.save({
        client_id: client.id || null,
        client_name: client.name || '',
        piece_name: payload.formData.get('pieceName'),
        printer_id: payload.printer?.id || null,
        printer_name: payload.printer?.name || '',
        material_id: payload.material?.id || null,
        material_name: payload.material?.name || '',
        weight_g: toNumber(payload.formData.get('weightG')),
        print_time_minutes: toInt(payload.formData.get('printTimeMinutes')),
        energy_cost_kwh: toNumber(payload.formData.get('energyCostKwh')),
        failure_rate: toNumber(payload.formData.get('failureRate')),
        labor_cost: toNumber(payload.formData.get('laborCost')),
        finishing_cost: toNumber(payload.formData.get('finishingCost')),
        packaging_cost: toNumber(payload.formData.get('packagingCost')),
        shipping_cost: toNumber(payload.formData.get('shippingCost')),
        profit_margin: toNumber(payload.formData.get('profitMargin')),
        tax_rate: toNumber(payload.formData.get('taxRate')),
        card_fee_rate: toNumber(payload.formData.get('cardFeeRate')),
        notes: payload.formData.get('notes'),
        cost_material: payload.result.costMaterial,
        cost_energy: payload.result.costEnergy,
        cost_depreciation: payload.result.costDepreciation,
        cost_maintenance: payload.result.costMaintenance,
        base_cost: payload.result.baseCost,
        cost_with_failure: payload.result.costWithFailure,
        price_with_profit: payload.result.priceWithProfit,
        price_with_tax: payload.result.priceWithTax,
        final_price: payload.result.finalPrice,
        expected_profit: payload.result.expectedProfit,
      });

      feedback.innerHTML = '<div class="notice success">Orçamento salvo com sucesso.</div>';
      refresh();

      const shareText = buildQuoteShareText({
        ...saved,
        pieceName: saved.piece_name,
        clientName: saved.client_name,
        materialName: saved.material_name,
        printerName: saved.printer_name,
        weightG: saved.weight_g,
        printTimeMinutes: saved.print_time_minutes,
        finalPriceFormatted: formatCurrency(saved.final_price),
      });
      if (navigator.share) {
        try { await navigator.share({ title: 'Orçamento 3D', text: shareText }); } catch (_) {}
      }
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível salvar o orçamento.'}</div>`;
    }
  });

  on('[data-remove-quote]', 'click', async (_, button) => {
    try {
      await quotesRepository.remove(button.dataset.removeQuote);
      refresh();
    } catch (error) {
      alert(error.message || 'Não foi possível excluir o orçamento.');
    }
  });

  on('[data-share-quote]', 'click', async (_, button) => {
    try {
      const quote = await quotesRepository.getById(button.dataset.shareQuote);
      if (!quote) return;
      const shareText = buildQuoteShareText({
        pieceName: quote.piece_name,
        clientName: quote.client_name,
        materialName: quote.material_name,
        printerName: quote.printer_name,
        weightG: quote.weight_g,
        printTimeMinutes: quote.print_time_minutes,
        finalPriceFormatted: formatCurrency(quote.final_price),
        notes: quote.notes,
      });
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Orçamento 3D', text: shareText });
          return;
        } catch (_) {}
      }
      await navigator.clipboard.writeText(shareText);
      alert('Texto do orçamento copiado para a área de transferência.');
    } catch (error) {
      alert(error.message || 'Não foi possível compartilhar o orçamento.');
    }
  });

  updatePreview();
}
