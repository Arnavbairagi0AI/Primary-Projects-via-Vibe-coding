/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { seedBusinessData } from '../utils/mockData';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Briefcase, 
  Phone, 
  MapPin, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  Compass, 
  Chrome 
} from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (businessId: string, isNewUser: boolean) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  // Onboarding state
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Restaurant');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  const checkOnboarding = async (uid: string, nameForFallback = '') => {
    try {
      const docRef = doc(db, 'businesses', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        onAuthSuccess(uid, false);
      } else {
        // Must onboard
        setTempUserId(uid);
        if (nameForFallback) {
          setBusinessName(nameForFallback);
        }
        setIsOnboarding(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error checking onboarding status');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await checkOnboarding(userCredential.user.uid);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await checkOnboarding(userCredential.user.uid);
    } catch (err: any) {
      setError(err.message || 'Failed to create an account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await checkOnboarding(user.uid, user.displayName || '');
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMessage('Reset password email sent successfully! Please check your inbox.');
      setIsForgotPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!businessName || !businessPhone || !businessAddress) {
      setError('Please fill out all onboarding fields.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create Business Profile document
      await setDoc(doc(db, 'businesses', tempUserId), {
        id: tempUserId,
        name: businessName,
        category: businessCategory,
        phone: businessPhone,
        whatsappNumber: businessPhone, // default
        address: businessAddress,
        businessHours: '9:00 AM - 10:00 PM',
        deliveryRadius: 5,
        languages: ['English', 'Hindi'],
        createdAt: new Date().toISOString(),
      });

      // 2. Seed business with interactive mock collections
      await seedBusinessData(tempUserId, businessName);

      onAuthSuccess(tempUserId, true);
    } catch (err: any) {
      setError(err.message || 'Error during onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 py-12" id="onboarding-page">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl shadow-xl"
        >
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-tight font-display">Onboard Your Business</h2>
            <p className="text-gray-400 text-sm mt-1">Setup your WhatsApp AI profile in 30 seconds</p>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Business Name</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Dhaba, Sparkle Salon"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Business Category</label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="Restaurant" className="bg-[#0a0a0a]">Restaurant / Cafe / Dhaba 🍛</option>
                <option value="Salon" className="bg-[#0a0a0a]">Salon & Spa 💇</option>
                <option value="Gym" className="bg-[#0a0a0a]">Gym & Fitness Centre 🏋️</option>
                <option value="Clinic" className="bg-[#0a0a0a]">Clinic / Health Centre 🩺</option>
                <option value="Coaching" className="bg-[#0a0a0a]">Coaching & Tuition Centre 📚</option>
                <option value="Store" className="bg-[#0a0a0a]">Local Grocery / Apparel Store 🛒</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">WhatsApp / Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 62, Noida, UP"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 p-2.5 rounded border border-red-500/20">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition duration-200 cursor-pointer disabled:opacity-55"
              id="submit-onboarding-btn"
            >
              {loading ? 'Setting up...' : 'Create My AI Assistant'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-4 py-12 relative" id="auth-page">
      {/* Visual Background Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Leo AI Business SaaS
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">Leo AI</h1>
          <p className="text-gray-400 text-sm mt-2">
            The Production-Ready AI WhatsApp Business Assistant SaaS. Turn WhatsApp chats into orders automatically!
          </p>
        </div>

        <motion.div 
          key={isSignUp ? 'signup' : isForgotPassword ? 'forgot' : 'signin'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl shadow-xl"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isForgotPassword 
                ? 'Forgot Password' 
                : isSignUp 
                ? 'Create Business Account' 
                : 'Sign In to Dashboard'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isForgotPassword 
                ? 'We will send you a password recovery email.' 
                : isSignUp 
                ? 'Get started in under 1 minute with trial access.' 
                : 'Enter your credentials to manage your AI WhatsApp flow.'}
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 mb-4">{error}</p>
          )}

          {infoMessage && (
            <p className="text-green-400 text-xs bg-green-500/10 p-3 rounded-lg border border-green-500/20 mb-4">{infoMessage}</p>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm py-2.5 rounded-lg transition duration-200 cursor-pointer disabled:opacity-55"
              >
                {loading ? 'Sending link...' : 'Send Recovery Email'}
              </button>

              <p className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-400">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition duration-200 cursor-pointer disabled:opacity-55"
              >
                {isSignUp ? <UserPlus className="w-4 h-4 text-black" /> : <LogIn className="w-4 h-4 text-black" />}
                {isSignUp ? 'Create Trial Account' : 'Sign In to Dashboard'}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-widest">Or Continue with</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2.5 border border-white/10 transition duration-200 cursor-pointer"
              >
                <Chrome className="w-4 h-4 text-emerald-400" />
                Google Workspace / Gmail Login
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                {isSignUp ? 'Already have an account? ' : "New business? "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Create an Account (14-day Free Trial)'}
                </button>
              </p>
            </form>
          )}
        </motion.div>
        
        {/* Safe Badge Footer */}
        <div className="text-center mt-6 text-[11px] text-gray-500">
          🔒 Production-grade AES-256 Cloud Encryption & SSL Secured.
        </div>
      </div>
    </div>
  );
}
