function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function roundDownToNineNinetyNine(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  if (numeric < 9.99) return roundMoney(numeric);
  return roundMoney(Math.floor((numeric - 9.99) / 10) * 10 + 9.99);
}

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
  const discountAmount = Math.max(0, Number(input.discountAmount || 0));

  const hasManualAdjustedPrice = !(
    input.manualAdjustedPrice === null ||
    input.manualAdjustedPrice === undefined ||
    String(input.manualAdjustedPrice).trim() === ''
  );
  const manualAdjustedPrice = hasManualAdjustedPrice
    ? Math.max(0, Number(input.manualAdjustedPrice || 0))
    : null;

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
  const calculatedFinalPrice = priceWithTax * (1 + cardFeeRate / 100);
  const suggestedPrice = roundDownToNineNinetyNine(calculatedFinalPrice);
  const adjustedPrice = manualAdjustedPrice !== null ? manualAdjustedPrice : suggestedPrice;
  const finalPrice = Math.max(0, adjustedPrice - discountAmount);
  const expectedProfit = finalPrice - costWithFailure;

  return {
    costMaterial: roundMoney(costMaterial),
    costEnergy: roundMoney(costEnergy),
    costDepreciation: roundMoney(costDepreciation),
    costMaintenance: roundMoney(costMaintenance),
    baseCost: roundMoney(baseCost),
    costWithFailure: roundMoney(costWithFailure),
    priceWithProfit: roundMoney(priceWithProfit),
    priceWithTax: roundMoney(priceWithTax),
    calculatedFinalPrice: roundMoney(calculatedFinalPrice),
    suggestedPrice: roundMoney(suggestedPrice),
    manualAdjustedPrice: manualAdjustedPrice !== null ? roundMoney(manualAdjustedPrice) : null,
    adjustedPrice: roundMoney(adjustedPrice),
    discountAmount: roundMoney(discountAmount),
    finalPrice: roundMoney(finalPrice),
    expectedProfit: roundMoney(expectedProfit),
  };
}

export function buildQuoteShareText(quote) {
  const brandName = quote.brandName || 'Perfeitos Presentes';
  const pieceLabel = quote.pieceName ? ` para "${quote.pieceName}"` : '';

  return [
    `Olá! Obrigado por escolher a ${brandName}. 💝`,
    '',
    `Segue abaixo o valor do seu orçamento${pieceLabel}:`,
    '',
    `Valor final ao cliente: ${quote.finalPriceFormatted}`,
    '',
    'Se quiser confirmar o pedido ou tirar qualquer dúvida, é só me chamar.',
  ].join('\n');
}
