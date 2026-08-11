import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { useActivityLog } from '../../hooks/useActivityLog';
import { db } from '../../lib/firebase';
import { getAuth, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  User, 
  Building2, 
  Bell, 
  Lock, 
  Check, 
  Palette, 
  Save, 
  ShieldCheck 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsSection() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { logActivity } = useActivityLog();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'notifications' | 'security'>('profile');

  // Profile Form States
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  // Notification States
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [tenderMatches, setTenderMatches] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Loading indicator
  const [saving, setSaving] = useState(false);

  // Load alert settings from Firestore on mount
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'settings', user.id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setEmailAlerts(data.emailAlerts ?? true);
          setTenderMatches(data.tenderMatches ?? true);
          setProjectUpdates(data.projectUpdates ?? true);
        }
      } catch (err) {
        console.error("Error loading notification settings:", err);
      }
    };

    loadSettings();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) {
      showToast("Please enter a name.", "error");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        displayName,
        phoneNumber
      });
      await logActivity('Updated Personal Profile', `Modified settings for ${displayName}`);
      showToast("Personal profile parameters updated!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', user.id), {
        emailAlerts,
        tenderMatches,
        projectUpdates,
        companyId: user.companyId || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await logActivity('Updated Alert Prefs', 'Modified email and push tender matching settings');
      showToast("Alert configurations modified successfully!", "success");
    } catch (err) {
      console.error("Error saving settings:", err);
      showToast("Could not save notification preferences.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast("Please fill in password parameters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setSaving(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updatePassword(currentUser, newPassword);
        await logActivity('Modified Auth Password', 'Completed password updates');
        showToast("Password updated successfully!", "success");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast("No active authenticated session detected.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to update security password.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[#1C1B1F] tracking-tight">Enterprise & System Settings</h2>
        <p className="text-xs text-[#44474E]">Configure corporate credentials, alert triggers, team notifications, and encryption credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation panel */}
        <div className="md:col-span-1 bg-white border border-[#E1E2E6] rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'notifications', label: 'Alert Actions', icon: Bell },
            { id: 'security', label: 'Passkey & Security', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-[#E8EDFF] text-[#2152FF] font-bold' 
                    : 'text-[#44474E] hover:bg-[#F1F3F8] hover:text-[#1C1B1F] border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Configurations content panel */}
        <div className="md:col-span-3 bg-white border border-[#E1E2E6] rounded-2xl p-6 md:p-8 shadow-sm">
          {activeSubTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="border-b border-[#E1E2E6] pb-3">
                <h3 className="text-sm font-extrabold text-[#1C1B1F] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#2152FF]" />
                  Personal Profile settings
                </h3>
                <p className="text-[11px] text-[#44474E] mt-0.5">Control how your details appear to other engineers in the workspace.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#44474E]">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email}
                    className="w-full px-4 py-2.5 bg-[#F1F3F8] border border-[#E1E2E6] rounded-xl text-[#44474E] text-xs cursor-not-allowed outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#44474E]">Staff Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] text-xs transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#44474E]">Designation Role</label>
                  <input
                    type="text"
                    disabled
                    value={user?.role}
                    className="w-full px-4 py-2.5 bg-[#F1F3F8] border border-[#E1E2E6] rounded-xl text-[#44474E] text-xs cursor-not-allowed outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#44474E]">Direct Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 9988776655"
                    className="w-full px-4 py-2.5 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] text-xs transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#2152FF] hover:bg-[#1E49E6] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-[#2152FF]/10 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile Changes
                  </>
                )}
              </button>
            </form>
          )}

          {activeSubTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <div className="border-b border-[#E1E2E6] pb-3">
                <h3 className="text-sm font-extrabold text-[#1C1B1F] uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#2152FF]" />
                  Alert Actions & Push configurations
                </h3>
                <p className="text-[11px] text-[#44474E] mt-0.5">Control system alert sensitivities and daily matching emails.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#1C1B1F]">Email Tender Summaries</p>
                    <p className="text-[10px] text-[#44474E]">Receive morning digests of newly matches in your state geographies.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4.5 w-4.5 rounded bg-white border-[#E1E2E6] text-[#2152FF] focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#1C1B1F]">Real-Time Match Triggers</p>
                    <p className="text-[10px] text-[#44474E]">Trigger alerts as soon as a tender exceeding 85% match score is scanned.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tenderMatches}
                    onChange={(e) => setTenderMatches(e.target.checked)}
                    className="h-4.5 w-4.5 rounded bg-white border-[#E1E2E6] text-[#2152FF] focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#1C1B1F]">Project Milestone Updates</p>
                    <p className="text-[10px] text-[#44474E]">Notify me when sub-engineers complete contract tasks or checklist targets.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={projectUpdates}
                    onChange={(e) => setProjectUpdates(e.target.checked)}
                    className="h-4.5 w-4.5 rounded bg-white border-[#E1E2E6] text-[#2152FF] focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#2152FF] hover:bg-[#1E49E6] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-[#2152FF]/10 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Alert Prefs
                  </>
                )}
              </button>
            </form>
          )}

          {activeSubTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="border-b border-[#E1E2E6] pb-3">
                <h3 className="text-sm font-extrabold text-[#1C1B1F] uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#2152FF]" />
                  Key Encryption & Portal Passwords
                </h3>
                <p className="text-[11px] text-[#44474E] mt-0.5">Modify portal credentials to secure organization assets.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xs font-semibold text-[#44474E]">Current Password (Bypassed for security rules)</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xs font-semibold text-[#44474E]">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xs font-semibold text-[#44474E]">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#2152FF] hover:bg-[#1E49E6] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-[#2152FF]/10 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Modify Encryption Keys
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
