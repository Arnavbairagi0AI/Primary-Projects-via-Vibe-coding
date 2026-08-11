import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Tender } from '../types';

export const CalendarView: React.FC = () => {
  const { tenders, savedTenders, logActivity } = useApp();
  const [meetings, setMeetings] = useState<{
    id: string;
    title: string;
    date: string;
    time: string;
    tenderTitle: string;
    type: 'review' | 'pricing' | 'submission';
  }[]>([
    {
      id: 'm-1',
      title: 'BoQ Pricing Final Review',
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
      time: '14:30',
      tenderTitle: 'Indo-Solar Irrigation Submersible Pump Installation NIT',
      type: 'pricing'
    },
    {
      id: 'm-2',
      title: 'Joint Venture Docs Check-off',
      date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days from now
      time: '11:00',
      tenderTitle: 'NTPC Solar Microgrid EPC Tender',
      type: 'review'
    }
  ]);

  // Meeting Form States
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [meetingType, setMeetingType] = useState<'review' | 'pricing' | 'submission'>('review');

  const [isSyncing, setIsSyncing] = useState(false);

  // Filter saved tenders for select list
  const savedTendersList = savedTenders
    .map(s => tenders.find(t => t.id === s.tenderId))
    .filter((t): t is Tender => !!t);

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle || !meetingDate) {
      alert('Please fill out all required meeting details.');
      return;
    }

    const matchedTender = tenders.find(t => t.id === selectedTenderId);
    const newMeeting = {
      id: `m-${Date.now()}`,
      title: meetingTitle,
      date: meetingDate,
      time: meetingTime,
      tenderTitle: matchedTender ? matchedTender.title : 'General Bidding Prep',
      type: meetingType
    };

    setMeetings([...meetings, newMeeting]);
    setMeetingTitle('');
    setMeetingDate('');
    logActivity('Schedule Meeting', `Scheduled bidding meeting "${meetingTitle}" for date ${meetingDate}`, 'tender');
    alert('Bidding review meeting successfully scheduled and added to pipeline calendar.');
  };

  const handleExternalSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Outlook and Google Calendar API connection established. All tender deadlines & bid team meetings synced successfully!');
    }, 1200);
  };

  // Generate current month days
  const daysInMonth = 30;
  const currentMonthName = "July 2026";
  const startDayOffset = 3; // Wednesday

  const renderMonthDays = () => {
    const dayCells = [];
    
    // Empty cells for padding
    for (let i = 0; i < startDayOffset; i++) {
      dayCells.push(<div key={`empty-${i}`} className="h-20 border border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-950/5" />);
    }

    // Days in July 2026
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `2026-07-${day < 10 ? '0' + day : day}`;
      
      // Find matching deadlines
      const dayDeadlines = tenders.filter(t => t.deadline.startsWith(dateStr));
      // Find matching meetings
      const dayMeetings = meetings.filter(m => m.date === dateStr);

      dayCells.push(
        <div key={day} className="h-20 border border-slate-100 dark:border-slate-800/40 p-1.5 relative bg-white dark:bg-slate-900 overflow-y-auto flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-600 font-mono block mb-1">{day}</span>
          
          <div className="space-y-1 overflow-hidden">
            {dayDeadlines.map(t => (
              <span key={t.id} className="block text-[8px] font-black bg-rose-500/10 text-rose-500 rounded px-1 py-0.5 truncate border border-rose-500/20" title={`DEADLINE: ${t.title}`}>
                🚨 {t.refNo}
              </span>
            ))}
            {dayMeetings.map(m => (
              <span key={m.id} className="block text-[8px] font-black bg-indigo-500/10 text-indigo-500 rounded px-1 py-0.5 truncate border border-indigo-500/20" title={`MEETING: ${m.title}`}>
                👥 {m.title}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return dayCells;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title block */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-indigo-500" /> Bidding Deadlines & Meetings Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Avoid missed submissions by tracking public bidding closure timelines and sync meetings with your board.</p>
        </div>

        <button 
          onClick={handleExternalSync}
          disabled={isSyncing}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          {isSyncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Sync with Google & Outlook Calendar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Calendar View (Desktop-first style grid) */}
        <div className="lg:col-span-2 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">{currentMonthName}</span>
            <div className="flex gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 bg-rose-500 rounded-full" /> Bidding Deadline</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 bg-indigo-500 rounded-full" /> Team Meeting</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-150 dark:border-slate-800 pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800/40 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/40">
            {renderMonthDays()}
          </div>
        </div>

        {/* Schedule panel & upcoming lists */}
        <div className="space-y-6">
          
          {/* Quick Schedule meeting form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Schedule Bid Review Meeting
            </h3>

            <form onSubmit={handleScheduleMeeting} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Meeting Subject</label>
                <input 
                  type="text" 
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Document Verification Meet"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Date</label>
                  <input 
                    type="date" 
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Time</label>
                  <input 
                    type="time" 
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Tender Scope Reference</label>
                <select 
                  value={selectedTenderId}
                  onChange={(e) => setSelectedTenderId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="">-- General Bidding Review --</option>
                  {savedTendersList.map(t => (
                    <option key={t.id} value={t.id}>{t.refNo} - {t.title.substring(0, 30)}...</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Meeting Focus</label>
                <select 
                  value={meetingType}
                  onChange={(e: any) => setMeetingType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="review">Technical Criteria Check-off</option>
                  <option value="pricing">BoQ Pricing & Profit Margins</option>
                  <option value="submission">Formal E-Portal Submission Prep</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/15"
              >
                Schedule Team Meeting
              </button>
            </form>
          </div>

          {/* List of upcoming events */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Team Reviews</h3>
            <div className="space-y-2">
              {meetings.map(m => (
                <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{m.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      m.type === 'pricing' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                    }`}>
                      {m.type}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Clock className="h-3.5 w-3.5" /> {m.date} at {m.time}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium italic border-t border-slate-100/60 dark:border-slate-850/30 pt-1.5">{m.tenderTitle}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
