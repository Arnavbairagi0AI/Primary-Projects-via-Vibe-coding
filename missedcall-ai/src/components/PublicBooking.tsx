import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, Sparkles, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

interface PublicBookingProps {
  onBackToDashboard?: () => void;
  standalone?: boolean;
}

export const PublicBooking: React.FC<PublicBookingProps> = ({ onBackToDashboard, standalone = false }) => {
  const { user, addBooking, missedCalls } = useApp();
  
  // Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0] // Default to tomorrow
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Grab the business's active slots, with a helpful fallback if none are set
  const activeSlots = user?.calendarSlots && user.calendarSlots.length > 0 
    ? user.calendarSlots 
    : ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

  // Quick helper to fill phone from an active missed call to make demoing effortless!
  const autofillFromRecentMissedCall = (phone: string) => {
    setCustomerPhone(phone);
    // Auto-fill some realistic test names based on the phone
    if (phone.includes('98765')) {
      setCustomerName('Rahul Sharma');
      setCustomerEmail('rahul.sharma@example.com');
    } else if (phone.includes('81234')) {
      setCustomerName('Aarav Patel');
      setCustomerEmail('aarav.patel@example.com');
    } else {
      setCustomerName('Test Customer');
      setCustomerEmail('test.customer@example.com');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim() || !customerPhone.trim() || !selectedDate || !selectedSlot) {
      setFormError('Please fill out all required fields and select an open time slot.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addBooking({
        businessId: user?.uid || 'demo-business',
        customerName,
        customerPhone,
        customerEmail,
        bookingDate: selectedDate,
        bookingTime: selectedSlot
      });
      
      setBookingSuccess(true);
    } catch (err: any) {
      setFormError(err.message || 'Booking submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setSelectedSlot('');
    setBookingSuccess(false);
    setFormError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8" id="public-booking-portal">
      {/* Simulation Banner - reminding user they are inside customer simulation mode */}
      {!standalone && (
        <div className="w-full max-w-2xl bg-indigo-950 text-white rounded-2xl p-4 mb-6 border border-indigo-800 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300">Sandbox Simulator</span>
              <span className="text-xs font-semibold text-white">Previewing customer scheduling portal experience</span>
            </div>
          </div>
          {onBackToDashboard && (
            <button
              id="back-to-dashboard-btn"
              onClick={onBackToDashboard}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Business Suite</span>
            </button>
          )}
        </div>
      )}

      {/* Booking Form Layout */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {/* Customer Header branding based on the active Business */}
        <div className="bg-indigo-600 px-8 py-10 text-white text-center flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-radial-gradient from-indigo-500/30 to-transparent pointer-events-none"></div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-200">SCHEDULE APPOINTMENT</span>
          <h1 className="text-2xl font-bold font-sans mt-2" id="booking-portal-business-name">
            {user?.businessName || 'Apex Business Solutions'}
          </h1>
          <p className="text-xs text-indigo-100 max-w-md mt-1.5 font-sans">
            Please select an available slot and provide your contact details. Your booking will automatically sync with our scheduling systems.
          </p>
        </div>

        {bookingSuccess ? (
          /* Success Screen */
          <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-6" id="booking-success-viewport">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 font-sans">Appointment Confirmed!</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-sans">
                Thank you, **{customerName}**. Your appointment is secured for **{selectedDate}** at **{selectedSlot}**. A confirmation SMS thread was sent to your phone.
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 w-full max-w-md text-left text-xs space-y-2.5 font-sans">
              <div className="flex justify-between border-b border-slate-200/50 pb-2">
                <span className="text-slate-400">Client:</span>
                <span className="font-bold text-slate-800">{customerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-2">
                <span className="text-slate-400">Phone:</span>
                <span className="font-bold text-slate-800">{customerPhone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-2">
                <span className="text-slate-400">Session Date:</span>
                <span className="font-bold text-slate-800">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Session Time:</span>
                <span className="font-bold text-indigo-600">{selectedSlot}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                id="reset-booking-btn"
                onClick={resetForm}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
              >
                Book Another Appointment
              </button>
              {!standalone && onBackToDashboard && (
                <button
                  id="success-back-to-dashboard-btn"
                  onClick={onBackToDashboard}
                  className="px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBookingSubmit} className="p-6 md:p-8 space-y-6" id="public-booking-form">
            {formError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Sandbox Quick Seeding / Testing panel */}
            {!standalone && missedCalls.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wide block">
                  💡 Sandbox Quick Tester: Autofill from Active Missed Calls
                </span>
                <p className="text-[11px] text-amber-700">
                  Select a caller from your logs feed to simulate how they book using the link sent to their SMS thread:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missedCalls.slice(0, 3).map((call) => (
                    <button
                      id={`autofill-missed-call-btn-${call.id}`}
                      key={call.id}
                      type="button"
                      onClick={() => autofillFromRecentMissedCall(call.customerPhone)}
                      className="px-2.5 py-1 bg-white border border-amber-200 hover:bg-amber-100 rounded-lg text-[10px] font-mono text-amber-900 transition-all flex items-center gap-1.5"
                    >
                      <Phone className="w-3 h-3 text-amber-500" />
                      <span>{call.customerPhone} ({call.status})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 font-mono tracking-wider">Your Contact Details</h3>
                
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="customer-name-input"
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Customer Phone */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="customer-phone-input"
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Customer Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="customer-email-input"
                      type="email"
                      placeholder="e.g. jane.doe@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Date & Slot Pickers */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 font-mono tracking-wider">Appointment Scheduling</h3>

                {/* Select Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">Select Date *</label>
                  <div className="relative">
                    <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="booking-date-input"
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Select Time Slot */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">Select Time Slot *</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1" id="booking-time-slots">
                    {activeSlots.map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          id={`select-booking-slot-${slot.replace(/[\s:]/g, '-')}`}
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`} />
                          <span>{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                id="submit-booking-form-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-all"
              >
                {isSubmitting ? 'Registering Appointment...' : 'Secure My Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
