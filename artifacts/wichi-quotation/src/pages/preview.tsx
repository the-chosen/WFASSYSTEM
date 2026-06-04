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
      className="min-h-screen bg-gray-100 p-4 md:p-8"
    >
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center">
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

      <div
        ref={docRef}
        className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm]"
      >
        <div className="p-10 md:p-14">
          <QuotationHeader />

          <div className="w-full h-1.5 bg-gradient-to-r from-primary via-primary/80 to-accent mb-8 rounded-full"></div>

          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-4xl font-serif font-bold text-primary mb-2">QUOTATION</h2>
              <p className="text-muted-foreground font-medium">#{data.quotationNumber}</p>
            </div>
            <div className="text-right text-sm space-y-1">
              <div className="grid grid-cols-2 gap-x-4">
                <span className="text-muted-foreground font-medium">Date:</span>
                <span className="font-semibold text-foreground">{formatDate(data.date)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <span className="text-muted-foreground font-medium">Valid Until:</span>
                <span className="font-semibold text-foreground">{formatDate(data.validUntil)}</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/10 p-6 rounded-lg border border-border/50 mb-10 text-sm">
            <h3 className="font-bold text-primary mb-3 uppercase tracking-wider text-xs">Quotation For:</h3>
            <div className="space-y-1 text-foreground">
              {data.clientName && <p className="font-bold text-base">{data.clientName}</p>}
              {data.companyName && <p className="font-medium text-primary">{data.companyName}</p>}
              {data.address && <p>{data.address}</p>}
              <div className="flex flex-wrap gap-x-4 mt-2">
                {data.email && <p className="text-muted-foreground"><span className="text-foreground/60 mr-1">E:</span>{data.email}</p>}
                {data.phone && <p className="text-muted-foreground"><span className="text-foreground/60 mr-1">T:</span>{data.phone}</p>}
              </div>
            </div>
          </div>

          <div className="mb-10">
            <LineItemsTable items={data.items} onChange={() => {}} readOnly />
          </div>

          <div className="flex justify-end mb-12">
            <div className="w-full max-w-sm">
              <QuotationTotals data={data} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm text-muted-foreground border-t border-primary/20 pt-8">
            <div>
              <h4 className="font-bold mb-3 uppercase tracking-wider text-xs" style={{ color: 'hsl(var(--primary))' }}>Terms &amp; Conditions</h4>
              <p className="whitespace-pre-wrap leading-relaxed">{data.notes}</p>
            </div>
            <div>
              <h4 className="font-bold mb-3 uppercase tracking-wider text-xs" style={{ color: 'hsl(var(--primary))' }}>Authorized Signature</h4>
              <div className="mt-2 min-h-[72px] flex items-end">
                {data.signatureImage ? (
                  <img
                    src={data.signatureImage}
                    alt="Authorized Signature"
                    className="max-h-16 max-w-[200px] object-contain"
                  />
                ) : (
                  <div className="w-52 border-b-2 border-foreground/40"></div>
                )}
              </div>
              <div className="mt-3 border-t border-primary/20 pt-2 space-y-0.5">
                <p className="font-semibold text-foreground">{data.preparedBy}</p>
                <p className="text-xs text-muted-foreground">Authorized Signatory — Wichi Farms And Agro Solutions</p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center text-xs text-muted-foreground/60 font-medium">
            Thank you for choosing Wichi Farms And Agro Solutions.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
