import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Package, Plus, Pencil, Trash2, ArrowLeft, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useListInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/quotation-store';

interface ItemForm {
  name: string;
  description: string;
  category: string;
  unit: string;
  unitPrice: string;
  isActive: boolean;
}

const blankForm = (): ItemForm => ({
  name: '',
  description: '',
  category: 'General',
  unit: 'unit',
  unitPrice: '0',
  isActive: true,
});

export default function Inventory() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ItemForm>(blankForm());

  const { data: items, isLoading, isError } = useListInventoryItems();

  const createMutation = useCreateInventoryItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['listInventoryItems'] });
        toast({ title: 'Item added', description: `${form.name} added to inventory.` });
        setDialogOpen(false);
      },
      onError: () => toast({ title: 'Failed', description: 'Could not save the item.', variant: 'destructive' }),
    },
  });

  const updateMutation = useUpdateInventoryItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['listInventoryItems'] });
        toast({ title: 'Item updated', description: `${form.name} has been updated.` });
        setDialogOpen(false);
      },
      onError: () => toast({ title: 'Failed', description: 'Could not update the item.', variant: 'destructive' }),
    },
  });

  const deleteMutation = useDeleteInventoryItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['listInventoryItems'] });
        toast({ title: 'Item deleted' });
      },
      onError: () => toast({ title: 'Failed', description: 'Could not delete the item.', variant: 'destructive' }),
    },
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
    setDialogOpen(true);
  };

  const openEdit = (item: NonNullable<typeof items>[0]) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? '',
      category: item.category ?? 'General',
      unit: item.unit ?? 'unit',
      unitPrice: String(item.unitPrice ?? 0),
      isActive: item.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim() || 'General',
      unit: form.unit.trim() || 'unit',
      unitPrice: parseFloat(form.unitPrice) || 0,
      isActive: form.isActive,
    };
    if (!payload.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Group items by category
  const grouped: Record<string, NonNullable<typeof items>> = {};
  (items ?? []).forEach((item) => {
    const cat = item.category ?? 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  const categories = Object.keys(grouped).sort();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
              <Package className="w-8 h-8 text-accent" />
              Product Inventory
            </h1>
            <p className="text-muted-foreground mt-1">Manage products and services with their prices.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Builder
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 text-center text-destructive">
              Failed to load inventory. Please try again.
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && (!items || items.length === 0) && (
          <Card className="shadow-sm border-border">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground text-lg">No inventory items yet.</p>
              <p className="text-muted-foreground/60 text-sm">Add products or services to quickly insert them into quotations.</p>
              <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                <Plus className="w-4 h-4 mr-2" /> Add First Item
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && categories.length > 0 && categories.map((cat) => (
          <Card key={cat} className="shadow-sm border-border">
            <CardHeader className="bg-muted/20 border-b border-border pb-3 pt-4 px-6">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary/70">{cat}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 divide-y divide-border">
              {grouped[cat].map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 px-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{item.name}</span>
                      {!item.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">MWK {formatCurrency(item.unitPrice ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">per {item.unit ?? 'unit'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove <strong>{item.name}</strong> from your inventory.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate({ id: item.id })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inv-name">Name *</Label>
              <Input
                id="inv-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. NPK Fertilizer (50kg)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-desc">Description</Label>
              <Textarea
                id="inv-desc"
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional details shown on quotation"
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-cat">Category</Label>
                <Input
                  id="inv-cat"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Fertilizers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-unit">Unit</Label>
                <Input
                  id="inv-unit"
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="e.g. bag, kg, litre"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-price">Unit Price (MWK) *</Label>
              <Input
                id="inv-price"
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
              <Label htmlFor="inv-active" className="cursor-pointer">Active (visible in picker)</Label>
              <Switch
                id="inv-active"
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
