import { clientDirectoryRepository } from '../../data/repositories/clientDirectoryRepository.js';
import { printersRepository } from '../../data/repositories/printersRepository.js';
import { materialsRepository } from '../../data/repositories/materialsRepository.js';
import { quotesRepository } from '../../data/repositories/quotesRepository.js';
import { productionRepository } from '../../data/repositories/productionRepository.js';
import { settingsRepository } from '../../data/repositories/settingsRepository.js';
import { getAppConfig } from '../../lib/supabaseClient.js';
import { authService } from '../../domain/services/authService.js';
import { calculateQuote, buildQuoteShareText } from '../../domain/services/quoteCalculator.js';
import { formatCurrency, formatDateTime, formatMinutes } from '../../core/utils/format.js';
import { qs, on, escapeHtml } from '../../core/utils/dom.js';
import { toInt, toNumber } from '../../core/utils/parse.js';

function renderEasyPreview(result) {
  return `
    <div class="easy-price-label">Valor final para o cliente</div>
    <div class="easy-price-value">${formatCurrency(result.finalPrice)}</div>
    <div class="small-text">Valor calculado com os parâmetros definidos pelo administrador e arredondado para cima em X,99.</div>
  `;
}

function resolveDefaults({ settings, printers, materials }) {
  return {
    printer: printers.find((item) => item.id === settings.default_printer_id) || null,
    material: materials.find((item) => item.id === settings.default_material_id) || null,
  };
}

function calculateEasyQuote({ weightG, printTimeMinutes, settings, printer, material }) {
  return calculateQuote({
    weightG,
    printTimeMinutes,
    powerWatts: Number(printer?.power_watts || 0),
    purchaseCost: Number(printer?.purchase_cost || 0),
    usefulLifeHours: Number(printer?.useful_life_hours || 0),
    monthlyMaintenanceCost: Number(printer?.monthly_maintenance_cost || 0),
    costPerG: Number(material?.cost_per_g || 0),
    energyCostKwh: Number(settings.energy_cost_kwh || 0),
    failureRate: Number(settings.default_failure_rate || 0),
    packagingCost: Number(settings.default_packaging_cost || 0),
    shippingCost: 0,
    profitMargin: Number(settings.default_profit_margin || 0),
    taxRate: Number(settings.default_tax_rate || 0),
    cardFeeRate: Number(settings.default_card_fee_rate || 0),
    manualAdjustedPrice: '',
    discountAmount: 0,
  });
}

function setFormValue(form, name, value) {
  const field = qs(`[name="${name}"]`, form);
  if (!field) return;
  field.value = value ?? '';
}

