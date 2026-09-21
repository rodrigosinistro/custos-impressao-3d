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
  const numeric = Number(totalMinutes || 0);
  const minutes = Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : 0;
  if (minutes < 60) return `${minutes} min`;
  // Mesmo padrão compacto dos perfis de impressão: 2.2 h ou 51 min.
  // O arredondamento é apenas visual; os cálculos usam os minutos originais.
  return `${Number((minutes / 60).toFixed(1))} h`;
}

export function formatPhone(value) {
  return String(value || '').trim() || '-';
}
