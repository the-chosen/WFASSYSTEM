import { QuotationData, formatCurrency } from '@/lib/quotation-store';

interface QuotationTotalsProps {
  data: QuotationData;
}

export function QuotationTotals({ data }: QuotationTotalsProps) {
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  let discountAmount = 0;
  if (data.discountValue > 0) {
    discountAmount = data.discountType === 'percentage'
      ? subtotal * (data.discountValue / 100)
      : data.discountValue;
  }

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = data.applyTax ? taxableAmount * 0.175 : 0;
  const grandTotal = taxableAmount + taxAmount;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-primary/20 text-sm">
      <div className="flex justify-between items-center px-5 py-2.5 bg-primary/5 border-b border-primary/10">
        <span className="text-muted-foreground font-medium">Subtotal</span>
        <span className="font-semibold">MWK {formatCurrency(subtotal)}</span>
      </div>

      {data.discountValue > 0 && (
        <div className="flex justify-between items-center px-5 py-2.5 bg-amber-50 border-b border-primary/10">
          <span className="text-amber-700 font-medium">
            Discount {data.discountType === 'percentage' && `(${data.discountValue}%)`}
          </span>
          <span className="text-amber-700 font-semibold">- MWK {formatCurrency(discountAmount)}</span>
        </div>
      )}

      {data.applyTax && (
        <div className="flex justify-between items-center px-5 py-2.5 bg-primary/5 border-b border-primary/10">
          <span className="text-muted-foreground font-medium">VAT (17.5%)</span>
          <span className="font-semibold">MWK {formatCurrency(taxAmount)}</span>
        </div>
      )}

      <div className="flex justify-between items-center px-5 py-3" style={{ background: 'hsl(var(--primary))' }}>
        <span className="font-bold text-white text-base uppercase tracking-wide whitespace-nowrap">Grand Total</span>
        <span className="font-bold text-white text-base whitespace-nowrap">MWK {formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}
