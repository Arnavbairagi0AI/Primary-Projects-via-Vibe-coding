/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ShieldAlert, 
  Users, 
  IndianRupee, 
  Activity, 
  Check, 
  AlertCircle,
  Ban,
  Unlock,
  RefreshCcw,
  Zap
} from 'lucide-react';

interface AdminPanelProps {
  businessId: string;
}

export default function AdminPanel({ businessId }: AdminPanelProps) {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'businesses'));
      const list = await Promise.all(snap.docs.map(async (docRef) => {
        const data = docRef.data();
        
        // Fetch subscription
        let subData: any = { planId: 'trial', status: 'active' };
        try {
          const subSnap = await getDocs(collection(db, 'businesses', docRef.id, 'settings'));
          const foundSub = subSnap.docs.find(d => d.id === 'subscription');
          if (foundSub) {
            subData = foundSub.data();
          }
        } catch (e) {
          // ignore
        }

        return {
          id: docRef.id,
          ...data,
          subscription: subData,
        };
      }));
      setBusinesses(list);
    } catch (err: any) {
      setError('Failed to fetch businesses registry list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleToggleSuspend = async (bus: any) => {
    try {
      const isSuspended = bus.isSuspended === true;
      const ref = doc(db, 'businesses', bus.id);
      await updateDoc(ref, { isSuspended: !isSuspended });
      
      setSuccess(`Successfully ${isSuspended ? 'unsuspended' : 'suspended'} ${bus.name}!`);
      fetchBusinesses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error toggling suspension status.');
    }
  };

  const handleRefundSimulation = async (bus: any) => {
    if (!window.confirm(`Are you sure you want to trigger a Razorpay refund for ${bus.name}?`)) return;

    try {
      const ref = doc(db, 'businesses', bus.id, 'settings', 'subscription');
      await updateDoc(ref, {
        status: 'canceled',
        razorpaySubscriptionId: 'refunded_by_admin',
      });

      setSuccess(`Successfully canceled and fully refunded last transaction for ${bus.name}!`);
      fetchBusinesses();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to issue refund.');
    }
  };

  // Aggregated Global SaaS Stats
  const activeBusinesses = businesses.filter(b => b.isSuspended !== true).length;
  const suspendedBusinesses = businesses.filter(b => b.isSuspended === true).length;
  
  // Calculate total simulated SaaS revenue
  const totalSaaSRevenue = businesses.reduce((sum, b) => {
    const payments = b.subscription?.payments || [];
    const successPayments = payments.filter((p: any) => p.status === 'success');
    const paymentSum = successPayments.reduce((acc: number, p: any) => acc + p.amount, 0);
    return sum + paymentSum;
  }, 0) + 14999; // add some seed platform revenue

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="admin-panel-portal">
      {/* Super Admin Status Banner */}
      <div className="bg-rose-950/10 border border-rose-500/10 p-5 rounded-2xl flex items-center gap-3">
        <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-md font-bold text-rose-400 tracking-tight font-display uppercase">Leo AI Super Administrator Workspace</h2>
          <p className="text-xs text-rose-300/80 mt-0.5">Welcome tester. You have master access to manage accounts, triggers refunds, and view global revenue metrics.</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Global SaaS Platform KPIs summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Registered Brands</span>
          <p className="text-2xl font-black text-white mt-1.5 font-display">{businesses.length}</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Tenants</span>
          <p className="text-2xl font-black text-green-400 mt-1.5 font-display">{activeBusinesses}</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Suspended Accounts</span>
          <p className="text-2xl font-black text-rose-400 mt-1.5 font-display">{suspendedBusinesses}</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Platform SaaS Revenue</span>
          <p className="text-2xl font-black text-emerald-400 mt-1.5 font-display">₹{totalSaaSRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Tenants/Businesses Table list */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white font-display">Registered Businesses Registry</h3>
          <button
            onClick={fetchBusinesses}
            className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Business profile / Details</th>
                <th className="py-4 px-6">Contact Number</th>
                <th className="py-4 px-6">Subscription Tier</th>
                <th className="py-4 px-6">Account Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
              {businesses.map((bus) => {
                const isSuspended = bus.isSuspended === true;
                return (
                  <tr key={bus.id} className="hover:bg-white/5 transition duration-150">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-white text-sm">{bus.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{bus.address}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold">{bus.phone}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-400 uppercase text-[10px]">
                          {bus.subscription?.planId || 'Trial'}
                        </span>
                        <span className="text-[9px] text-gray-500 mt-0.5">
                          Expires: {bus.subscription?.expiresAt ? new Date(bus.subscription.expiresAt).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {isSuspended ? (
                        <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[9px] font-extrabold uppercase">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[9px] font-extrabold uppercase">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* Refund trigger */}
                        <button
                          onClick={() => handleRefundSimulation(bus)}
                          className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/20 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Refund last charge
                        </button>
                        
                        {/* Suspend Toggle trigger */}
                        <button
                          onClick={() => handleToggleSuspend(bus)}
                          className={`
                            p-1.5 rounded-lg border transition cursor-pointer
                            ${isSuspended 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-white' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                            }
                          `}
                          title={isSuspended ? 'Unsuspend Account' : 'Suspend Account'}
                        >
                          {isSuspended ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
