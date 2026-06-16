import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useSearch } from 'wouter';
import { ArrowLeft, Download, Loader2, Clock, XCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotationHeader } from '@/components/quotation-header';
import { LineItemsTable } from '@/components/line-items-table';
import { QuotationTotals } from '@/components/quotation-totals';
import { loadQuotationData, QuotationData, DOCUMENT_TYPE_LABELS } from '@/lib/quotation-store';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/auth';
import { useGetQuotation } from '@workspace/api-client-react';

const DOC_CLIENT_LABEL: Record<string, string> = {
  quotation: 'Quotation For',
  invoice: 'Invoice To',
  receipt: 'Received From',
  delivery_note: 'Deliver To',
  sale_order: 'Order By',
};

const DOC_DATE2_LABEL: Record<string, string> = {
  quotation: 'Valid Until',
  invoice: 'Due Date',
  receipt: 'Receipt Date',
  delivery_note: 'Delivery Date',
  sale_order: 'Order Valid Until',
};

export default function Preview() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const [data, setData] = useState<QuotationData | null>(null);
  const [exporting, setExporting] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();

  const params = new URLSearchParams(searchStr);
  const savedId = params.get('id') ? Number(params.get('id')) : null;

  const { data: remoteQ } = useGetQuotation(savedId ?? 0, { query: { enabled: savedId !== null, queryKey: ['getQuotation', savedId] } });
  const docStatus: string = (remoteQ as any)?.status ?? 'draft';
  const rejectionReason: string = (remoteQ as any)?.rejectionReason ?? '';

  useEffect(() => {
    setData(loadQuotationData());
  }, []);

  if (!data) return null;

  const docType = data.documentType ?? 'quotation';
  const docLabel = DOCUMENT_TYPE_LABELS[docType] ?? 'Quotation';
  const clientLabel = DOC_CLIENT_LABEL[docType] ?? 'For';
  const date2Label = DOC_DATE2_LABEL[docType] ?? 'Valid Until';

  // PDF download is allowed only for approved docs or admins (or no saved id = local draft)
  const canDownload = isAdmin || !savedId || docStatus === 'approved';

  const handleSavePdf = async () => {
    if (!docRef.current || !canDownload) return;
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const A4_PX = 794;
      const contentHeight = docRef.current.scrollHeight;

      const dataUrl = await toPng(docRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: A4_PX,
        height: contentHeight,
        style: {
          width: `${A4_PX}px`,
          maxWidth: 'none',
          boxShadow: 'none',
          borderRadius: '0',
        },
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>(res => { img.onload = () => res(); });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const mmPerPx = pdfW / img.naturalWidth;
      const imgHeightMm = img.naturalHeight * mmPerPx;

      let yOffset = 0;
      let pageIndex = 0;
      while (yOffset < imgHeightMm) {
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, -(yOffset), pdfW, imgHeightMm);
        yOffset += pdfH;
        pageIndex++;
      }

      pdf.save(`${docLabel}-${data.quotationNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-100 p-4 md:p-6"
    >
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => setLocation('/')} className="text-foreground hover:bg-black/5">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit
        </Button>
        <div className="flex items-center gap-3">
          {savedId && docStatus === 'pending' && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>Awaiting admin approval before PDF download</span>
            </div>
          )}
          {savedId && docStatus === 'rejected' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-1.5 rounded-lg">
              <XCircle className="w-4 h-4" />
              <span>{rejectionReason ? `Rejected: ${rejectionReason}` : 'Document rejected'}</span>
            </div>
          )}
          {canDownload ? (
            <Button
              onClick={handleSavePdf}
              disabled={exporting}
              data-testid="button-save-pdf"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            >
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {exporting ? 'Generating PDF...' : `Save as PDF`}
            </Button>
          ) : (
            <Button disabled className="bg-muted text-muted-foreground cursor-not-allowed">
              <Lock className="w-4 h-4 mr-2" /> PDF Locked
            </Button>
          )}
        </div>
      </div>

      {/* A4 document */}
      <div
        ref={docRef}
        style={{ width: '794px' }}
        className="mx-auto bg-white shadow-xl"
      >
        <div className="px-10 pt-7 pb-6">

          <QuotationHeader />

          <div className="w-full h-1 bg-gradient-to-r from-primary via-primary/80 to-accent mb-4 rounded-full"></div>

          {/* Document type title + dates */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary leading-none mb-1">{docLabel.toUpperCase()}</h2>
              <p className="text-muted-foreground text-xs font-medium">#{data.quotationNumber}</p>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div className="flex justify-end gap-3">
                <span className="text-muted-foreground font-medium">Date:</span>
                <span className="font-semibold text-foreground">{formatDate(data.date)}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-muted-foreground font-medium">{date2Label}:</span>
                <span className="font-semibold text-foreground">{formatDate(data.validUntil)}</span>
              </div>
            </div>
          </div>

          {/* Client block */}
          <div className="bg-muted/10 px-4 py-3 rounded border border-border/50 mb-4 text-xs">
            <h3 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">{clientLabel}:</h3>
            <div className="space-y-0.5 text-foreground">
              {data.clientName && <p className="font-bold text-sm">{data.clientName}</p>}
              {data.companyName && <p className="font-medium text-primary">{data.companyName}</p>}
              {data.address && <p>{data.address}</p>}
              <div className="flex flex-wrap gap-x-4 mt-1">
                {data.email && <p className="text-muted-foreground"><span className="text-foreground/60 mr-1">E:</span>{data.email}</p>}
                {data.phone && <p className="text-muted-foreground"><span className="text-foreground/60 mr-1">T:</span>{data.phone}</p>}
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="mb-4">
            <LineItemsTable items={data.items} onChange={() => {}} readOnly />
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-5">
            <div className="w-full max-w-xs">
              <QuotationTotals data={data} />
            </div>
          </div>

          {/* Footer: Terms + Signature */}
          <div className="grid grid-cols-2 gap-6 text-xs text-muted-foreground border-t border-primary/20 pt-4">
            <div>
              <h4 className="font-bold mb-1.5 uppercase tracking-wider text-[10px]" style={{ color: 'hsl(var(--primary))' }}>Terms &amp; Conditions</h4>
              <p className="whitespace-pre-wrap leading-relaxed">{data.notes}</p>
            </div>
            <div>
              <h4 className="font-bold mb-1.5 uppercase tracking-wider text-[10px]" style={{ color: 'hsl(var(--primary))' }}>Authorized Signature</h4>
              <div className="mt-1.5 min-h-[36px] flex items-end">
                {data.signatureImage ? (
                  <img src={data.signatureImage} alt="Authorized Signature" className="max-h-10 max-w-[160px] object-contain" />
                ) : (
                  <div className="w-44 border-b-2 border-foreground/40"></div>
                )}
              </div>
              <div className="mt-1 border-t border-primary/20 pt-1 space-y-0.5">
                <p className="font-semibold text-foreground text-xs">{data.preparedBy}</p>
                <p className="text-[10px] text-muted-foreground">Authorized Signatory — Wichi Farms And Agro Solutions</p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] text-muted-foreground/70">
            <span className="font-bold italic">Thank you for choosing Wichi farms and agro solutions.</span>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
