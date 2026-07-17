import { routes } from './routes.js';
import { authService } from '../domain/services/authService.js';
import { escapeHtml } from '../core/utils/dom.js';

export function renderShell({ currentHash, title, subtitle, content, settings }) {
  const appName = settings?.public_app_name || 'Custos de Impressão 3D';
  const navLinks = routes
    .filter((route) => route.requiresAuth && route.showInNav !== false && authService.canAccessRoles(route.roles))
    .map(
      (route) => `
        <a class="nav-link ${currentHash === route.hash ? 'active' : ''}" href="${route.hash}">${escapeHtml(route.label)}</a>
      `,
    )
    .join('');

  return `
    <div class="page-shell">
      <div class="sidebar-overlay" id="sidebarOverlay" hidden></div>

      <aside class="sidebar" id="appSidebar" aria-label="Navegação principal">
        <div class="sidebar-heading">
          <div class="brand">
            <div class="brand-logo">
              <img src="./assets/perfeitos-presentes-logo.png" alt="Logo Perfeitos Presentes" class="brand-logo-image" />
            </div>
            <div class="brand-copy">
              <h1>${escapeHtml(appName)}</h1>
              <p>Perfeitos Presentes • GitHub Pages + Supabase</p>
            </div>
          </div>

          <button class="icon-button sidebar-close" id="sidebarCloseButton" type="button" aria-label="Fechar menu">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div class="notice sidebar-notice">
          Banco real no Supabase com autenticação, RLS e publicação estática no GitHub Pages.
        </div>

        <nav class="nav-list">
          ${navLinks}
        </nav>

        <div class="sidebar-footer">
          <div class="small-text sidebar-user">
            Logado como <b>${escapeHtml(authService.getState().user?.email || '---')}</b>
            <span class="role-label">${authService.isAdmin() ? 'Administrador' : 'Orçamentista'}</span>
          </div>
          <button class="btn btn-danger" id="logoutButton">Sair</button>
        </div>
      </aside>

      <main class="content-area">
        <div class="mobile-appbar">
          <button class="icon-button menu-toggle" id="sidebarToggleButton" type="button" aria-label="Abrir menu" aria-controls="appSidebar" aria-expanded="false">
            <span class="menu-icon" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
          <div class="mobile-appbar-copy">
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(appName)}</span>
          </div>
          <span class="mobile-appbar-status" aria-label="Conectado ao Supabase"></span>
        </div>

        <div class="topbar">
          <div class="topbar-copy">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(subtitle)}</p>
          </div>
          <span class="badge topbar-badge">Modo Web • Supabase</span>
        </div>
        ${content}
      </main>
    </div>
  `;
}

export function renderSetupView() {
  return `
    <div class="login-shell">
      <section class="card login-card wide-card">
        <div class="login-header">
          <h1>Falta configurar o Supabase</h1>
          <p>Edite o arquivo <code>config.js</code> com a URL do projeto e a chave anon/publishable.</p>
        </div>

        <div class="notice">
          Este projeto foi preparado para o repositório <b>rodrigosinistro/custos-impressao-3d</b> e para a URL
          <b>https://rodrigosinistro.github.io/custos-impressao-3d/</b>.
        </div>

        <div class="summary-box">
          <div class="summary-line"><span>1.</span><b>Criar projeto no Supabase</b></div>
          <div class="summary-line"><span>2.</span><b>Executar supabase/schema.sql</b></div>
          <div class="summary-line"><span>3.</span><b>Criar o primeiro usuário em Auth</b></div>
          <div class="summary-line"><span>4.</span><b>Preencher config.js</b></div>
        </div>

        <div class="code-block">window.APP_CONFIG = {
  SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
  SUPABASE_ANON_KEY: 'SUA_CHAVE_ANON_OU_PUBLISHABLE',
  APP_NAME: 'Custos de Impressão 3D'
};</div>
      </section>
    </div>
  `;
}
