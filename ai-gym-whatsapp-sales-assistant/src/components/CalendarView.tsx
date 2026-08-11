import React, { useState, useEffect } from "react";
import { Booking } from "../types";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Calendar, Clock, User, Phone, Check, AlertOctagon, RefreshCw, BookmarkCheck } from "lucide-react";

interface CalendarViewProps {
  onRefreshLeads: () => void;
}

export default function CalendarView({ onRefreshLeads }: CalendarViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, orderBy("date", "asc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Booking);
        });
        setBookings(list);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error (bookings):", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUpdateBookingStatus = async (booking: Booking, newStatus: "completed" | "no-show") => {
    try {
      // 1. Update Booking Status
      const bookingDocRef = doc(db, "bookings", booking.id);
      await updateDoc(bookingDocRef, { status: newStatus });

      // 2. Trigger automated WhatsApp Follow-up via backend simulator endpoint
      const triggerType = newStatus === "completed" ? "visited_followup" : "no_show_reminder";
      await fetch("/api/simulate-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: booking.leadId,
          triggerType
        })
      });

      onRefreshLeads();
    } catch (e) {
      console.error("Error updating booking status:", e);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl space-y-6">
      
      <div>
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#CCFF00]" /> Trial Workout Calendar
        </h2>
        <p className="text-xs text-white/60">View and manage scheduled one-day free trials. Update client visit states to activate follow-ups.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-xs text-white/40 font-mono flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#CCFF00]" /> Fetching appointments...
        </div>
      ) : bookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <div 
              key={booking.id}
              className={`border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all hover:bg-white/10 bg-white/5 ${
                booking.status === "completed" ? "border-indigo-500/35 shadow-lg shadow-indigo-500/5 bg-indigo-950/20" :
                booking.status === "no-show" ? "border-rose-500/20 bg-rose-950/10" : "border-white/10"
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-white/50" /> {booking.customerName}
                    </h3>
                    <p className="text-[10px] text-white/40 font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {booking.customerPhone}
                    </p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${
                    booking.status === "completed" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                    booking.status === "no-show" ? "bg-rose-500/15 text-rose-300 border border-rose-500/20" :
                    "bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/25 animate-pulse"
                  }`}>
                    {booking.status === "scheduled" ? "active" : booking.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs font-mono text-white/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-white/40" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    <span className="truncate">{booking.timeSlot}</span>
                  </div>
                </div>
              </div>

              {booking.status === "scheduled" && (
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleUpdateBookingStatus(booking, "no-show")}
                    className="flex-1 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold py-1.5 rounded-xl border border-white/10 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <AlertOctagon className="w-3 h-3" /> No-Show
                  </button>
                  <button
                    onClick={() => handleUpdateBookingStatus(booking, "completed")}
                    className="flex-1 bg-[#CCFF00] hover:bg-[#b5e600] text-black text-[10px] font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(204,255,0,0.25)] cursor-pointer"
                  >
                    <Check className="w-3 h-3 text-black" /> Attended
                  </button>
                </div>
              )}
              
              {booking.status === "completed" && (
                <div className="text-[10px] text-indigo-300 font-bold font-mono text-center flex items-center justify-center gap-1">
                  <BookmarkCheck className="w-3.5 h-3.5" /> Checked-In & Feedback Sent
                </div>
              )}
              
              {booking.status === "no-show" && (
                <div className="text-[10px] text-rose-400/80 font-bold font-mono text-center">
                  ⚠️ No-Show Follow-up Sent
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center text-white/40">
          <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-xs font-mono mb-1 text-white/60">NO TRIALS BOOKED YET</p>
          <p className="text-[10px] text-white/40">Free trials will populate here automatically once clients schedule them through FitBot.</p>
        </div>
      )}

    </div>
  );
}
