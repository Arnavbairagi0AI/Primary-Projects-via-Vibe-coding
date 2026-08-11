import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Briefcase, 
  ChevronRight, 
  Clock, 
  DollarSign, 
  Plus, 
  Save, 
  Trash2, 
  CheckSquare, 
  User, 
  FileText, 
  CheckCircle2, 
  X,
  Target
} from 'lucide-react';
import { Tender } from '../types';

interface Lead {
  id: string;
  tenderTitle: string;
  refNo: string;
  authority: string;
  value: number;
  stage: 'identified' | 'review' | 'document_prep' | 'submitted' | 'won' | 'lost';
  notes: string;
  contactName: string;
  contactEmail: string;
  tasks: { id: string; text: string; done: boolean }[];
  timeline: { id: string; action: string; date: string }[];
}

export const CrmView: React.FC = () => {
  const { tenders, logActivity } = useApp();

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 'lead-1',
      tenderTitle: 'Indo-Solar Irrigation Submersible Pump Installation NIT',
      refNo: 'TENDER-2026-NRE-7712',
      authority: 'Ministry of New and Renewable Energy (MNRE), Delhi',
      value: 12500000,
      stage: 'document_prep',
      notes: 'Initial evaluation of high interest. Need to verify joint-venture partner qualifications.',
      contactName: 'Shri R. K. Sharma',
      contactEmail: 'rksharma.mnre@nic.in',
      tasks: [
        { id: 't-1', text: 'Validate joint-venture financial turnover certificates', done: true },
        { id: 't-2', text: 'Obtain EMD bank guarantee from SBI branch office', done: false },
        { id: 't-3', text: 'Draft technical specifications compliance matrix', done: false }
      ],
      timeline: [
        { id: 'tl-1', action: 'Lead identified from public NIT database', date: '2026-07-01' },
        { id: 'tl-2', action: 'Assigned proposal review to procurement department', date: '2026-07-02' }
      ]
    },
    {
      id: 'lead-2',
      tenderTitle: 'NTPC Solar Microgrid EPC Tender',
      refNo: 'NTPC-SOLAR-2026-004',
      authority: 'National Thermal Power Corporation (NTPC), Mumbai',
      value: 48000000,
      stage: 'review',
      notes: 'Large capital engagement. Evaluated using TenderFlow Risk Modeling.',
      contactName: 'Smt. Priya Nair',
      contactEmail: 'pnair@ntpc.co.in',
      tasks: [
        { id: 't-4', text: 'Run TenderFlow Risk & Opportunity Scorecard', done: true },
        { id: 't-5', text: 'Prepare pre-bid queries list for NTPC portal upload', done: false }
      ],
      timeline: [
        { id: 'tl-3', action: 'Opportunity matched with core keywords list', date: '2026-07-02' }
      ]
    }
  ]);

  const [selectedLeadId, setSelectedLeadId] = useState<string>('lead-1');
  const [newLeadTitle, setNewLeadTitle] = useState('');
  const [newLeadVal, setNewLeadVal] = useState('');
  const [newLeadAuth, setNewLeadAuth] = useState('');

  const [newTaskText, setNewTaskText] = useState('');

  const activeLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadTitle) return;

    const matchedTender = tenders.find(t => t.title.toLowerCase().includes(newLeadTitle.toLowerCase()));

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      tenderTitle: newLeadTitle,
      refNo: matchedTender ? matchedTender.refNo : `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
      authority: newLeadAuth || 'General Procuring Authority',
      value: Number(newLeadVal) || 500000,
      stage: 'identified',
      notes: '',
      contactName: '',
      contactEmail: '',
      tasks: [],
      timeline: [
        { id: `tl-${Date.now()}`, action: 'CRM Lead Created', date: new Date().toISOString().split('T')[0] }
      ]
    };

    setLeads([...leads, newLead]);
    setSelectedLeadId(newLead.id);
    setNewLeadTitle('');
    setNewLeadVal('');
    setNewLeadAuth('');
    logActivity('CRM Lead Created', `Created CRM lead pipeline record for "${newLeadTitle}"`, 'tender');
  };

  const handleUpdateLeadField = (field: keyof Lead, value: any) => {
    if (!activeLead) return;
    const updatedLeads = leads.map(l => {
      if (l.id === activeLead.id) {
        return { ...l, [field]: value };
      }
      return l;
    });
    setLeads(updatedLeads);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !activeLead) return;

    const newTask = {
      id: `task-${Date.now()}`,
      text: newTaskText,
      done: false
    };

    const updatedLeads = leads.map(l => {
      if (l.id === activeLead.id) {
        return {
          ...l,
          tasks: [...l.tasks, newTask],
          timeline: [
            ...l.timeline,
            { id: `tl-${Date.now()}`, action: `Added checklist item: "${newTaskText}"`, date: new Date().toISOString().split('T')[0] }
          ]
        };
      }
      return l;
    });

    setLeads(updatedLeads);
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: string) => {
    if (!activeLead) return;
    const updatedLeads = leads.map(l => {
      if (l.id === activeLead.id) {
        const tObj = l.tasks.find(t => t.id === taskId);
        const nextDone = !tObj?.done;
        return {
          ...l,
          tasks: l.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t),
          timeline: [
            ...l.timeline,
            { id: `tl-${Date.now()}`, action: `${nextDone ? 'Completed' : 'Reopened'} task: "${tObj?.text}"`, date: new Date().toISOString().split('T')[0] }
          ]
        };
      }
      return l;
    });
    setLeads(updatedLeads);
  };

  const handleStageChange = (newStage: Lead['stage']) => {
    if (!activeLead) return;
    const updatedLeads = leads.map(l => {
      if (l.id === activeLead.id) {
        return {
          ...l,
          stage: newStage,
          timeline: [
            ...l.timeline,
            { id: `tl-${Date.now()}`, action: `Pipeline stage shifted to: ${newStage.toUpperCase().replace('_', ' ')}`, date: new Date().toISOString().split('T')[0] }
          ]
        };
      }
      return l;
    });
    setLeads(updatedLeads);
    logActivity('CRM Stage Transition', `Shifted lead ${activeLead.refNo} to ${newStage}`, 'tender');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Visual Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-500" /> Enterprise Bid CRM & Lead Pipeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track lead stages, follow-up workflows, customer timelines, and assign team responsibilities seamlessly.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl min-w-[80px]">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Leads</span>
            <span className="text-lg font-black text-blue-600 font-mono">{leads.length}</span>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pipeline Value</span>
            <span className="text-lg font-black text-indigo-500 font-mono">₹{((leads.reduce((acc, l) => acc + l.value, 0)) / 100000).toFixed(1)}L</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leads Selector Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Bidding Leads</h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-sm">CRM</span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {leads.map(lead => (
                <button 
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                    selectedLeadId === lead.id 
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/35 shadow-xs' 
                      : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{lead.refNo}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      lead.stage === 'won' ? 'bg-emerald-500/10 text-emerald-400' :
                      lead.stage === 'submitted' ? 'bg-indigo-500/10 text-indigo-400' :
                      lead.stage === 'document_prep' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {lead.stage.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">{lead.tenderTitle}</span>
                  <span className="text-[10px] font-extrabold text-slate-400 font-mono">₹{(lead.value / 100000).toFixed(1)} Lakhs</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Lead Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-blue-500" /> Register Manual Bidding Lead
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Tender Scope Title</label>
                <input 
                  type="text"
                  value={newLeadTitle}
                  onChange={(e) => setNewLeadTitle(e.target.value)}
                  placeholder="e.g. Smart City CCTV Commissioning"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Procuring Authority</label>
                <input 
                  type="text"
                  value={newLeadAuth}
                  onChange={(e) => setNewLeadAuth(e.target.value)}
                  placeholder="e.g. Pune Municipal Corporation"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Target Bid Value (INR)</label>
                <input 
                  type="number"
                  value={newLeadVal}
                  onChange={(e) => setNewLeadVal(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/10"
              >
                Incept CRM Lead Record
              </button>
            </form>
          </div>
        </div>

        {/* Lead Details Work Area */}
        {activeLead && (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stage Selector Progress Block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Pipeline Stage Progression</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(['identified', 'review', 'document_prep', 'submitted', 'won', 'lost'] as const).map(stage => (
                  <button
                    key={stage}
                    onClick={() => handleStageChange(stage)}
                    className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase text-center cursor-pointer border transition-all ${
                      activeLead.stage === stage 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/15' 
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {stage.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Core details card (Notes, customer, etc.) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Contact and Notes */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-4 w-4 text-blue-500" /> Bidding Authority Contact
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block">Contact Officer</label>
                    <input 
                      type="text"
                      value={activeLead.contactName}
                      onChange={(e) => handleUpdateLeadField('contactName', e.target.value)}
                      placeholder="e.g. Shri S. K. Roy, Exec Director"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block">Official Email Address</label>
                    <input 
                      type="email"
                      value={activeLead.contactEmail}
                      onChange={(e) => handleUpdateLeadField('contactEmail', e.target.value)}
                      placeholder="e.g. skroy.procurement@authority.in"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Internal Proposal Notes</label>
                  <textarea 
                    value={activeLead.notes}
                    onChange={(e) => handleUpdateLeadField('notes', e.target.value)}
                    placeholder="Document joint venture covenants, profit targets or supplier terms here..."
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none resize-none font-medium"
                  />
                </div>
              </div>

              {/* Task list and timeline */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-indigo-500" /> CRM Follow-up Tasks Checklist
                </h3>

                {/* Task Form */}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input 
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add task e.g. Finalize pricing matrix"
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-xl transition-all cursor-pointer font-bold"
                  >
                    Add
                  </button>
                </form>

                {/* Tasks rendering */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {activeLead.tasks.length === 0 ? (
                    <div className="text-center py-4 text-[11px] text-slate-400 font-medium">
                      No follow-up tasks currently listed.
                    </div>
                  ) : (
                    activeLead.tasks.map(t => (
                      <button 
                        key={t.id}
                        type="button"
                        onClick={() => handleToggleTask(t.id)}
                        className="w-full flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-950/40 rounded-lg text-left cursor-pointer"
                      >
                        <CheckCircle2 className={`h-4.5 w-4.5 ${t.done ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-800'}`} />
                        <span className={`text-xs font-medium ${t.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{t.text}</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Chronological Lead Timelines */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lead Log Timeline History</span>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto pl-1">
                    {activeLead.timeline.map(tl => (
                      <div key={tl.id} className="flex items-start gap-2 text-[11px]">
                        <Clock className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 mt-0.5" />
                        <div>
                          <span className="text-slate-400 font-mono text-[9px] block">{tl.date}</span>
                          <span className="text-slate-600 dark:text-slate-400 font-semibold">{tl.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
