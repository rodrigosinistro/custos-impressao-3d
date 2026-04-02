import { settingsRepository } from '../../data/repositories/settingsRepository.js';
import { qs } from '../../core/utils/dom.js';
import { toNumber } from '../../core/utils/parse.js';

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function renderSettingsView() {
  const settings = await settingsRepository.getMine();

  return `
    <div class="grid grid-2">
      <section class="card section-card">
        <h3>Parâmetros padrão</h3>
        <form id="settingsForm">
          <div class="form-grid">
            <div class="field"><label>Nome público do app</label><input name="publicAppName" value="${settings.public_app_name || ''}" /></div>
            <div class="field"><label>Nome da empresa</label><input name="companyName" value="${settings.company_name || ''}" /></div>
            <div class="field"><label>WhatsApp</label><input name="companyWhatsapp" value="${settings.company_whatsapp || ''}" /></div>
            <div class="field"><label>Energia (R$/kWh)</label><input name="energyCostKwh" inputmode="decimal" value="${settings.energy_cost_kwh}" /></div>
            <div class="field"><label>Falha padrão (%)</label><input name="defaultFailureRate" inputmode="decimal" value="${settings.default_failure_rate}" /></div>
            <div class="field"><label>Margem padrão (%)</label><input name="defaultProfitMargin" inputmode="decimal" value="${settings.default_profit_margin}" /></div>
            <div class="field"><label>Imposto padrão (%)</label><input name="defaultTaxRate" inputmode="decimal" value="${settings.default_tax_rate}" /></div>
            <div class="field"><label>Taxa de cartão (%)</label><input name="defaultCardFeeRate" inputmode="decimal" value="${settings.default_card_fee_rate}" /></div>
            <div class="field"><label>Mão de obra padrão</label><input name="defaultLaborCost" inputmode="decimal" value="${settings.default_labor_cost}" /></div>
            <div class="field"><label>Acabamento padrão</label><input name="defaultFinishingCost" inputmode="decimal" value="${settings.default_finishing_cost}" /></div>
            <div class="field"><label>Embalagem padrão</label><input name="defaultPackagingCost" inputmode="decimal" value="${settings.default_packaging_cost}" /></div>
            <div class="field checkbox-field"><label><input name="allowPublicClientSignup" type="checkbox" ${settings.allow_public_client_signup ? 'checked' : ''} /> Permitir cadastro público</label></div>
          </div>
          <div id="settingsFeedback"></div>
          <div class="button-row"><button class="btn btn-primary" type="submit">Salvar configurações</button></div>
        </form>
      </section>

      <section class="card section-card">
        <h3>Banco e deploy</h3>
        <p class="small-text">Os dados agora ficam no Supabase. O GitHub Pages serve apenas a interface web estática.</p>
        <div class="button-row">
          <button class="btn btn-secondary" id="exportSnapshotButton" type="button">Exportar snapshot JSON</button>
        </div>
        <div class="separator"></div>
        <div class="notice">
          Use apenas a chave anon/publishable no <code>config.js</code>. Nunca exponha a chave <code>service_role</code> no navegador.
        </div>
        <div id="backupFeedback"></div>
      </section>
    </div>
  `;
}

export function attachSettingsEvents(refresh) {
  const form = qs('#settingsForm');
  const feedback = qs('#settingsFeedback');
  const backupFeedback = qs('#backupFeedback');
  const exportButton = qs('#exportSnapshotButton');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    try {
      await settingsRepository.save({
        public_app_name: formData.get('publicAppName'),
        company_name: formData.get('companyName'),
        company_whatsapp: formData.get('companyWhatsapp'),
        energy_cost_kwh: toNumber(formData.get('energyCostKwh')),
        default_failure_rate: toNumber(formData.get('defaultFailureRate')),
        default_profit_margin: toNumber(formData.get('defaultProfitMargin')),
        default_tax_rate: toNumber(formData.get('defaultTaxRate')),
        default_card_fee_rate: toNumber(formData.get('defaultCardFeeRate')),
        default_labor_cost: toNumber(formData.get('defaultLaborCost')),
        default_finishing_cost: toNumber(formData.get('defaultFinishingCost')),
        default_packaging_cost: toNumber(formData.get('defaultPackagingCost')),
        allow_public_client_signup: formData.get('allowPublicClientSignup') === 'on',
      });
      feedback.innerHTML = '<div class="notice success">Configurações salvas.</div>';
      refresh();
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível salvar as configurações.'}</div>`;
    }
  });

  exportButton?.addEventListener('click', async () => {
    try {
      const snapshot = await settingsRepository.exportSnapshot();
      downloadJson(`custos-impressao-3d-snapshot-${new Date().toISOString().slice(0, 10)}.json`, snapshot);
      backupFeedback.innerHTML = '<div class="notice success">Snapshot exportado.</div>';
    } catch (error) {
      backupFeedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível exportar o snapshot.'}</div>`;
    }
  });
}
