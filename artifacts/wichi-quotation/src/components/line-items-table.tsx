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
      <div className="w-full rounded-lg overflow-hidden border border-primary/20">
        <table className="w-full text-sm text-left">
          <thead>
            <tr style={{ background: 'hsl(var(--primary))' }}>
              <th className="px-5 py-3 font-semibold text-white text-xs uppercase tracking-wider">Description</th>
              <th className="px-5 py-3 font-semibold text-white text-xs uppercase tracking-wider text-center w-20">Qty</th>
              <th className="px-5 py-3 font-semibold text-white text-xs uppercase tracking-wider text-right w-40">Unit Price (MWK)</th>
              <th className="px-5 py-3 font-semibold text-white text-xs uppercase tracking-wider text-right w-40">Total (MWK)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-primary/5'}
              >
                <td className="px-5 py-3 border-b border-primary/10 text-foreground">{item.description || '-'}</td>
                <td className="px-5 py-3 border-b border-primary/10 text-center text-foreground">{item.quantity}</td>
                <td className="px-5 py-3 border-b border-primary/10 text-right text-foreground">{formatCurrency(item.unitPrice)}</td>
                <td className="px-5 py-3 border-b border-primary/10 text-right font-semibold text-primary">{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden border border-primary/20">
        <table className="w-full text-sm text-left">
          <thead>
            <tr style={{ background: 'hsl(var(--primary))' }}>
              <th className="px-4 py-3 font-semibold text-white text-xs uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 font-semibold text-white text-xs uppercase tracking-wider w-24 text-center">Qty</th>
              <th className="px-4 py-3 font-semibold text-white text-xs uppercase tracking-wider w-40 text-right">Unit Price (MWK)</th>
              <th className="px-4 py-3 font-semibold text-white text-xs uppercase tracking-wider w-40 text-right">Total (MWK)</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                className={`group transition-colors ${index % 2 === 0 ? 'bg-white hover:bg-primary/5' : 'bg-primary/5 hover:bg-primary/10'}`}
              >
                <td className="p-2 border-b border-primary/10">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                    data-testid={`input-description-${item.id}`}
                    className="border-transparent bg-transparent hover:border-input focus:bg-background"
                  />
                </td>
                <td className="p-2 border-b border-primary/10">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    data-testid={`input-qty-${item.id}`}
                    className="text-center border-transparent bg-transparent hover:border-input focus:bg-background"
                  />
                </td>
                <td className="p-2 border-b border-primary/10">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    data-testid={`input-price-${item.id}`}
                    className="text-right border-transparent bg-transparent hover:border-input focus:bg-background"
                  />
                </td>
                <td className="p-2 border-b border-primary/10 text-right font-semibold text-primary px-4">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
                <td className="p-2 border-b border-primary/10 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    data-testid={`button-remove-${item.id}`}
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
      <Button
        variant="outline"
        size="sm"
        onClick={addItem}
        data-testid="button-add-item"
        className="text-primary hover:text-primary hover:bg-primary/5 border-primary/30"
      >
        <Plus className="w-4 h-4 mr-2" /> Add Item
      </Button>
    </div>
  );
}
