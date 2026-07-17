import { usersRepository } from '../../data/repositories/usersRepository.js';
import { authService } from '../../domain/services/authService.js';
import { formatDateTime } from '../../core/utils/format.js';
import { qs, qsa, escapeHtml } from '../../core/utils/dom.js';

function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Orçamentista';
}

function renderUserActions(user, currentUserId) {
  if (user.id === currentUserId || user.role === 'admin') {
    return '<span class="small-text">Conta principal</span>';
  }

  const userId = escapeHtml(user.id);
  const email = escapeHtml(user.email || 'usuário');
  const name = escapeHtml(user.full_name || user.email || 'Orçamentista');

  return `
    <div class="button-row user-action-buttons">
      <button
        class="btn btn-secondary btn-compact"
        type="button"
        data-user-action="reset-password"
        data-user-id="${userId}"
        data-user-email="${email}"
        data-user-name="${name}"
        aria-label="Reenviar acesso para ${name}"
      >Reenviar acesso</button>
      <button
        class="btn btn-danger btn-compact"
        type="button"
        data-user-action="delete"
        data-user-id="${userId}"
        data-user-email="${email}"
        data-user-name="${name}"
        aria-label="Excluir ${name}"
      >Excluir</button>
    </div>
  `;
}

export async function renderUsersView() {
  const users = await usersRepository.getAll();
  const currentUserId = authService.getUserId();

  return `
    <div class="grid">
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
        <p class="small-text">Reenvie o acesso para o usuário definir uma nova senha ou remova o acesso de um orçamentista.</p>
        <div id="teamUsersFeedback"></div>
        ${users.length ? `
          <div class="table-wrap">
            <table class="users-table">
              <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Criado em</th><th>Ações</th></tr></thead>
              <tbody>
                ${users.map((user) => `
                  <tr>
                    <td><b>${escapeHtml(user.full_name || '-')}</b>${user.id === currentUserId ? '<div class="small-text">Você</div>' : ''}</td>
                    <td>${escapeHtml(user.email || '-')}</td>
                    <td><span class="badge ${user.role === 'admin' ? '' : 'badge-soft'}">${roleLabel(user.role)}</span></td>
                    <td>${formatDateTime(user.created_at)}</td>
                    <td>${renderUserActions(user, currentUserId)}</td>
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
  const teamFeedback = qs('#teamUsersFeedback');

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

  qsa('[data-user-action]').forEach((actionButton) => {
    actionButton.addEventListener('click', async () => {
      const action = actionButton.dataset.userAction;
      const userId = actionButton.dataset.userId || '';
      const email = actionButton.dataset.userEmail || 'este usuário';
      const name = actionButton.dataset.userName || email;
      const isDelete = action === 'delete';
      const confirmationMessage = isDelete
        ? `Excluir ${name} (${email})? O acesso será removido imediatamente. Os orçamentos e itens de produção da empresa serão preservados.`
        : `Enviar para ${email} um link para criar uma nova senha?`;

      if (!window.confirm(confirmationMessage)) return;

      const originalText = actionButton.textContent;
      actionButton.disabled = true;
      actionButton.textContent = isDelete ? 'EXCLUINDO...' : 'ENVIANDO...';
      teamFeedback.innerHTML = '';

      try {
        if (isDelete) {
          await usersRepository.remove(userId);
          alert(`O acesso de ${email} foi excluído.`);
          await refresh();
        } else {
          await usersRepository.sendPasswordReset(userId);
          teamFeedback.innerHTML = `<div class="notice success">Link para definir uma nova senha enviado para ${escapeHtml(email)}.</div>`;
        }
      } catch (error) {
        teamFeedback.innerHTML = `<div class="alert">${escapeHtml(error.message || 'Não foi possível concluir a ação.')}</div>`;
      } finally {
        actionButton.disabled = false;
        actionButton.textContent = originalText;
      }
    });
  });
}
