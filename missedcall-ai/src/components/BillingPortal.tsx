import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, CreditCard, ShieldCheck, QrCode, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';

export const BillingPortal: React.FC = () => {
  const { user, addPayment, payments, updateProfile } = useApp();
  const [upiRefId, setUpiRefId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Features included in the Premium Recovery Plan
  const planFeatures = [
    '24/7 AI Missed Call SMS Receptionist',
    'Unlimited SMS Auto-Replies & Conversations',
    'Public Scheduling Portal & CRM Calendar',
    'Real-time Analytics Dashboard & Urgency Badges',
    'Premium SMS Delivery Lines with 5-Sec Dispatch',
    'Multi-agent Staff Role Support'
  ];

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    // Basic 12-digit validation
    const cleanRefId = upiRefId.trim();
    if (!/^\d{12}$/.test(cleanRefId)) {
      setFormError('UPI Transaction ID must be a valid 12-digit numeric reference number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPayment(5000, cleanRefId);
      
      // Also automatically elevate subscription to "Active" for sandbox convenience!
      // This allows the user to immediately experience the activated state without waiting,
      // while displaying a notification explaining that the admin will verify it.
      await updateProfile({ subscriptionStatus: 'Active' });

      setSuccessMsg('Your transaction reference has been recorded successfully. Your dashboard has been activated instantly in trial-bypass mode while we verify the payment reference in our database!');
      setUpiRefId('');
    } catch (err: any) {
      setFormError(err.message || 'Payment recording failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="billing-portal-container">
      
      {/* Universal Lifetime Premium Access Banner */}
      <div className="col-span-12 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 p-[1px] rounded-2xl shadow-lg mb-2">
        <div className="bg-slate-950 p-6 rounded-[15px] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/20">
                  ✨ 100% Free Lifetime Full Access
                </span>
              </div>
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                No Subscriptions or Razorpay Needed!
              </h2>
              <p className="text-xs text-slate-400 font-sans max-w-2xl leading-relaxed">
                You have <span className="text-amber-400 font-bold">Unrestricted Full Access</span> to all features. No payment wall, no mandatory subscription, and no email sign-in barrier. All AI missed-call auto-responders, lead booking engines, and analytics are completely unlocked for everyone.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg uppercase tracking-wider font-mono">
                ● FULL ACCESS UNLOCKED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Pricing Plan Selector - Left Column */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-5 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
            UNLIMITED FREE PLAN
          </span>
          <h2 className="text-xl font-bold text-slate-900 font-sans">Full Recovery Suite</h2>
          <p className="text-xs text-slate-500 font-sans">
            Scale up lead recovery with zero paywall obstacles.
          </p>

          <div className="py-4 border-y border-slate-100 flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight font-sans">₹0</span>
            <span className="text-xs text-emerald-600 font-bold font-sans uppercase">/ Always Free</span>
          </div>

          <div className="space-y-3 pt-2">
            {planFeatures.map((feat) => (
              <div key={feat} className="flex items-start gap-3 text-xs text-slate-600">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="font-sans font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900">100% Unrestricted Access</span>
            <span className="text-[10px] text-slate-500">No payment processor or Razorpay subscription required.</span>
          </div>
        </div>
      </div>

      {/* 2. Optional UPI Gateway / Reference Logging - Right Column */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-7 space-y-6">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 font-sans">Direct Business Support (Optional)</h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            All capabilities are already 100% free. If you wish to log a direct donation or business reference ID, you may optional scan or enter reference below.
          </p>
        </div>

        {/* UPI Interactive Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Dynamic Vector QR Code */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 border border-slate-100 rounded-2xl bg-slate-50 relative group">
            <div className="relative w-36 h-36 bg-white p-2 rounded-xl border border-slate-200/50 shadow-sm flex items-center justify-center">
              {/* Elegant SVG-based simulated QR Code */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 font-semibold select-none" id="upi-qr-code-svg">
                {/* 3 Large Corner Anchors */}
                <rect x="5" y="5" width="22" height="22" rx="3" fill="currentColor" />
                <rect x="9" y="9" width="14" height="14" rx="2" fill="white" />
                <rect x="12" y="12" width="8" height="8" rx="1" fill="currentColor" />

                <rect x="73" y="5" width="22" height="22" rx="3" fill="currentColor" />
                <rect x="77" y="9" width="14" height="14" rx="2" fill="white" />
                <rect x="80" y="12" width="8" height="8" rx="1" fill="currentColor" />

                <rect x="5" y="73" width="22" height="22" rx="3" fill="currentColor" />
                <rect x="9" y="77" width="14" height="14" rx="2" fill="white" />
                <rect x="12" y="80" width="8" height="8" rx="1" fill="currentColor" />

                {/* Simulated QR Pixels matrix */}
                <rect x="35" y="5" width="6" height="12" rx="1" fill="currentColor" />
                <rect x="45" y="12" width="12" height="6" rx="1" fill="currentColor" />
                <rect x="62" y="5" width="6" height="6" rx="1" fill="currentColor" />
                
                <rect x="35" y="24" width="18" height="6" rx="1" fill="currentColor" />
                <rect x="60" y="20" width="6" height="12" rx="1" fill="currentColor" />
                <rect x="40" y="35" width="6" height="6" rx="1" fill="currentColor" />
                <rect x="52" y="35" width="12" height="12" rx="1" fill="currentColor" />
                <rect x="73" y="35" width="6" height="18" rx="1" fill="currentColor" />
                
                <rect x="5" y="35" width="12" height="6" rx="1" fill="currentColor" />
                <rect x="23" y="35" width="6" height="12" rx="1" fill="currentColor" />
                <rect x="5" y="47" width="6" height="18" rx="1" fill="currentColor" />
                <rect x="18" y="55" width="18" height="6" rx="1" fill="currentColor" />
                
                <rect x="35" y="55" width="6" height="12" rx="1" fill="currentColor" />
                <rect x="45" y="52" width="12" height="6" rx="1" fill="currentColor" />
                <rect x="62" y="55" width="6" height="6" rx="1" fill="currentColor" />
                
                <rect x="73" y="62" width="18" height="6" rx="1" fill="currentColor" />
                <rect x="60" y="73" width="6" height="12" rx="1" fill="currentColor" />
                <rect x="35" y="73" width="12" height="6" rx="1" fill="currentColor" />
                <rect x="40" y="85" width="18" height="6" rx="1" fill="currentColor" />
                <rect x="73" y="85" width="6" height="6" rx="1" fill="currentColor" />
                <rect x="85" y="73" width="6" height="6" rx="1" fill="currentColor" />

                {/* Tiny central UPI brand badge icon */}
                <rect x="42" y="42" width="16" height="16" rx="4" fill="indigo" />
                <text x="50" y="53" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">UPI</text>
              </svg>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-500 mt-3 tracking-wider flex items-center gap-1 uppercase">
              <Smartphone className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> SCAN WITH UPI APP
            </span>
          </div>

          {/* UPI Text Guide */}
          <div className="md:col-span-7 space-y-4 font-sans text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">UPI ADDRESS</span>
              <p className="text-sm font-black text-slate-900 font-mono">missedcallai@upi</p>
            </div>

            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 text-[11px] block">Payment Instructions:</span>
              <ol className="list-decimal pl-4 space-y-1 leading-relaxed text-[11px]">
                <li>Scan the QR Code or copy our UPI ID above.</li>
                <li>Transfer exactly **₹5,000** for high-volume limits.</li>
                <li>Copy the 12-digit transaction reference number (UTR / Ref ID).</li>
                <li>Paste it below and submit to bypass trial status.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* UPI Ref Submission Form */}
        <form onSubmit={handlePaymentSubmit} className="space-y-4 border-t border-slate-100 pt-5" id="upi-ref-verification-form">
          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 font-sans uppercase tracking-wider">
              12-Digit UPI Transaction Ref / UTR ID *
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="upi-ref-id-input"
                type="text"
                required
                maxLength={12}
                placeholder="e.g. 340946605250"
                value={upiRefId}
                onChange={(e) => setUpiRefId(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500 font-mono font-bold tracking-widest text-slate-900"
              />
              <button
                id="submit-payment-btn"
                type="submit"
                disabled={isSubmitting || !upiRefId}
                className="px-6 py-3 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                {isSubmitting ? 'Verifying Ref...' : 'Submit for Activation'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              * Verification occurs asynchronously. Trial-bypass is activated immediately upon reference logging!
            </p>
          </div>
        </form>

        {/* Historical Transactions List */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <span className="text-xs font-bold text-slate-700 font-sans uppercase tracking-wider block">
            Payment History Log
          </span>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1" id="payment-logs-list">
            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No past transactions recorded. Submit your UPI Ref ID above to log your first payment.
              </p>
            ) : (
              payments.map((p) => (
                <div 
                  id={`payment-log-${p.id}`}
                  key={p.id} 
                  className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200 text-slate-700 rounded-lg shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-950 font-mono">Ref: {p.upiTransactionId}</span>
                      <span className="text-[10px] text-slate-400">{new Date(p.paymentDate).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-slate-900">₹{p.amount}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(p.confirmationStatus)}`}>
                      {p.confirmationStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
