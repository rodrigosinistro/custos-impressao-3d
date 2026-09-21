// O banco e o cálculo continuam usando minutos inteiros.
const MAX_MINUTES = 2147483647;

export function parsePrintTimeMinutes(value, unit) {
  if (!['h', 'min'].includes(unit)) return NaN;
  const text = String(value ?? '').trim();
  if (!/^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text)) return NaN;
  const minutes = Number(text.replace(',', '.')) * (unit === 'h' ? 60 : 1);
  if (!Number.isFinite(minutes) || minutes > MAX_MINUTES) return NaN;
  return Math.round(minutes);
}

export function readPrintTimeMinutes(formData) {
  return parsePrintTimeMinutes(formData.get('printTime'), formData.get('printTimeUnit'));
}

export function printTimeInputValues(totalMinutes) {
  const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  // Só usa décimos de hora quando representam exatamente o tempo salvo.
  // Ex.: 132 min -> 2.2 h; 125 min permanece 125 min durante a edição.
  if (minutes >= 60 && minutes % 6 === 0) {
    return { value: String(minutes / 60), unit: 'h' };
  }
  return { value: String(minutes), unit: 'min' };
}
