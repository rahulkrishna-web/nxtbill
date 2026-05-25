import { Invoice, ClientPreset, CompanyDetails, BankDetails } from './types';

export const DEFAULT_COMPANY: CompanyDetails = {
  name: "NXTNET",
  address: "2-A/3, Kundan Mansion,\nAsaf Ali Rd, New Delhi,\nDelhi 110002",
  gstin: "07BUPPK0544M1Z8",
  stateCode: "07",
  email: "hello@nxtnet.in",
  contact: "6205806621"
};

export const DEFAULT_BANK: BankDetails = {
  accountNumber: "42285266780",
  accountName: "NXTNET",
  ifscCode: "SBIN0000745",
  branch: "SBI, Asaf Ali Road, New Delhi"
};

export const DEFAULT_CLIENTS: ClientPreset[] = [
  {
    id: "c1",
    name: "HomeRun Retail Private Limited",
    address: "5, Sunningdale, No.22/8,\nDsouza Layout, Vittal Mallya Road,\nBengaluru – 560001, India",
    email: "hello@home-run.co",
    mobile: "9972966515",
    gstin: "29AAICH0538F1ZM"
  },
  {
    id: "c2",
    name: "Acme Corporation",
    address: "123 Tech Park, Phase 1,\nElectronic City, Bangalore - 560100",
    email: "billing@acme.com",
    mobile: "9876543210",
    gstin: "29ACMEB1234A1Z0"
  }
];

export const INITIAL_INVOICE: Invoice = {
  id: "inv-26",
  invoiceNumber: "26",
  date: "28/02/2026",
  status: "Paid",
  companyDetails: { ...DEFAULT_COMPANY },
  clientDetails: { ...DEFAULT_CLIENTS[0] },
  bankDetails: { ...DEFAULT_BANK },
  items: [
    {
      id: "item-1",
      sNo: 1,
      item: "Shopify Development Services",
      hsn: "998314",
      quantity: 1,
      rate: 23400,
      amount: 23400
    }
  ],
  taxType: "IGST",
  taxRate: 18,
  discountLabel: "-",
  discountAmount: 0,
  paymentTerms: [
    {
      id: "pt-1",
      title: "Website Development",
      terms: "50% - Advance.\n50% - Project Completion."
    },
    {
      id: "pt-2",
      title: "Website Management",
      terms: "100% Advance"
    }
  ],
  signerName: "Rahul Krishna",
  footerNote: "Thank you.",
  createdAt: "2026-02-28T10:00:00Z",
  updatedAt: "2026-02-28T10:00:00Z"
};
