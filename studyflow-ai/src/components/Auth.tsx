/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserProfile } from '../types';

interface AuthProps {
  onLogout: () => void;
}

export default function Auth({ onLogout }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getFriendlyErrorMessage = (err: any, defaultMsg: string) => {
    if (err && (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed')))) {
      return "Email/Password sign-in method is not enabled in your Firebase Console. To resolve this: Go to your Firebase Console -> select your project -> Authentication -> Sign-in method tab -> enable 'Email/Password' -> click Save, and then try again.";
    }
    return err?.message || defaultMsg;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Let the main layout's onAuthStateChanged reactively log in instantly
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!displayName.trim()) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    try {
      // Securely store the pending display name to local storage so the react-auth listener can pick it up instantly
      localStorage.setItem('pending_signup_display_name', displayName.trim());
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, 'Failed to create account.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, 'Google Sign-In failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, 'Error sending password reset email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F0]">
      <div className="w-full max-w-md bg-white rounded-[32px] border border-black/5 shadow-xl shadow-[#5A5A40]/10 overflow-hidden p-8 md:p-10 transition-all duration-300">
        
        {/* Brand Logo (Stylish GenZ design) */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative group cursor-pointer mb-4">
            {/* Glowing background halo */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#D4A373] via-[#E29578] to-[#5A5A40] rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            {/* Main Badge */}
            <div className="relative w-14 h-14 bg-[#2C2C2B] rounded-2xl flex items-center justify-center text-white font-bold shadow-2xl border border-white/10 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-2xl select-none filter drop-shadow-[0_2px_4px_rgba(212,163,115,0.6)]">⚡</span>
              {/* Floating modern sparkle dot */}
              <span className="absolute -top-1.5 -right-1.5 text-xs text-[#D4A373] animate-bounce">✦</span>
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[#2C2C2B] font-sans flex items-center gap-1.5">
            studyflow<span className="text-xs px-2 py-0.5 rounded-full bg-[#5A5A40] text-[#F5F5F0] uppercase tracking-widest font-black self-center mt-1 scale-90 border border-[#D4A373]/30">ai</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1.5 font-medium max-w-[300px]">
            Next-Gen Study Suite • Connected Workspace
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span>✅</span> {message}
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <h3 className="text-lg font-bold font-serif italic text-stone-800 mb-2">Reset Password</h3>
            <p className="text-xs text-stone-500 mb-4">Enter your registered email address and we'll send a secure password reset link.</p>
            
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-widest font-black text-stone-400">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold text-sm shadow-md hover:bg-[#494933] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full text-center text-xs font-bold text-[#5A5A40] hover:underline pt-2"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex bg-stone-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => { setIsSignUp(false); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${!isSignUp ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsSignUp(true); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${isSignUp ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-widest font-black text-stone-400">Your Full Name</label>
                  <input 
                    type="text" 
                    required={isSignUp}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Arnav Singh"
                    className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest font-black text-stone-400">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] uppercase tracking-widest font-black text-stone-400">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[11px] text-[#5A5A40] font-bold hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold text-sm shadow-md hover:bg-[#494933] transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In to Dashboard'}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-black/5 w-full"></div>
              <span className="absolute bg-white px-3 text-[10px] uppercase font-black tracking-widest text-stone-400">Or Connect</span>
            </div>

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border border-black/10 text-stone-700 py-3 rounded-2xl font-bold text-xs shadow-sm hover:bg-stone-50 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.74 14.93 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.6 2.8C6.01 7.21 8.79 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.46h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.65 2.83c2.14-1.97 3.38-4.88 3.38-8.49z" />
                <path fill="#FBBC05" d="M5.1 14.3c-.25-.75-.39-1.56-.39-2.3c0-.74.14-1.55.39-2.3L1.5 6.9C.54 8.81 0 10.95 0 13.2c0 2.25.54 4.39 1.5 6.3l3.6-2.9z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.65-2.83c-1.02.68-2.33 1.09-4.31 1.09-3.21 0-5.99-2.17-6.96-5.26l-3.6 2.8C3.4 20.35 7.35 23 12 23z" />
              </svg>
              Continue with Google
            </button>


          </div>
        )}
      </div>
    </div>
  );
}
