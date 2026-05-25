"use client";

import React, { useState } from "react";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { ShieldAlert, ArrowRight, Sparkles, Building2, ReceiptText, Users, Mail, Lock, User } from "lucide-react";

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Email/Password state
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (isSignUp && !name) {
      setError("Please provide your name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!auth) {
        throw new Error("Firebase Auth is not initialized. Please configure env variables.");
      }

      if (isSignUp) {
        // Sign Up Flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name
        await updateProfile(userCredential.user, {
          displayName: name
        });
      } else {
        // Sign In Flow
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email address is already in use by another account.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/missing-password" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(err.message || "An error occurred during email authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-950 overflow-hidden font-sans text-zinc-100 py-12 px-4">
      {/* Dynamic Animated Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/0 blur-[130px] animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-indigo-500/20 to-purple-500/0 blur-[130px] animate-pulse duration-[8000ms]" />

      {/* Grid Overlay for Premium Tech Feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
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
            <h2 className="text-lg font-bold text-white">
              {isSignUp ? "Create Business Account" : "Welcome Back"}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {isSignUp 
                ? "Sign up to collaborate on invoices and manage presets."
                : "Sign in to access the NXTNET billing database & business suite."}
            </p>
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
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-850 hover:bg-zinc-800 active:bg-zinc-700/60 disabled:opacity-50 disabled:pointer-events-none text-sm font-semibold tracking-wide text-white cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg shadow-black/20 hover:border-zinc-700"
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
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="px-3 text-xs text-zinc-500 uppercase tracking-widest font-semibold">Or with Email</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-teal-500/80 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-teal-500/80 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-teal-500/80 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-6 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 disabled:opacity-50 disabled:pointer-events-none text-sm font-semibold tracking-wide text-zinc-950 cursor-pointer transition-all duration-300 shadow-md shadow-teal-500/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? "Create Account" : "Sign In with Email"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer"
            >
              {isSignUp 
                ? "Already have an account? Sign In" 
                : "Need a company account? Register here"}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-zinc-500">
          NxtBill Invoicing is an internal tool. Contact administrator to request access if your account is unauthorized.
        </p>
      </div>
    </div>
  );
}
