import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { useActivityLog } from '../../hooks/useActivityLog';
import { 
  Layers, 
  MapPin, 
  Calendar, 
  Plus, 
  Briefcase, 
  DollarSign, 
  CheckCircle2, 
  Wrench, 
  TrendingUp, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../../types';

interface ProjectsSectionProps {
  projects: Project[];
  onAddProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status'>) => void;
}

export default function ProjectsSection({ projects, onAddProject }: ProjectsSectionProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { logActivity } = useActivityLog();

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [value, setValue] = useState(1);
  const [valueUnit, setValueUnit] = useState<'Lakhs' | 'Crores'>('Crores');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [progress, setProgress] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client || !startDate || !endDate) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    onAddProject({
      companyId: user?.companyId || '',
      title,
      client,
      value,
      valueUnit,
      startDate,
      endDate,
      managerId: user?.id || '',
      progress,
      budgetSpent: value * (progress / 100) * 0.85, // estimate spent
      tasksCount: { total: 12, completed: Math.floor(12 * (progress / 100)) }
    });

    logActivity('Created Construction Project', `Started execution tracking for ${title} under ${client}`);
    showToast("Construction project launched successfully!", "success");
    
    // Reset state
    setTitle('');
    setClient('');
    setValue(1);
    setStartDate('');
    setEndDate('');
    setProgress(10);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Active Construction Projects</h2>
          <p className="text-xs text-slate-400">Track milestones, engineering progress, and financial outflows of active tenders.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 py-20 flex flex-col items-center justify-center bg-slate-900/10 border border-slate-800/85 border-dashed rounded-2xl text-slate-500">
            <Layers className="w-10 h-10 opacity-30 mb-2.5 text-slate-400" />
            <p className="font-semibold text-sm">No construction projects currently tracked.</p>
            <p className="text-xs text-slate-600 mt-1">Convert a won tender to a project, or add one manually above.</p>
          </div>
        ) : (
          projects.map((proj) => {
            return (
              <div
                key={proj.id}
                className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between h-[250px]"
              >
                <div className="space-y-3.5">
                  {/* Status Indicator & Client */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider truncate max-w-[70%]">
                      {proj.client}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      proj.progress === 100 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {proj.progress === 100 ? 'Completed' : 'Executing'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-sm text-slate-100 line-clamp-2 leading-snug">
                    {proj.title}
                  </h3>

                  {/* Details row */}
                  <div className="flex justify-between text-[10px] text-slate-500 border-t border-b border-slate-800/40 py-2.5">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-bold text-slate-300">
                        ₹{proj.value} {proj.valueUnit}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>End: {proj.endDate}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-semibold">
                    <span className="text-slate-400">Milestones: {proj.tasksCount?.completed}/{proj.tasksCount?.total}</span>
                    <span className="text-indigo-400">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Creation Dialog */}
      <AnimatePresence>
        {showAddForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-10 md:top-20 md:max-w-lg md:mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 z-50 overflow-y-auto max-h-[85vh] shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-extrabold text-white text-base">Launch Manual Project</h3>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Project / Work Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Building of G+3 Civil Hospital Wing"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Authority Client Name</label>
                  <input
                    type="text"
                    required
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g. PWD Maharashtra"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-100 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Contract Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-100 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Denomination</label>
                    <select
                      value={valueUnit}
                      onChange={(e) => setValueUnit(e.target.value as 'Lakhs' | 'Crores')}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none"
                    >
                      <option value="Crores">Crores (Cr)</option>
                      <option value="Lakhs">Lakhs (L)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-300">Initial Progress Gauge ({progress}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all mt-4 cursor-pointer"
                >
                  Create & Launch Project
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