function normalizeExternalUrl(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';

  try {
    const url = new URL(rawValue);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (_) {
    return '';
  }
}

function renderProjectLink(quote) {
  const projectLink = normalizeExternalUrl(quote.project_link);
  if (!projectLink) return '-';

  return `<a class="btn btn-ghost btn-compact" href="${escapeHtml(projectLink)}" target="_blank" rel="noopener noreferrer">Abrir projeto</a>`;
}

function buildQuotePayload({ formData, client, settings, printer, material, result }) {
  return {
    quote_mode: 'easy',
    client_id: client?.id || null,
    client_name: String(formData.get('clientName') || '').trim(),
    piece_name: String(formData.get('pieceName') || '').trim(),
    project_link: String(formData.get('projectLink') || '').trim() || null,
    project_image_url: null,
    printer_id: printer.id,
    printer_name: printer.name || '',
    material_id: material.id,
    material_name: material.name || '',
    weight_g: toNumber(formData.get('weightG')),
    print_time_minutes: toInt(formData.get('printTimeMinutes')),
    energy_cost_kwh: Number(settings.energy_cost_kwh || 0),
    failure_rate: Number(settings.default_failure_rate || 0),
    labor_cost: result.laborCost,
    finishing_cost: result.finishingCost,
    packaging_cost: Number(settings.default_packaging_cost || 0),
    shipping_cost: 0,
    profit_margin: Number(settings.default_profit_margin || 0),
    tax_rate: Number(settings.default_tax_rate || 0),
    card_fee_rate: Number(settings.default_card_fee_rate || 0),
    manual_adjusted_price: null,
    discount_amount: 0,
    adjusted_price: result.adjustedPrice,
    calculated_final_price: result.calculatedFinalPrice,
    notes: String(formData.get('notes') || '').trim() || null,
    cost_material: result.costMaterial,
    cost_energy: result.costEnergy,
    cost_depreciation: result.costDepreciation,
    cost_maintenance: result.costMaintenance,
    base_cost: result.baseCost,
    cost_with_failure: result.costWithFailure,
    price_with_profit: result.priceWithProfit,
    price_with_tax: result.priceWithTax,
    final_price: result.finalPrice,
    expected_profit: result.expectedProfit,
  };
}

async function shareQuote(quote, settings) {
  const appConfig = getAppConfig();
  const brandName = settings?.public_app_name || appConfig.APP_NAME || 'Perfeitos Presentes';
  const text = buildQuoteShareText({
    brandName,
    pieceName: quote.piece_name,
    finalPriceFormatted: formatCurrency(quote.final_price),
    storeUrl: 'https://loja.infinitepay.io/perfeitos_presentes',
    instagramHandle: '@perfeitos.presentes',
  });

  if (navigator.share) {
    try {
      await navigator.share({ title: `${brandName} • Orçamento`, text });
      return;
    } catch (_) {}
  }

  await navigator.clipboard.writeText(text);
  alert('Mensagem do orçamento copiada para a área de transferência.');
}

function renderSetupWarning() {
  const adminAction = authService.isAdmin()
    ? 'Acesse <a href="#/settings"><b>Configurações</b></a> e escolha a impressora e o material do Orçamento Fácil.'
    : 'Peça ao administrador para escolher a impressora e o material padrão do Orçamento Fácil.';

  return `
    <section class="card section-card">
      <h3>Orçamento Fácil ainda não configurado</h3>
      <div class="alert">${adminAction}</div>
    </section>
  `;
}

export async function renderEasyQuoteView() {
  const [clients, printers, materials, quotes, settings, productionItems] = await Promise.all([
    clientDirectoryRepository.getAll(),
    printersRepository.getAll(),
    materialsRepository.getAll(),
    quotesRepository.getAll(),
    settingsRepository.getMine(),
    productionRepository.getAll(),
  ]);
  const { printer, material } = resolveDefaults({ settings, printers, materials });
  if (!printer || !material) return renderSetupWarning();

  const easyQuotes = quotes.filter((quote) => quote.quote_mode === 'easy');
  const producedQuoteIds = new Set(
    productionItems.filter((item) => item.quote_id).map((item) => String(item.quote_id)),
  );
  const initialResult = calculateEasyQuote({
    weightG: 100,
    printTimeMinutes: 180,
    settings,
    printer,
    material,
  });

  return `
    <div class="two-column easy-quote-layout">
      <section class="card section-card">
        <h3 id="easyQuoteFormTitle">Novo orçamento fácil</h3>
        <form id="easyQuoteForm">
          <input type="hidden" name="id" />
          <div class="form-grid">
            <div class="field">
              <label>Cliente</label>
              <input name="clientName" list="easyQuoteClientOptions" autocomplete="off" required />
              <datalist id="easyQuoteClientOptions">
                ${clients.map((client) => `<option value="${escapeHtml(client.name)}"></option>`).join('')}
              </datalist>
            </div>
            <div class="field"><label>Nome da peça</label><input name="pieceName" required /></div>
          </div>
          <div class="form-grid">
            <div class="field form-grid-full">
              <label>Link do Projeto</label>
              <input name="projectLink" type="url" inputmode="url" placeholder="https://..." />
            </div>
          </div>
          <div class="field">
            <label>Observações</label>
            <textarea name="notes" placeholder="Detalhes, cores, acabamento ou outras informações do projeto..."></textarea>
          </div>
          <div class="form-grid">
            <div class="field"><label>Peso (g)</label><input name="weightG" inputmode="decimal" min="0.01" value="100" required /></div>
            <div class="field"><label>Tempo de produção (min)</label><input name="printTimeMinutes" inputmode="numeric" min="1" value="180" required /></div>
          </div>
          <div class="notice">
            Cálculo configurado com <b>${escapeHtml(printer.name)}</b> e <b>${escapeHtml(material.name)}</b>.
          </div>
          <div id="easyQuoteFeedback"></div>
          <div class="button-row">
            <button class="btn btn-primary" id="saveEasyQuoteButton" type="submit" data-easy-action="save">Salvar orçamento</button>
            <button class="btn btn-success" id="produceEasyQuoteButton" type="submit" data-easy-action="produce">Salvar e enviar à produção</button>
            <button class="btn btn-ghost" id="cancelEditEasyQuoteButton" type="button" hidden>Cancelar edição</button>
          </div>
        </form>
      </section>

      <section class="card section-card easy-price-card">
        <h3>Resultado</h3>
        <div id="easyQuotePreview" class="easy-price-box">${renderEasyPreview(initialResult)}</div>
      </section>
    </div>

    <section class="card section-card" style="margin-top:18px;">
      <h3>Orçamentos fáceis recentes</h3>
      ${easyQuotes.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Peça</th><th>Cliente</th><th>Projeto</th><th>Observações</th><th>Peso</th><th>Tempo</th><th>Valor</th><th>Data</th><th></th></tr></thead>
            <tbody>
              ${easyQuotes.map((quote) => {
                const wasSentToProduction = producedQuoteIds.has(String(quote.id));
                return `
                  <tr>
                    <td><b>${escapeHtml(quote.piece_name)}</b></td>
                    <td>${escapeHtml(quote.client_name || '-')}</td>
                    <td>${renderProjectLink(quote)}</td>
                    <td>${escapeHtml(quote.notes || '-')}</td>
                    <td>${Number(quote.weight_g || 0).toLocaleString('pt-BR')} g</td>
                    <td>${formatMinutes(quote.print_time_minutes)}</td>
                    <td>${formatCurrency(quote.final_price)}</td>
                    <td>${formatDateTime(quote.created_at)}</td>
                    <td>
                      <div class="button-row compact-row">
                        <button class="btn btn-secondary" data-easy-edit="${quote.id}">Editar</button>
                        ${wasSentToProduction
                          ? '<button class="btn btn-success" type="button" disabled>ENVIADO</button>'
                          : `<button class="btn btn-success" data-easy-produce="${quote.id}">Enviar à produção</button>`}
                        <button class="btn btn-secondary" data-easy-share="${quote.id}">Compartilhar</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state">Nenhum orçamento fácil salvo.</div>'}
    </section>
  `;
}

export async function attachEasyQuoteEvents(refresh) {
  const form = qs('#easyQuoteForm');
  if (!form) return;

  const preview = qs('#easyQuotePreview');
  const feedback = qs('#easyQuoteFeedback');
  const cancelEditButton = qs('#cancelEditEasyQuoteButton');
  const formTitle = qs('#easyQuoteFormTitle');
  const saveButton = qs('#saveEasyQuoteButton');
  const produceButton = qs('#produceEasyQuoteButton');
  const [clients, printers, materials, settings, productionItems] = await Promise.all([
    clientDirectoryRepository.getAll(),
    printersRepository.getAll(),
    materialsRepository.getAll(),
    settingsRepository.getMine(),
    productionRepository.getAll(),
  ]);
  const { printer, material } = resolveDefaults({ settings, printers, materials });
  if (!printer || !material) return;
  const producedQuoteIds = new Set(
    productionItems.filter((item) => item.quote_id).map((item) => String(item.quote_id)),
  );

  const updatePreview = () => {
    const formData = new FormData(form);
    const result = calculateEasyQuote({
      weightG: toNumber(formData.get('weightG')),
      printTimeMinutes: toInt(formData.get('printTimeMinutes')),
      settings,
      printer,
      material,
    });
    preview.innerHTML = renderEasyPreview(result);
    return { formData, result };
  };

  const resetFormState = () => {
    form.reset();
    setFormValue(form, 'id', '');
    setFormValue(form, 'weightG', '100');
    setFormValue(form, 'printTimeMinutes', '180');
    cancelEditButton.hidden = true;
    produceButton.hidden = false;
    formTitle.textContent = 'Novo orçamento fácil';
    saveButton.textContent = 'Salvar orçamento';
    produceButton.textContent = 'Salvar e enviar à produção';
    feedback.innerHTML = '';
    updatePreview();
  };

  const fillFormFromQuote = (quote) => {
    const wasSentToProduction = producedQuoteIds.has(String(quote.id));
    setFormValue(form, 'id', quote.id);
    setFormValue(form, 'clientName', quote.client_name || '');
    setFormValue(form, 'pieceName', quote.piece_name || '');
    setFormValue(form, 'projectLink', quote.project_link || '');
    setFormValue(form, 'notes', quote.notes || '');
    setFormValue(form, 'weightG', quote.weight_g ?? '');
    setFormValue(form, 'printTimeMinutes', quote.print_time_minutes ?? '');

    cancelEditButton.hidden = false;
    produceButton.hidden = wasSentToProduction;
    formTitle.textContent = `Editando orçamento: ${quote.piece_name}`;
    saveButton.textContent = 'Salvar alterações';
    produceButton.textContent = 'Salvar alterações e enviar à produção';
    feedback.innerHTML = wasSentToProduction
      ? '<div class="notice">Você está editando um orçamento que já foi enviado. As alterações serão salvas no orçamento, sem modificar o item existente na fila de produção.</div>'
      : '<div class="notice">Você está editando um orçamento fácil salvo.</div>';
    updatePreview();
    qs('[name="pieceName"]', form)?.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  form.addEventListener('input', updatePreview);
  cancelEditButton.addEventListener('click', resetFormState);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { formData, result } = updatePreview();
    const quoteId = String(formData.get('id') || '').trim();
    const clientName = String(formData.get('clientName') || '').trim();
    const client = clients.find((item) => item.name.toLocaleLowerCase('pt-BR') === clientName.toLocaleLowerCase('pt-BR')) || null;
    const action = event.submitter?.dataset.easyAction || 'save';
    const buttons = form.querySelectorAll('button[type="submit"]');

    if (toNumber(formData.get('weightG')) <= 0 || toInt(formData.get('printTimeMinutes')) <= 0) {
      feedback.innerHTML = '<div class="alert">Informe um peso e um tempo de produção maiores que zero.</div>';
      return;
    }

    buttons.forEach((button) => { button.disabled = true; });
    feedback.innerHTML = '';

    try {
      const saved = await quotesRepository.save({
        ...(quoteId ? { id: quoteId } : {}),
        ...buildQuotePayload({
          formData,
          client,
          settings,
          printer,
          material,
          result,
        }),
      });

      if (action === 'produce') {
        try {
          const productionResult = await productionRepository.createFromQuote(saved);
          if (productionResult.alreadyExisted) {
            alert('Orçamento salvo. Este orçamento já estava na fila de produção; o item da fila não foi alterado.');
            await refresh();
            return;
          }
        } catch (productionError) {
          alert(`O orçamento foi salvo, mas não pôde ser enviado para a produção: ${productionError.message || 'erro inesperado.'}`);
          await refresh();
          return;
        }
        alert('Orçamento salvo e enviado para a fila de produção.');
        window.location.hash = '#/production';
        return;
      }

      alert(quoteId ? 'Orçamento atualizado com sucesso.' : 'Orçamento salvo com sucesso.');
      await refresh();
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${escapeHtml(error.message || 'Não foi possível salvar o orçamento.')}</div>`;
      buttons.forEach((button) => { button.disabled = false; });
    }
  });

  on('[data-easy-edit]', 'click', async (_, button) => {
    try {
      const quote = await quotesRepository.getById(button.dataset.easyEdit);
      if (!quote || quote.quote_mode !== 'easy') {
        throw new Error('Este registro não é um Orçamento Fácil válido.');
      }
      fillFormFromQuote(quote);
    } catch (error) {
      alert(error.message || 'Não foi possível carregar o orçamento para edição.');
    }
  });

  on('[data-easy-produce]', 'click', async (_, button) => {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'ENVIANDO...';
    try {
      const quote = await quotesRepository.getById(button.dataset.easyProduce);
      if (!quote) return;
      const result = await productionRepository.createFromQuote(quote);
      alert(result.alreadyExisted ? 'Este orçamento já estava na fila.' : 'Orçamento enviado para a produção.');
      window.location.hash = '#/production';
    } catch (error) {
      button.disabled = false;
      button.textContent = originalText;
      alert(error.message || 'Não foi possível enviar o orçamento para a produção.');
    }
  });

  on('[data-easy-share]', 'click', async (_, button) => {
    try {
      const quote = await quotesRepository.getById(button.dataset.easyShare);
      if (quote) await shareQuote(quote, settings);
    } catch (error) {
      alert(error.message || 'Não foi possível compartilhar o orçamento.');
    }
  });

  updatePreview();
}
