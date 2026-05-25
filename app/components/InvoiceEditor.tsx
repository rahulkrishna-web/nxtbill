"use client";

import React, { useRef, useState } from "react";
import { Invoice, InvoiceItem, PaymentTermColumn } from "../types";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { Plus, Trash2, ArrowUp, ArrowDown, Printer, Download, Save, RefreshCw } from "lucide-react";

interface InvoiceEditorProps {
  invoice: Invoice;
  onChangeInvoice: (updatedInvoice: Invoice) => void;
  onSaveInvoice: () => void;
  onResetInvoice: () => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  onChangeInvoice,
  onSaveInvoice,
  onResetInvoice,
}) => {
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleCompanyChange = (field: keyof Invoice["companyDetails"], value: string) => {
    onChangeInvoice({
      ...invoice,
      companyDetails: {
        ...invoice.companyDetails,
        [field]: value,
      },
    });
  };

  const handleClientChange = (field: keyof Invoice["clientDetails"], value: string) => {
    onChangeInvoice({
      ...invoice,
      clientDetails: {
        ...invoice.clientDetails,
        [field]: value,
      },
    });
  };

  const handleBankChange = (field: keyof Invoice["bankDetails"], value: string) => {
    onChangeInvoice({
      ...invoice,
      bankDetails: {
        ...invoice.bankDetails,
        [field]: value,
      },
    });
  };

  const handleInvoiceMetaChange = (field: "invoiceNumber" | "date" | "signerName" | "footerNote", value: string) => {
    onChangeInvoice({
      ...invoice,
      [field]: value,
    });
  };

  // Item management
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoice.items];
    const updatedItem = { ...updatedItems[index], [field]: value };
    
    // Automatically calculate amount
    if (field === "quantity" || field === "rate") {
      const q = field === "quantity" ? Number(value) : updatedItem.quantity;
      const r = field === "rate" ? Number(value) : updatedItem.rate;
      updatedItem.amount = q * r;
    }
    
    updatedItems[index] = updatedItem;
    onChangeInvoice({
      ...invoice,
      items: updatedItems,
    });
  };

  const addItemRow = () => {
    const newSNo = invoice.items.length + 1;
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      sNo: newSNo,
      item: "New Item/Service Description",
      hsn: "998314",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    onChangeInvoice({
      ...invoice,
      items: [...invoice.items, newItem],
    });
  };

  const removeItemRow = (index: number) => {
    const filtered = invoice.items.filter((_, i) => i !== index);
    // Recalculate S. No.
    const reordered = filtered.map((item, i) => ({
      ...item,
      sNo: i + 1,
    }));
    onChangeInvoice({
      ...invoice,
      items: reordered,
    });
  };

  const moveItemRow = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === invoice.items.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updatedItems = [...invoice.items];
    
    // Swap
    const temp = updatedItems[index];
    updatedItems[index] = updatedItems[newIndex];
    updatedItems[newIndex] = temp;

    // Recalculate serial numbers
    const reordered = updatedItems.map((item, i) => ({
      ...item,
      sNo: i + 1,
    }));

    onChangeInvoice({
      ...invoice,
      items: reordered,
    });
  };

  // Payment terms column management
  const handlePaymentTermChange = (index: number, field: keyof PaymentTermColumn, value: string) => {
    const updatedTerms = [...invoice.paymentTerms];
    updatedTerms[index] = {
      ...updatedTerms[index],
      [field]: value,
    };
    onChangeInvoice({
      ...invoice,
      paymentTerms: updatedTerms,
    });
  };

  const addPaymentTermColumn = () => {
    const newCol: PaymentTermColumn = {
      id: `pt-${Date.now()}`,
      title: "New Term Column",
      terms: "100% Advance"
    };
    onChangeInvoice({
      ...invoice,
      paymentTerms: [...invoice.paymentTerms, newCol],
    });
  };

  const removePaymentTermColumn = (index: number) => {
    onChangeInvoice({
      ...invoice,
      paymentTerms: invoice.paymentTerms.filter((_, i) => i !== index),
    });
  };

  // Calculation details
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  
  let taxAmount = 0;
  if (invoice.taxType === "IGST" || invoice.taxType === "CGST_SGST") {
    taxAmount = subtotal * (invoice.taxRate / 100);
  }
  const total = Math.round(subtotal + taxAmount - invoice.discountAmount);

  // Spacer rows count to match design in screenshot if item count is small
  const minRows = 2;
  const spacerRowsCount = Math.max(0, minRows - invoice.items.length);

  // Dynamic html2pdf loader and trigger
  const handleDirectDownload = async () => {
    setDownloading(true);
    try {
      const loadHtml2Pdf = () => {
        return new Promise((resolve, reject) => {
          if ((window as any).html2pdf) {
            resolve((window as any).html2pdf);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = () => resolve((window as any).html2pdf);
          script.onerror = reject;
          document.body.appendChild(script);
        });
      };

      const html2pdf = await loadHtml2Pdf() as any;
      const element = document.getElementById("invoice-page");
      if (!element) return;

      const opt = {
        margin: [0, 0, 0, 0],
        filename: `Invoice-${invoice.companyDetails.name}-${invoice.invoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Direct PDF generation failed. Try using the 'Print Invoice' option to Save as PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-y-auto h-full p-6 relative">
      {/* Editor Control Panel (Hides in print) */}
      <div className="no-print w-[794px] mx-auto mb-6 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Editing Invoice</span>
            <span className="text-sm font-semibold text-zinc-800 dark:text-white font-mono">#{invoice.invoiceNumber || "Draft"}</span>
          </div>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Status:</span>
            <select
              value={invoice.status}
              onChange={(e) => onChangeInvoice({ ...invoice, status: e.target.value as any })}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetInvoice}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg cursor-pointer transition-all"
            title="Reset Invoice"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={onSaveInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>

          <button
            onClick={handleDirectDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-300 text-black font-semibold rounded-lg text-xs shadow transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Generating..." : "Download PDF"}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg text-xs shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* A4 Canvas Area */}
      <div className="flex-1 flex justify-center items-start pb-12">
        <div
          id="invoice-page"
          ref={invoiceRef}
          className="w-[794px] min-h-[1123px] bg-white text-black p-[50px] shadow-2xl relative border border-zinc-200 flex flex-col justify-between"
          style={{ fontFamily: "'Courier New', Courier, monospace" }}
        >
          <div>
            {/* Top Header Grid */}
            <div className="flex justify-between items-start">
              {/* Left Column: Sender details */}
              <div className="flex-1 max-w-[400px]">
                <input
                  type="text"
                  value={invoice.companyDetails.name}
                  onChange={(e) => handleCompanyChange("name", e.target.value)}
                  className="invoice-input text-2xl font-bold tracking-tight text-black mb-1 p-0 focus:px-1"
                  style={{ fontFamily: "Arial, sans-serif" }}
                  placeholder="COMPANY NAME"
                />
                
                <AutoResizeTextarea
                  value={invoice.companyDetails.address}
                  onChange={(e) => handleCompanyChange("address", e.target.value)}
                  className="invoice-textarea text-xs leading-5 text-zinc-700 w-full mb-3"
                  placeholder="Company Address"
                />

                <div className="text-xs space-y-1 text-zinc-800">
                  <div className="flex items-center">
                    <span className="font-semibold w-16">GSTIN :</span>
                    <input
                      type="text"
                      value={invoice.companyDetails.gstin}
                      onChange={(e) => handleCompanyChange("gstin", e.target.value)}
                      className="invoice-input text-xs p-0 focus:px-1 uppercase w-48"
                      placeholder="GSTIN"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-16">State Code:</span>
                    <input
                      type="text"
                      value={invoice.companyDetails.stateCode}
                      onChange={(e) => handleCompanyChange("stateCode", e.target.value)}
                      className="invoice-input text-xs p-0 focus:px-1 w-20"
                      placeholder="State Code"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-16">Email:</span>
                    <input
                      type="text"
                      value={invoice.companyDetails.email}
                      onChange={(e) => handleCompanyChange("email", e.target.value)}
                      className="invoice-input text-xs p-0 focus:px-1 w-64"
                      placeholder="Email"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-16">Contact:</span>
                    <input
                      type="text"
                      value={invoice.companyDetails.contact}
                      onChange={(e) => handleCompanyChange("contact", e.target.value)}
                      className="invoice-input text-xs p-0 focus:px-1 w-48"
                      placeholder="Contact Number"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Invoice title and metadata */}
              <div className="flex flex-col items-end w-[280px] text-right">
                <h2 
                  className="text-4xl font-bold text-black mb-6 tracking-wide"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Invoice
                </h2>

                <div className="grid grid-cols-2 gap-y-1.5 text-xs text-zinc-900 w-full mt-4">
                  <div className="text-left font-semibold">INVOICE #</div>
                  <div className="text-right">
                    <input
                      type="text"
                      value={invoice.invoiceNumber}
                      onChange={(e) => handleInvoiceMetaChange("invoiceNumber", e.target.value)}
                      className="invoice-input text-right text-xs p-0 focus:px-1 font-bold"
                      placeholder="Number"
                    />
                  </div>

                  <div className="text-left font-semibold">DATE</div>
                  <div className="text-right">
                    <input
                      type="text"
                      value={invoice.date}
                      onChange={(e) => handleInvoiceMetaChange("date", e.target.value)}
                      className="invoice-input text-right text-xs p-0 focus:px-1 font-bold"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal Separator Line */}
            <div className="border-t-2 border-black my-4 w-full" />

            {/* Client Info (TO) */}
            <div className="mt-4 mb-6 text-xs text-zinc-900 max-w-[500px]">
              <div className="font-bold text-black mb-1">TO</div>
              <input
                type="text"
                value={invoice.clientDetails.name}
                onChange={(e) => handleClientChange("name", e.target.value)}
                className="invoice-input font-bold text-black text-xs mb-1 p-0 focus:px-1"
                placeholder="Client Company Name"
              />
              
              <AutoResizeTextarea
                value={invoice.clientDetails.address}
                onChange={(e) => handleClientChange("address", e.target.value)}
                className="invoice-textarea text-xs leading-5 text-zinc-700 w-full mb-2"
                placeholder="Client Address"
              />

              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="font-semibold w-16">Email:</span>
                  <input
                    type="text"
                    value={invoice.clientDetails.email}
                    onChange={(e) => handleClientChange("email", e.target.value)}
                    className="invoice-input text-xs p-0 focus:px-1 w-64"
                    placeholder="Client Email"
                  />
                </div>
                <div className="flex items-center">
                  <span className="font-semibold w-16">Mobile:</span>
                  <input
                    type="text"
                    value={invoice.clientDetails.mobile}
                    onChange={(e) => handleClientChange("mobile", e.target.value)}
                    className="invoice-input text-xs p-0 focus:px-1 w-48"
                    placeholder="Client Mobile"
                  />
                </div>
                <div className="flex items-center">
                  <span className="font-semibold w-16">GSTIN:</span>
                  <input
                    type="text"
                    value={invoice.clientDetails.gstin}
                    onChange={(e) => handleClientChange("gstin", e.target.value)}
                    className="invoice-input text-xs p-0 focus:px-1 uppercase w-48 font-bold"
                    placeholder="Client GSTIN"
                  />
                </div>
              </div>
            </div>

            {/* Item Table Controls (Hides in print) */}
            <div className="no-print flex justify-end gap-2 mb-2">
              <button
                onClick={addItemRow}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Row
              </button>
            </div>

            {/* Item Details Table */}
            <div className="border border-black overflow-hidden mb-6">
              <table className="w-full text-xs text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-black font-semibold text-black">
                    <th className="w-12 border-r border-black p-2 text-center">S. No.</th>
                    <th className="w-auto border-r border-black p-2">Item</th>
                    <th className="w-20 border-r border-black p-2 text-center">HSN</th>
                    <th className="w-16 border-r border-black p-2 text-center">Quantity</th>
                    <th className="w-24 border-r border-black p-2 text-right">Rate(₹)</th>
                    <th className="w-28 p-2 text-right">Amount(₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className="align-top group relative">
                      {/* Serial Number & Row Operations */}
                      <td className="border-r border-black p-2 text-center align-middle font-mono font-bold relative">
                        {item.sNo}
                        {/* Hover item controls */}
                        <div className="no-print absolute left-0 top-0 h-full flex flex-col justify-center items-start pl-1 opacity-0 group-hover:opacity-100 transition-all bg-white/95">
                          <button
                            onClick={() => removeItemRow(index)}
                            disabled={invoice.items.length <= 1}
                            className="p-0.5 rounded text-rose-500 hover:bg-rose-50 disabled:text-zinc-300 disabled:hover:bg-transparent cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="flex gap-0.5 mt-0.5">
                            <button
                              onClick={() => moveItemRow(index, "up")}
                              disabled={index === 0}
                              className="p-0.5 rounded text-zinc-500 hover:bg-zinc-100 disabled:text-zinc-200 disabled:hover:bg-transparent cursor-pointer"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={() => moveItemRow(index, "down")}
                              disabled={index === invoice.items.length - 1}
                              className="p-0.5 rounded text-zinc-500 hover:bg-zinc-100 disabled:text-zinc-200 disabled:hover:bg-transparent cursor-pointer"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="border-r border-black p-1 text-left">
                        <AutoResizeTextarea
                          value={item.item}
                          onChange={(e) => handleItemChange(index, "item", e.target.value)}
                          className="invoice-textarea text-xs w-full min-h-[28px] focus:bg-white resize-none py-1 px-1.5"
                          placeholder="Description of services or products"
                        />
                      </td>

                      {/* HSN */}
                      <td className="border-r border-black p-1 text-center align-middle">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(index, "hsn", e.target.value)}
                          className="invoice-input text-xs text-center p-0.5 font-mono focus:bg-white"
                          placeholder="HSN"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="border-r border-black p-1 text-center align-middle">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="invoice-input text-xs text-center p-0.5 font-mono focus:bg-white"
                          placeholder="Qty"
                        />
                      </td>

                      {/* Rate */}
                      <td className="border-r border-black p-1 text-right align-middle">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                          className="invoice-input text-xs text-right p-0.5 font-mono focus:bg-white"
                          placeholder="Rate"
                        />
                      </td>

                      {/* Calculated Amount */}
                      <td className="p-2 text-right align-middle font-mono font-bold">
                        {item.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}

                  {/* Spacer Rows to keep layout standard */}
                  {Array.from({ length: spacerRowsCount }).map((_, idx) => (
                    <tr key={`spacer-${idx}`} className="h-10">
                      <td className="border-r border-black p-2"></td>
                      <td className="border-r border-black p-2"></td>
                      <td className="border-r border-black p-2"></td>
                      <td className="border-r border-black p-2"></td>
                      <td className="border-r border-black p-2"></td>
                      <td className="p-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Account Details & Totals Grid */}
            <div className="flex justify-between items-start mt-6">
              {/* Account Details */}
              <div className="flex-1 max-w-[400px] text-xs text-zinc-900">
                <div className="font-bold text-black mb-1.5">Account Details</div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <span className="font-semibold w-24">Ac. No:</span>
                    <input
                      type="text"
                      value={invoice.bankDetails.accountNumber}
                      onChange={(e) => handleBankChange("accountNumber", e.target.value)}
                      className="invoice-input text-xs p-0 focus:px-1 font-bold w-48 font-mono"
                      placeholder="Account Number"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-24">Ac. Name:</span>
                    <input
                      type="text"
                      value={invoice.bankDetails.accountName}
                      onChange={(e) => handleBankChange("accountName", e.target.value)}
                      className="invoice-input text-xs p-0 focus:px-1 font-bold w-48"
                      placeholder="Account Name"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-24">IFSC Code:</span>
                    <input
                      type="text"
                      value={invoice.bankDetails.ifscCode}
                      onChange={(e) => handleBankChange("ifscCode", e.target.value)}
                      className="invoice-input text-xs p-0 focus:px-1 font-bold uppercase w-48 font-mono"
                      placeholder="IFSC Code"
                    />
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-24 pt-0.5">Branch:</span>
                    <textarea
                      value={invoice.bankDetails.branch}
                      onChange={(e) => handleBankChange("branch", e.target.value)}
                      className="invoice-textarea text-xs p-0 focus:px-1 w-64 leading-relaxed"
                      placeholder="Branch Details"
                      rows={1}
                    />
                  </div>
                </div>
              </div>

              {/* Totals Table */}
              <div className="w-[320px] border border-black text-xs text-zinc-900 font-mono">
                {/* Subtotal */}
                <div className="flex border-b border-black">
                  <div className="w-[180px] border-r border-black p-2 font-semibold">Subtotal (₹)</div>
                  <div className="flex-1 p-2 text-right font-bold">{subtotal.toLocaleString("en-IN")}</div>
                </div>

                {/* Tax (IGST or CGST/SGST or Custom) */}
                <div className="flex border-b border-black">
                  <div className="w-[180px] border-r border-black p-1.5 flex items-center gap-1">
                    {/* Tax Type selector inside label cell in edit mode */}
                    <select
                      value={invoice.taxType}
                      onChange={(e) => onChangeInvoice({ ...invoice, taxType: e.target.value as any })}
                      className="no-print bg-zinc-100 border border-zinc-300 rounded px-1 text-[10px] font-semibold text-black"
                    >
                      <option value="IGST">IGST</option>
                      <option value="CGST_SGST">CGST + SGST</option>
                      <option value="NONE">None</option>
                    </select>
                    
                    {invoice.taxType !== "NONE" && (
                      <div className="flex items-center text-[10px] font-semibold">
                        @
                        <input
                          type="number"
                          value={invoice.taxRate}
                          onChange={(e) => onChangeInvoice({ ...invoice, taxRate: Number(e.target.value) })}
                          className="no-print w-8 text-center bg-zinc-100 border border-zinc-300 rounded mx-0.5 py-0.5"
                        />
                        %
                      </div>
                    )}
                    
                    {/* Print-only Tax Label */}
                    <span className="hidden print:inline font-semibold">
                      {invoice.taxType === "IGST" && `IGST @${invoice.taxRate}%`}
                      {invoice.taxType === "CGST_SGST" && `CGST @${invoice.taxRate / 2}% + SGST @${invoice.taxRate / 2}%`}
                      {invoice.taxType === "NONE" && "Tax"}
                    </span>
                  </div>

                  <div className="flex-1 p-2 text-right font-bold">
                    {invoice.taxType === "NONE" ? "0" : Math.round(taxAmount).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Discount / Adjustments */}
                <div className="flex border-b border-black">
                  <div className="w-[180px] border-r border-black p-1.5 flex items-center gap-1">
                    <input
                      type="text"
                      value={invoice.discountLabel}
                      onChange={(e) => onChangeInvoice({ ...invoice, discountLabel: e.target.value })}
                      className="invoice-input text-xs font-semibold p-0.5 text-black"
                      placeholder="Adjustment/Discount"
                    />
                  </div>
                  <div className="flex-1 p-1 text-right flex items-center justify-end">
                    <input
                      type="number"
                      value={invoice.discountAmount}
                      onChange={(e) => onChangeInvoice({ ...invoice, discountAmount: Number(e.target.value) })}
                      className="invoice-input text-right text-xs p-0.5 font-bold focus:bg-white"
                      placeholder="Amount"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="flex font-bold bg-zinc-50">
                  <div className="w-[180px] border-r border-black p-2 font-bold text-black">Total (₹)</div>
                  <div className="flex-1 p-2 text-right text-black font-bold text-sm">{total.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>

            {/* Payment Terms Section */}
            <div className="mt-8 mb-6">
              <div className="no-print flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-black">Payment Terms</div>
                <button
                  onClick={addPaymentTermColumn}
                  className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[9px] font-semibold transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add Column
                </button>
              </div>

              {/* Payment Terms Grid Container */}
              <div className="border border-black flex divide-x divide-black text-xs">
                {invoice.paymentTerms.map((term, index) => (
                  <div key={term.id} className="flex-1 min-w-[150px] relative group/term">
                    {/* Header Row */}
                    <div className="border-b border-black p-2 font-bold text-black flex justify-between items-center bg-zinc-50/50">
                      <input
                        type="text"
                        value={term.title}
                        onChange={(e) => handlePaymentTermChange(index, "title", e.target.value)}
                        className="invoice-input font-bold text-xs p-0 focus:px-1"
                        placeholder="Term Header"
                      />
                      {/* Delete Column Button */}
                      <button
                        onClick={() => removePaymentTermColumn(index)}
                        disabled={invoice.paymentTerms.length <= 1}
                        className="no-print opacity-0 group-hover/term:opacity-100 p-0.5 rounded text-rose-500 hover:bg-rose-50 disabled:text-zinc-300 disabled:hover:bg-transparent cursor-pointer transition-all absolute right-1.5 top-1.5"
                        title="Delete Column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Value Area */}
                    <div className="p-2">
                      <AutoResizeTextarea
                        value={term.terms}
                        onChange={(e) => handlePaymentTermChange(index, "terms", e.target.value)}
                        className="invoice-textarea text-xs leading-5 text-zinc-700 w-full"
                        placeholder="Terms terms details..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex justify-between items-end mt-12 text-xs">
              <div className="flex-1"></div>
              <div className="text-right w-64 space-y-16">
                <div className="text-black font-semibold flex items-center justify-end gap-1">
                  <span>For</span>
                  <input
                    type="text"
                    value={invoice.companyDetails.name}
                    onChange={(e) => handleCompanyChange("name", e.target.value)}
                    className="invoice-input font-bold p-0 focus:px-1 inline-block text-left"
                    style={{ width: `${Math.max(60, (invoice.companyDetails.name || "").length * 8.5)}px` }}
                    placeholder="NXTNET"
                  />
                </div>
                
                <div className="flex items-center justify-end text-zinc-900 font-bold">
                  <span className="mr-0.5">(</span>
                  <input
                    type="text"
                    value={invoice.signerName}
                    onChange={(e) => handleInvoiceMetaChange("signerName", e.target.value)}
                    className="invoice-input text-center font-bold p-0 focus:px-1 inline-block text-zinc-800"
                    style={{ width: `${Math.max(80, (invoice.signerName || "").length * 8.5)}px` }}
                    placeholder="Authorized Signatory"
                  />
                  <span className="ml-0.5">)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-12 mb-2 no-shrink">
            <input
              type="text"
              value={invoice.footerNote}
              onChange={(e) => handleInvoiceMetaChange("footerNote", e.target.value)}
              className="invoice-input text-center italic text-sm p-0 focus:px-1 text-black font-semibold"
              placeholder="Footer Message"
              style={{ textDecoration: "underline", fontFamily: "Arial, sans-serif" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
