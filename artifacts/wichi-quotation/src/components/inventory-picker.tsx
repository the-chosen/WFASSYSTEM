import React, { useState } from 'react';
import { Package, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { useListInventoryItems } from '@workspace/api-client-react';
import { formatCurrency } from '@/lib/quotation-store';

interface InventoryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: { name: string; unitPrice: number; unit: string }) => void;
}

export function InventoryPicker({ open, onOpenChange, onSelect }: InventoryPickerProps) {
  const [search, setSearch] = useState('');
  const { data: items, isLoading } = useListInventoryItems();

  const activeItems = (items ?? []).filter(i => i.isActive !== false);

  const filtered = search.trim()
    ? activeItems.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (i.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : activeItems;

  // Group by category
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach(item => {
    const cat = item.category ?? 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  const categories = Object.keys(grouped).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Pick from Inventory
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {isLoading && (
            <p className="text-center text-muted-foreground py-8 text-sm">Loading inventory...</p>
          )}
          {!isLoading && activeItems.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No inventory items yet. Add some in the Inventory page.
            </p>
          )}
          {!isLoading && activeItems.length > 0 && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">No items match your search.</p>
          )}
          {categories.map(cat => (
            <div key={cat} className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/60 mb-2 px-1">{cat}</p>
              <div className="space-y-1">
                {grouped[cat].map(item => (
                  <button
                    key={item.id}
                    className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors group"
                    onClick={() => {
                      onSelect({ name: item.name, unitPrice: item.unitPrice ?? 0, unit: item.unit ?? 'unit' });
                      onOpenChange(false);
                      setSearch('');
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-primary text-sm">MWK {formatCurrency(item.unitPrice ?? 0)}</p>
                        <p className="text-xs text-muted-foreground">/{item.unit ?? 'unit'}</p>
                      </div>
                      <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border flex justify-between items-center">
          <p className="text-xs text-muted-foreground">{activeItems.length} active item{activeItems.length !== 1 ? 's' : ''}</p>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
