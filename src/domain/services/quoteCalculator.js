export function calculateQuote(input) {
  const weightG = Number(input.weightG || 0);
  const printTimeMinutes = Number(input.printTimeMinutes || 0);
  const powerWatts = Number(input.powerWatts || 0);
  const costPerG = Number(input.costPerG || 0);
  const purchaseCost = Number(input.purchaseCost || 0);
  const usefulLifeHours = Number(input.usefulLifeHours || 1);
  const maintenanceMonthly = Number(input.monthlyMaintenanceCost || 0);
  const energyCostKwh = Number(input.energyCostKwh || 0);
  const failureRate = Number(input.failureRate || 0);
  const laborCost = Number(input.laborCost || 0);
  const finishingCost = Number(input.finishingCost || 0);
  const packagingCost = Number(input.packagingCost || 0);
  const shippingCost = Number(input.shippingCost || 0);
  const profitMargin = Number(input.profitMargin || 0);
  const taxRate = Number(input.taxRate || 0);
  const cardFeeRate = Number(input.cardFeeRate || 0);

  const printHours = printTimeMinutes / 60;
  const costMaterial = weightG * costPerG;
  const costEnergy = (powerWatts / 1000) * printHours * energyCostKwh;
  const hourlyDepreciation = purchaseCost / Math.max(usefulLifeHours, 1);
  const maintenancePerHour = maintenanceMonthly / 160;
  const costDepreciation = hourlyDepreciation * printHours;
  const costMaintenance = maintenancePerHour * printHours;

  const baseCost =
    costMaterial +
    costEnergy +
    costDepreciation +
    costMaintenance +
    laborCost +
    finishingCost +
    packagingCost +
    shippingCost;

  const costWithFailure = baseCost * (1 + failureRate / 100);
  const priceWithProfit = costWithFailure * (1 + profitMargin / 100);
  const priceWithTax = priceWithProfit * (1 + taxRate / 100);
  const finalPrice = priceWithTax * (1 + cardFeeRate / 100);
  const expectedProfit = finalPrice - costWithFailure;

  return {
    costMaterial,
    costEnergy,
    costDepreciation,
    costMaintenance,
    baseCost,
    costWithFailure,
    priceWithProfit,
    priceWithTax,
    finalPrice,
    expectedProfit,
  };
}

export function buildQuoteShareText(quote) {
  return [
    `Orçamento: ${quote.pieceName}`,
    `Cliente: ${quote.clientName || 'Não informado'}`,
    `Material: ${quote.materialName || '-'}`,
    `Impressora: ${quote.printerName || '-'}`,
    `Peso: ${quote.weightG} g`,
    `Tempo: ${quote.printTimeMinutes} min`,
    `Preço final: ${quote.finalPriceFormatted}`,
    quote.notes ? `Observações: ${quote.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
