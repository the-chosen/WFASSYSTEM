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
    <div className="w-full border border-primary/20 rounded-lg text-sm" style={{ overflow: 'visible' }}>
      <div className="flex justify-between items-center px-4 py-2 bg-primary/5 border-b border-primary/10 rounded-t-lg">
        <span className="text-muted-foreground font-medium whitespace-nowrap text-xs">Subtotal</span>
        <span className="font-semibold whitespace-nowrap ml-8 text-xs">MWK {formatCurrency(subtotal)}</span>
      </div>

      {data.discountValue > 0 && (
        <div className="flex justify-between items-center px-4 py-2 bg-amber-50 border-b border-primary/10">
          <span className="text-amber-700 font-medium whitespace-nowrap text-xs">
            Discount {data.discountType === 'percentage' && `(${data.discountValue}%)`}
          </span>
          <span className="text-amber-700 font-semibold whitespace-nowrap ml-8 text-xs">- MWK {formatCurrency(discountAmount)}</span>
        </div>
      )}

      {data.applyTax && (
        <div className="flex justify-between items-center px-4 py-2 bg-primary/5 border-b border-primary/10">
          <span className="text-muted-foreground font-medium whitespace-nowrap text-xs">VAT (17.5%)</span>
          <span className="font-semibold whitespace-nowrap ml-8 text-xs">MWK {formatCurrency(taxAmount)}</span>
        </div>
      )}

      <div
        className="flex justify-between items-center px-4 py-2.5 rounded-b-lg"
        style={{ background: 'hsl(var(--primary))' }}
      >
        <span className="font-bold text-white text-sm uppercase tracking-widest whitespace-nowrap">Grand Total</span>
        <span className="font-bold text-white text-sm whitespace-nowrap ml-8">MWK {formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}
