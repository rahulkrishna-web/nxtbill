"use client";

import React, { useState, useEffect } from "react";
import { Invoice, ClientPreset } from "./types";
import { INITIAL_INVOICE, DEFAULT_CLIENTS, DEFAULT_COMPANY, DEFAULT_BANK } from "./constants";
import { Sidebar } from "./components/Sidebar";
import { InvoiceEditor } from "./components/InvoiceEditor";
import { Login } from "./components/Login";
import { ShieldAlert } from "lucide-react";

// Firebase imports
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

const normalizeDateStr = (dateStr: string): string => {
  if (!dateStr) return "";
  // Match YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }
  // Match YYYY/MM/DD or YYYY/DD/MM
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    const parts = dateStr.split("/");
    const yyyy = parts[0];
    const p1 = parts[1];
    const p2 = parts[2];
    if (parseInt(p1) > 12) {
      return `${p1}/${p2}/${yyyy}`;
    } else {
      return `${p2}/${p1}/${yyyy}`;
    }
  }
  return dateStr;
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>("");
  const [clientPresets, setClientPresets] = useState<ClientPreset[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  // 1. Mount & Auth subscription
  useEffect(() => {
    setIsMounted(true);
    
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Firestore real-time sync subscription
  useEffect(() => {
    if (!currentUser || !db) {
      setInvoices([]);
      setClientPresets([]);
      return;
    }

    // Subscribe to invoices collection
    const invoicesRef = collection(db!, "invoices");
    const unsubscribeInvoices = onSnapshot(invoicesRef, (snapshot) => {
      setDbError(null);
      let loadedInvoices: Invoice[] = [];
      snapshot.forEach((doc) => {
        loadedInvoices.push(doc.data() as Invoice);
      });
      
      // Sort by createdAt descending
      loadedInvoices.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      if (loadedInvoices.length === 0) {
        // Seed with INITIAL_INVOICE
        setDoc(doc(db!, "invoices", INITIAL_INVOICE.id), INITIAL_INVOICE);
      } else {
        setInvoices(loadedInvoices);
        // Ensure there is an activeInvoiceId
        setActiveInvoiceId(prev => {
          if (!prev || !loadedInvoices.some(inv => inv.id === prev)) {
            return loadedInvoices[0].id;
          }
          return prev;
        });
      }
    }, (err) => {
      console.error("Firestore read error (invoices):", err);
      setDbError(err.message || "Failed to load invoices.");
    });

    // Subscribe to client presets collection
    const clientsRef = collection(db!, "clientPresets");
    const unsubscribeClients = onSnapshot(clientsRef, (snapshot) => {
      setDbError(null);
      let loadedClients: ClientPreset[] = [];
      snapshot.forEach((doc) => {
        loadedClients.push(doc.data() as ClientPreset);
      });

      if (loadedClients.length === 0) {
        // Seed DEFAULT_CLIENTS
        DEFAULT_CLIENTS.forEach(client => {
          setDoc(doc(db!, "clientPresets", client.id), client);
        });
      } else {
        setClientPresets(loadedClients);
      }
    }, (err) => {
      console.error("Firestore read error (clients):", err);
      setDbError(err.message || "Failed to load client presets.");
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeClients();
    };
  }, [currentUser]);

  const handleSelectInvoice = (id: string) => {
    setActiveInvoiceId(id);
  };

  const handleCreateInvoice = async () => {
    if (!db) return;
    // Generate new invoice number by finding the highest one and adding 1
    const invoiceNumbers = invoices
      .map((inv) => parseInt(inv.invoiceNumber))
      .filter((num) => !isNaN(num));
    const highestNum = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 25;
    const nextNum = (highestNum + 1).toString();

    // Get today's date formatted as DD/MM/YYYY
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const formattedDate = `${dd}/${mm}/${yyyy}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: nextNum,
      date: formattedDate,
      status: "Draft",
      companyDetails: invoices.length > 0 ? { ...invoices[0].companyDetails } : { ...DEFAULT_COMPANY },
      clientDetails: {
        id: "",
        name: "New Client",
        address: "Client Address Line 1\nLine 2",
        email: "client@example.com",
        mobile: "",
        gstin: "",
      },
      bankDetails: invoices.length > 0 ? { ...invoices[0].bankDetails } : { ...DEFAULT_BANK },
      items: [
        {
          id: `item-${Date.now()}`,
          sNo: 1,
          item: "Shopify Development Services",
          hsn: "998314",
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ],
      taxType: "IGST",
      taxRate: 18,
      discountLabel: "-",
      discountAmount: 0,
      paymentTerms: invoices.length > 0 ? [...invoices[0].paymentTerms] : [
        {
          id: "pt-1",
          title: "Website Development",
          terms: "50% - Advance.\n50% - Project Completion.",
        },
        {
          id: "pt-2",
          title: "Website Management",
          terms: "100% Advance",
        },
      ],
      signerName: invoices.length > 0 ? invoices[0].signerName : "Rahul Krishna",
      footerNote: "Thank you.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db!, "invoices", newInvoice.id), newInvoice);
      setActiveInvoiceId(newInvoice.id);
    } catch (e) {
      console.error("Failed to create invoice in Firestore:", e);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db!, "invoices", id));
      if (activeInvoiceId === id) {
        const remaining = invoices.filter((inv) => inv.id !== id);
        if (remaining.length > 0) {
          setActiveInvoiceId(remaining[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to delete invoice from Firestore:", e);
    }
  };

  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    if (!db) return;
    try {
      const docRef = doc(db!, "invoices", updatedInvoice.id);
      await setDoc(docRef, {
        ...updatedInvoice,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Failed to update invoice in Firestore:", e);
    }
  };

  const handleManualSave = () => {
    alert("Invoice changes auto-saved to cloud!");
  };

  const handleResetInvoice = async () => {
    if (!db) return;
    const activeInvoice = invoices.find((inv) => inv.id === activeInvoiceId);
    if (!activeInvoice) return;

    if (confirm("Reset this invoice to its default settings? This will discard your current edits.")) {
      const reset = { 
        ...INITIAL_INVOICE, 
        id: activeInvoiceId, 
        invoiceNumber: activeInvoice.invoiceNumber, // preserve number
        date: activeInvoice.date, // preserve date
        updatedAt: new Date().toISOString() 
      };
      try {
        await setDoc(doc(db!, "invoices", activeInvoiceId), reset);
      } catch (e) {
        console.error("Failed to reset invoice in Firestore:", e);
      }
    }
  };

  // Client presets
  const handleAddClientPreset = async (newPreset: Omit<ClientPreset, "id">) => {
    if (!db) return;
    const presetId = `client-${Date.now()}`;
    const preset: ClientPreset = {
      ...newPreset,
      id: presetId,
    };
    try {
      await setDoc(doc(db!, "clientPresets", presetId), preset);
    } catch (e) {
      console.error("Failed to add client preset to Firestore:", e);
    }
  };

  const handleDeleteClientPreset = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db!, "clientPresets", id));
    } catch (e) {
      console.error("Failed to delete client preset from Firestore:", e);
    }
  };

  const handleApplyClientPreset = (preset: ClientPreset) => {
    const activeInvoice = invoices.find((inv) => inv.id === activeInvoiceId);
    if (!activeInvoice) return;

    const updated: Invoice = {
      ...activeInvoice,
      clientDetails: { ...preset },
    };
    handleUpdateInvoice(updated);
  };

  // Export / Import
  const handleExportData = () => {
    const backup = {
      invoices,
      clientPresets,
      version: "1.0",
      exportedAt: new Date().toISOString(),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nxtbill-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (jsonString: string): boolean => {
    if (!db) return false;
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.invoices)) {
        const batch = writeBatch(db!);
        data.invoices.forEach((inv: Invoice) => {
          const normalized = {
            ...inv,
            date: inv.date ? normalizeDateStr(inv.date) : inv.date
          };
          const ref = doc(db!, "invoices", normalized.id);
          batch.set(ref, normalized);
        });

        if (Array.isArray(data.clientPresets)) {
          data.clientPresets.forEach((client: ClientPreset) => {
            const ref = doc(db!, "clientPresets", client.id);
            batch.set(ref, client);
          });
        }
        
        batch.commit().then(() => {
          if (data.invoices.length > 0) {
            setActiveInvoiceId(data.invoices[0].id);
          }
        }).catch(e => {
          console.error("Failed to commit import batch:", e);
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Render loading state during SSR hydration or auth validation
  if (!isMounted || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm font-semibold tracking-wide text-zinc-400">Loading NxtBill System...</div>
        </div>
      </div>
    );
  }

  // Render login portal if unauthorized
  if (!currentUser) {
    return <Login />;
  }

  const activeInvoice = invoices.find((inv) => inv.id === activeInvoiceId) || invoices[0];

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        invoices={invoices}
        activeInvoiceId={activeInvoiceId}
        onSelectInvoice={handleSelectInvoice}
        onCreateInvoice={handleCreateInvoice}
        onDeleteInvoice={handleDeleteInvoice}
        clientPresets={clientPresets}
        onAddClientPreset={handleAddClientPreset}
        onDeleteClientPreset={handleDeleteClientPreset}
        onApplyClientPreset={handleApplyClientPreset}
        onImportData={handleImportData}
        onExportData={handleExportData}
        userEmail={currentUser.email || undefined}
        userName={currentUser.displayName || undefined}
        userPhoto={currentUser.photoURL || undefined}
        onLogout={auth ? () => signOut(auth!) : undefined}
      />

      {/* Editor / Invoice Canvas */}
      {dbError ? (
        <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 p-6">
          <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-lg">Database Setup Required</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              {dbError.includes("permission") || dbError.includes("Permission") 
                ? "Your Firebase account does not have read/write access to Cloud Firestore. You need to configure the database rules in the Firebase console." 
                : dbError}
            </p>
            <div className="text-xs bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/50 space-y-2 text-zinc-400">
              <p className="font-semibold text-zinc-200">How to Fix This:</p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">Firebase Console</a>.</li>
                <li>Ensure you have clicked <strong>Create Database</strong> under <strong>Cloud Firestore</strong>.</li>
                <li>Go to the <strong>Rules</strong> tab and replace the default rules with:
                  <pre className="mt-1 bg-zinc-900 p-2 rounded border border-zinc-800 text-[10px] text-teal-300/90 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                  </pre>
                </li>
                <li>Publish the new rules and refresh this page.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : activeInvoice ? (
        <InvoiceEditor
          invoice={activeInvoice}
          onChangeInvoice={handleUpdateInvoice}
          onSaveInvoice={handleManualSave}
          onResetInvoice={handleResetInvoice}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
          <div className="text-sm font-semibold text-zinc-500">Initializing cloud database...</div>
        </div>
      )}
    </div>
  );
}
