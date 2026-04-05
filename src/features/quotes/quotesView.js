import { clientsRepository } from '../../data/repositories/clientsRepository.js';
import { getAppConfig } from '../../lib/supabaseClient.js';
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

function renderQuotePreview(result) {
  return `
    <div class="summary-line"><span>Material</span><b>${formatCurrency(result.costMaterial)}</b></div>
    <div class="summary-line"><span>Energia</span><b>${formatCurrency(result.costEnergy)}</b></div>
    <div class="summary-line"><span>Depreciação</span><b>${formatCurrency(result.costDepreciation)}</b></div>
    <div class="summary-line"><span>Manutenção</span><b>${formatCurrency(result.costMaintenance)}</b></div>
    <div class="separator"></div>
    <div class="summary-line"><span>Custo base</span><b>${formatCurrency(result.baseCost)}</b></div>
    <div class="summary-line"><span>Custo com falha</span><b>${formatCurrency(result.costWithFailure)}</b></div>
    <div class="summary-line"><span>Preço calculado</span><b>${formatCurrency(result.calculatedFinalPrice)}</b></div>
    <div class="summary-line"><span>Preço sugerido (9,99)</span><b>${formatCurrency(result.suggestedPrice)}</b></div>
    <div class="summary-line"><span>Ajuste manual</span><b>${result.manualAdjustedPrice !== null ? formatCurrency(result.manualAdjustedPrice) : '-'}</b></div>
    <div class="summary-line"><span>Desconto</span><b>${formatCurrency(result.discountAmount)}</b></div>
    <div class="separator"></div>
    <div class="summary-line"><span>Preço final ao cliente</span><b>${formatCurrency(result.finalPrice)}</b></div>
    <div class="summary-line"><span>Lucro estimado</span><b>${formatCurrency(result.expectedProfit)}</b></div>
  `;
}

function setFormValue(form, name, value) {
  const field = qs(`[name="${name}"]`, form);
  if (!field) return;
  field.value = value ?? '';
}

