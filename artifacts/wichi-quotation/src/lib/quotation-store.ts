export type DocumentType = 'quotation' | 'invoice' | 'receipt' | 'delivery_note' | 'sale_order';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  quotation: 'Quotation',
  invoice: 'Invoice',
  receipt: 'Sale Receipt',
  delivery_note: 'Delivery Note',
  sale_order: 'Sale Order',
};

export const DOCUMENT_TYPE_PREFIX: Record<DocumentType, string> = {
  quotation: 'QT',
  invoice: 'INV',
  receipt: 'RCP',
  delivery_note: 'DN',
  sale_order: 'SO',
};

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotationData {
  documentType: DocumentType;
  quotationNumber: string;
  date: string;
  validUntil: string;
  clientName: string;
  companyName: string;
  address: string;
  email: string;
  phone: string;
  items: LineItem[];
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  applyTax: boolean;
  notes: string;
  preparedBy: string;
  signatureImage: string;
}

const STORAGE_KEY = 'wichi-quotation-data';

export const defaultQuotationData: QuotationData = {
  documentType: 'quotation',
  quotationNumber: 'QT-2024-001',
  date: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  clientName: '',
  companyName: '',
  address: '',
  email: '',
  phone: '',
  items: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
  discountType: 'fixed',
  discountValue: 0,
  applyTax: true,
  notes: 'Payment due within 30 days. All prices are in Malawian Kwacha (MWK).',
  preparedBy: 'Sales Team',
  signatureImage: ''
};

export function loadQuotationData(): QuotationData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...defaultQuotationData, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to load quotation data from local storage', error);
  }
  return defaultQuotationData;
}

export function saveQuotationData(data: QuotationData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save quotation data to local storage', error);
  }
}

export function generateNextDocNumber(type: DocumentType): string {
  const prefix = DOCUMENT_TYPE_PREFIX[type];
  const year = new Date().getFullYear();
  return `${prefix}-${year}-001`;
}

export function generateNextQuotationNumber() {
  const currentData = loadQuotationData();
  const currentNumber = currentData.quotationNumber;
  const year = new Date().getFullYear();

  if (currentNumber.includes(year.toString())) {
    const parts = currentNumber.split('-');
    const sequence = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(sequence)) {
      const prefix = DOCUMENT_TYPE_PREFIX[currentData.documentType] ?? 'QT';
      return `${prefix}-${year}-${(sequence + 1).toString().padStart(3, '0')}`;
    }
  }

  return `QT-${year}-001`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MW', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
