import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Bell,
  BellOff,
  X,
  Save
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { useActivityLog } from '../../hooks/useActivityLog';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarEvent {
  id: string;
  companyId: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'pre_bid' | 'deadline' | 'meeting' | 'review';
  tenderNumber?: string;
  time: string;
  reminder?: boolean;
  createdAt: string;
}

export default function CalendarSection() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { logActivity } = useActivityLog();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 3)); // July 2026
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  
  // Real-time Firestore Events State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'pre_bid' | 'deadline' | 'meeting' | 'review'>('pre_bid');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formTenderNumber, setFormTenderNumber] = useState('');
  const [formReminder, setFormReminder] = useState(true);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // 1. Fetch & Listen to events from Firestore
  useEffect(() => {
    if (!user || !user.companyId) return;

    setLoading(true);
    const q = query(
      collection(db, 'calendarEvents'),
      where('companyId', '==', user.companyId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CalendarEvent);
      });

      // If empty, auto-seed with default corporate calendar milestones
      if (list.length === 0) {
        await seedDefaultEvents();
      } else {
        // Sort chronologically
        list.sort((a, b) => {
          const dateComp = a.date.localeCompare(b.date);
          if (dateComp !== 0) return dateComp;
          return a.time.localeCompare(b.time);
        });
        setEvents(list);
        setLoading(false);
      }
    }, (err) => {
      console.error("Error loading calendar events:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Seed standard bidding events on initial company load
  const seedDefaultEvents = async () => {
    if (!user || !user.companyId) return;
    try {
      const defaultMilestones = [
        {
          date: "2026-07-10",
          title: "MMRDA Ballastless Track Pre-Bid Conference",
          type: "pre_bid",
          tenderNumber: "MMRDA/METRO-4/TRACK/2026",
          time: "11:00 AM",
          reminder: true,
          createdAt: new Date().toISOString()
        },
        {
          date: "2026-07-25",
          title: "MMRDA Metro Track Bid Submission Deadline",
          type: "deadline",
          tenderNumber: "MMRDA/METRO-4/TRACK/2026",
          time: "03:00 PM",
          reminder: true,
          createdAt: new Date().toISOString()
        },
        {
          date: "2026-07-30",
          title: "CPWD Delhi Hospital Hospital Submission closing",
          type: "deadline",
          tenderNumber: "CPWD/DEL/MED/2026/894",
          time: "05:00 PM",
          reminder: true,
          createdAt: new Date().toISOString()
        },
        {
          date: "2026-07-08",
          title: "State Highway Box Bridge Site Survey & Team Meeting",
          type: "meeting",
          tenderNumber: "PWD/KAR/BRG/2026-11",
          time: "10:00 AM",
          reminder: false,
          createdAt: new Date().toISOString()
        },
        {
          date: "2026-07-15",
          title: "NHAI Elevated Highway Corridor Bid Opening",
          type: "review",
          tenderNumber: "NHAI/HQ/CORR/2026/T-104",
          time: "02:30 PM",
          reminder: true,
          createdAt: new Date().toISOString()
        }
      ];

      const promises = defaultMilestones.map((ev) => 
        addDoc(collection(db, 'calendarEvents'), {
          ...ev,
          companyId: user.companyId
        })
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Failed seeding default events:", err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate calendar grid dates
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysAmount = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Present month days
    for (let i = 1; i <= daysAmount; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth();

  // Create or Update Action Handler
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.companyId) return;

    if (!formTitle || !formDate || !formTime) {
      showToast("Please fill in all required parameters.", "error");
      return;
    }

    try {
      const eventData = {
        companyId: user.companyId,
        title: formTitle,
        type: formType,
        date: formDate,
        time: formTime,
        tenderNumber: formTenderNumber || '',
        reminder: formReminder,
        updatedAt: new Date().toISOString()
      };

      if (editingEvent) {
        // Edit flow
        const eventRef = doc(db, 'calendarEvents', editingEvent.id);
        await updateDoc(eventRef, eventData);
        await logActivity("Updated Calendar Event", `Modified event: ${formTitle}`);
        showToast("Calendar event updated successfully!", "success");
      } else {
        // Create flow
        await addDoc(collection(db, 'calendarEvents'), {
          ...eventData,
          createdAt: new Date().toISOString(),
          createdBy: user.id
        });
        await logActivity("Created Calendar Event", `Created event: ${formTitle}`);
        showToast("Calendar event scheduled successfully!", "success");
      }

      closeModal();
    } catch (err) {
      console.error("Failed to save calendar event:", err);
      showToast("Could not schedule calendar event.", "error");
    }
  };

  // Delete Action Handler
  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Delete calendar event "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'calendarEvents', eventId));
      await logActivity("Deleted Calendar Event", `Removed event: ${title}`);
      showToast("Calendar event removed from schedule.", "success");
      if (editingEvent?.id === eventId) closeModal();
    } catch (err) {
      console.error("Failed deleting event:", err);
      showToast("Could not delete calendar event.", "error");
    }
  };

  // Toggle Reminder
  const handleToggleReminder = async (event: CalendarEvent) => {
    try {
      const newReminderState = !event.reminder;
      await updateDoc(doc(db, 'calendarEvents', event.id), {
        reminder: newReminderState,
        updatedAt: new Date().toISOString()
      });
      showToast(
        newReminderState ? `Reminders active for: ${event.title}` : `Reminders silenced.`, 
        "info"
      );
    } catch (err) {
      console.error("Error toggling reminder:", err);
    }
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormType('pre_bid');
    setFormDate(new Date(2026, 6, 3).toISOString().split('T')[0]); // Default in July 2026 scope
    setFormTime('10:00 AM');
    setFormTenderNumber('');
    setFormReminder(true);
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormType(event.type);
    setFormDate(event.date);
    setFormTime(event.time);
    setFormTenderNumber(event.tenderNumber || '');
    setFormReminder(!!event.reminder);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  // Filter events displayed in list based on selection
  const filteredEvents = selectedDateFilter 
    ? events.filter(ev => ev.date === selectedDateFilter)
    : events;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Bid Deadlines & Events Calendar</h2>
          <p className="text-xs text-slate-400">Never miss critical pre-bid meetings or submission windows. Sync tender calendars in real-time.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="self-start sm:self-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Schedule Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          {/* Calendar header controls */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/80 mb-4">
            <h3 className="font-bold text-white text-sm">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="h-14 bg-slate-900/10 rounded-lg opacity-10" />;
              }

              const formattedDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              
              // Get active events for this cell
              const cellEvents = events.filter((e) => e.date === formattedDateString);
              const isToday = date.getDate() === 3 && date.getMonth() === 6 && date.getFullYear() === 2026;
              const isSelected = selectedDateFilter === formattedDateString;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedDateFilter(null);
                    } else {
                      setSelectedDateFilter(formattedDateString);
                    }
                  }}
                  className={`h-14 p-1.5 border rounded-lg flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-500/15'
                      : isToday 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-slate-800/50 bg-slate-950/20 hover:bg-slate-900/30 hover:border-slate-700/50'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-300' : isToday ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {date.getDate()}
                  </span>

                  <div className="flex gap-1 overflow-hidden">
                    {cellEvents.map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        title={ev.title}
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          ev.type === 'deadline' 
                            ? 'bg-rose-500' 
                            : ev.type === 'pre_bid' 
                            ? 'bg-amber-500' 
                            : ev.type === 'meeting'
                            ? 'bg-indigo-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule Listing Pane */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Bidding Milestones Calendar
                </h3>
                {selectedDateFilter && (
                  <button 
                    onClick={() => setSelectedDateFilter(null)}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {selectedDateFilter && (
                <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-bold">
                  Showing events for: {selectedDateFilter}
                </div>
              )}

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    <div className="w-5 h-5 border border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                    Synchronizing schedules...
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 border border-slate-800/60 border-dashed rounded-xl">
                    <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs">No events registered.</p>
                  </div>
                ) : (
                  filteredEvents.map((ev) => {
                    const isDeadline = ev.type === 'deadline';
                    const isPreBid = ev.type === 'pre_bid';
                    const isMeeting = ev.type === 'meeting';

                    return (
                      <div
                        key={ev.id}
                        className="p-3 bg-slate-950/60 border border-slate-900 hover:border-slate-850 rounded-xl space-y-2 transition-colors relative group/event"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            isDeadline 
                              ? 'bg-rose-500/15 border border-rose-500/20 text-rose-400' 
                              : isPreBid 
                              ? 'bg-amber-500/15 border border-amber-500/20 text-amber-400' 
                              : isMeeting
                              ? 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-400'
                              : 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400'
                          }`}>
                            {ev.type.replace('_', ' ')}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold font-mono">
                              <Clock className="w-3 h-3 text-slate-600" />
                              <span>{ev.time}</span>
                            </div>
                            
                            {/* Reminder Action Bell */}
                            <button
                              onClick={() => handleToggleReminder(ev)}
                              title={ev.reminder ? "Reminder enabled" : "Enable reminder"}
                              className={`p-1 rounded hover:bg-slate-900 transition-colors ${
                                ev.reminder ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'
                              }`}
                            >
                              {ev.reminder ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-200 pr-12 line-clamp-2 leading-tight">
                          {ev.title}
                        </h4>

                        {ev.tenderNumber && (
                          <p className="text-[10px] text-slate-500 font-mono">ID: {ev.tenderNumber}</p>
                        )}

                        <div className="flex justify-between items-center pt-1 border-t border-slate-900/50">
                          <div className="text-[9px] text-indigo-400 font-semibold">
                            Date: {ev.date}
                          </div>

                          {/* Controls (visible on hover) */}
                          <div className="flex gap-1.5 opacity-0 group-hover/event:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(ev)}
                              className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id, ev.title)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduler Modal Dialogue */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-14 md:top-24 md:max-w-md md:mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-6 z-50 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  {editingEvent ? "Edit Scheduled Event" : "Schedule New Event"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Event Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Pre-bid Meeting for Expressway Corridor"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-100 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Event Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none"
                    >
                      <option value="pre_bid">Pre-Bid Meeting</option>
                      <option value="deadline">Submission Closing</option>
                      <option value="meeting">Internal Meeting</option>
                      <option value="review">Bid Opening / Review</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tender Reference ID (Optional)</label>
                    <input
                      type="text"
                      value={formTenderNumber}
                      onChange={(e) => setFormTenderNumber(e.target.value)}
                      placeholder="e.g. NHAI/2026/01"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-100 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Event Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Event Time</label>
                    <input
                      type="text"
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      placeholder="e.g. 11:30 AM"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-100 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-950/40 border border-slate-900 rounded-xl">
                  <input
                    type="checkbox"
                    id="reminder_check"
                    checked={formReminder}
                    onChange={(e) => setFormReminder(e.target.checked)}
                    className="h-4 w-4 bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 rounded"
                  />
                  <label htmlFor="reminder_check" className="text-[11px] font-medium text-slate-400 cursor-pointer select-none">
                    Enable real-time notification alerts 1 hour before this event
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all mt-2 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {editingEvent ? "Update Scheduled Milestone" : "Schedule Milestone"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
