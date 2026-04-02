import { routes } from './routes.js';
import { authService } from '../domain/services/authService.js';
import { escapeHtml } from '../core/utils/dom.js';

export function renderShell({ currentHash, title, subtitle, content, settings }) {
  const navLinks = routes
    .filter((route) => route.requiresAuth)
    .map(
      (route) => `
        <a class="nav-link ${currentHash === route.hash ? 'active' : ''}" href="${route.hash}">${escapeHtml(route.label)}</a>
      `,
    )
    .join('');

  return `
    <div class="page-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-logo">
            <img src="./assets/favicon.svg" alt="Logo" width="28" height="28" />
          </div>
          <div>
            <h1>${escapeHtml(settings?.public_app_name || 'Custos de Impressão 3D')}</h1>
            <p>GitHub Pages + Supabase</p>
          </div>
        </div>

        <div class="notice">
          Banco real no Supabase com autenticação, RLS e publicação estática no GitHub Pages.
        </div>

        <nav class="nav-list">
          ${navLinks}
        </nav>

        <div class="sidebar-footer">
          <div class="small-text">
            Logado como <b>${escapeHtml(authService.getState().user?.email || '---')}</b>
          </div>
          <button class="btn btn-danger" id="logoutButton">Sair</button>
        </div>
      </aside>

      <main class="content-area">
        <div class="topbar">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(subtitle)}</p>
          </div>
          <span class="badge">Modo Web • Supabase</span>
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
