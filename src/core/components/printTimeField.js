import { escapeHtml } from '../utils/dom.js';
import { parsePrintTimeMinutes, printTimeInputValues } from '../utils/printTime.js';

export function renderPrintTimeField({ id, minutes = 180, label = 'Tempo de impressão' }) {
  const initial = printTimeInputValues(minutes);
  return `
    <div class="field">
      <label for="${id}">${escapeHtml(label)}</label>
      <div class="print-time-controls">
        <input id="${id}" name="printTime" type="text" inputmode="decimal" value="${initial.value}" placeholder="Ex.: 2.2" aria-describedby="${id}Hint" required />
        <select name="printTimeUnit" aria-label="Unidade do tempo de impressão" aria-describedby="${id}Hint">
          <option value="h" ${initial.unit === 'h' ? 'selected' : ''}>h</option>
          <option value="min" ${initial.unit === 'min' ? 'selected' : ''}>min</option>
        </select>
      </div>
      <div class="small-text" id="${id}Hint">Ex.: 2.2 h ou 51 min. Aceita ponto ou vírgula.</div>
    </div>
  `;
}

export function setPrintTimeField(form, totalMinutes) {
  const { value, unit } = printTimeInputValues(totalMinutes);
  const input = form.elements.namedItem('printTime');
  input.value = value;
  input.setCustomValidity('');
  form.elements.namedItem('printTimeUnit').value = unit;
}

export function attachPrintTimeField(form, { minMinutes = 0 } = {}) {
  const input = form.elements.namedItem('printTime');
  const unit = form.elements.namedItem('printTimeUnit');
  const validate = () => {
    const minutes = parsePrintTimeMinutes(input.value, unit.value);
    input.setCustomValidity(Number.isFinite(minutes) && minutes >= minMinutes
      ? ''
      : `Informe um tempo válido em h ou min${minMinutes > 0 ? ', de pelo menos 1 minuto' : ', igual ou maior que zero'}.`);
  };
  input.addEventListener('input', validate);
  unit.addEventListener('change', validate);
  validate();
}
