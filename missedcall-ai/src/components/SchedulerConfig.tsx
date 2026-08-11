import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, Copy, Check, ExternalLink, UserCheck, Trash2, ShieldAlert } from 'lucide-react';

interface SchedulerConfigProps {
  onPreviewBookingPortal: () => void;
}

export const SchedulerConfig: React.FC<SchedulerConfigProps> = ({ onPreviewBookingPortal }) => {
  const { user, updateProfile, bookings, updateBookingStatus } = useApp();
  const [copied, setCopied] = useState<boolean>(false);

  // Pre-configured slots that the business can choose to enable or disable
  const availableSystemSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  const activeSlots = user?.calendarSlots || [];

  const handleToggleSlot = async (slot: string) => {
    let newSlots: string[];
    if (activeSlots.includes(slot)) {
      newSlots = activeSlots.filter(s => s !== slot);
    } else {
      newSlots = [...activeSlots, slot].sort((a, b) => {
        // Simple string compare or actual time sort
        return availableSystemSlots.indexOf(a) - availableSystemSlots.indexOf(b);
      });
    }
    await updateProfile({ calendarSlots: newSlots });
  };

  const copyBookingLink = () => {
    const link = `${window.location.origin}/book/${user?.uid || 'demo'}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  return (
    <div className="space-y-8" id="scheduler-engine-container">
      {/* 1. Public Booking Link Setup Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold">
              AI Powered Scheduling Link
            </span>
            <h2 className="text-lg font-bold text-slate-900 font-sans mt-2">Lead Auto-Recovery Booking Portal</h2>
            <p className="text-xs text-slate-500 font-sans max-w-xl">
              When a client misses their call, our AI agent responds within 5 seconds sending this exact link. When customers choose an open slot, they automatically sync below!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Display Mock Booking Link */}
            <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-600 flex-1 lg:flex-initial">
              <span className="select-all">/book/{user?.uid ? user.uid.substring(0, 8) : 'demo'}...</span>
            </div>
            
            <button
              id="copy-booking-link-btn"
              onClick={copyBookingLink}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>

            <button
              id="preview-booking-portal-btn"
              onClick={onPreviewBookingPortal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-600/10"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Simulate Booking Portal</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Calendar Slot Active/Inactive Toggles */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-6">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 font-sans">Active Calendar Time Slots</h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Toggle the exact hours you are available. Disabled hours will instantly lock and hide from customers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" id="calendar-slots-grid">
            {availableSystemSlots.map((slot) => {
              const isActive = activeSlots.includes(slot);
              return (
                <button
                  id={`slot-toggle-${slot.replace(/[\s:]/g, '-')}`}
                  key={slot}
                  onClick={() => handleToggleSlot(slot)}
                  className={`p-3 border rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isActive 
                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-xs shadow-amber-500/10' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                    <span>{slot}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-slate-950 animate-ping' : 'bg-slate-300'}`}></span>
                </button>
              );
            })}
          </div>
          {activeSlots.length === 0 && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>No slots enabled! Simulated customers won't be able to book any appointments. Please enable some.</span>
            </div>
          )}
        </div>

        {/* 3. Confirmed Recovered Bookings View */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6 flex flex-col h-full">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 font-sans">Recovered Bookings</h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Schedule list of recovered leads that successfully converted.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px] space-y-3 pr-1" id="recovered-bookings-list">
            {bookings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 text-xs">
                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                <span>No bookings found. Convert clients inside the public booking simulator!</span>
              </div>
            ) : (
              bookings.map((booking) => (
                <div 
                  id={`booking-card-${booking.id}`}
                  key={booking.id} 
                  className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 font-sans">
                        {booking.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {booking.customerPhone}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${getBookingStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100/80 pt-2 font-sans">
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {booking.bookingDate}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {booking.bookingTime}
                    </span>
                  </div>

                  {booking.status === 'Confirmed' && (
                    <div className="flex gap-2 pt-1 border-t border-slate-100/40">
                      <button
                        id={`complete-booking-${booking.id}`}
                        onClick={() => updateBookingStatus(booking.id, 'Completed')}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Complete Session</span>
                      </button>
                      <button
                        id={`cancel-booking-${booking.id}`}
                        onClick={() => updateBookingStatus(booking.id, 'Cancelled')}
                        className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] flex items-center justify-center transition-colors"
                        title="Cancel Appointment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
