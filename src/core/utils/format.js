export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatMinutes(totalMinutes) {
  const minutes = Number(totalMinutes || 0);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return `${hours}h`;
  return `${hours}h ${rest}min`;
}

export function formatPhone(value) {
  return String(value || '').trim() || '-';
}
