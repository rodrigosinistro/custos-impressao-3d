import { authService } from '../../domain/services/authService.js';
import { clientsRepository } from '../../data/repositories/clientsRepository.js';
import { settingsRepository } from '../../data/repositories/settingsRepository.js';
import { qs } from '../../core/utils/dom.js';

export function renderAuthView({ publicSettings }) {
  const publicEnabled = Boolean(publicSettings?.allow_public_client_signup && publicSettings?.owner_id);

  return `
    <div class="login-shell with-two-cards">
      <section class="card login-card">
        <div class="login-header">
          <h1>Cadastro público</h1>
          <p>Seu cliente pode deixar os dados aqui e o cadastro vai direto para o banco.</p>
        </div>

        ${publicEnabled ? `
          <div class="notice">Cadastros públicos ativos para <b>${publicSettings.company_name || publicSettings.public_app_name || 'sua operação'}</b>.</div>
          <form id="publicClientForm">
            <input type="hidden" name="ownerId" value="${publicSettings.owner_id}" />
            <div class="field"><label>Nome</label><input name="name" required /></div>
            <div class="field"><label>E-mail</label><input name="email" type="email" /></div>
            <div class="field"><label>Telefone</label><input name="phone" /></div>
            <div class="field"><label>WhatsApp</label><input name="whatsapp" /></div>
            <div class="field"><label>Observações</label><textarea name="notes"></textarea></div>
            <div id="publicClientFeedback"></div>
            <div class="button-row"><button class="btn btn-primary" type="submit">Cadastrar</button></div>
          </form>
        ` : `
          <div class="alert">O cadastro público está desativado ou ainda não foi configurado no Supabase.</div>
        `}
      </section>

      <section class="card login-card">
        <div class="login-header">
          <h1>Entrar como administrador</h1>
          <p>Use seu e-mail e senha do Supabase Auth para acessar clientes, materiais, impressoras e orçamentos.</p>
        </div>

        <div class="notice">
          O frontend usa apenas a chave anon/publishable. A proteção real está no banco via RLS.
        </div>

        <form id="loginForm">
          <div class="field">
            <label for="email">E-mail</label>
            <input id="email" name="email" type="email" autocomplete="username" required />
          </div>
          <div class="field">
            <label for="password">Senha</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <div id="loginFeedback"></div>
          <div class="button-row">
            <button class="btn btn-primary" type="submit">Entrar</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

export function attachAuthEvents(refresh) {
  const loginForm = qs('#loginForm');
  const loginFeedback = qs('#loginFeedback');
  const publicForm = qs('#publicClientForm');
  const publicFeedback = qs('#publicClientFeedback');

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginFeedback.innerHTML = '';
    const formData = new FormData(loginForm);
    try {
      await authService.login(String(formData.get('email') || ''), String(formData.get('password') || ''));
      if (!authService.isAdmin()) {
        await authService.logout();
        throw new Error('Esse usuário existe, mas não está com role admin na tabela profiles.');
      }
      window.location.hash = '#/dashboard';
    } catch (error) {
      loginFeedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível entrar.'}</div>`;
    }
  });

  publicForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    publicFeedback.innerHTML = '';
    const formData = new FormData(publicForm);
    try {
      await clientsRepository.publicRegister({
        ownerId: String(formData.get('ownerId') || ''),
        name: String(formData.get('name') || ''),
        email: String(formData.get('email') || ''),
        phone: String(formData.get('phone') || ''),
        whatsapp: String(formData.get('whatsapp') || ''),
        notes: String(formData.get('notes') || ''),
      });
      publicFeedback.innerHTML = '<div class="notice success">Cadastrado com sucesso.</div>';
      publicForm.reset();
      const publicSettings = await settingsRepository.getPublicSite();
      qs('[name="ownerId"]', publicForm).value = publicSettings.owner_id || '';
    } catch (error) {
      publicFeedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível cadastrar.'}</div>`;
    }
  });
}
