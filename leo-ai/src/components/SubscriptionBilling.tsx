/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Subscription, SubscriptionPayment } from '../types';
import { 
  CreditCard, 
  Check, 
  ArrowRight, 
  Calendar, 
  Receipt, 
  Sparkles, 
  Download, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Printer
} from 'lucide-react';

interface BillingProps {
  businessId: string;
  businessName: string;
}

export default function SubscriptionBilling({ businessId, businessName }: BillingProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradedPlanId, setUpgradedPlanId] = useState<'starter' | 'pro' | 'premium' | null>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<SubscriptionPayment | null>(null);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const farFuture = new Date(Date.now() + 36500 * 86400000).toISOString(); // 100 years lifetime lease
        const ownerSub: Subscription = {
          planId: 'premium',
          status: 'active',
          expiresAt: farFuture,
          razorpaySubscriptionId: 'sub_unlocked_lifetime',
          payments: [
            {
              id: 'pay_unlocked_lifetime',
              amount: 0,
              date: new Date().toISOString(),
              status: 'success',
              planId: 'premium',
            }
          ]
        };
        setSubscription(ownerSub);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, [businessId]);

  const handleSimulatePayment = async (planId: 'starter' | 'pro' | 'premium') => {
    setUpgrading(true);
    setUpgradedPlanId(planId);

    // Call simulated backend checkout session
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          businessName,
          email: 'neoedits2008@gmail.com', // user demo
        })
      });
      const data = await response.json();

      // Delay for realistic Razorpay checkout animation
      setTimeout(async () => {
        const cost = planId === 'starter' ? 999 : planId === 'pro' ? 1999 : 4999;
        const newPayment: SubscriptionPayment = {
          id: data.orderId || `pay_sim_${Math.random().toString(36).substring(2, 9)}`,
          amount: cost,
          date: new Date().toISOString(),
          status: 'success',
          planId: planId,
        };

        const updatedPayments = subscription ? [newPayment, ...subscription.payments] : [newPayment];

        const docRef = doc(db, 'businesses', businessId, 'settings', 'subscription');
        await updateDoc(docRef, {
          planId: planId,
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), // 30-day billing cycle
          razorpaySubscriptionId: data.subscriptionId,
          payments: updatedPayments,
        });

        setSubscription({
          planId,
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          razorpaySubscriptionId: data.subscriptionId,
          payments: updatedPayments,
        });

        setUpgrading(false);
        setUpgradedPlanId(null);
      }, 2000);
    } catch (err) {
      console.error(err);
      setUpgrading(false);
    }
  };

  const getPlanDetails = (planId: string) => {
    switch (planId) {
      case 'trial': return { name: 'Free Trial', price: '₹0', term: '14 days' };
      case 'starter': return { name: 'Starter Plan', price: '₹999', term: 'month' };
      case 'pro': return { name: 'Pro Plan', price: '₹1,999', term: 'month' };
      case 'premium': return { name: 'Premium Plan', price: '₹4,999', term: 'month' };
      default: return { name: 'Free Trial', price: '₹0', term: 'days' };
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="subscription-billing-panel">
      {/* Active Subscription Summary card */}
      <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white font-display">Active SaaS Subscription</h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-extrabold uppercase">
                UNLIMITED LIFETIME ACCESS
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
              Current Plan:{' '}
              <span className="text-emerald-400 font-bold uppercase">
                Enterprise Premium + All Features Unlocked (FREE & LIFETIME)
              </span>
              <span>•</span>
              <Calendar className="w-4 h-4 text-gray-500" />
              Renews / Expires: NEVER (Lifetime Unlocked)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold relative z-10 animate-pulse">
          <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>Full access granted for everyone. Starter, Business Pro, and Enterprise Premium features are 100% unlocked with zero payment or subscription required!</span>
        </div>
      </div>

      {/* Pricing Tiers Comparison Grid */}
      <div className="space-y-4">
        <h3 className="text-md font-bold text-white uppercase tracking-wider">Select Dashboard Tier</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Starter Plan */}
          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Starter</span>
                <span className="text-[10px] text-gray-500 font-semibold">For Local Shops</span>
              </div>
              <p className="text-3xl font-black text-white font-display">₹999<span className="text-xs text-gray-500 font-semibold">/month</span></p>
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">Perfect for dhabas, local stores, and clinics getting started with AI orders.</p>
              
              <ul className="space-y-3 mt-6 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> 500 AI replies/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> 1 WhatsApp Cloud number
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Menu & Order Management
                </li>
              </ul>
            </div>
            
            <button
              onClick={() => handleSimulatePayment('starter')}
              disabled={upgrading || subscription?.planId === 'starter'}
              className="w-full mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition disabled:opacity-50"
            >
              {upgrading && upgradedPlanId === 'starter' ? 'Opening Razorpay Secure...' : subscription?.planId === 'starter' ? 'Current Active Plan' : 'Select Starter Plan'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#0a0a0a] border-2 border-emerald-500 p-6 rounded-2xl flex flex-col justify-between relative shadow-xl shadow-emerald-500/5">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-black font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Most Popular
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Business Pro</span>
                <span className="text-[10px] text-gray-500 font-semibold">For Growing Brands</span>
              </div>
              <p className="text-3xl font-black text-white font-display">₹1,999<span className="text-xs text-gray-500 font-semibold">/month</span></p>
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">Highly recommended for popular cafes, restaurants, gyms, and salons.</p>
              
              <ul className="space-y-3 mt-6 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> 2,000 AI replies/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Auto-Order Confirmation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Bulk Price Adjustment tools
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Advanced Analytics Graphs
                </li>
              </ul>
            </div>
            
            <button
              onClick={() => handleSimulatePayment('pro')}
              disabled={upgrading || subscription?.planId === 'pro'}
              className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              {upgrading && upgradedPlanId === 'pro' ? 'Opening Razorpay Secure...' : subscription?.planId === 'pro' ? 'Current Active Plan' : 'Select Business Pro'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Enterprise Premium</span>
                <span className="text-[10px] text-gray-500 font-semibold">Unlimited Power</span>
              </div>
              <p className="text-3xl font-black text-white font-display">₹4,999<span className="text-xs text-gray-500 font-semibold">/month</span></p>
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">For major coaching centres, multi-chain clinics, and high-volume local stores.</p>
              
              <ul className="space-y-3 mt-6 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Unlimited AI replies/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Custom System Prompt Tuning
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Full CRM & Staff notes
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Multi-Number WhatsApp support
                </li>
              </ul>
            </div>
            
            <button
              onClick={() => handleSimulatePayment('premium')}
              disabled={upgrading || subscription?.planId === 'premium'}
              className="w-full mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition disabled:opacity-50"
            >
              {upgrading && upgradedPlanId === 'premium' ? 'Opening Razorpay Secure...' : subscription?.planId === 'premium' ? 'Current Active Plan' : 'Select Enterprise Premium'}
            </button>
          </div>

        </div>
      </div>

      {/* Razorpay Billing History & Invoice Download Table */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-sm font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Razorpay Subscription Billing History
          </h3>
          <p className="text-xs text-gray-400 mt-1">Download monthly invoices or review transaction status logs</p>
        </div>

        {!subscription?.payments || subscription.payments.length === 0 ? (
          <p className="text-center py-10 text-xs text-gray-500">No transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-6">Payment Reference ID</th>
                  <th className="py-3 px-6">Plan Tier</th>
                  <th className="py-3 px-6">Billing Date</th>
                  <th className="py-3 px-6">Paid Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                {subscription.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition duration-150">
                    <td className="py-4 px-6 font-mono font-bold text-emerald-400">{p.id}</td>
                    <td className="py-4 px-6 uppercase font-bold text-[10px] text-gray-400">{p.planId}</td>
                    <td className="py-4 px-6">{new Date(p.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                    <td className="py-4 px-6 font-display font-bold text-white">₹{p.amount}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-extrabold uppercase">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setInvoiceToPrint(p)}
                        className="text-emerald-400 hover:text-white hover:underline font-bold text-xs flex items-center justify-end gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal for Screen / Print Rendering */}
      {invoiceToPrint && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="invoice-modal">
          <div className="bg-white text-gray-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Action Bar (Top of invoice) */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 print:hidden">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Razorpay Verified Invoice
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintInvoice}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setInvoiceToPrint(null)}
                  className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close Invoice
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-display">LEO AI SAAS</h1>
                <p className="text-xs text-gray-500 mt-1">Noida Sector 62, Uttar Pradesh, India - 201301</p>
                <p className="text-[10px] text-gray-500">GSTIN: 09LEOAISAAS1209B1ZN</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Invoice</h2>
                <p className="text-xs text-gray-500 mt-0.5">Reference ID: {invoiceToPrint.id}</p>
                <p className="text-xs text-gray-500">Date: {new Date(invoiceToPrint.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Bill To Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Billed To</p>
                <p className="font-bold text-gray-800 mt-1">{businessName || 'My Business'}</p>
                <p className="text-gray-500 mt-0.5">Sector 62, Noida, UP, India</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Payment Method</p>
                <p className="font-bold text-gray-800 mt-1">Razorpay Secured UPI / Card</p>
                <p className="text-gray-500 mt-0.5">Status: <span className="text-green-600 font-bold uppercase">Success</span></p>
              </div>
            </div>

            {/* Table of Charges */}
            <table className="w-full text-left border-collapse border-b border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Item Specification Description</th>
                  <th className="py-3 px-4 text-right">Price Rate</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                <tr>
                  <td className="py-4 px-4 font-bold">
                    Leo AI Monthly SaaS Subscription - Plan Tier: <span className="text-blue-600 uppercase">{invoiceToPrint.planId}</span>
                    <p className="text-[10px] text-gray-400 font-normal mt-0.5">Includes full dashboard credentials, orders analytics, and automated replies.</p>
                  </td>
                  <td className="py-4 px-4 text-right">₹{invoiceToPrint.amount}</td>
                  <td className="py-4 px-4 text-right font-bold">₹{invoiceToPrint.amount}</td>
                </tr>
              </tbody>
            </table>

            {/* Total Block */}
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{invoiceToPrint.amount}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>CGST (9%)</span>
                  <span>₹0 (GST Exempted)</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>SGST (9%)</span>
                  <span>₹0 (GST Exempted)</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-gray-950 border-t border-gray-200 pt-2">
                  <span>Total Due</span>
                  <span>₹{invoiceToPrint.amount}</span>
                </div>
              </div>
            </div>

            {/* Invoice Footer details */}
            <div className="text-center pt-8 border-t border-gray-200 text-[10px] text-gray-400 leading-relaxed">
              🌸 Thank you for choosing Leo AI! This is a computer-generated, Razorpay-verified invoice.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
