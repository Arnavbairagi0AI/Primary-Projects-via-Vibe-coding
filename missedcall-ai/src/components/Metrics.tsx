import React from 'react';
import { useApp } from '../context/AppContext';
import { PhoneMissed, MessageSquare, CalendarCheck, Sparkles } from 'lucide-react';

export const Metrics: React.FC = () => {
  const { missedCalls, bookings } = useApp();

  const totalCalls = missedCalls.length;
  
  // Auto-replies sent: Any call where the logs array has at least one system message
  const autoReplies = missedCalls.filter(call => 
    call.status !== 'Missed' || (call.logs && call.logs.some(log => log.sender === 'system'))
  ).length;

  // Converted Appointments: Confirmed bookings or resolved calls
  const convertedAppointments = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length;

  // Recovery Rate calculation
  const recoveryRate = totalCalls > 0 
    ? Math.round((convertedAppointments / totalCalls) * 100) 
    : 0;

  const cards = [
    {
      id: 'metric-total-missed',
      name: 'Total Missed Calls',
      value: totalCalls,
      change: '100% captured',
      icon: PhoneMissed,
      color: 'bg-rose-50 border-rose-100 text-rose-600',
      iconColor: 'text-rose-600'
    },
    {
      id: 'metric-auto-replies',
      name: 'AI Auto-Replies',
      value: autoReplies,
      change: `${totalCalls > 0 ? Math.round((autoReplies / totalCalls) * 100) : 0}% automated`,
      icon: MessageSquare,
      color: 'bg-indigo-50 border-indigo-100 text-indigo-600',
      iconColor: 'text-indigo-600'
    },
    {
      id: 'metric-converted',
      name: 'Appointments Recovered',
      value: convertedAppointments,
      change: `${recoveryRate}% recovery rate`,
      icon: CalendarCheck,
      color: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      iconColor: 'text-emerald-600'
    },
    {
      id: 'metric-recovery-rate',
      name: 'Customer Recovery Rate',
      value: `${recoveryRate}%`,
      change: 'Industry avg: 15%',
      icon: Sparkles,
      color: 'bg-amber-50 border-amber-100 text-amber-600',
      iconColor: 'text-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8" id="metrics-card-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div 
            id={card.id}
            key={card.name} 
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
                {card.name}
              </span>
              <div className={`p-2.5 rounded-xl border ${card.color}`}>
                <Icon className="w-5 h-5 shrink-0" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-slate-900 tracking-tight font-sans">
                {card.value}
              </span>
              <span className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1">
                {card.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
