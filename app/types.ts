export interface InvoiceItem {
  id: string;
  sNo: number;
  item: string;
  hsn: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface PaymentTermColumn {
  id: string;
  title: string;
  terms: string;
}

export interface ClientPreset {
  id: string;
  name: string;
  address: string;
  email: string;
  mobile: string;
  gstin: string;
}

export interface BankDetails {
  accountNumber: string;
  accountName: string;
  ifscCode: string;
  branch: string;
}

export interface CompanyDetails {
  name: string;
  address: string;
  gstin: string;
  stateCode: string;
  email: string;
  contact: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  
  companyDetails: CompanyDetails;
  clientDetails: ClientPreset;
  bankDetails: BankDetails;
  
  items: InvoiceItem[];
  
  taxType: 'IGST' | 'CGST_SGST' | 'NONE';
  taxRate: number; // e.g., 18 for 18%
  discountLabel: string; // e.g., "Discount" or "-"
  discountAmount: number;
  
  paymentTerms: PaymentTermColumn[];
  signerName: string;
  footerNote: string;
  
  createdAt: string;
  updatedAt: string;
}
