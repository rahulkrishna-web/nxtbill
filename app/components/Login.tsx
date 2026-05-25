"use client";

import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { ShieldAlert, ArrowRight, Sparkles, Building2, ReceiptText, Users } from "lucide-react";

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!auth) {
        throw new Error("Firebase Auth is not initialized. Please ensure that you have added the required Firebase environment variables to Vercel and deployed again.");
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Firebase Login Error:", err);
      // Friendly message based on firebase error code
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed before completion.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network connection issue. Please check your internet connection.");
      } else {
        setError(err.message || "An unexpected error occurred during Google sign-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-950 overflow-hidden font-sans text-zinc-100">
      {/* Dynamic Animated Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/0 blur-[130px] animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-indigo-500/20 to-purple-500/0 blur-[130px] animate-pulse duration-[8000ms]" />

      {/* Grid Overlay for Premium Tech Feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 p-[1px] shadow-lg shadow-teal-500/10 mb-4 group hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full rounded-[15px] bg-zinc-900 flex items-center justify-center">
              <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">N</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            nxtbill
          </h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-teal-400/80 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Business Management Portal
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Welcome Back</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Sign in with Google to access the NXTNET billing database & business suite.
            </p>
          </div>

          {/* Feature List / Shared Access Notice */}
          <div className="space-y-4 mb-8 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/40 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                <ReceiptText className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-zinc-200">Centralized Invoice Database</p>
                <p className="text-zinc-400 mt-0.5">Create, edit, and audit professional invoices collaboratively.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-zinc-200">Shared Client Database</p>
                <p className="text-zinc-400 mt-0.5">Sync and search through shared client presets and contact info.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-zinc-200">Shared Bank & Settings</p>
                <p className="text-zinc-400 mt-0.5">Always stay updated with single-source-of-truth payment terms.</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Authentication issue:</span> {error}
              </div>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800/80 active:bg-zinc-700/60 disabled:opacity-50 disabled:pointer-events-none text-sm font-semibold tracking-wide text-white cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg shadow-black/20 hover:border-zinc-500"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.23 0-5.856-2.626-5.856-5.857 0-3.23 2.625-5.856 5.856-5.856 1.455 0 2.784.532 3.81 1.408l3.056-3.056C18.98 3.323 15.776 2 12.24 2 6.643 2 2.13 6.512 2.13 12.11s4.512 10.11 10.11 10.11c6.512 0 10.207-4.577 9.718-10.286H12.24Z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-zinc-500">
          NxtBill Invoicing is an internal tool. Contact administrator to request access if your Google account is unauthorized.
        </p>
      </div>
    </div>
  );
}
