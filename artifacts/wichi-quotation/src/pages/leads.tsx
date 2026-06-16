import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  ArrowLeft, Plus, Download, Edit2, Trash2, ChevronDown, ChevronUp,
  CalendarCheck, CheckCircle2, XCircle, Clock, Loader2, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useListLeads, useCreateLead, useUpdateLead, useDeleteLead,
  useListFollowUps, useCreateFollowUp, useUpdateFollowUp, useDeleteFollowUp,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { QuotationHeader } from '@/components/quotation-header';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost';
type FollowUpStatus = 'pending' | 'done' | 'cancelled';

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

const FU_COLORS: Record<FollowUpStatus, string> = {
  pending: 'bg-orange-100 text-orange-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const fmtDate = (d: string) => {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
};

const defaultLead = {
  clientName: '', companyName: '', email: '', phone: '',
  productInterest: '', status: 'new' as LeadStatus, notes: '',
};

const defaultFollowUp = { scheduledDate: '', notes: '', status: 'pending' as FollowUpStatus };

export default function Leads() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: leads = [], refetch: refetchLeads } = useListLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [leadDialog, setLeadDialog] = useState(false);
  const [editLead, setEditLead] = useState<(typeof defaultLead & { id?: number }) | null>(null);
  const [leadForm, setLeadForm] = useState(defaultLead);

  const [fuDialog, setFuDialog] = useState(false);
  const [editFu, setEditFu] = useState<(typeof defaultFollowUp & { id?: number }) | null>(null);
  const [fuForm, setFuForm] = useState(defaultFollowUp);
  const [fuLeadId, setFuLeadId] = useState<number | null>(null);

  const [exporting, setExporting] = useState(false);

  const { data: followUps = [], refetch: refetchFu } = useListFollowUps(expandedId ?? 0);

  const createFu = useCreateFollowUp();
  const updateFu = useUpdateFollowUp();
  const deleteFu = useDeleteFollowUp();

  function openNewLead() {
    setEditLead(null);
    setLeadForm(defaultLead);
    setLeadDialog(true);
  }

  function openEditLead(lead: typeof leads[0]) {
    setEditLead({ ...lead, status: lead.status as LeadStatus, companyName: lead.companyName ?? '', email: lead.email ?? '', phone: lead.phone ?? '', productInterest: lead.productInterest ?? '', notes: lead.notes ?? '' });
    setLeadForm({
      clientName: lead.clientName,
      companyName: lead.companyName ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      productInterest: lead.productInterest ?? '',
      status: (lead.status ?? 'new') as LeadStatus,
      notes: lead.notes ?? '',
    });
    setLeadDialog(true);
  }

  async function saveLead() {
    try {
      if (editLead?.id) {
        await updateLead.mutateAsync({ id: editLead.id, data: leadForm });
        toast({ title: 'Lead updated' });
      } else {
        await createLead.mutateAsync({ data: leadForm });
        toast({ title: 'Lead added' });
      }
      setLeadDialog(false);
      refetchLeads();
    } catch {
      toast({ title: 'Error saving lead', variant: 'destructive' });
    }
  }

  async function handleDeleteLead(id: number) {
    if (!confirm('Delete this lead and all follow-ups?')) return;
    await deleteLead.mutateAsync({ id });
    if (expandedId === id) setExpandedId(null);
    refetchLeads();
    toast({ title: 'Lead deleted' });
  }

  function openNewFu(leadId: number) {
    setFuLeadId(leadId);
    setEditFu(null);
    setFuForm({ ...defaultFollowUp, scheduledDate: new Date().toISOString().split('T')[0] });
    setFuDialog(true);
  }

  function openEditFu(fu: typeof followUps[0], leadId: number) {
    setFuLeadId(leadId);
    setEditFu({ ...fu, status: fu.status as FollowUpStatus, notes: fu.notes ?? '' });
    setFuForm({
      scheduledDate: fu.scheduledDate,
      notes: fu.notes ?? '',
      status: (fu.status ?? 'pending') as FollowUpStatus,
    });
    setFuDialog(true);
  }

  async function saveFu() {
    if (!fuLeadId) return;
    try {
      if (editFu?.id) {
        await updateFu.mutateAsync({ id: fuLeadId, fid: editFu.id, data: { ...fuForm, leadId: fuLeadId } });
        toast({ title: 'Follow-up updated' });
      } else {
        await createFu.mutateAsync({ id: fuLeadId, data: { ...fuForm, leadId: fuLeadId } });
        toast({ title: 'Follow-up scheduled' });
      }
      setFuDialog(false);
      refetchFu();
    } catch {
      toast({ title: 'Error saving follow-up', variant: 'destructive' });
    }
  }

  async function handleDeleteFu(fid: number, leadId: number) {
    await deleteFu.mutateAsync({ id: leadId, fid });
    refetchFu();
    toast({ title: 'Follow-up removed' });
  }

  async function downloadPdf() {
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      const el = document.getElementById('leads-pdf-doc');
      if (!el) throw new Error('No element');
      const A4_PX = 794;
      const h = el.scrollHeight;
      const dataUrl = await toPng(el, {
        quality: 1, pixelRatio: 2, backgroundColor: '#ffffff',
        width: A4_PX, height: h,
        style: { width: `${A4_PX}px`, maxWidth: 'none', boxShadow: 'none', borderRadius: '0' },
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>(res => { img.onload = () => res(); });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const mmPerPx = pdfW / img.naturalWidth;
      const imgH = img.naturalHeight * mmPerPx;
      let y = 0, p = 0;
      while (y < imgH) {
        if (p > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, -y, pdfW, imgH);
        y += pdfH; p++;
      }
      pdf.save(`Leads-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      alert('PDF generation failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
              <Users className="w-8 h-8 text-accent" /> Sales Leads
            </h1>
            <p className="text-muted-foreground mt-1">Manage prospects and schedule follow-ups.</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Builder
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              Export PDF
            </Button>
            <Button size="sm" onClick={openNewLead} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1" /> Add Lead
            </Button>
          </div>
        </div>

        {leads.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">No leads yet.</p>
              <p className="text-sm text-muted-foreground">Add your first prospect to start tracking.</p>
              <Button onClick={openNewLead} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-1.5" /> Add First Lead
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <Card key={lead.id} className="shadow-sm border-border overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{lead.clientName}</p>
                      {lead.companyName && <p className="text-sm text-muted-foreground truncate">{lead.companyName}</p>}
                    </div>
                    <Badge className={`shrink-0 text-xs ${STATUS_COLORS[lead.status as LeadStatus] ?? ''}`}>
                      {lead.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">{fmtDate(lead.createdAt)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEditLead(lead); }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); handleDeleteLead(lead.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {expandedId === lead.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {expandedId === lead.id && (
                  <div className="border-t border-border px-5 py-4 bg-muted/5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      {lead.email && <div><span className="text-muted-foreground">Email: </span>{lead.email}</div>}
                      {lead.phone && <div><span className="text-muted-foreground">Phone: </span>{lead.phone}</div>}
                      {lead.productInterest && <div><span className="text-muted-foreground">Interest: </span>{lead.productInterest}</div>}
                    </div>
                    {lead.notes && <p className="text-sm text-muted-foreground">{lead.notes}</p>}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <CalendarCheck className="w-4 h-4 text-primary" /> Follow-ups
                        </h4>
                        <Button size="sm" variant="outline" onClick={() => openNewFu(lead.id)}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Schedule
                        </Button>
                      </div>
                      {followUps.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-1">No follow-ups yet. Schedule one to stay on top of this lead.</p>
                      ) : (
                        <div className="space-y-2">
                          {followUps.map(fu => (
                            <div key={fu.id} className="flex items-start justify-between bg-background rounded-lg border border-border px-3 py-2.5">
                              <div className="flex items-start gap-2 min-w-0">
                                {fu.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> :
                                  fu.status === 'cancelled' ? <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> :
                                  <Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">{fmtDate(fu.scheduledDate)}</p>
                                  {fu.notes && <p className="text-xs text-muted-foreground mt-0.5">{fu.notes}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                <Badge className={`text-xs ${FU_COLORS[fu.status as FollowUpStatus] ?? ''}`}>{fu.status}</Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditFu(fu, lead.id)}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteFu(fu.id, lead.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Hidden PDF document */}
      <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
        <div id="leads-pdf-doc" style={{ width: '794px', fontFamily: 'serif' }} className="bg-white">
          <div className="px-10 pt-7 pb-6">
            <QuotationHeader />
            <div className="w-full h-1 bg-gradient-to-r from-primary via-primary/80 to-accent mb-4 rounded-full" />
            <h2 className="text-2xl font-bold text-primary mb-1">SALES LEADS REPORT</h2>
            <p className="text-xs text-muted-foreground mb-6">Generated: {new Date().toLocaleDateString('en-MW', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            {leads.map(lead => (
              <div key={lead.id} className="mb-6 border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/20 px-4 py-2.5 flex justify-between items-center border-b border-border">
                  <div>
                    <span className="font-bold text-sm">{lead.clientName}</span>
                    {lead.companyName && <span className="text-xs text-muted-foreground ml-2">— {lead.companyName}</span>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status as LeadStatus] ?? ''}`}>{lead.status}</span>
                </div>
                <div className="px-4 py-3 text-xs space-y-1">
                  {lead.email && <p><span className="text-muted-foreground">Email:</span> {lead.email}</p>}
                  {lead.phone && <p><span className="text-muted-foreground">Phone:</span> {lead.phone}</p>}
                  {lead.productInterest && <p><span className="text-muted-foreground">Interest:</span> {lead.productInterest}</p>}
                  {lead.notes && <p className="text-muted-foreground italic">{lead.notes}</p>}
                </div>
              </div>
            ))}
            <div className="mt-4 text-center text-[10px] text-muted-foreground/70">
              <span className="font-bold italic">Wichi Farms And Agro Solutions — Confidential</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lead dialog */}
      <Dialog open={leadDialog} onOpenChange={setLeadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editLead?.id ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Client Name *</Label>
              <Input value={leadForm.clientName} onChange={e => setLeadForm(f => ({ ...f, clientName: e.target.value }))} placeholder="John Banda" />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={leadForm.companyName} onChange={e => setLeadForm(f => ({ ...f, companyName: e.target.value }))} placeholder="ABC Farm" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={leadForm.status} onValueChange={v => setLeadForm(f => ({ ...f, status: v as LeadStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} placeholder="john@farm.mw" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))} placeholder="+265..." />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Product Interest</Label>
              <Input value={leadForm.productInterest} onChange={e => setLeadForm(f => ({ ...f, productInterest: e.target.value }))} placeholder="Fertilizer, Seeds..." />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={leadForm.notes} onChange={e => setLeadForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeadDialog(false)}>Cancel</Button>
            <Button onClick={saveLead} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editLead?.id ? 'Update' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-up dialog */}
      <Dialog open={fuDialog} onOpenChange={setFuDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editFu?.id ? 'Edit Follow-up' : 'Schedule Follow-up'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={fuForm.scheduledDate} onChange={e => setFuForm(f => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={fuForm.status} onValueChange={v => setFuForm(f => ({ ...f, status: v as FollowUpStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={fuForm.notes} onChange={e => setFuForm(f => ({ ...f, notes: e.target.value }))} placeholder="What to discuss, action items..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFuDialog(false)}>Cancel</Button>
            <Button onClick={saveFu} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editFu?.id ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
