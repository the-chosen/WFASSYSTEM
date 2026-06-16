import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useSearch } from 'wouter';
import { FileText, Save, FileCheck, Copy, Upload, History, Plus, Loader2, CheckCircle2, Package, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LineItemsTable } from '@/components/line-items-table';
import { QuotationTotals } from '@/components/quotation-totals';
import { loadQuotationData, saveQuotationData, defaultQuotationData, QuotationData, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_PREFIX, DocumentType } from '@/lib/quotation-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateQuotation, useUpdateQuotation, useGetQuotation } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { InventoryPicker } from '@/components/inventory-picker';

function generateNextNumber(current: string, docType: DocumentType = 'quotation'): string {
  const year = new Date().getFullYear();
  const prefix = DOCUMENT_TYPE_PREFIX[docType];
  if (current.includes(year.toString())) {
    const parts = current.split('-');
    const seq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(seq)) return `${prefix}-${year}-${(seq + 1).toString().padStart(3, '0')}`;
  }
  return `${prefix}-${year}-001`;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = new URLSearchParams(searchStr);
  const loadId = params.get('load') ? Number(params.get('load')) : null;

  const [data, setData] = useState<QuotationData | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: remoteQuotation, isLoading: loadingRemote } = useGetQuotation(
    loadId ?? 0,
  );

  useEffect(() => {
    if (remoteQuotation && loadId) {
      const q = remoteQuotation;
      const mapped: QuotationData = {
        documentType: (q.documentType as DocumentType) ?? 'quotation',
        quotationNumber: q.quotationNumber,
        date: q.date,
        validUntil: q.validUntil,
        clientName: q.clientName,
        companyName: q.companyName ?? '',
        address: q.address ?? '',
        email: q.email ?? '',
        phone: q.phone ?? '',
        items: (q.items ?? []) as QuotationData['items'],
        discountType: (q.discountType ?? 'fixed') as 'fixed' | 'percentage',
        discountValue: typeof q.discountValue === 'number' ? q.discountValue : 0,
        applyTax: q.applyTax ?? true,
        notes: q.notes ?? '',
        preparedBy: q.preparedBy ?? '',
        signatureImage: q.signatureImage ?? '',
      };
      setData(mapped);
      setSavedId(loadId);
      saveQuotationData(mapped);
    }
  }, [remoteQuotation, loadId]);

  useEffect(() => {
    if (!loadId) {
      setData(loadQuotationData());
    }
  }, [loadId]);

  useEffect(() => {
    if (!data || loadId) return;
    const timer = setTimeout(() => saveQuotationData(data), 500);
    return () => clearTimeout(timer);
  }, [data, loadId]);

  const createMutation = useCreateQuotation({
    mutation: {
      onSuccess: (result) => {
        setSavedId(result.id);
        setSaveStatus('saved');
        queryClient.invalidateQueries({ queryKey: ['listQuotations'] });
        toast({ title: 'Quotation saved', description: `Saved as ${result.quotationNumber}` });
        setTimeout(() => setSaveStatus('idle'), 3000);
      },
      onError: () => {
        setSaveStatus('idle');
        toast({ title: 'Save failed', description: 'Could not save to database.', variant: 'destructive' });
      },
    },
  });

  const updateMutation = useUpdateQuotation({
    mutation: {
      onSuccess: (result) => {
        setSaveStatus('saved');
        queryClient.invalidateQueries({ queryKey: ['listQuotations'] });
        toast({ title: 'Quotation updated', description: `Updated ${result.quotationNumber}` });
        setTimeout(() => setSaveStatus('idle'), 3000);
      },
      onError: () => {
        setSaveStatus('idle');
        toast({ title: 'Update failed', description: 'Could not update the quotation.', variant: 'destructive' });
      },
    },
  });

  if (!data || (loadId && loadingRemote)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleChange = (field: keyof QuotationData, value: any) => {
    setData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSaveToDb = () => {
    if (!data) return;
    setSaveStatus('saving');
    const payload = {
      quotationNumber: data.quotationNumber,
      date: data.date,
      validUntil: data.validUntil,
      clientName: data.clientName,
      companyName: data.companyName,
      address: data.address,
      email: data.email,
      phone: data.phone,
      items: data.items,
      discountType: data.discountType,
      discountValue: data.discountValue,
      applyTax: data.applyTax,
      notes: data.notes,
      preparedBy: data.preparedBy,
      signatureImage: data.signatureImage,
    };
    if (savedId) {
      updateMutation.mutate({ id: savedId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const handleNew = () => {
    const newData = {
      ...defaultQuotationData,
      quotationNumber: generateNextNumber(data.quotationNumber),
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setData(newData);
    setSavedId(null);
    setSaveStatus('idle');
    saveQuotationData(newData);
    setLocation('/');
  };

  const handleInventorySelect = (item: { name: string; unitPrice: number; unit: string }) => {
    if (!data) return;
    const newItem = {
      id: crypto.randomUUID(),
      description: item.name,
      quantity: 1,
      unitPrice: item.unitPrice,
    };
    handleChange('items', [...data.items, newItem]);
  };

  const isSaving = saveStatus === 'saving';

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
              <FileText className="w-8 h-8 text-accent" />
              WICHI System
            </h1>
            <p className="text-muted-foreground mt-1">Wichi Farms And Agro Solutions — Document Management</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={handleNew}>
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation('/history')}>
              <History className="w-4 h-4 mr-1" /> History
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation('/inventory')}>
              <Package className="w-4 h-4 mr-1" /> Inventory
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation('/leads')}>
              <Users className="w-4 h-4 mr-1" /> Leads
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToDb}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {savedId ? 'Update' : 'Save'}
            </Button>
            <Button onClick={() => setLocation('/preview')} className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
              <FileCheck className="w-4 h-4 mr-1" /> Preview & Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm border-border">
            <CardHeader className="bg-muted/20 border-b border-border pb-4">
              <CardTitle className="text-lg">Client Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" value={data.clientName} onChange={e => handleChange('clientName', e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" value={data.companyName} onChange={e => handleChange('companyName', e.target.value)} placeholder="Acme Logistics" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={data.email} onChange={e => handleChange('email', e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={data.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+265..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={data.address} onChange={e => handleChange('address', e.target.value)} placeholder="123 Business Park, Lilongwe" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardHeader className="bg-muted/20 border-b border-border pb-4">
              <CardTitle className="text-lg">Document Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={data.documentType ?? 'quotation'}
                  onValueChange={val => {
                    const t = val as DocumentType;
                    const prefix = DOCUMENT_TYPE_PREFIX[t];
                    const year = new Date().getFullYear();
                    const newNum = `${prefix}-${year}-001`;
                    handleChange('documentType', t);
                    handleChange('quotationNumber', newNum);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quotationNumber">Document Number</Label>
                <div className="flex gap-2">
                  <Input id="quotationNumber" value={data.quotationNumber} onChange={e => handleChange('quotationNumber', e.target.value)} />
                  <Button variant="outline" size="icon" onClick={() => handleChange('quotationNumber', generateNextNumber(data.quotationNumber, data.documentType ?? 'quotation'))} title="Auto-increment">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={data.date} onChange={e => handleChange('date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input id="validUntil" type="date" value={data.validUntil} onChange={e => handleChange('validUntil', e.target.value)} />
              </div>
              {savedId && (
                <p className="text-xs text-muted-foreground pt-1">
                  DB ID: #{savedId} — click Update to sync changes.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-3 shadow-sm border-border">
            <CardHeader className="bg-muted/20 border-b border-border pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Line Items</CardTitle>
                <CardDescription>All prices in Malawian Kwacha (MWK)</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="shrink-0">
                <Package className="w-4 h-4 mr-1.5" /> Pick from Inventory
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <LineItemsTable items={data.items} onChange={items => handleChange('items', items)} />

              <div className="mt-8 flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="w-full md:w-1/2 space-y-6">
                  <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-border">
                    <Label className="text-base font-semibold">Settings</Label>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="applyTax" className="flex-1 cursor-pointer">Apply 17.5% VAT</Label>
                      <Switch id="applyTax" checked={data.applyTax} onCheckedChange={checked => handleChange('applyTax', checked)} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <Select value={data.discountType} onValueChange={val => handleChange('discountType', val as any)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Value</Label>
                        <Input type="number" min="0" value={data.discountValue} onChange={e => handleChange('discountValue', parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto min-w-[300px]">
                  <QuotationTotals data={data} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 shadow-sm border-border">
            <CardHeader className="bg-muted/20 border-b border-border pb-4">
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="notes">Notes & Terms</Label>
                <Textarea id="notes" rows={4} value={data.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Terms and conditions..." className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preparedBy">Prepared By</Label>
                <Input id="preparedBy" value={data.preparedBy} onChange={e => handleChange('preparedBy', e.target.value)} placeholder="Sales Representative Name" />
              </div>
              <div className="space-y-2">
                <Label>Authorized Signature</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${data.signatureImage ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-primary/5'}`}
                  onClick={() => document.getElementById('sig-upload')?.click()}
                >
                  {data.signatureImage ? (
                    <div className="space-y-2">
                      <img src={data.signatureImage} alt="Signature" className="max-h-16 mx-auto object-contain" />
                      <p className="text-xs text-muted-foreground">Click to replace</p>
                    </div>
                  ) : (
                    <div className="py-2 space-y-1">
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload signature image</p>
                      <p className="text-xs text-muted-foreground/60">PNG, JPG supported</p>
                    </div>
                  )}
                </div>
                <input
                  id="sig-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => handleChange('signatureImage', ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                {data.signatureImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive w-full"
                    onClick={() => handleChange('signatureImage', '')}
                  >
                    Remove Signature
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
      <InventoryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleInventorySelect}
      />
    </>
  );
}
