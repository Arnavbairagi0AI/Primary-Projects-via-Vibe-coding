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
import { Customer } from '../types';
import { 
  Users, 
  Search, 
  Phone, 
  TrendingUp, 
  MessageSquarePlus, 
  Calendar, 
  Award, 
  Check, 
  AlertCircle,
  Download
} from 'lucide-react';

interface CustomersProps {
  businessId: string;
  initialSearchQuery?: string;
  onClearInitialSearchQuery?: () => void;
}

export default function CustomersDirectory({ businessId, initialSearchQuery, onClearInitialSearchQuery }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [success, setSuccess] = useState('');

  // Handle preset initial search query
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      if (onClearInitialSearchQuery) {
        onClearInitialSearchQuery();
      }
    }
  }, [initialSearchQuery, onClearInitialSearchQuery]);

  const fetchCustomers = async () => {
    try {
      const snap = await getDocs(collection(db, 'businesses', businessId, 'customers'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [businessId]);

  const handleStartEditingNotes = (cust: Customer) => {
    setEditingNotesId(cust.id);
    setTempNotes(cust.notes || '');
  };

  const handleSaveNotes = async (custId: string) => {
    try {
      const ref = doc(db, 'businesses', businessId, 'customers', custId);
      await updateDoc(ref, { notes: tempNotes });
      setCustomers(customers.map(c => c.id === custId ? { ...c, notes: tempNotes } : c));
      setEditingNotesId(null);
      setSuccess('Customer staff notes updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const query = searchQuery.toLowerCase();
    return (
      cust.name.toLowerCase().includes(query) ||
      cust.phone.toLowerCase().includes(query) ||
      (cust.notes && cust.notes.toLowerCase().includes(query))
    );
  });

  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Phone Number',
      'Orders Placed',
      'Total Value Spent (INR)',
      'Registered At',
      'Loyalty Tier',
      'Staff Notes'
    ];

    const rows = filteredCustomers.map(cust => {
      return [
        `"${cust.id}"`,
        `"${cust.name.replace(/"/g, '""')}"`,
        `"${cust.phone}"`,
        cust.orderCount || 0,
        cust.totalValue || 0,
        `"${cust.createdAt ? new Date(cust.createdAt).toLocaleString('en-IN') : 'N/A'}"`,
        `"${(cust.tier || 'STANDARD').toUpperCase()}"`,
        `"${(cust.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="customers-directory-panel">
      {/* Top Search bar Row */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Customers Directory
          </h2>
          <p className="text-xs text-gray-400 mt-1">Review verified contact records, order history, and custom staff logs</p>
        </div>
        
        {/* Search Input bar & Export Button */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, number, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs focus:border-emerald-500/50 outline-none placeholder-gray-500"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0"
            title="Export Customers to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Customer List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-[#0a0a0a] border border-white/5 p-16 rounded-2xl text-center">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">No customers registered yet</p>
            <p className="text-gray-500 text-xs mt-1">Customer profiles auto-register when they send messages on WhatsApp</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const isRepeatCustomer = cust.orderCount >= 2;
            return (
              <div 
                key={cust.id} 
                className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-white/10 transition"
              >
                <div>
                  {/* Name and Repeat Customer Badge Row */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{cust.name}</h3>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3.5 h-3.5 text-gray-500" />
                          {cust.phone}
                        </p>
                      </div>
                    </div>

                    {isRepeatCustomer && (
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-extrabold uppercase flex items-center gap-0.5">
                        <Award className="w-3 h-3" /> Repeat Customer
                      </span>
                    )}
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/5 p-3.5 rounded-xl mb-4">
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase">Orders Placed</p>
                      <p className="text-sm font-extrabold text-white mt-1 flex items-baseline gap-1">
                        {cust.orderCount} <span className="text-[10px] text-emerald-400 font-semibold">runs</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase">Total Value</p>
                      <p className="text-sm font-extrabold text-white mt-1 flex items-baseline gap-1">
                        ₹{cust.totalSpent.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Notes Field (Staff Logs) */}
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquarePlus className="w-3.5 h-3.5 text-gray-500" />
                      Internal Staff Notes
                    </p>
                    
                    {editingNotesId === cust.id ? (
                      <div className="space-y-2 mt-1">
                        <textarea
                          rows={2}
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none resize-none"
                          placeholder="e.g. Likes food extra spicy. Delivers near Noida Sec 62."
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="px-2.5 py-1 text-[10px] text-gray-400 font-bold hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNotes(cust.id)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-black rounded text-[10px] font-extrabold cursor-pointer transition"
                          >
                            Save Notes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleStartEditingNotes(cust)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-dashed border-white/10 cursor-pointer transition group"
                      >
                        <p className="text-xs text-gray-400 italic leading-relaxed">
                          {cust.notes ? `"${cust.notes}"` : 'No staff logs added. Click to write notes...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Age Footer details */}
                <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-gray-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {new Date(cust.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">WhatsApp Member</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
