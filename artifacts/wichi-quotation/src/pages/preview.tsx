import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotationHeader } from '@/components/quotation-header';
import { LineItemsTable } from '@/components/line-items-table';
import { QuotationTotals } from '@/components/quotation-totals';
import { loadQuotationData, QuotationData, formatCurrency } from '@/lib/quotation-store';
import { format, parseISO } from 'date-fns';

export default function Preview() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<QuotationData | null>(null);

  useEffect(() => {
    setData(loadQuotationData());
  }, []);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
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
      className="min-h-screen bg-gray-100 p-4 md:p-8 no-print"
    >
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
        <Button variant="ghost" onClick={() => setLocation('/')} className="text-foreground hover:bg-black/5">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit
        </Button>
        <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
          <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
        </Button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] print-document overflow-hidden">
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
            <div className="w-1/2 min-w-[300px]">
              <div className="bg-muted/10 p-4 rounded-lg border border-border/50">
                <QuotationTotals data={data} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm text-muted-foreground border-t border-border pt-8">
            <div>
              <h4 className="font-bold text-foreground mb-2">Terms & Conditions</h4>
              <p className="whitespace-pre-wrap">{data.notes}</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-2">Prepared By</h4>
              <p>{data.preparedBy}</p>
              <div className="mt-6 border-b border-border w-48"></div>
              <p className="text-xs mt-1 text-muted-foreground/60">Authorized Signature</p>
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
