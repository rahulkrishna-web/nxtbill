"use client";

import React, { useState } from "react";
import { Invoice, ClientPreset } from "../types";
import { Plus, Search, Trash2, Download, Upload, Users, FileText, Settings, Sparkles, Mail, Copy, Check } from "lucide-react";

interface EmailTemplateCopySectionProps {
  title: string;
  subject: string;
  body: string;
}

const EmailTemplateCopySection: React.FC<EmailTemplateCopySectionProps> = ({ title, subject, body }) => {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const copySubject = () => {
    navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const copyBody = () => {
    navigator.clipboard.writeText(body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  return (
    <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2">
      <div className="font-semibold text-xs text-white">{title}</div>
      
      <div className="flex flex-col gap-1">
        <div className="text-[9px] text-zinc-550 text-zinc-500 uppercase font-mono tracking-wider">Subject</div>
        <div className="flex gap-1.5 items-center bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-350">
          <span className="truncate flex-1 font-mono text-[10px] text-zinc-350">{subject}</span>
          <button 
            onClick={copySubject} 
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Copy Subject"
          >
            {copiedSubject ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Body</div>
        <div className="relative">
          <pre className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto no-scrollbar">
            {body}
          </pre>
          <button 
            onClick={copyBody} 
            className="absolute right-2 top-2 p-1 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title="Copy Body"
          >
            {copiedBody ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  invoices: Invoice[];
  activeInvoiceId: string;
  onSelectInvoice: (id: string) => void;
  onCreateInvoice: () => void;
  onDeleteInvoice: (id: string) => void;
  clientPresets: ClientPreset[];
  onAddClientPreset: (preset: Omit<ClientPreset, "id">) => void;
  onDeleteClientPreset: (id: string) => void;
  onApplyClientPreset: (preset: ClientPreset) => void;
  onImportData: (data: string) => boolean;
  onExportData: () => void;
  userEmail?: string;
  userName?: string;
  userPhoto?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  invoices,
  activeInvoiceId,
  onSelectInvoice,
  onCreateInvoice,
  onDeleteInvoice,
  clientPresets,
  onAddClientPreset,
  onDeleteClientPreset,
  onApplyClientPreset,
  onImportData,
  onExportData,
  userEmail,
  userName,
  userPhoto,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"invoices" | "clients" | "emails" | "settings">("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Client form state
  const [newClientName, setNewClientName] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientMobile, setNewClientMobile] = useState("");
  const [newClientGstin, setNewClientGstin] = useState("");

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    onAddClientPreset({
      name: newClientName,
      address: newClientAddress,
      email: newClientEmail,
      mobile: newClientMobile,
      gstin: newClientGstin,
    });
    setNewClientName("");
    setNewClientAddress("");
    setNewClientEmail("");
    setNewClientMobile("");
    setNewClientGstin("");
  };

  const calculateInvoiceTotal = (invoice: Invoice) => {
    const subtotal = invoice.items.reduce(
      (sum, item) => sum + (item.quantity * item.rate),
      0
    );
    let taxAmount = 0;
    if (invoice.taxType === "IGST" || invoice.taxType === "CGST_SGST") {
      taxAmount = subtotal * (invoice.taxRate / 100);
    }
    return Math.round(subtotal + taxAmount - invoice.discountAmount);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.items.some((item) =>
        item.item.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "All" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
      case "Draft":
        return "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20";
      case "Sent":
        return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
      case "Overdue":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        const success = onImportData(result);
        if (success) {
          alert("Backup data restored successfully!");
        } else {
          alert("Invalid backup data format.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <aside className="w-80 flex flex-col bg-zinc-900 text-zinc-300 border-r border-zinc-800 h-full no-print">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-black font-bold text-lg shadow-md shadow-teal-500/20">
            N
          </div>
          <div>
            <h1 className="font-semibold text-white tracking-tight text-md">NXTNET Bill</h1>
            <p className="text-[10px] text-zinc-500 font-mono">INTERNAL INVOICING v1.0</p>
          </div>
        </div>
        <button
          onClick={onCreateInvoice}
          className="p-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition-all shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 flex items-center justify-center cursor-pointer"
          title="New Invoice"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 text-[10px] font-bold tracking-tight font-sans">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex-1 py-2.5 text-center border-b-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "invoices"
              ? "border-teal-500 text-teal-400 bg-zinc-800/40"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab("clients")}
          className={`flex-1 py-2.5 text-center border-b-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "clients"
              ? "border-teal-500 text-teal-400 bg-zinc-800/40"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Clients
        </button>
        <button
          onClick={() => setActiveTab("emails")}
          className={`flex-1 py-2.5 text-center border-b-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "emails"
              ? "border-teal-500 text-teal-400 bg-zinc-800/40"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Emails
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-2.5 text-center border-b-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-teal-500 text-teal-400 bg-zinc-800/40"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Backups
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "invoices" && (
          <div className="flex flex-col h-full">
            {/* Search & Filter */}
            <div className="p-3 border-b border-zinc-800 flex flex-col gap-2 bg-zinc-950/40">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] no-scrollbar">
                {["All", "Draft", "Sent", "Paid", "Overdue"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2 py-1 rounded-md border font-medium whitespace-nowrap cursor-pointer transition-all ${
                      statusFilter === status
                        ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoice List */}
            <div className="flex-1 p-2 flex flex-col gap-1.5">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No invoices found
                </div>
              ) : (
                filteredInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer group flex flex-col gap-1.5 ${
                      activeInvoiceId === inv.id
                        ? "bg-zinc-800/80 border-teal-500/50 text-white shadow-md"
                        : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/40 hover:border-zinc-700 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-xs font-bold text-white group-hover:text-teal-400 transition-colors">
                          #{inv.invoiceNumber}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {inv.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this invoice?")) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs mt-1">
                      <div className="truncate max-w-[140px] font-medium">
                        {inv.clientDetails.name || "Untitled Client"}
                      </div>
                      <div className="font-mono font-bold text-white">
                        ₹{calculateInvoiceTotal(inv).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "clients" && (
          <div className="p-4 flex flex-col gap-4">
            {/* Add Client Preset */}
            <form onSubmit={handleAddClient} className="bg-zinc-850 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2.5">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-400" /> Save New Client Preset
              </h3>
              <input
                type="text"
                placeholder="Client Name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                required
              />
              <textarea
                placeholder="Client Address"
                value={newClientAddress}
                onChange={(e) => setNewClientAddress(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 h-16 resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                />
                <input
                  type="text"
                  placeholder="Mobile"
                  value={newClientMobile}
                  onChange={(e) => setNewClientMobile(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <input
                type="text"
                placeholder="GSTIN"
                value={newClientGstin}
                onChange={(e) => setNewClientGstin(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 uppercase"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded text-xs transition-all cursor-pointer"
              >
                Add Preset
              </button>
            </form>

            {/* Presets List */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-white">Client Presets</h3>
              {clientPresets.length === 0 ? (
                <div className="text-center py-4 text-zinc-600 text-xs">
                  No client presets saved
                </div>
              ) : (
                clientPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-all flex flex-col gap-1.5 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-semibold text-xs text-white truncate max-w-[180px]">
                        {preset.name}
                      </div>
                      <button
                        onClick={() => onDeleteClientPreset(preset.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/10 rounded text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {preset.gstin && (
                      <div className="text-[10px] text-zinc-500 font-mono">
                        GSTIN: {preset.gstin}
                      </div>
                    )}
                    <button
                      onClick={() => onApplyClientPreset(preset)}
                      className="mt-1.5 w-full py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded text-[10px] border border-zinc-700 transition-all cursor-pointer"
                    >
                      Apply to Active Invoice
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "emails" && (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-white">Email Formats</h3>
              <p className="text-[10px] text-zinc-500">Pre-filled subject and body templates dynamically matching the active invoice.</p>
            </div>
            
            {(() => {
              const activeInvoice = invoices.find((inv) => inv.id === activeInvoiceId);
              if (!activeInvoice) {
                return (
                  <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-lg">
                    Select an invoice to generate email templates.
                  </div>
                );
              }

              const invoiceNum = activeInvoice.invoiceNumber || "Draft";
              const clientName = activeInvoice.clientDetails.name || "Client Name";
              const invoiceDate = activeInvoice.date || "Date";
              const invoiceTotal = calculateInvoiceTotal(activeInvoice);
              const totalAmount = invoiceTotal.toLocaleString("en-IN");
              const companyName = activeInvoice.companyDetails.name || "NXTNET";
              const signerName = activeInvoice.signerName || "Authorized Signatory";
              
              const bankName = activeInvoice.bankDetails.accountName || "";
              const bankAcc = activeInvoice.bankDetails.accountNumber || "";
              const bankIfsc = activeInvoice.bankDetails.ifscCode || "";
              const bankBranch = activeInvoice.bankDetails.branch || "";

              const termsText = activeInvoice.paymentTerms && activeInvoice.paymentTerms.length > 0
                ? activeInvoice.paymentTerms
                    .map((t) => `${t.title}: ${t.terms.replace(/\n/g, ", ")}`)
                    .join(" | ")
                : "Standard Terms";

              // Templates
              const deliverySubject = `Invoice #${invoiceNum} from ${companyName}`;
              const deliveryBody = `Dear ${clientName},

Please find attached invoice #${invoiceNum} dated ${invoiceDate} for Shopify / Website development services.

Total Amount Due: ₹${totalAmount}
Payment Terms: ${termsText}

Please transfer the amount to our bank account:
- Account Name: ${bankName}
- Account Number: ${bankAcc}
- IFSC Code: ${bankIfsc}
- Branch: ${bankBranch}

Please let us know once the transfer is processed.

Regards,
${signerName}
${companyName}`;

              const reminderSubject = `Payment Reminder: Invoice #${invoiceNum} - ${companyName}`;
              const reminderBody = `Hi ${clientName},

Hope you are doing well.

This is a quick reminder regarding invoice #${invoiceNum} of ₹${totalAmount}, which was sent on ${invoiceDate}. 

Please process the transfer at your earliest convenience. If the payment has already been sent, please disregard this note.

Bank Details:
- Account Name: ${bankName}
- Account Number: ${bankAcc}
- IFSC Code: ${bankIfsc}

Thank you,
${signerName}
${companyName}`;

              const receiptSubject = `Payment Confirmation: Invoice #${invoiceNum} - Thank you!`;
              const receiptBody = `Hi ${clientName},

We have received the payment of ₹${totalAmount} for invoice #${invoiceNum}. 

Thank you for your business!

Best regards,
${signerName}
${companyName}`;

              return (
                <div className="flex flex-col gap-4">
                  <EmailTemplateCopySection 
                    title="1. Invoice Delivery" 
                    subject={deliverySubject} 
                    body={deliveryBody} 
                  />
                  <EmailTemplateCopySection 
                    title="2. Payment Reminder" 
                    subject={reminderSubject} 
                    body={reminderBody} 
                  />
                  <EmailTemplateCopySection 
                    title="3. Receipt Confirmation" 
                    subject={receiptSubject} 
                    body={receiptBody} 
                  />
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-4 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-white">Data Management</h3>
            
            <div className="flex flex-col gap-2.5">
              {/* Export Button */}
              <button
                onClick={onExportData}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Backup Data (JSON)
              </button>

              {/* Import Button */}
              <label className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition-all text-center">
                <Upload className="w-3.5 h-3.5" />
                Restore Data (JSON)
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Usage Tips</h4>
              <ul className="mt-2 text-[10px] text-zinc-500 list-disc list-inside space-y-1">
                <li>Directly click any text on the invoice to edit it in place.</li>
                <li>Adding items automatically recalculates totals.</li>
                <li>Tax type automatically supports IGST, CGST + SGST, or None.</li>
                <li>Invoices are saved in real-time to the NXTNET cloud database.</li>
                <li>To print or save as PDF, click "Print Invoice" and choose "Save as PDF" in the print options.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* User profile footer */}
      {onLogout && (
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs mt-auto shrink-0">
          <div className="flex items-center gap-2 truncate max-w-[170px]">
            {userPhoto ? (
              <img src={userPhoto} alt={userName || ""} className="w-6 h-6 rounded-full border border-zinc-700" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center text-[10px] font-bold uppercase font-mono shrink-0">
                {userName ? userName[0] : "U"}
              </div>
            )}
            <div className="truncate">
              <div className="font-semibold text-zinc-200 truncate">{userName || "User"}</div>
              <div className="text-[9px] text-zinc-500 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-2 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 transition-all text-[10px] cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
};
