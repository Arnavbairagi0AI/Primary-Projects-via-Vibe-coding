/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Lock, Sparkles, ChevronRight, X, Shield, Star, Crown, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BillingManager } from '../utils/billingService';
import { FEATURES, PlanType } from '../utils/premiumGuard';

interface UpgradeScreenProps {
  userProfile: UserProfile;
  onClose?: () => void;
  onUpdatePlan: (plan: 'free' | 'pro' | 'premium') => void;
}

export default function UpgradeScreen({ userProfile, onClose, onUpdatePlan }: UpgradeScreenProps) {
  const [selectedBillingProvider, setSelectedBillingProvider] = useState<'stripe' | 'razorpay' | 'play' | 'apple'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentPlan = userProfile.subscriptionPlan || userProfile.currentPlan || 'free';

  const handleUpgrade = async (plan: 'pro' | 'premium', price: number) => {
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // Configure dynamic billing provider based on user select
      if (selectedBillingProvider === 'stripe') {
        // Stripe flow
        console.log("Using Stripe gateway");
      } else if (selectedBillingProvider === 'razorpay') {
        console.log("Using Razorpay gateway");
      }

      const result = await BillingManager.processPayment(plan, price, 'INR');
      
      if (result.success) {
        // Update user record in Firestore
        const userRef = doc(db, 'users', userProfile.uid);
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);

        const updatedFields = {
          currentPlan: plan,
          subscriptionPlan: plan,
          subscriptionStatus: 'active' as const,
          subscriptionStart: new Date().toISOString(),
          subscriptionEnd: nextMonth.toISOString(),
          subscriptionExpiresAt: nextMonth.toISOString()
        };

        await updateDoc(userRef, updatedFields);
        
        // Notify parent callback
        onUpdatePlan(plan);
        setSuccessMessage(`Congratulations! You've successfully upgraded to ${plan.toUpperCase()} plan.`);
        setTimeout(() => {
          if (onClose) onClose();
        }, 3000);
      } else {
        setErrorMessage(result.error || 'Payment transaction failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during upgrade.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngradeToFree = async () => {
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        currentPlan: 'free',
        subscriptionPlan: 'free',
        subscriptionStatus: 'inactive',
        subscriptionEnd: null,
        subscriptionExpiresAt: null
      });
      onUpdatePlan('free');
      setSuccessMessage("Switched back to Free plan.");
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating subscription.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-stone-50 border border-black/5 p-6 md:p-8 max-w-5xl mx-auto shadow-2xl backdrop-blur-md">
      {/* Background radial gradient */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4A373]/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#5A5A40]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Header and Close */}
      <div className="flex items-center justify-between border-b border-black/5 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/50 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> 100% FREE & UNLOCKED ACCESS
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">Full Access Unlocked</h2>
          <p className="text-xs text-stone-500 mt-1">All AI tutors, notes generators, PDF summarizers, and quizzes are 100% unlocked for everyone — zero subscription or Razorpay fees required!</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-200/80 rounded-full text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Full access notification banner */}
      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-black uppercase tracking-wider text-[10px] block text-emerald-700 mb-0.5">✨ Premium Access Granted</span>
          Your account has full unlimited access to all features. No payments, email sign-ins, or subscriptions required.
        </div>
      </div>

      {/* Status banner */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold animate-[slideIn_0.2s_ease-out]">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs font-bold animate-[slideIn_0.2s_ease-out]">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Billing provider selection */}
      <div className="mb-8 p-4 bg-stone-100/80 rounded-2xl border border-black/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black text-stone-700">Billing Service Integration Gateways</p>
          <p className="text-[10px] text-stone-500">Abstraction active. Standard transaction simulations apply globally.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'stripe', label: 'Stripe API' },
            { id: 'razorpay', label: 'Razorpay order' },
            { id: 'play', label: 'Google Play Billing' },
            { id: 'apple', label: 'Apple IAP' }
          ].map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedBillingProvider(provider.id as any)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all border ${
                selectedBillingProvider === provider.id
                  ? 'bg-[#2C2C2B] text-white border-transparent shadow-sm'
                  : 'bg-white hover:bg-stone-50 text-stone-600 border-black/5'
              }`}
            >
              {provider.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* FREE TIER CARD */}
        <div className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all ${
          currentPlan === 'free'
            ? 'bg-white border-[#5A5A40]/40 shadow-xl'
            : 'bg-stone-100/50 border-black/5 opacity-85 hover:opacity-100'
        }`}>
          {currentPlan === 'free' && (
            <span className="absolute top-4 right-4 text-[9px] font-black bg-[#5A5A40] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Current
            </span>
          )}
          <div>
            <span className="text-xs font-black text-stone-400 uppercase tracking-widest">Plan Basic</span>
            <h3 className="text-xl font-extrabold text-stone-800 mt-1">Free Tier</h3>
            <p className="text-xs text-stone-500 mt-2">Essential study timers and limited daily AI help.</p>
            
            <div className="mt-5 flex items-baseline">
              <span className="text-3xl font-black text-stone-900">₹0</span>
              <span className="text-xs text-stone-500 ml-1">/ forever</span>
            </div>

            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-2.5 text-xs text-stone-600">
                <Check className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <span>20 AI Chats/day</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600">
                <Check className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <span>5 AI Study Plans/month</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600 line-through opacity-50">
                <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>AI Notes Generator</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600 line-through opacity-50">
                <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>PDF Summarizer</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600 line-through opacity-50">
                <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>Flashcard Generator</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600 line-through opacity-50">
                <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>Voice Chat Tutors</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-5 border-t border-black/5">
            {currentPlan === 'free' ? (
              <button 
                disabled
                className="w-full py-2.5 rounded-xl bg-stone-200 text-stone-500 font-extrabold text-xs uppercase tracking-wider"
              >
                Active
              </button>
            ) : (
              <button 
                onClick={handleDowngradeToFree}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-black/10 font-extrabold text-xs uppercase tracking-wider transition"
              >
                Switch to Free
              </button>
            )}
          </div>
        </div>

        {/* PRO PLAN ₹199/month */}
        <div className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all ${
          currentPlan === 'pro'
            ? 'bg-white border-[#5A5A40] shadow-xl ring-2 ring-[#5A5A40]/10'
            : 'bg-white border-black/10 hover:border-[#5A5A40]/30 shadow-sm hover:shadow-lg'
        }`}>
          {currentPlan === 'pro' && (
            <span className="absolute top-4 right-4 text-[9px] font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Active
            </span>
          )}
          <div>
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
              <Star className="w-3 h-3 fill-blue-500 text-blue-600" /> Pro Power
            </span>
            <h3 className="text-xl font-extrabold text-stone-800 mt-1">Pro Plan</h3>
            <p className="text-xs text-stone-500 mt-2">Unlimited AI interaction, structured planners, and extensive tools.</p>
            
            <div className="mt-5 flex items-baseline">
              <span className="text-3xl font-black text-stone-900">₹199</span>
              <span className="text-xs text-stone-500 ml-1">/ month</span>
            </div>

            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-2.5 text-xs text-stone-700 font-semibold">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Unlimited AI Study Plans</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-700 font-semibold">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Unlimited AI Chats</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>30 AI Notes Generated/month</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>30 PDF Summarizers/month</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>30 Flashcard Sets/month</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>20 Quiz Arenas/month</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Calendar Planner & Group Study</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-stone-600">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Upload up to 50 Files</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-5 border-t border-black/5">
            {currentPlan === 'pro' ? (
              <button 
                disabled
                className="w-full py-2.5 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-xs uppercase tracking-wider"
              >
                Current Pro
              </button>
            ) : (
              <button 
                onClick={() => handleUpgrade('pro', 199)}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-sm hover:shadow-md"
              >
                {isProcessing ? 'Processing Transaction...' : 'Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>

        {/* PREMIUM PLAN ₹499/month (RECOMMENDED - Highlighted Gold) */}
        <div className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all ${
          currentPlan === 'premium'
            ? 'bg-amber-50/80 border-amber-400 shadow-xl ring-2 ring-amber-400/20'
            : 'bg-stone-900 text-stone-100 border-stone-800 shadow-xl'
        }`}>
          {/* Recommended ribbon */}
          <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-[9px] font-black bg-gradient-to-r from-amber-500 to-[#D4A373] text-white px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300">
            Highly Recommended
          </span>

          {currentPlan === 'premium' && (
            <span className="absolute top-4 right-4 text-[9px] font-black bg-amber-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Active Member
            </span>
          )}

          <div className="pt-2">
            <span className={`text-xs font-black uppercase tracking-widest flex items-center gap-1 ${
              currentPlan === 'premium' ? 'text-amber-700' : 'text-amber-400'
            }`}>
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Premium Learning
            </span>
            <h3 className={`text-xl font-extrabold mt-1 ${currentPlan === 'premium' ? 'text-stone-800' : 'text-white'}`}>Premium Plan</h3>
            <p className={`text-xs mt-2 ${currentPlan === 'premium' ? 'text-stone-500' : 'text-stone-400'}`}>
              Everything in Pro with completely uncapped limits and advanced predictive AI engines.
            </p>
            
            <div className="mt-5 flex items-baseline">
              <span className={`text-3xl font-black ${currentPlan === 'premium' ? 'text-stone-900' : 'text-white'}`}>₹499</span>
              <span className={`text-xs ml-1 ${currentPlan === 'premium' ? 'text-stone-500' : 'text-stone-400'}`}>/ month</span>
            </div>

            <ul className="mt-6 space-y-3">
              <li className={`flex items-start gap-2.5 text-xs font-bold ${currentPlan === 'premium' ? 'text-stone-800' : 'text-white'}`}>
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <span>Everything in Pro PLUS:</span>
              </li>
              <li className={`flex items-start gap-2.5 text-xs ${currentPlan === 'premium' ? 'text-stone-700' : 'text-stone-300'}`}>
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Unlimited AI Notes & PDFs summaries</span>
              </li>
              <li className={`flex items-start gap-2.5 text-xs ${currentPlan === 'premium' ? 'text-stone-700' : 'text-stone-300'}`}>
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Unlimited Quizzes & Mock Tests</span>
              </li>
              <li className={`flex items-start gap-2.5 text-xs ${currentPlan === 'premium' ? 'text-stone-700' : 'text-stone-300'}`}>
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Interactive Voice Chat & Lectures</span>
              </li>
              <li className={`flex items-start gap-2.5 text-xs ${currentPlan === 'premium' ? 'text-stone-700' : 'text-stone-300'}`}>
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>OCR Handwritten Notes scanner</span>
              </li>
              <li className={`flex items-start gap-2.5 text-xs ${currentPlan === 'premium' ? 'text-stone-700' : 'text-stone-300'}`}>
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Personalized adaptive AI Tutors</span>
              </li>
              <li className={`flex items-start gap-2.5 text-xs ${currentPlan === 'premium' ? 'text-stone-700' : 'text-stone-300'}`}>
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Predictive Exam Scores & Analytics</span>
              </li>
              <li className={`flex items-start gap-2.5 text-xs ${currentPlan === 'premium' ? 'text-stone-700' : 'text-stone-300'}`}>
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Unlimited Uploads & Fast AI Queues</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-5 border-t border-black/5">
            {currentPlan === 'premium' ? (
              <button 
                disabled
                className="w-full py-2.5 rounded-xl bg-amber-100 text-amber-800 font-extrabold text-xs uppercase tracking-wider"
              >
                Current Premium
              </button>
            ) : (
              <button 
                onClick={() => handleUpgrade('premium', 499)}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg border border-amber-400/20"
              >
                {isProcessing ? 'Processing...' : 'Upgrade to Premium'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Feature Checklist Table */}
      <div className="border-t border-black/10 pt-8 mt-4">
        <h4 className="text-sm font-black text-stone-800 uppercase tracking-widest mb-6 text-center">Full Features Comparison Matrix</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/5">
                <th className="pb-3 text-stone-500 font-extrabold">FEATURES</th>
                <th className="pb-3 text-stone-500 font-extrabold text-center">FREE</th>
                <th className="pb-3 text-blue-600 font-extrabold text-center">PRO (₹199)</th>
                <th className="pb-3 text-amber-600 font-extrabold text-center">PREMIUM (₹499)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[
                { name: 'AI Study Roadmaps', free: '5/month', pro: 'Unlimited', premium: 'Unlimited' },
                { name: 'AI Chat Tutor Interactions', free: '20/day', pro: 'Unlimited', premium: 'Unlimited' },
                { name: 'AI Notes Generators', free: 'Locked 🔒', pro: '30/month', premium: 'Unlimited' },
                { name: 'PDF Document Summarizer', free: 'Locked 🔒', pro: '30/month', premium: 'Unlimited' },
                { name: 'Flashcard Generator sets', free: 'Locked 🔒', pro: '30/month', premium: 'Unlimited' },
                { name: 'Quiz Generator tests', free: 'Locked 🔒', pro: '20/month', premium: 'Unlimited' },
                { name: 'Mind Maps layouts', free: 'Locked 🔒', pro: '15/month', premium: 'Unlimited' },
                { name: 'Previous-Year Style Questions', free: 'Locked 🔒', pro: 'Included ✔', premium: 'Included ✔' },
                { name: 'Google Calendar integration', free: 'Locked 🔒', pro: 'Included ✔', premium: 'Smart AI Auto Sync' },
                { name: 'Max File Upload capacity', free: 'Locked 🔒', pro: '50 Files', premium: 'Unlimited' },
                { name: 'Adaptive Pomodoro & focus music', free: 'Locked 🔒', pro: 'Standard', premium: 'AI Adaptive' },
                { name: 'OCR Handwritten notes scan', free: 'Locked 🔒', freeLock: true, pro: 'Locked 🔒', proLock: true, premium: 'Unlimited' },
                { name: 'Interactive Voice Chat & lecture mode', free: 'Locked 🔒', freeLock: true, pro: 'Locked 🔒', proLock: true, premium: 'Unlimited' },
                { name: 'Predictive Exam scores analysis', free: 'Locked 🔒', freeLock: true, pro: 'Locked 🔒', proLock: true, premium: 'Unlimited' },
                { name: 'Fastest Priority AI queue support', free: 'Locked 🔒', freeLock: true, pro: 'Standard', proLock: false, premium: 'Fastest ⚡' },
              ].map((f, idx) => (
                <tr key={idx} className="hover:bg-stone-100/50">
                  <td className="py-3 text-stone-700 font-bold">{f.name}</td>
                  <td className={`py-3 text-center ${f.free.includes('Locked') ? 'text-stone-400 font-light' : 'text-stone-800'}`}>{f.free}</td>
                  <td className={`py-3 text-center font-semibold ${f.pro.includes('Locked') ? 'text-stone-400 font-light' : 'text-blue-600 bg-blue-50/20'}`}>{f.pro}</td>
                  <td className="py-3 text-center font-bold text-amber-700 bg-amber-50/20">{f.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
