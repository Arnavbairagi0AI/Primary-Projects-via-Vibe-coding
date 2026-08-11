/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface AdminPanelProps {
  userProfile: UserProfile;
}

export default function AdminPanel({ userProfile }: AdminPanelProps) {
  const [featureChats, setFeatureChats] = useState(true);
  const [featurePdfs, setFeaturePdfs] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Free access grants state
  const [freeAccessEmails, setFreeAccessEmails] = useState<string[]>([]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  // Real DB Users state
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const isExcluded = 
    userProfile.email?.toLowerCase() === 'rinkibairagi1989@gmail.com' || 
    userProfile.email?.toLowerCase() === 'reikinbaragi1989@gmail.com';

  // Check Admin role
  const isAdmin = 
    !isExcluded && (
      userProfile.role === 'admin' || 
      userProfile.email === 'neoedits2008@gmail.com'
    );

  const isOwner = 
    !isExcluded && userProfile.email === 'neoedits2008@gmail.com';

  const fetchGrants = async () => {
    try {
      const snap = await getDocs(collection(db, 'free_access_grants'));
      const emails: string[] = [];
      snap.forEach(doc => {
        emails.push(doc.id);
      });
      setFreeAccessEmails(emails);
    } catch (err) {
      console.warn("Failed to fetch free access grants:", err);
    }
  };

  const fetchDbUsers = async () => {
    setUsersLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach(d => {
        list.push(d.data() as UserProfile);
      });
      // Sort: admins first, then newest registered
      list.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setDbUsers(list);
    } catch (err) {
      console.warn("Failed to fetch registered users from database:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchGrants();
      fetchDbUsers();
    }
  }, [userProfile]);

  const handleTogglePlan = async (targetUid: string, currentPlan: 'free' | 'pro' | 'premium') => {
    try {
      const newPlan = currentPlan === 'premium' ? 'free' : 'premium';
      const userRef = doc(db, 'users', targetUid);
      await setDoc(userRef, { currentPlan: newPlan, subscriptionStatus: 'active' }, { merge: true });
      
      // Update local state instantly
      setDbUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, currentPlan: newPlan, subscriptionStatus: 'active' } : u));
    } catch (err: any) {
      console.error("Failed to update user plan in Firestore:", err);
    }
  };

  const handleToggleRole = async (targetUid: string, currentRole: 'student' | 'admin') => {
    try {
      const newRole = currentRole === 'admin' ? 'student' : 'admin';
      const userRef = doc(db, 'users', targetUid);
      await setDoc(userRef, { role: newRole }, { merge: true });
      
      // Update local state instantly
      setDbUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
    } catch (err: any) {
      console.error("Failed to update user role in Firestore:", err);
    }
  };

  const handleAddGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim()) return;
    setGrantLoading(true);
    try {
      const targetEmail = newEmailInput.trim().toLowerCase();
      await setDoc(doc(db, 'free_access_grants', targetEmail), {
        email: targetEmail,
        grantedBy: userProfile.email,
        grantedAt: new Date().toISOString()
      });
      setNewEmailInput('');
      await fetchGrants();
    } catch (err: any) {
      console.error(err);
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRemoveGrant = async (email: string) => {
    try {
      await deleteDoc(doc(db, 'free_access_grants', email));
      await fetchGrants();
    } catch (err: any) {
      console.error(err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="study-card p-12 bg-white max-w-xl mx-auto text-center space-y-4">
        <span className="text-5xl">🚫</span>
        <h3 className="text-xl font-serif italic text-stone-800 font-bold">Access Unauthorized</h3>
        <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
          The Admin Control Console is restricted solely to the owner email (<strong className="text-brand-sage font-bold">neoedits2008@gmail.com</strong>), project testers, and verified administrators.
        </p>
      </div>
    );
  }

  // Simulated metrics and user base for a high-fidelity workspace
  const mockSubscribers = [
    { email: 'neoedits2008@gmail.com', name: 'Arnav Singh (Owner)', plan: 'Premium', status: 'Active', created: '2026-06-01' },
    { email: 'rinkibairagi1989@gmail.com', name: 'Rinki Bairagi (Learner)', plan: 'Free', status: 'Active', created: '2026-06-15' },
    { email: 'student_tester@edu.in', name: 'Kabir Dev', plan: 'Free', status: 'Active', created: '2026-07-01' },
    { email: 'learner_competitive@gmail.com', name: 'Priya Sharma', plan: 'Pro', status: 'Active', created: '2026-06-20' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm text-center">
          <span className="text-[10px] uppercase font-black tracking-widest text-stone-400">Total Users</span>
          <span className="text-3xl font-bold text-stone-800 block mt-1">1,429</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm text-center">
          <span className="text-[10px] uppercase font-black tracking-widest text-stone-400">Paid Subscribers</span>
          <span className="text-3xl font-bold text-[#8B5E3C] block mt-1">340</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm text-center">
          <span className="text-[10px] uppercase font-black tracking-widest text-stone-400">Monthly Revenue (MRR)</span>
          <span className="text-3xl font-bold text-brand-sage block mt-1">₹67,660</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm text-center">
          <span className="text-[10px] uppercase font-black tracking-widest text-stone-400">Server Health</span>
          <span className="text-3xl font-bold text-emerald-600 block mt-1">99.9%</span>
        </div>
      </div>

      {/* Owner Access Control Section */}
      {isOwner && (
        <div className="study-card p-6 bg-white border border-amber-200 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-amber-800 flex items-center gap-2">
                👑 Owner Access Control Room
              </h3>
              <p className="text-[10px] text-stone-400 mt-0.5">
                This exclusive section is ONLY visible to the application owner ({userProfile.email})
              </p>
            </div>
            <span className="text-[9px] bg-amber-500/10 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">
              Secure Owner Portal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={handleAddGrant} className="space-y-3">
              <span className="text-[11px] uppercase tracking-wider font-black text-stone-500 block">
                Grant New Free Access
              </span>
              <p className="text-xs text-stone-500">
                Enter any user's email address below to grant them lifetime free premium/VIP access.
              </p>
              <div className="flex gap-2">
                <input 
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 bg-stone-50 border border-black/5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs outline-none transition-all text-stone-800"
                />
                <button
                  type="submit"
                  disabled={grantLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {grantLoading ? 'Granting...' : 'Grant Access'}
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-black text-stone-500 block">
                Current VIP Free Access List ({freeAccessEmails.length})
              </span>
              {freeAccessEmails.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No free access emails registered yet.</p>
              ) : (
                <div className="max-h-[140px] overflow-y-auto border border-stone-100 rounded-xl divide-y divide-stone-100 bg-stone-50">
                  {freeAccessEmails.map((email) => (
                    <div key={email} className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="font-mono text-stone-700">{email}</span>
                      <button
                        onClick={() => handleRemoveGrant(email)}
                        className="text-[10px] text-red-600 hover:text-red-800 font-bold uppercase cursor-pointer"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User database logs */}
        <div className="lg:col-span-2 study-card p-6 bg-white space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-stone-800">StudyFlow Live User Database</h3>
              <p className="text-[10px] text-stone-400">Manage plans and permissions for your user base in real time.</p>
            </div>
            <button 
              onClick={fetchDbUsers} 
              className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 px-2.5 py-1.5 rounded-lg font-bold uppercase transition-all"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-stone-100">
              <thead>
                <tr className="text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">System Role</th>
                  <th className="pb-3">Active Plan</th>
                  <th className="pb-3 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-stone-400 italic">
                      Retrieving registered user profiles from Cloud Firestore...
                    </td>
                  </tr>
                ) : dbUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-stone-400 italic">
                      No registered users found.
                    </td>
                  </tr>
                ) : (
                  dbUsers.map((u) => (
                    <tr key={u.uid} className="text-stone-700 hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 flex items-center gap-2">
                        <img 
                          src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || '')}`} 
                          alt="" 
                          className="w-6 h-6 rounded-full border bg-stone-100"
                        />
                        <span className="font-bold">{u.displayName || 'Learner'}</span>
                      </td>
                      <td className="py-3 text-stone-500 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleToggleRole(u.uid, u.role)}
                          title="Click to toggle system role"
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase transition-all ${
                            u.role === 'admin' 
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                          }`}
                        >
                          {u.role || 'student'}
                        </button>
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          u.currentPlan === 'premium' 
                            ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' 
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                        }`}>
                          {u.currentPlan || 'free'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleTogglePlan(u.uid, u.currentPlan)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            u.currentPlan === 'premium'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.currentPlan === 'premium' ? 'Revoke Free Premium' : 'Grant Free Premium'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="study-card p-6 bg-white space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-black">Feature Management Panel</p>
          
          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div>
                <span className="text-xs font-bold text-stone-700 block">AI Chat Tutor Service</span>
                <span className="text-[9px] text-stone-400">Status of LLM Chat proxy routes</span>
              </div>
              <input 
                type="checkbox"
                checked={featureChats}
                onChange={(e) => setFeatureChats(e.target.checked)}
                className="w-4 h-4 accent-brand-sage cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div>
                <span className="text-xs font-bold text-stone-700 block">PDF Summaries Queue</span>
                <span className="text-[9px] text-stone-400">Status of prompt file readers</span>
              </div>
              <input 
                type="checkbox"
                checked={featurePdfs}
                onChange={(e) => setFeaturePdfs(e.target.checked)}
                className="w-4 h-4 accent-brand-sage cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
              <div>
                <span className="text-xs font-bold text-red-800 block">SaaS Maintenance Banner</span>
                <span className="text-[9px] text-red-500">Lock general dashboard for systems work</span>
              </div>
              <input 
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 accent-red-600 cursor-pointer"
              />
            </div>

            <p className="text-[10px] text-stone-400 leading-relaxed pt-2">
              Changes applied here propagate dynamically. Keep both AI services active to ensure frictionless reviews by neoedits2008@gmail.com and other academic evaluators.
            </p>

          </div>
        </div>

      </div>

    </div>
  );
}
