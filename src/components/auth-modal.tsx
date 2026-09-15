'use client';

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { FirebaseAuthService } from '@/lib/firebase/auth.service';
import { NationalEmblem } from './ui-assets';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  requiredActionMessage?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  requiredActionMessage,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const user = await FirebaseAuthService.signInWithGoogle();
      onUserChange(user);
      onClose();
    } catch (err: unknown) {
      console.warn('Google sign-in error:', err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please complete the Google sign-in window.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not yet authorized in Firebase Console > Authentication > Settings > Authorized domains. Please add localhost.');
      } else {
        setErrorMessage((err as Error)?.message || 'Google sign-in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email / Password submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      if (isSignUp) {
        if (!email.trim() || !password || !displayName.trim()) {
          throw new Error('Please fill in your name, email, and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const user = await FirebaseAuthService.signUpWithEmail(
          email.trim(),
          password,
          displayName.trim()
        );
        onUserChange(user);
        setSuccessNotice(
          `Account created! A verification email was sent to ${user.email}. Please verify your email before scanning or searching.`
        );
      } else {
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password.');
        }
        const user = await FirebaseAuthService.signInWithEmail(email.trim(), password);
        onUserChange(user);
        if (!user.emailVerified) {
          setSuccessNotice(
            `Signed in as ${user.email}. Please verify your email to unlock scanning and searches.`
          );
        } else {
          onClose();
        }
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please switch to Sign In.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setErrorMessage('Invalid email or password. Please try again.');
      } else if (code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email. Please sign up.');
      } else {
        setErrorMessage((err as Error)?.message || 'Authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await FirebaseAuthService.sendVerificationEmail(currentUser);
      setSuccessNotice(`Verification email resent to ${currentUser.email}!`);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check verification status
  const handleCheckVerification = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const updated = await FirebaseAuthService.reloadUser(currentUser);
      onUserChange(updated);
      if (updated.emailVerified) {
        setSuccessNotice('Email verified successfully! You now have full access.');
        setTimeout(() => onClose(), 1200);
      } else {
        setErrorMessage('Email is still unverified. Please check your inbox and click the verification link.');
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Failed to check verification status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Emblem & Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <NationalEmblem className="w-10 h-12 mb-2" />
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Verified User Authentication
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Department of Legal Metrology • Government of India
          </p>

          {requiredActionMessage && (
            <div className="mt-3 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>{requiredActionMessage}</span>
            </div>
          )}
        </div>

        {/* Current User Verification Banner (If signed in but unverified) */}
        {currentUser && !currentUser.emailVerified && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Email Verification Required</span>
            </div>
            <p className="text-amber-700 leading-relaxed">
              Signed in as <strong>{currentUser.email}</strong>. To upload labels and search records, your email address must be verified.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
              >
                I&apos;ve Verified (Check Status)
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-800 font-semibold text-[11px] cursor-pointer"
              >
                Resend Link
              </button>
            </div>
          </div>
        )}

        {/* Alerts / Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            {successNotice}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-2xs transition-colors cursor-pointer"
        >
          {/* Google G SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google (Auto-Verified)</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
            or with email
          </span>
        </div>

        {/* Tabs: Sign In / Create Account */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              !isSignUp ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              isSignUp ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3 text-xs">
          {isSignUp && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Full Name / Designation
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ramesh Kumar (Inspector)"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@gov.in or your email"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading
              ? 'Processing...'
              : isSignUp
              ? 'Register & Send Verification Email'
              : 'Sign In'}
          </button>
        </form>

        {/* Footer Note */}
        <p className="mt-4 text-[11px] text-slate-400 text-center leading-relaxed">
          CompliScan access is monitored under the Legal Metrology Act, 2009. Email verification ensures genuine compliance reporting.
        </p>
      </div>
    </div>
  );
}
