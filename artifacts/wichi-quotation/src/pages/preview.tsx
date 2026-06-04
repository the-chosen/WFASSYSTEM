import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotationHeader } from '@/components/quotation-header';
import { LineItemsTable } from '@/components/line-items-table';
import { QuotationTotals } from '@/components/quotation-totals';
import { loadQuotationData, QuotationData } from '@/lib/quotation-store';
import { format, parseISO } from 'date-fns';

export default function Preview() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<QuotationData | null>(null);
  const [exporting, setExporting] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setData(loadQuotationData());
  }, []);

  if (!data) return null;

  const handleSavePdf = async () => {
    if (!docRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const dataUrl = await toPng(docRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: { borderRadius: '0' },
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      img.src = dataUrl;
      await new Promise(res => { img.onload = res; });

      const ratio = pdfWidth / img.naturalWidth;
      const scaledHeight = img.naturalHeight * ratio;

      let position = 0;
      let heightLeft = scaledHeight;

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Quotation-${data.quotationNumber}.pdf`);
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
        <Button
          onClick={handleSavePdf}
          disabled={exporting}
          data-testid="button-save-pdf"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
        >
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          {exporting ? 'Generating PDF...' : 'Save as PDF'}
        </Button>
      </div>

      {/* A4 document — compact padding to fit on one page */}
      <div
        ref={docRef}
        className="max-w-[210mm] mx-auto bg-white shadow-xl"
      >
        <div className="px-10 pt-7 pb-6">

          {/* Header */}
          <QuotationHeader />

          {/* Divider */}
          <div className="w-full h-1 bg-gradient-to-r from-primary via-primary/80 to-accent mb-4 rounded-full"></div>

          {/* QUOTATION title + dates */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary leading-none mb-1">QUOTATION</h2>
              <p className="text-muted-foreground text-xs font-medium">#{data.quotationNumber}</p>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div className="flex justify-end gap-3">
                <span className="text-muted-foreground font-medium">Date:</span>
                <span className="font-semibold text-foreground">{formatDate(data.date)}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-muted-foreground font-medium">Valid Until:</span>
                <span className="font-semibold text-foreground">{formatDate(data.validUntil)}</span>
              </div>
            </div>
          </div>

          {/* Client block */}
          <div className="bg-muted/10 px-4 py-3 rounded border border-border/50 mb-4 text-xs">
            <h3 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Quotation For:</h3>
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

          {/* Totals — right-aligned */}
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

          {/* Footer note */}
          <div className="mt-4 text-center text-[10px] text-muted-foreground/70">
            <span className="font-bold italic">Thank you for choosing Wichi farms and agro solutions.</span>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
