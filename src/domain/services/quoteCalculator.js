function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function roundUpToNinetyNine(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;

  // Trabalha em centavos para evitar imprecisões de ponto flutuante.
  const valueInCents = Math.ceil((numeric * 100) - 0.000001);
  const wholeReais = Math.floor(valueInCents / 100);
  let suggestedInCents = (wholeReais * 100) + 99;

  if (suggestedInCents < valueInCents) {
    suggestedInCents += 100;
  }

  return roundMoney(suggestedInCents / 100);
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
    packagingCost +
    shippingCost;

  const costWithFailure = baseCost * (1 + failureRate / 100);
  const priceWithProfit = costWithFailure * (1 + profitMargin / 100);
  const priceWithTax = priceWithProfit * (1 + taxRate / 100);
  const priceBeforeLaborAndFinishing = priceWithTax * (1 + cardFeeRate / 100);

  // Mão de obra e pintura são calculadas automaticamente como 10%
  // do valor calculado, antes da sugestão de preço terminada em X,99.
  const laborAndFinishingCost = priceBeforeLaborAndFinishing * 0.10;
  const calculatedFinalPrice = priceBeforeLaborAndFinishing + laborAndFinishingCost;
  const suggestedPrice = roundUpToNinetyNine(calculatedFinalPrice);
  const adjustedPrice = manualAdjustedPrice !== null ? manualAdjustedPrice : suggestedPrice;
  const finalPrice = Math.max(0, adjustedPrice - discountAmount);
  const expectedProfit = finalPrice - costWithFailure - laborAndFinishingCost;

  // Mantém compatibilidade com as colunas existentes do banco, dividindo
  // igualmente os 10% entre mão de obra e acabamento/pintura.
  const laborCost = laborAndFinishingCost / 2;
  const finishingCost = laborAndFinishingCost - laborCost;

  return {
    costMaterial: roundMoney(costMaterial),
    costEnergy: roundMoney(costEnergy),
    costDepreciation: roundMoney(costDepreciation),
    costMaintenance: roundMoney(costMaintenance),
    laborCost: roundMoney(laborCost),
    finishingCost: roundMoney(finishingCost),
    laborAndFinishingCost: roundMoney(laborAndFinishingCost),
    baseCost: roundMoney(baseCost),
    costWithFailure: roundMoney(costWithFailure),
    priceWithProfit: roundMoney(priceWithProfit),
    priceWithTax: roundMoney(priceWithTax),
    priceBeforeLaborAndFinishing: roundMoney(priceBeforeLaborAndFinishing),
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
  const pieceName = quote.pieceName || 'sua peça';
  const storeUrl = quote.storeUrl || 'https://loja.infinitepay.io/perfeitos_presentes';
  const instagramHandle = quote.instagramHandle || '@perfeitos.presentes';

  const lines = [
    `Olá! Obrigado por escolher a Perfeitos Presentes. 💝 `,
    '',
    `Segue abaixo o valor do seu orçamento para "${pieceName}" `,
    '',
    `Valor: ${quote.finalPriceFormatted} `,
    '',
    'Conheça mais do nosso trabalho no nosso Instagram: ',
    `Instagram: ${instagramHandle} (https://www.instagram.com/perfeitos.presentes?igsh=cjlicW11cmM5eTNh)`,
    '',
    'Se quiser confirmar o pedido ou tirar qualquer dúvida, é só me chamar.',
  ];

  if (quote.projectImageUrl) {
    lines.push(
      '',
      'Essa imagem é somente de referência, poderá haver diferenças em cores e tamanho, dependendo da escolha do cliente.',
      quote.projectImageUrl,
    );
  }

  return lines.join('\n');
}
