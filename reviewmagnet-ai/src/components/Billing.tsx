import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "motion/react";
import { 
  CreditCard, 
  Check, 
  QrCode, 
  Copy, 
  Send, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from "lucide-react";

export const Billing: React.FC = () => {
  const { user, payments, submitPaymentRequest } = useApp();
  const [upiIdInput, setUpiIdInput] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const staticUpiId = "reviewmagnet@upi";
  const upiUri = `upi://pay?pa=${staticUpiId}&pn=ReviewMagnet%20AI&am=5000&cu=INR&tn=ReviewMagnet%20Premium`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(staticUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate 12-digit UPI Transaction Reference ID (UTR)
    const cleanedId = upiIdInput.trim();
    if (!cleanedId) {
      setError("UPI Transaction Reference ID is mandatory.");
      return;
    }

    if (!/^\d{12}$/.test(cleanedId)) {
      setError("A valid UPI UTR/Transaction Reference ID must be exactly 12 numeric digits.");
      return;
    }

    setSubmitting(true);
    try {
      await submitPaymentRequest(cleanedId, 5000);
      setSuccess(true);
      setUpiIdInput("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Payment Portal</h1>
        <p className="text-sm text-slate-400">Manage your subscription, view transaction histories, and upgrade your plan.</p>
      </div>

      {/* Subscription Status Callout */}
      <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm">
              Your Current Status: Full Unlimited Access Unlocked (100% Free)
            </h4>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              Razorpay & Subscription requirements removed. Everyone has full, unrestricted access to AI Smart Replies, Review Hub, QR Placard Generator, and Admin Console.
            </p>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
            Active - Unlocked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Plan selection card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0e131f] rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-indigo-950 p-6 text-white text-center space-y-2 border-b border-slate-800/80">
              <h3 className="text-lg font-bold tracking-tight">Unlimited Open Plan</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-extrabold text-emerald-400">₹0</span>
                <span className="text-xs text-slate-300">/ Free Forever</span>
              </div>
              <p className="text-xs text-emerald-200">Full access granted to all users with zero paywall or fees</p>
            </div>

            {/* Features list */}
            <div className="p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Features Included:</h4>
              <ul className="space-y-3">
                {[
                  "Unlimited Automated Smart AI replies",
                  "Deep-learning context alerts for negative reviews",
                  "Custom Google Review QR Placard generator",
                  "High-resolution print countertop placards layouts",
                  "Durable cloud storage for reviews and audits",
                  "Dedicated 24/7 Priority chat support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <div className="p-0.5 bg-indigo-500/10 rounded-full text-indigo-400 shrink-0 border border-indigo-500/20">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Zero-Cost payment gateway workspace */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0e131f] p-6 rounded-2xl border border-slate-800/80 shadow-lg space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-400" />
                Zero-Cost UPI Payment Gateway
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Use your mobile phone to scan the UPI QR code below. Our system is completely zero-commission.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* UPI QR Column */}
              <div className="sm:col-span-5 flex flex-col items-center space-y-3">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xl flex items-center justify-center">
                  <img 
                    id="upi-payment-qr"
                    src={qrCodeUrl} 
                    alt="UPI Payment QR Code" 
                    className="w-44 h-44 block"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <QrCode className="h-3 w-3" />
                  UPI QR Code
                </div>
              </div>

              {/* Steps Instructions Column */}
              <div className="sm:col-span-7 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-200">How to Complete Payment:</h4>
                <ol className="space-y-3 text-xs text-slate-300">
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-400">1.</span>
                    <span>Scan the QR code with any UPI App (Paytm, Google Pay, PhonePe, BHIM, etc.).</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <span className="font-bold text-indigo-400">2.</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>Or pay directly to UPI ID:</span>
                      <code className="bg-[#131a26] px-1.5 py-0.5 rounded font-mono text-indigo-400 border border-slate-800/80 font-semibold">{staticUpiId}</code>
                      <button
                        type="button"
                        id="copy-upi-btn"
                        onClick={handleCopyUpi}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-bold focus:outline-none cursor-pointer"
                      >
                        {copiedUpi ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-400">3.</span>
                    <span>Input exact amount of <span className="font-bold text-white">₹5,000 INR</span> and complete transaction.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-400">4.</span>
                    <span>Copy the <span className="font-bold text-white">12-digit UPI Transaction ID</span> (UTR Number) and enter below.</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handlePaymentSubmit} className="border-t border-slate-800 pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Amount to Pay (INR)
                  </label>
                  <div className="px-3 py-2 border border-slate-800 bg-[#131a26] rounded-lg text-slate-300 text-sm font-semibold">
                    ₹ 5,000
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    12-Digit UPI Transaction ID (UTR) *
                  </label>
                  <input
                    id="upi-trans-id-input"
                    type="text"
                    required
                    maxLength={12}
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value.replace(/\D/g, ""))} // Only digits
                    placeholder="e.g. 340512894567"
                    className="block w-full px-3 py-2 bg-[#131a26] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border-l-4 border-rose-500 rounded text-xs text-rose-400 flex items-start gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-500/10 border-l-4 border-emerald-500 rounded text-xs text-emerald-400 flex items-start gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="font-bold">Upgrade request submitted!</span> Your premium membership is pending administrative review. We usually approve manual UPI transactions within 15 minutes!
                  </div>
                </div>
              )}

              <button
                id="submit-payment-btn"
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 rounded-lg shadow-md shadow-indigo-500/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit for Activation"}
              </button>
            </form>
          </div>

          {/* Payment History Table */}
          <div className="bg-[#0e131f] p-5 rounded-2xl border border-slate-800/80 shadow-lg space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Transaction History
            </h3>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No manual transaction records found on this account.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                  <thead className="bg-[#131a26] font-semibold text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Transaction ID</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5">
                          {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short"
                          })}
                        </td>
                        <td className="px-4 py-2.5 font-mono">{p.upiTransactionId}</td>
                        <td className="px-4 py-2.5">₹{p.amount}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.confirmationStatus === "Approved"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {p.confirmationStatus === "Approved" ? "Approved" : "Pending Approval"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
