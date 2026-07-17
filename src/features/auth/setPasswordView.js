import { authService } from '../../domain/services/authService.js';
import { qs, escapeHtml } from '../../core/utils/dom.js';

export function renderSetPasswordView() {
  return `
    <div class="login-shell">
      <section class="card login-card">
        <div class="login-header">
          <h1>Defina sua senha</h1>
          <p>Finalize seu convite para acessar o Orçamento Fácil.</p>
        </div>
        <form id="setPasswordForm">
          <div class="field">
            <label>Nova senha</label>
            <input name="password" type="password" minlength="8" autocomplete="new-password" required />
          </div>
          <div class="field">
            <label>Confirmar senha</label>
            <input name="passwordConfirmation" type="password" minlength="8" autocomplete="new-password" required />
          </div>
          <div class="small-text">Use pelo menos 8 caracteres.</div>
          <div id="setPasswordFeedback"></div>
          <button class="btn btn-primary" type="submit" id="setPasswordButton">Salvar senha e continuar</button>
        </form>
      </section>
    </div>
  `;
}

export function attachSetPasswordEvents() {
  const form = qs('#setPasswordForm');
  const feedback = qs('#setPasswordFeedback');
  const button = qs('#setPasswordButton');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const password = String(formData.get('password') || '');
    const confirmation = String(formData.get('passwordConfirmation') || '');

    if (password !== confirmation) {
      feedback.innerHTML = '<div class="alert">As senhas não são iguais.</div>';
      return;
    }

    button.disabled = true;
    button.textContent = 'SALVANDO...';
    feedback.innerHTML = '';

    try {
      await authService.updatePassword(password);
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      url.hash = authService.isAdmin() ? '#/dashboard' : '#/easy-quote';
      window.history.replaceState({}, document.title, url.href);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${escapeHtml(error.message || 'Não foi possível salvar a senha.')}</div>`;
      button.disabled = false;
      button.textContent = 'Salvar senha e continuar';
    }
  });
}
