/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdatePlan: (plan: 'free' | 'pro' | 'premium') => void;
  onUpdateProfile: (displayName: string, dailyGoal: number) => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi';
  name: string;
  details: string; // e.g. "•••• •••• •••• 4242" or "rinki@ybl"
  isDefault: boolean;
  expiry?: string;
  brand?: string;
}

export default function SettingsView({
  userProfile,
  onUpdatePlan,
  onUpdateProfile
}: SettingsViewProps) {
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [dailyGoal, setDailyGoal] = useState(userProfile.dailyStudyGoal || 45);
  const [appLang, setAppLang] = useState<'en' | 'hi'>('en');
  const [aiPref, setAiPref] = useState<'flash' | 'pro'>('flash');
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Saved Payment Methods state (persists in localStorage)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const saved = localStorage.getItem('studyflow_payment_methods');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: 'pay_1', type: 'card', name: 'Rinki Bairagi', details: '•••• •••• •••• 8291', isDefault: true, expiry: '12/29', brand: 'Visa' },
      { id: 'pay_2', type: 'upi', name: 'Rinki Bairagi UPI', details: 'rinki@okhdfcbank', isDefault: false }
    ];
  });

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'card' | 'upi'>('card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');

  const savePaymentMethods = (methods: PaymentMethod[]) => {
    setPaymentMethods(methods);
    localStorage.setItem('studyflow_payment_methods', JSON.stringify(methods));
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    let newMethod: PaymentMethod;
    if (newMethodType === 'card') {
      if (!cardHolder.trim() || !cardNumber.trim() || !cardExpiry.trim()) {
        alert("Please fill in all card details!");
        return;
      }
      const digitsOnly = cardNumber.replace(/\D/g, '');
      const lastFour = digitsOnly.slice(-4) || '1111';
      newMethod = {
        id: 'pay_' + Date.now(),
        type: 'card',
        name: cardHolder.trim(),
        details: `•••• •••• •••• ${lastFour}`,
        expiry: cardExpiry,
        brand: cardBrand,
        isDefault: paymentMethods.length === 0
      };
    } else {
      if (!upiId.trim() || !upiId.includes('@')) {
        alert("Please enter a valid UPI ID (e.g. name@upi)!");
        return;
      }
      newMethod = {
        id: 'pay_' + Date.now(),
        type: 'upi',
        name: 'UPI Auto-pay',
        details: upiId.trim().toLowerCase(),
        isDefault: paymentMethods.length === 0
      };
    }

    const updated = [...paymentMethods, newMethod];
    savePaymentMethods(updated);
    
    // Reset form
    setCardHolder('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setUpiId('');
    setShowAddMethod(false);
    setMessage('✓ New payment method added successfully!');
  };

  const handleSetDefault = (id: string) => {
    const updated = paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === id
    }));
    savePaymentMethods(updated);
    setMessage('✓ Default payment method updated!');
  };

  const handleDeleteMethod = (id: string) => {
    const methodToDelete = paymentMethods.find(m => m.id === id);
    if (methodToDelete?.isDefault && paymentMethods.length > 1) {
      alert("Please set another default payment method before deleting this one!");
      return;
    }
    const updated = paymentMethods.filter(m => m.id !== id);
    // If we deleted default, set another default
    if (methodToDelete?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    savePaymentMethods(updated);
    setMessage('✓ Payment method removed.');
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      // Save directly to parent
      onUpdateProfile(displayName, dailyGoal);
      
      // Sync to Firestore
      try {
        await setDoc(doc(db, 'users', userProfile.uid), {
          ...userProfile,
          displayName,
          dailyStudyGoal: dailyGoal
        }, { merge: true });
      } catch (fErr) {
        console.warn("Firestore save profile merge skipped:", fErr);
      }

      setMessage('Preferences saved successfully!');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isNormalUserEmail = 
    userProfile.email?.toLowerCase() === 'rinkibairagi1989@gmail.com' || 
    userProfile.email?.toLowerCase() === 'reikinbaragi1989@gmail.com';

  const handleSimulateSubscription = async (plan: 'free' | 'pro' | 'premium') => {
    setMessage('');
    
    if (isNormalUserEmail && plan !== 'free') {
      alert("⚠️ Premium upgrades are restricted for this normal student account (rinkibairagi1989@gmail.com). You must use the Free tier with no subscription.");
      return;
    }

    setLoading(true);

    try {
      // Elevate subscription tier
      onUpdatePlan(plan);

      // Sync user profile state in Firestore
      try {
        await setDoc(doc(db, 'users', userProfile.uid), {
          ...userProfile,
          currentPlan: plan,
          subscriptionStatus: plan === 'free' ? 'inactive' : 'active',
          subscriptionExpiresAt: plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, { merge: true });
      } catch (fErr) {
        console.warn("Firestore subscription save skip:", fErr);
      }

      setMessage(`🎉 Plan updated to ${plan.toUpperCase()}! Premium capabilities activated immediately.`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Settings Form Column */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Profile Card */}
        <div className="study-card p-6 bg-white space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-black">User Preferences</p>
          <form onSubmit={handleSavePreferences} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Display Name</label>
                <input 
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Arnav Singh"
                  className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Daily Goal (Minutes)</label>
                <input 
                  type="number"
                  min="10"
                  max="300"
                  required
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-black text-stone-400">App Language Interface</label>
                <select 
                  value={appLang}
                  onChange={(e) => setAppLang(e.target.value as any)}
                  className="w-full bg-[#F5F5F0] border border-black/5 rounded-xl px-2.5 py-2.5 text-[11px] font-bold outline-none cursor-pointer"
                >
                  <option value="en">English (Default)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-black text-stone-400">Gemini LLM Engine</label>
                <select 
                  value={aiPref}
                  onChange={(e) => setAiPref(e.target.value as any)}
                  className="w-full bg-[#F5F5F0] border border-black/5 rounded-xl px-2.5 py-2.5 text-[11px] font-bold outline-none cursor-pointer"
                >
                  <option value="flash">Gemini 3.5 Flash (Balanced speed)</option>
                  <option value="pro">Gemini 1.5 Pro (Max reasoning)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl pt-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-stone-700">Receive Push Notifications</span>
                <span className="text-[9px] text-stone-400 font-medium">Daily exam countdown reminders & streak updates</span>
              </div>
              <input 
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4 accent-brand-sage cursor-pointer"
              />
            </div>

            {message && <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-bold">✓ {message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#5A5A40] text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider shadow-sm"
            >
              Save Configuration
            </button>
          </form>
        </div>

        {/* Saved Payment Methods Section */}
        <div className="study-card p-6 bg-white space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-black">Billing & Invoices</p>
              <h3 className="text-sm font-bold text-stone-800">Saved Payment Methods</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMethod(!showAddMethod)}
              className="text-[10px] bg-[#5A5A40] hover:bg-[#494933] text-white font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{showAddMethod ? '✕ Cancel' : '➕ Add New'}</span>
            </button>
          </div>

          {/* Add Method Form */}
          {showAddMethod && (
            <form onSubmit={handleAddPaymentMethod} className="p-4 bg-stone-50 border border-stone-200/60 rounded-2xl space-y-3.5 animate-fadeIn">
              <span className="text-[11px] uppercase tracking-wider font-black text-stone-500 block">
                Add Payment Credentials
              </span>
              
              <div className="flex gap-4 border-b border-stone-200/40 pb-2 text-xs">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer text-stone-700">
                  <input 
                    type="radio" 
                    checked={newMethodType === 'card'} 
                    onChange={() => setNewMethodType('card')} 
                    className="accent-[#5A5A40]" 
                  />
                  💳 Credit/Debit Card
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer text-stone-700">
                  <input 
                    type="radio" 
                    checked={newMethodType === 'upi'} 
                    onChange={() => setNewMethodType('upi')} 
                    className="accent-[#5A5A40]" 
                  />
                  ⚡ UPI (UPI Auto-pay)
                </label>
              </div>

              {newMethodType === 'card' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-black text-stone-400 block">Cardholder Name</label>
                      <input 
                        type="text" 
                        required
                        value={cardHolder} 
                        onChange={(e) => setCardHolder(e.target.value)} 
                        placeholder="Rinki Bairagi"
                        className="w-full bg-white border border-stone-200 focus:border-[#5A5A40] rounded-xl px-3 py-2 text-xs outline-none text-stone-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-black text-stone-400 block">Card Issuer Brand</label>
                      <select 
                        value={cardBrand} 
                        onChange={(e) => setCardBrand(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer text-stone-700"
                      >
                        <option value="Visa">Visa Premium</option>
                        <option value="Mastercard">Mastercard Gold</option>
                        <option value="RuPay">RuPay Elite</option>
                        <option value="Amex">American Express</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-black text-stone-400 block">Card Number</label>
                    <input 
                      type="text" 
                      required
                      value={cardNumber} 
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} 
                      placeholder="4111 2222 3333 4444"
                      className="w-full bg-white border border-stone-200 focus:border-[#5A5A40] rounded-xl px-3 py-2 text-xs outline-none font-mono tracking-wider text-stone-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-black text-stone-400 block">Expiry Date</label>
                      <input 
                        type="text" 
                        required
                        value={cardExpiry} 
                        onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))} 
                        placeholder="MM/YY"
                        className="w-full bg-white border border-stone-200 focus:border-[#5A5A40] rounded-xl px-3 py-2 text-xs outline-none text-stone-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-black text-stone-400 block">CVV Code</label>
                      <input 
                        type="password" 
                        required
                        value={cardCvv} 
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                        placeholder="•••"
                        className="w-full bg-white border border-stone-200 focus:border-[#5A5A40] rounded-xl px-3 py-2 text-xs outline-none text-stone-700"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-black text-stone-400 block">Virtual Payment Address (VPA / UPI ID)</label>
                  <input 
                    type="text" 
                    required
                    value={upiId} 
                    onChange={(e) => setUpiId(e.target.value)} 
                    placeholder="rinki@okhdfcbank"
                    className="w-full bg-white border border-stone-200 focus:border-[#5A5A40] rounded-xl px-3 py-2 text-xs outline-none text-stone-700 font-mono"
                  />
                  <p className="text-[9px] text-stone-400">Standard UPI mandates auto-renewals on ₹199/₹499 subscriptions.</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                💾 Save Payment Method
              </button>
            </form>
          )}

          {/* Payment Method List */}
          <div className="space-y-3">
            {paymentMethods.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-2 text-center">No payment methods added. Please insert a mock payment gateway above to handle subscriptions.</p>
            ) : (
              paymentMethods.map((method) => (
                <div 
                  key={method.id} 
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    method.isDefault 
                      ? 'bg-stone-50 border-stone-300 shadow-sm' 
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-lg shadow-sm border border-stone-200/50 shrink-0">
                      {method.type === 'card' ? '💳' : '⚡'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-stone-800">{method.name}</span>
                        {method.type === 'card' && (
                          <span className="text-[8px] bg-stone-200 text-stone-600 px-1.5 py-0.2 rounded font-black uppercase">
                            {method.brand}
                          </span>
                        )}
                        {method.isDefault && (
                          <span className="text-[8px] bg-[#5A5A40]/10 text-[#5A5A40] border border-[#5A5A40]/20 px-2 py-0.2 rounded-full font-black uppercase tracking-wider">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-stone-500 mt-0.5 tracking-wider">{method.details}</p>
                      {method.expiry && <p className="text-[9px] text-stone-400 mt-0.5">Expires: {method.expiry}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!method.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(method.id)}
                        className="text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-600 px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteMethod(method.id)}
                      className="text-[9px] hover:bg-red-50 text-red-600 px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Subscription SaaS pricing packages card */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-[#2C2C2B] rounded-[32px] p-6 text-white space-y-5 shadow-2xl relative overflow-hidden">
          
          <div className="border-b border-white/10 pb-4">
            <span className="text-[9px] uppercase tracking-widest text-[#D4A373] font-black">Plan Tier Settings</span>
            <h3 className="text-lg font-serif italic text-white mt-1">StudyFlow Pricing SaaS</h3>
            <p className="text-[11px] text-stone-400 font-medium">Select a plan to instantly elevate your cloud limit quotas</p>
          </div>

          <div className="space-y-4">
            
            {/* Free Plan */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
              <div>
                <h4 className="text-xs font-extrabold uppercase text-stone-300">Free Tier</h4>
                <p className="text-[10px] text-stone-400 mt-1">5 AI Chats/day • 2 PDFs/day</p>
              </div>
              {userProfile.currentPlan === 'free' ? (
                <span className="text-[10px] bg-white/10 text-stone-300 px-2 py-0.5 rounded-full font-bold">Active</span>
              ) : (
                <button 
                  onClick={() => handleSimulateSubscription('free')}
                  className="bg-white/10 text-stone-300 text-[10px] font-black uppercase px-2.5 py-1 rounded hover:bg-white/20 transition-all cursor-pointer"
                >
                  Downgrade
                </button>
              )}
            </div>

            {/* Pro Plan */}
            <div className={`p-4 rounded-2xl flex justify-between items-center border ${userProfile.currentPlan === 'pro' ? 'bg-[#5A5A40]/30 border-brand-sage' : 'bg-white/5 border-white/10'}`}>
              <div>
                <h4 className="text-xs font-extrabold uppercase text-brand-sand">Pro SaaS Plan</h4>
                <p className="text-[10px] text-stone-300 mt-0.5">₹199 / month</p>
                <p className="text-[10px] text-stone-400 mt-1">Unlimited Chats, Quizzes & PDFs</p>
              </div>
              {userProfile.currentPlan === 'pro' ? (
                <span className="text-[10px] bg-brand-sand/20 text-brand-sand px-2.5 py-0.5 rounded-full font-bold">Active</span>
              ) : (
                <button 
                  onClick={() => handleSimulateSubscription('pro')}
                  className="bg-brand-sage hover:bg-[#494933] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded transition-all cursor-pointer"
                >
                  Select
                </button>
              )}
            </div>

            {/* Premium Plan */}
            <div className={`p-4 rounded-2xl flex justify-between items-center border ${userProfile.currentPlan === 'premium' ? 'bg-[#D4A373]/20 border-brand-sand' : 'bg-white/5 border-white/10'}`}>
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold uppercase text-stone-100">Premium Plan</h4>
                  <span className="text-[7.5px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.2 rounded font-black uppercase">Best Value</span>
                </div>
                <p className="text-[10px] text-stone-300 mt-0.5">₹499 / month</p>
                <p className="text-[9.5px] text-stone-400 mt-1 leading-relaxed">
                  All in Pro + 👥 Group Rooms + 📊 Analytics + 🎵 Focus Soundscapes + 👑 Scholar Profile Aura!
                </p>
              </div>
              {userProfile.currentPlan === 'premium' ? (
                <span className="text-[10px] bg-white/20 text-stone-200 px-2.5 py-0.5 rounded-full font-bold shrink-0">Active</span>
              ) : (
                <button 
                  onClick={() => handleSimulateSubscription('premium')}
                  className="bg-brand-sand text-stone-900 text-[10px] font-black uppercase px-2.5 py-1 rounded transition-all cursor-pointer hover:scale-105 shrink-0"
                >
                  Elevate
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
