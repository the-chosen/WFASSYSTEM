import React from 'react';
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
  const taxAmount = data.applyTax ? taxableAmount * 0.165 : 0;
  const grandTotal = taxableAmount + taxAmount;

  return (
    <div className="w-64 ml-auto space-y-2 text-sm">
      <div className="flex justify-between py-1">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>
      
      {data.discountValue > 0 && (
        <div className="flex justify-between py-1 text-accent">
          <span>Discount {data.discountType === 'percentage' && `(${data.discountValue}%)`}</span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
      )}
      
      {data.applyTax && (
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">VAT (16.5%)</span>
          <span className="font-medium">{formatCurrency(taxAmount)}</span>
        </div>
      )}
      
      <div className="flex justify-between py-2 border-t border-border mt-2 font-bold text-base text-primary">
        <span>Grand Total</span>
        <span>MWK {formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}
