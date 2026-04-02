import { hasSupabaseConfig } from './lib/supabaseClient.js';
import { getCurrentHash, guardRoute } from './app/router.js';
import { renderShell, renderSetupView } from './app/layout.js';
import { authService } from './domain/services/authService.js';
import { qs } from './core/utils/dom.js';
import { settingsRepository } from './data/repositories/settingsRepository.js';
import { renderAuthView, attachAuthEvents } from './features/auth/authView.js';
import { renderDashboardView } from './features/dashboard/dashboardView.js';
import { renderClientsView, attachClientsEvents } from './features/clients/clientsView.js';
import { renderPrintersView, attachPrintersEvents } from './features/printers/printersView.js';
import { renderMaterialsView, attachMaterialsEvents } from './features/materials/materialsView.js';
import { renderQuotesView, attachQuotesEvents } from './features/quotes/quotesView.js';
import { renderSettingsView, attachSettingsEvents } from './features/settings/settingsView.js';

const app = document.getElementById('app');
let renderCounter = 0;

function bindCommonEvents() {
  qs('#logoutButton')?.addEventListener('click', async () => {
    await authService.logout();
    window.location.hash = '#/login';
  });
}

function renderLoading(message = 'Carregando...') {
  app.innerHTML = `<div class="login-shell"><section class="card login-card"><div class="loading-state">${message}</div></section></div>`;
}

async function refresh() {
  await render();
}

async function render() {
  const currentRender = ++renderCounter;

  if (!hasSupabaseConfig()) {
    app.innerHTML = renderSetupView();
    return;
  }

  renderLoading('Sincronizando com o banco...');

  try {
    await authService.initialize();
    const hash = guardRoute(getCurrentHash());

    if (hash === '#/login') {
      const publicSettings = await settingsRepository.getPublicSite();
      if (currentRender !== renderCounter) return;
      app.innerHTML = renderAuthView({ publicSettings });
      attachAuthEvents(refresh);
      return;
    }

    const screens = {
      '#/dashboard': {
        title: 'Dashboard',
        subtitle: 'Visão geral do negócio e atalhos rápidos.',
        view: renderDashboardView,
        attach: null,
      },
      '#/clients': {
        title: 'Clientes',
        subtitle: 'Cadastre e gerencie sua base de clientes.',
        view: renderClientsView,
        attach: attachClientsEvents,
      },
      '#/printers': {
        title: 'Impressoras',
        subtitle: 'Potência, custo, vida útil e manutenção.',
        view: renderPrintersView,
        attach: attachPrintersEvents,
      },
      '#/materials': {
        title: 'Materiais',
        subtitle: 'Controle de filamentos, custo do rolo e custo por grama.',
        view: renderMaterialsView,
        attach: attachMaterialsEvents,
      },
      '#/quotes': {
        title: 'Orçamentos',
        subtitle: 'Calcule, salve e compartilhe valores de impressão 3D.',
        view: renderQuotesView,
        attach: attachQuotesEvents,
      },
      '#/settings': {
        title: 'Configurações',
        subtitle: 'Parâmetros padrão, deploy e integração com Supabase.',
        view: renderSettingsView,
        attach: attachSettingsEvents,
      },
    };

    const screen = screens[hash] || screens['#/dashboard'];
    const settings = await settingsRepository.getMine();
    const content = await screen.view();
    if (currentRender !== renderCounter) return;
    app.innerHTML = renderShell({
      currentHash: hash,
      title: screen.title,
      subtitle: screen.subtitle,
      content,
      settings,
    });
    bindCommonEvents();
    await screen.attach?.(refresh);
  } catch (error) {
    console.error(error);
    app.innerHTML = `
      <div class="login-shell">
        <section class="card login-card wide-card">
          <div class="login-header">
            <h1>Não foi possível carregar o app</h1>
            <p>Verifique o Supabase, o arquivo config.js e se o schema SQL já foi executado.</p>
          </div>
          <div class="alert">${error.message || 'Erro inesperado.'}</div>
        </section>
      </div>
    `;
  }
}

authService.subscribe(() => {
  render().catch(console.error);
});

window.addEventListener('hashchange', () => {
  render().catch(console.error);
});
window.addEventListener('DOMContentLoaded', () => {
  render().catch(console.error);
});
render().catch(console.error);
