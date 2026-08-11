import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "motion/react";
import { 
  Users, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  FileCheck,
  Zap,
  Check
} from "lucide-react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { PaymentTransaction } from "../types";

export const AdminConsole: React.FC = () => {
  const { user, adminApprovePayment } = useApp();
  const [allPendingPayments, setAllPendingPayments] = useState<PaymentTransaction[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Sync all pending payments globally so we can simulate a SaaS admin reviewing them
  useEffect(() => {
    if (!user) return;

    const paymentsRef = collection(db, "payments");
    const unsubscribe = onSnapshot(paymentsRef, (snapshot) => {
      const fetched: PaymentTransaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.confirmationStatus === "Pending") {
          fetched.push({ id: doc.id, ...data } as PaymentTransaction);
        }
      });
      // Sort newest first
      fetched.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      setAllPendingPayments(fetched);
    });

    return () => unsubscribe();
  }, [user]);

  const handleApprove = async (paymentId: string, userId: string) => {
    setApprovingId(paymentId);
    try {
      await adminApprovePayment(paymentId, userId);
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Approval Panel (Demo sandbox)</h1>
          <p className="text-sm text-slate-400">
            Simulate the SaaS provider admin backoffice. Review incoming UPI transfer reference receipts and activate subscriptions.
          </p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
            <Zap className="h-3.5 w-3.5" />
            Sandbox Developer Mode
          </span>
        </div>
      </div>

      {/* Admin Information Alert */}
      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/30 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-indigo-200">How to test the SaaS Upgrade Loop:</h4>
          <ol className="list-decimal list-inside text-xs text-indigo-300 space-y-1 leading-relaxed">
            <li>Go to the <b className="text-white font-semibold">Billing</b> page and submit a 12-digit mock Transaction Ref ID.</li>
            <li>Return here to view the pending ticket instantly.</li>
            <li>Click <b className="text-white font-semibold">Approve & Activate</b> to simulate direct bank verification, upgrading the target user to Premium!</li>
          </ol>
        </div>
      </div>

      {/* Main Pending Payments List */}
      <div className="bg-[#0e131f] rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-400" />
            Pending Activation Tickets ({allPendingPayments.length})
          </h3>
        </div>

        {allPendingPayments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <CheckCircle className="h-10 w-10 text-emerald-500/10 mb-2" />
            <h4 className="font-bold text-slate-300 text-sm">All Clear!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              There are no pending subscription activation tickets. Submit a payment transaction on the Billing tab to test!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
              <thead className="bg-[#131a26] font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Business / Client Info</th>
                  <th className="px-6 py-3.5">UTR Reference Number</th>
                  <th className="px-6 py-3.5">Amount Paid</th>
                  <th className="px-6 py-3.5">Ticket Age</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {allPendingPayments.map((p) => {
                  const ticketAgeSeconds = Math.max(0, Math.floor((Date.now() - new Date(p.paymentDate).getTime()) / 1000));
                  let displayAge = `${ticketAgeSeconds}s ago`;
                  if (ticketAgeSeconds >= 60) {
                    displayAge = `${Math.floor(ticketAgeSeconds / 60)}m ago`;
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/20">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{p.businessName || "My Business"}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {p.userId.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-300">
                        {p.upiTransactionId}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-indigo-400">
                        ₹ {p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {displayAge}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`approve-btn-${p.id}`}
                          onClick={() => handleApprove(p.id, p.userId)}
                          disabled={approvingId === p.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-600/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {approvingId === p.id ? "Activating..." : "Approve & Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-slate-800/80 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Tenants</h4>
            <p className="text-xl font-bold text-white">1 Real-Time</p>
          </div>
        </div>
        <div className="bg-[#0e131f] p-5 rounded-2xl border border-slate-800/80 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projected ARR</h4>
            <p className="text-xl font-bold text-white">₹ 60,000</p>
          </div>
        </div>
      </div>
    </div>
  );
};