export async function renderQuotesView() {
  const [clients, printers, materials, quotes, settings] = await Promise.all([
    clientsRepository.getAll(),
    printersRepository.getAll(),
    materialsRepository.getAll(),
    quotesRepository.getAll(),
    settingsRepository.getMine(),
  ]);

  const initialPreview = renderQuotePreview(
    calculateQuote({
      weightG: 100,
      printTimeMinutes: 180,
      energyCostKwh: settings.energy_cost_kwh,
      failureRate: settings.default_failure_rate,
      laborCost: settings.default_labor_cost,
      finishingCost: settings.default_finishing_cost,
      packagingCost: settings.default_packaging_cost,
      shippingCost: 0,
      profitMargin: settings.default_profit_margin,
      taxRate: settings.default_tax_rate,
      cardFeeRate: settings.default_card_fee_rate,
      manualAdjustedPrice: '',
      discountAmount: 0,
    }),
  );

  return `
    <div class="two-column">
      <section class="card section-card">
        <h3 id="quoteFormTitle">Novo orçamento</h3>
        <form id="quoteForm">
          <input type="hidden" name="id" />
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
            <div class="field"><label>Preço manual ao cliente (R$)</label><input name="manualAdjustedPrice" inputmode="decimal" placeholder="Opcional" /></div>
          </div>

          <div class="form-grid-3">
            <div class="field"><label>Desconto (R$)</label><input name="discountAmount" inputmode="decimal" value="0" /></div>
            <div class="field"><label>Observações</label><input name="notes" /></div>
            <div class="field"><label>&nbsp;</label><div class="notice">O preço final sempre usa a sugestão abaixo terminada em 9,99, salvo quando você preencher o preço manual.</div></div>
          </div>

          <div id="quoteFeedback"></div>
          <div class="button-row">
            <button class="btn btn-primary" type="submit" id="saveQuoteButton">Salvar orçamento</button>
            <button class="btn btn-secondary" id="previewQuoteButton" type="button">Atualizar prévia</button>
            <button class="btn btn-ghost" id="cancelEditQuoteButton" type="button" hidden>Cancelar edição</button>
          </div>
        </form>
      </section>

      <section class="card section-card">
        <h3>Resumo calculado</h3>
        <div class="notice" style="margin-bottom:12px;">O valor de <b>Preço final ao cliente</b> é o valor mostrado para o cliente e salvo no orçamento.</div>
        <div id="quotePreview" class="summary-box">
          ${initialPreview}
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
                      <button class="btn btn-secondary" data-edit-quote="${quote.id}">Editar</button>
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
  const cancelEditButton = qs('#cancelEditQuoteButton');
  const formTitle = qs('#quoteFormTitle');
  const saveButton = qs('#saveQuoteButton');

  const [clients, printers, materials, settings] = await Promise.all([
    clientsRepository.getAll(),
    printersRepository.getAll(),
    materialsRepository.getAll(),
    settingsRepository.getMine(),
  ]);

  const resetFormState = () => {
    if (!form) return;
    form.reset();
    setFormValue(form, 'id', '');
    setFormValue(form, 'weightG', '100');
    setFormValue(form, 'printTimeMinutes', '180');
    setFormValue(form, 'shippingCost', '0');
    setFormValue(form, 'discountAmount', '0');
    cancelEditButton.hidden = true;
    formTitle.textContent = 'Novo orçamento';
    saveButton.textContent = 'Salvar orçamento';
    feedback.innerHTML = '';
    updatePreview();
  };

  const fillFormFromQuote = (quote) => {
    if (!form) return;
    setFormValue(form, 'id', quote.id);
    setFormValue(form, 'clientId', quote.client_id || '');
    setFormValue(form, 'pieceName', quote.piece_name || '');
    setFormValue(form, 'printerId', quote.printer_id || '');
    setFormValue(form, 'materialId', quote.material_id || '');
    setFormValue(form, 'weightG', quote.weight_g ?? '');
    setFormValue(form, 'printTimeMinutes', quote.print_time_minutes ?? '');
    setFormValue(form, 'energyCostKwh', quote.energy_cost_kwh ?? '');
    setFormValue(form, 'failureRate', quote.failure_rate ?? '');
    setFormValue(form, 'laborCost', quote.labor_cost ?? '');
    setFormValue(form, 'finishingCost', quote.finishing_cost ?? '');
    setFormValue(form, 'packagingCost', quote.packaging_cost ?? '');
    setFormValue(form, 'shippingCost', quote.shipping_cost ?? '');
    setFormValue(form, 'profitMargin', quote.profit_margin ?? '');
    setFormValue(form, 'taxRate', quote.tax_rate ?? '');
    setFormValue(form, 'cardFeeRate', quote.card_fee_rate ?? '');
    setFormValue(form, 'manualAdjustedPrice', quote.manual_adjusted_price ?? '');
    setFormValue(form, 'discountAmount', quote.discount_amount ?? '0');
    setFormValue(form, 'notes', quote.notes || '');

    cancelEditButton.hidden = false;
    formTitle.textContent = `Editando orçamento: ${quote.piece_name}`;
    saveButton.textContent = 'Salvar alterações';
    feedback.innerHTML = '<div class="notice">Você está editando um orçamento salvo.</div>';
    updatePreview();
    qs('[name="pieceName"]', form)?.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      manualAdjustedPrice: formData.get('manualAdjustedPrice'),
      discountAmount: toNumber(formData.get('discountAmount')),
    });

    previewBox.innerHTML = renderQuotePreview(result);

    return { result, printer, material, formData };
  };

  previewButton?.addEventListener('click', updatePreview);
  form?.addEventListener('input', () => updatePreview());
  cancelEditButton?.addEventListener('click', () => resetFormState());

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = updatePreview();
    if (!payload) return;
    const client = clients.find((item) => item.id === payload.formData.get('clientId')) || {};
    const quoteId = String(payload.formData.get('id') || '').trim();

    try {
      const saved = await quotesRepository.save({
        ...(quoteId ? { id: quoteId } : {}),
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
        manual_adjusted_price: payload.result.manualAdjustedPrice,
        discount_amount: payload.result.discountAmount,
        adjusted_price: payload.result.adjustedPrice,
        calculated_final_price: payload.result.calculatedFinalPrice,
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

      feedback.innerHTML = `<div class="notice success">${quoteId ? 'Orçamento atualizado com sucesso.' : 'Orçamento salvo com sucesso.'} Use o botão <b>Compartilhar</b> no histórico quando quiser enviar ao cliente.</div>`;
      await refresh();
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível salvar o orçamento.'}</div>`;
    }
  });

  on('[data-edit-quote]', 'click', async (_, button) => {
    try {
      const quote = await quotesRepository.getById(button.dataset.editQuote);
      if (!quote) return;
      fillFormFromQuote(quote);
    } catch (error) {
      alert(error.message || 'Não foi possível carregar o orçamento para edição.');
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


  async function buildSharePayload(quote) {
    const appConfig = getAppConfig();
    const brandName = settings?.public_app_name || appConfig.APP_NAME || 'Perfeitos Presentes';
    const shareText = buildQuoteShareText({
      brandName,
      pieceName: quote.piece_name,
      finalPriceFormatted: formatCurrency(quote.final_price),
      storeUrl: 'https://loja.infinitepay.io/perfeitos_presentes',
      instagramHandle: '@perfeitos.presentes',
    });

    const sharePayload = {
      title: `${brandName} • Orçamento`,
      text: shareText,
    };

    try {
      const response = await fetch('./assets/perfeitos-presentes-logo.png');
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], 'perfeitos-presentes-logo.png', { type: blob.type || 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          sharePayload.files = [file];
        }
      }
    } catch (_) {}

    return sharePayload;
  }

  on('[data-share-quote]', 'click', async (_, button) => {
    try {
      const quote = await quotesRepository.getById(button.dataset.shareQuote);
      if (!quote) return;
      const sharePayload = await buildSharePayload(quote);
      if (navigator.share) {
        try {
          await navigator.share(sharePayload);
          return;
        } catch (_) {}
      }
      await navigator.clipboard.writeText(sharePayload.text);
      alert('Mensagem do orçamento copiada para a área de transferência.');
    } catch (error) {
      alert(error.message || 'Não foi possível compartilhar o orçamento.');
    }
  });

  updatePreview();
}
