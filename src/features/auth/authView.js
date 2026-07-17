import { authService } from '../../domain/services/authService.js';
import { qs, escapeHtml } from '../../core/utils/dom.js';

function loginErrorMessage(error) {
  const message = String(error?.message || '');
  if (/invalid login credentials/i.test(message)) {
    return 'Usuário ou senha inválidos.';
  }
  return message || 'Não foi possível entrar.';
}

export function renderAuthView() {
  return `
    <div class="login-shell">
      <section class="card login-card">
        <div class="login-header">
          <h1>Entrar</h1>
          <p>Informe seu usuário e senha para acessar o sistema.</p>
        </div>

        <form id="loginForm">
          <div class="field">
            <label for="email">Usuário</label>
            <input id="email" name="email" type="email" autocomplete="username" required />
          </div>
          <div class="field">
            <label for="password">Senha</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <div id="loginFeedback"></div>
          <div class="button-row">
            <button class="btn btn-primary" type="submit" id="loginButton">Entrar</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

export function attachAuthEvents() {
  const loginForm = qs('#loginForm');
  const loginFeedback = qs('#loginFeedback');
  const loginButton = qs('#loginButton');

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginFeedback.innerHTML = '';
    loginButton.disabled = true;
    loginButton.textContent = 'ENTRANDO...';
    const formData = new FormData(loginForm);

    try {
      await authService.login(String(formData.get('email') || ''), String(formData.get('password') || ''));

      if (!authService.isAdmin() && !authService.isStaff()) {
        await authService.logout();
        throw new Error('Este usuário não possui um perfil autorizado no sistema.');
      }

      window.location.hash = authService.isAdmin() ? '#/dashboard' : '#/easy-quote';
    } catch (error) {
      loginFeedback.innerHTML = `<div class="alert">${escapeHtml(loginErrorMessage(error))}</div>`;
      loginButton.disabled = false;
      loginButton.textContent = 'Entrar';
    }
  });
}
