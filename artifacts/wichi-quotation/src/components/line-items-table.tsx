import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { LineItem, formatCurrency } from '@/lib/quotation-store';

interface LineItemsTableProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  readOnly?: boolean;
}

export function LineItemsTable({ items, onChange, readOnly = false }: LineItemsTableProps) {
  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    onChange(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    onChange([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      onChange(items.filter(item => item.id !== id));
    }
  };

  if (readOnly) {
    return (
      <div className="w-full">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-primary bg-primary/5 uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-tl-lg">Description</th>
              <th className="px-4 py-3 font-semibold text-center w-24">Qty</th>
              <th className="px-4 py-3 font-semibold text-right w-36">Unit Price (MWK)</th>
              <th className="px-4 py-3 font-semibold text-right w-40 rounded-tr-lg">Total (MWK)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{item.description || '-'}</td>
                <td className="px-4 py-3 text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium w-24 text-center">Qty</th>
              <th className="px-4 py-3 font-medium w-40 text-right">Unit Price</th>
              <th className="px-4 py-3 font-medium w-40 text-right">Total</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id} className="group hover:bg-muted/20 transition-colors">
                <td className="p-2">
                  <Input 
                    value={item.description} 
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                    className="border-transparent bg-transparent hover:border-input focus:bg-background"
                  />
                </td>
                <td className="p-2">
                  <Input 
                    type="number" 
                    min="1"
                    value={item.quantity} 
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="text-center border-transparent bg-transparent hover:border-input focus:bg-background"
                  />
                </td>
                <td className="p-2">
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={item.unitPrice} 
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="text-right border-transparent bg-transparent hover:border-input focus:bg-background"
                  />
                </td>
                <td className="p-2 text-right font-medium px-4">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
                <td className="p-2 text-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={addItem} className="text-primary hover:text-primary hover:bg-primary/5">
        <Plus className="w-4 h-4 mr-2" /> Add Item
      </Button>
    </div>
  );
}
