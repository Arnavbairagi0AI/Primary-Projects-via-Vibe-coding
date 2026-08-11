import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Users, 
  Building2, 
  Terminal, 
  HelpCircle, 
  Plus, 
  Save, 
  AlertCircle,
  Database,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Mail,
  Loader2
} from 'lucide-react';
import { Tender } from '../types';

export const AdminPanel: React.FC = () => {
  const { 
    logs, 
    feedbacks, 
    settings, 
    updateFeedbackStatus, 
    updateSystemSettings, 
    addTender,
    tenders
  } = useApp();

  const [activeTab, setActiveTab] = useState<'settings' | 'tenders' | 'logs' | 'feedback' | 'companies'>('settings');

  // Add tender state
  const [tenderTitle, setTenderTitle] = useState('');
  const [tenderRef, setTenderRef] = useState('');
  const [tenderAuthority, setTenderAuthority] = useState('');
  const [tenderDept, setTenderDept] = useState('');
  const [tenderState, setTenderState] = useState('Delhi');
  const [tenderCity, setTenderCity] = useState('');
  const [tenderCategory, setTenderCategory] = useState('Information Technology');
  const [tenderValue, setTenderValue] = useState('');
  const [tenderDeadline, setTenderDeadline] = useState('');

  // Settings states
  const [allowReg, setAllowReg] = useState(settings?.allowNewRegistrations ?? true);
  const [modelVersion, setModelVersion] = useState(settings?.aiModelVersion ?? 'gemini-2.5-flash');
  const [maintMode, setMaintMode] = useState(settings?.maintenanceMode ?? false);
  const [supportEmail, setSupportEmail] = useState(settings?.supportEmail ?? 'support@tenderflow.ai');
  const [loading, setLoading] = useState(false);

  // Resolution Notes state
  const [resolutionText, setResolutionText] = useState<{ [key: string]: string }>({});

  const handleAddTenderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenderTitle || !tenderRef || !tenderAuthority || !tenderValue || !tenderDeadline) {
      alert('Please fill out all mandatory tender fields.');
      return;
    }

    try {
      const data: Omit<Tender, 'id' | 'createdAt'> = {
        title: tenderTitle,
        refNo: tenderRef,
        authority: tenderAuthority,
        department: tenderDept || 'General Procurement',
        state: tenderState,
        city: tenderCity || 'New Delhi',
        category: tenderCategory,
        value: Number(tenderValue),
        deadline: new Date(tenderDeadline).toISOString(),
        status: 'active'
      };
      await addTender(data);
      alert('Tender successfully added to Firestore database! Go to Tender Search to view.');
      
      // Clear form
      setTenderTitle('');
      setTenderRef('');
      setTenderAuthority('');
      setTenderDept('');
      setTenderCity('');
      setTenderValue('');
      setTenderDeadline('');
    } catch (err: any) {
      alert('Error creating tender: ' + err.message);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await updateSystemSettings({
        allowNewRegistrations: allowReg,
        aiModelVersion: modelVersion,
        maintenanceMode: maintMode,
        supportEmail: supportEmail
      });
      alert('System-wide administrator configurations saved successfully!');
    } catch (e: any) {
      alert('Failed to update system settings: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFeedback = async (id: string) => {
    const notes = resolutionText[id] || 'Issue marked as resolved by Administrator.';
    await updateFeedbackStatus(id, 'resolved', notes);
    alert('Ticket marked as resolved.');
  };

  const statesList = ['Delhi', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Kerala', 'Punjab', 'Gujarat', 'Uttar Pradesh'];
  const categoriesList = ['Civil Works & Construction', 'Information Technology', 'Energy & Power', 'Medical & Healthcare', 'Manufacturing & Heavy Industry', 'Chemicals & Materials'];

  return (
    <div className="space-y-6">
      
      {/* Admin System KPI stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Global Ingested Tenders</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 block mt-1">{tenders.length} Active</span>
          <span className="text-[9px] text-emerald-500 font-medium block mt-0.5">Seeded with Indian railway & solar NITs</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">System Activity Volume</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 block mt-1">{logs.length} Telemetry logs</span>
          <span className="text-[9px] text-indigo-400 font-medium block mt-0.5">Active database sync with Firestore</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Feedback Tickets</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 block mt-1">
            {feedbacks.filter(f => f.status === 'pending').length} Open / {feedbacks.length} Total
          </span>
          <span className="text-[9px] text-indigo-500 font-medium block mt-0.5">Customer satisfaction: 4.8/5</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Inference Core</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 block mt-1">Active</span>
          <span className="text-[9px] text-emerald-500 font-medium block mt-0.5">Target model: gemini-2.5-flash</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          System Configuration
        </button>
        <button 
          onClick={() => setActiveTab('tenders')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'tenders' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Publish New Tender
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'logs' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Activity Logs ({logs.length})
        </button>
        <button 
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'feedback' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Customer Feedback ({feedbacks.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">System Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            
            <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Allow New SaaS Sign-ups</label>
                <span className="text-[11px] text-slate-400 block leading-tight">Enable/disable public company registration</span>
              </div>
              <input 
                type="checkbox" 
                checked={allowReg}
                onChange={(e) => setAllowReg(e.target.checked)}
                className="rounded-sm text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">System Maintenance Mode</label>
                <span className="text-[11px] text-slate-400 block leading-tight">Restrict standard employee portal logins</span>
              </div>
              <input 
                type="checkbox" 
                checked={maintMode}
                onChange={(e) => setMaintMode(e.target.checked)}
                className="rounded-sm text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Target Gemini AI Model</label>
              <select 
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast, accurate, standard)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Highly comprehensive reasoning)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash (Legacy fast model)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">System Support Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="email" 
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Administrator Configurations
          </button>
        </div>
      )}

      {activeTab === 'tenders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Publish New Tender Opportunity</h3>
          </div>

          <form onSubmit={handleAddTenderSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tender Title / Scope Description</label>
              <input 
                type="text" 
                value={tenderTitle}
                onChange={(e) => setTenderTitle(e.target.value)}
                placeholder="e.g. Design, Build and Maintain Grid-Tied Solar Plant"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tender Reference ID (Ref No)</label>
              <input 
                type="text" 
                value={tenderRef}
                onChange={(e) => setTenderRef(e.target.value)}
                placeholder="e.g. NTPC/MECH/SOLAR-890A"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Bidding Authority Organization</label>
              <input 
                type="text" 
                value={tenderAuthority}
                onChange={(e) => setTenderAuthority(e.target.value)}
                placeholder="e.g. National Thermal Power Corporation (NTPC)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Department / Subdivision</label>
              <input 
                type="text" 
                value={tenderDept}
                onChange={(e) => setTenderDept(e.target.value)}
                placeholder="e.g. Renewable Ingest Cell"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tender Category Preference</label>
              <select 
                value={tenderCategory}
                onChange={(e) => setTenderCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Bidding State Jurisdiction</label>
              <select 
                value={tenderState}
                onChange={(e) => setTenderState(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                {statesList.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Execution City Location</label>
              <input 
                type="text" 
                value={tenderCity}
                onChange={(e) => setTenderCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Estimated Project Value (INR Rupees)</label>
              <input 
                type="number" 
                value={tenderValue}
                onChange={(e) => setTenderValue(e.target.value)}
                placeholder="e.g. 5000000 (50 Lakhs)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Bid Submission Deadline Date & Time</label>
              <input 
                type="datetime-local" 
                value={tenderDeadline}
                onChange={(e) => setTenderDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <button 
              type="submit" 
              className="sm:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all flex justify-center items-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="h-4.5 w-4.5" /> Publish Active B2B Tender
            </button>
          </form>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Live Activity System Telemetry Logs</h3>
          </div>
          
          <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl h-80 overflow-y-auto font-mono text-[10px] space-y-2 select-text">
            {logs.map((log) => (
              <div key={log.id} className="text-slate-300 leading-normal flex items-start gap-1">
                <span className="text-indigo-400 font-semibold shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`px-1 rounded-sm shrink-0 uppercase tracking-wide font-extrabold text-[8px] ${
                  log.category === 'auth' ? 'bg-blue-500/10 text-blue-400' :
                  log.category === 'tender' ? 'bg-indigo-500/10 text-indigo-400' :
                  log.category === 'admin' ? 'bg-rose-500/10 text-rose-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {log.category}
                </span>
                <span className="text-slate-100 shrink-0 font-bold">{log.userName} ({log.userEmail}):</span>
                <span className="text-slate-300 italic">{log.action}</span>
                <span className="text-slate-500 font-normal shrink-0">- {log.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">User Feedbacks & Support Tickets</h3>
          </div>

          <div className="space-y-3.5">
            {feedbacks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No user feedbacks received yet.</p>
            ) : (
              feedbacks.map((feed) => (
                <div 
                  key={feed.id} 
                  className={`p-5 rounded-2xl border ${
                    feed.status === 'resolved' 
                      ? 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850 opacity-70' 
                      : 'bg-indigo-500/5 border-indigo-500/10'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Subject:</span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                        {feed.subject} (Rating: {feed.rating}/5 ⭐)
                      </h4>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      feed.status === 'resolved' ? 'bg-slate-500/10 text-slate-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {feed.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    "{feed.message}"
                  </p>

                  <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Submitted by: <b>{feed.email}</b></span>
                    <span>Date: {new Date(feed.createdAt).toLocaleString()}</span>
                  </div>

                  {feed.status === 'pending' ? (
                    <div className="mt-3.5 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Resolution details or reply..."
                        value={resolutionText[feed.id] || ''}
                        onChange={(e) => setResolutionText({ ...resolutionText, [feed.id]: e.target.value })}
                        className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                      <button 
                        onClick={() => handleResolveFeedback(feed.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-950/60 rounded-xl text-xs text-slate-400">
                      <b>Admin notes:</b> {feed.adminNotes}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
