import React from 'react';
import { Sprout } from 'lucide-react';

export function QuotationHeader() {
  return (
    <div className="flex justify-between items-start mb-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-sm">
          <Sprout className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-serif text-primary tracking-tight">WICHI FARMS AND AGRO SOLUTIONS</h1>
          <p className="text-sm font-medium text-accent">Quality Agriculture, Quality Life</p>
        </div>
      </div>
      <div className="text-right text-sm text-foreground/80 space-y-1">
        <p className="font-medium text-foreground">Contact</p>
        <p>+265 987 785 947 / 0892 874 439</p>
        <p>sales@wichiholdings.com</p>
        <p>www.wichiholdings.com/farms</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] ml-auto">Kawale, next to Chipiku Stores, opp CTS Courier</p>
      </div>
    </div>
  );
}
