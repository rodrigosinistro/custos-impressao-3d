import { usersRepository } from '../../data/repositories/usersRepository.js';
import { authService } from '../../domain/services/authService.js';
import { formatDateTime } from '../../core/utils/format.js';
import { qs, escapeHtml } from '../../core/utils/dom.js';

function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Orçamentista';
}

export async function renderUsersView() {
  const users = await usersRepository.getAll();
  const currentUserId = authService.getUserId();

  return `
    <div class="two-column">
      <section class="card section-card">
        <h3>Convidar orçamentista</h3>
        <p class="small-text">O usuário receberá um e-mail para entrar no sistema e definir a própria senha.</p>
        <form id="inviteUserForm">
          <div class="form-grid">
            <div class="field"><label>Nome</label><input name="fullName" autocomplete="name" required /></div>
            <div class="field"><label>E-mail</label><input name="email" type="email" autocomplete="email" required /></div>
          </div>
          <div class="notice">
            O perfil Orçamentista acessa somente <b>Orçamento Fácil</b> e a visualização da fila de <b>Produção</b>.
          </div>
          <div id="inviteUserFeedback"></div>
          <div class="button-row">
            <button class="btn btn-primary" type="submit" id="inviteUserButton">Enviar convite</button>
          </div>
        </form>
      </section>

      <section class="card section-card">
        <h3>Usuários da equipe</h3>
        ${users.length ? `
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Criado em</th></tr></thead>
              <tbody>
                ${users.map((user) => `
                  <tr>
                    <td><b>${escapeHtml(user.full_name || '-')}</b>${user.id === currentUserId ? '<div class="small-text">Você</div>' : ''}</td>
                    <td>${escapeHtml(user.email || '-')}</td>
                    <td><span class="badge ${user.role === 'admin' ? '' : 'badge-soft'}">${roleLabel(user.role)}</span></td>
                    <td>${formatDateTime(user.created_at)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-state">Nenhum usuário encontrado.</div>'}
      </section>
    </div>
  `;
}

export function attachUsersEvents(refresh) {
  const form = qs('#inviteUserForm');
  const feedback = qs('#inviteUserFeedback');
  const button = qs('#inviteUserButton');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'ENVIANDO...';
    feedback.innerHTML = '';

    try {
      const user = await usersRepository.invite({
        email: formData.get('email'),
        fullName: formData.get('fullName'),
      });
      form.reset();
      alert(`Convite enviado para ${user.email || String(formData.get('email') || '')}.`);
      await refresh();
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${escapeHtml(error.message || 'Não foi possível enviar o convite.')}</div>`;
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}
