import { Phone, Mail, Globe, MapPin } from 'lucide-react';

export function QuotationHeader() {
  return (
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <img
          src="/wichi-logo.png"
          alt="Wichi Farms And Agro Solutions"
          className="h-20 w-auto object-contain"
        />
      </div>

      <div className="text-right text-sm space-y-0">
        <p className="font-bold text-primary uppercase tracking-widest text-xs mb-2 border-b border-primary/30 pb-1">
          Contact Details
        </p>
        <div className="space-y-1.5 text-foreground/80">
          <div className="flex items-center justify-end gap-2">
            <span className="font-medium">+265 987 785 947 / 0892 874 439</span>
            <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span>sales@wichiholdings.com</span>
            <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span>www.wichiholdings.com/farms</span>
            <Globe className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs max-w-[220px] text-right leading-snug">
              Kawale, next to Chipiku Stores, opp CTS Courier
            </span>
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
