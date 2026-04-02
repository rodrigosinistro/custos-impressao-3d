import { clientsRepository } from '../../data/repositories/clientsRepository.js';
import { printersRepository } from '../../data/repositories/printersRepository.js';
import { materialsRepository } from '../../data/repositories/materialsRepository.js';
import { quotesRepository } from '../../data/repositories/quotesRepository.js';
import { settingsRepository } from '../../data/repositories/settingsRepository.js';
import { formatCurrency, formatDateTime } from '../../core/utils/format.js';

export async function renderDashboardView() {
  const [clients, printers, materials, quotes, settings] = await Promise.all([
    clientsRepository.getAll(),
    printersRepository.getAll(),
    materialsRepository.getAll(),
    quotesRepository.getAll(),
    settingsRepository.getMine(),
  ]);
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyQuotes = quotes.filter((quote) => String(quote.created_at || quote.createdAt || '').startsWith(monthKey));
  const monthlyRevenue = monthlyQuotes.reduce((sum, quote) => sum + Number(quote.final_price || quote.finalPrice || 0), 0);
  const monthlyProfit = monthlyQuotes.reduce((sum, quote) => sum + Number(quote.expected_profit || quote.expectedProfit || 0), 0);
  const latestQuote = quotes[0];
  const publicLeads = clients.filter((entry) => entry.source === 'public_form').length;

  return `
    <div class="grid grid-4">
      <section class="card kpi-card">
        <small>Clientes cadastrados</small>
        <strong>${clients.length}</strong>
      </section>
      <section class="card kpi-card">
        <small>Cadastros públicos</small>
        <strong>${publicLeads}</strong>
      </section>
      <section class="card kpi-card">
        <small>Receita do mês</small>
        <strong>${formatCurrency(monthlyRevenue)}</strong>
      </section>
      <section class="card kpi-card">
        <small>Lucro estimado do mês</small>
        <strong>${formatCurrency(monthlyProfit)}</strong>
      </section>
    </div>

    <div class="grid grid-2" style="margin-top: 18px;">
      <section class="card section-card">
        <h3>Atalhos rápidos</h3>
        <div class="button-row">
          <a class="btn btn-primary" href="#/quotes">Novo orçamento</a>
          <a class="btn btn-secondary" href="#/clients">Clientes</a>
          <a class="btn btn-secondary" href="#/materials">Materiais</a>
          <a class="btn btn-secondary" href="#/printers">Impressoras</a>
        </div>
      </section>

      <section class="card section-card">
        <h3>Último orçamento</h3>
        ${latestQuote ? `
          <div class="summary-box">
            <div class="summary-line"><span>Peça</span><b>${latestQuote.piece_name}</b></div>
            <div class="summary-line"><span>Cliente</span><b>${latestQuote.client_name || '-'}</b></div>
            <div class="summary-line"><span>Valor</span><b>${formatCurrency(latestQuote.final_price)}</b></div>
            <div class="summary-line"><span>Data</span><b>${formatDateTime(latestQuote.created_at)}</b></div>
          </div>
        ` : '<div class="empty-state">Nenhum orçamento salvo ainda.</div>'}
      </section>
    </div>

    <div class="grid grid-2" style="margin-top: 18px;">
      <section class="card section-card">
        <h3>Materiais disponíveis</h3>
        <div class="pill-list">
          ${materials.map((material) => `<span class="badge">${material.name}</span>`).join('') || '<span class="muted">Cadastre seu primeiro material.</span>'}
        </div>
      </section>
      <section class="card section-card">
        <h3>Status da operação</h3>
        <div class="summary-box">
          <div class="summary-line"><span>Empresa</span><b>${settings.company_name || '-'}</b></div>
          <div class="summary-line"><span>WhatsApp</span><b>${settings.company_whatsapp || '-'}</b></div>
          <div class="summary-line"><span>Cadastro público</span><b>${settings.allow_public_client_signup ? 'Ativo' : 'Desativado'}</b></div>
          <div class="summary-line"><span>Impressoras ativas</span><b>${printers.filter((entry) => entry.is_active).length}</b></div>
        </div>
      </section>
    </div>
  `;
}
