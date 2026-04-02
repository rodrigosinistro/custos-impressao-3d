export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const source = String(value).trim();
  const hasComma = source.includes(',');
  const normalized = hasComma ? source.replace(/\./g, '').replace(',', '.') : source;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function toInt(value, fallback = 0) {
  return Math.round(toNumber(value, fallback));
}
