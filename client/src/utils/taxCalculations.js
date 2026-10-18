// Tax calculation helpers conforming strictly to BongPizza backend calculation rules

export const calculateOrderTotals = (items = [], discount = 0, settings = {}) => {
  // 1. Subtotal from items
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);

  // 2. Validate discount (cannot exceed subtotal)
  const safeDiscount = Math.min(Math.max(0, Number(discount) || 0), subtotal);

  // 3. Tax calculation based on settings
  let cgstAmount = 0;
  let sgstAmount = 0;
  let taxAmount = 0;

  const taxEnabled = Boolean(settings.taxEnabled);
  const pricesIncludeTax = Boolean(settings.pricesIncludeTax);
  const cgstRate = Number(settings.cgstRate) || 0;
  const sgstRate = Number(settings.sgstRate) || 0;

  const taxableBase = Math.max(0, subtotal - safeDiscount);

  if (taxEnabled && taxableBase > 0) {
    if (pricesIncludeTax) {
      // Back-calculate tax included in price
      const totalTaxRate = (cgstRate + sgstRate) / 100;
      if (totalTaxRate > 0) {
        const preTaxBase = taxableBase / (1 + totalTaxRate);
        const totalTax = taxableBase - preTaxBase;
        cgstAmount = Math.round((totalTax * (cgstRate / (cgstRate + sgstRate))) * 100) / 100;
        sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;
        taxAmount = Math.round(totalTax * 100) / 100;
      }
    } else {
      // Tax added on top of taxable base
      cgstAmount = Math.round(((taxableBase * cgstRate) / 100) * 100) / 100;
      sgstAmount = Math.round(((taxableBase * sgstRate) / 100) * 100) / 100;
      taxAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
    }
  }

  // 4. Net amount authoritative formula
  const netAmount = pricesIncludeTax 
    ? Math.max(0, taxableBase) 
    : Math.max(0, Math.round((taxableBase + taxAmount) * 100) / 100);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(safeDiscount * 100) / 100,
    taxableBase: Math.round(taxableBase * 100) / 100,
    cgstAmount,
    sgstAmount,
    taxAmount,
    netAmount,
    totalItems: items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
  };
};
