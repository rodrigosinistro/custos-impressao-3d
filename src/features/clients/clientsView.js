import { clientsRepository } from '../../data/repositories/clientsRepository.js';
import { qs, on, escapeHtml } from '../../core/utils/dom.js';

export async function renderClientsView() {
  const clients = await clientsRepository.getAll();

  return `
    <div class="grid grid-2">
      <section class="card section-card">
        <h3>Novo cliente</h3>
        <form id="clientForm">
          <div class="form-grid">
            <div class="field"><label>Nome</label><input name="name" required /></div>
            <div class="field"><label>E-mail</label><input name="email" type="email" /></div>
            <div class="field"><label>Telefone</label><input name="phone" /></div>
            <div class="field"><label>WhatsApp</label><input name="whatsapp" /></div>
            <div class="field form-grid-full"><label>Observações</label><textarea name="notes"></textarea></div>
          </div>
          <div id="clientFeedback"></div>
          <div class="button-row"><button class="btn btn-primary" type="submit">Salvar cliente</button></div>
        </form>
      </section>

      <section class="card section-card">
        <h3>Clientes cadastrados</h3>
        ${clients.length ? `
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Origem</th><th>WhatsApp</th><th></th></tr></thead>
              <tbody>
                ${clients.map((client) => `
                  <tr>
                    <td>${escapeHtml(client.name)}</td>
                    <td><span class="badge badge-soft">${escapeHtml(client.source || 'admin')}</span></td>
                    <td>${escapeHtml(client.whatsapp || client.phone || '-')}</td>
                    <td><button class="btn btn-danger" data-remove-client="${client.id}">Excluir</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-state">Nenhum cliente cadastrado.</div>'}
      </section>
    </div>
  `;
}

export function attachClientsEvents(refresh) {
  const form = qs('#clientForm');
  const feedback = qs('#clientFeedback');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    try {
      await clientsRepository.save({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        whatsapp: formData.get('whatsapp'),
        notes: formData.get('notes'),
        source: 'admin',
      });
      feedback.innerHTML = '<div class="notice success">Cliente salvo com sucesso.</div>';
      form.reset();
      refresh();
    } catch (error) {
      feedback.innerHTML = `<div class="alert">${error.message || 'Não foi possível salvar o cliente.'}</div>`;
    }
  });

  on('[data-remove-client]', 'click', async (_, button) => {
    try {
      await clientsRepository.remove(button.dataset.removeClient);
      refresh();
    } catch (error) {
      alert(error.message || 'Não foi possível excluir o cliente.');
    }
  });
}
