import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MissedCall } from '../types';
import { MessageSquare, CalendarClock, ChevronRight, CheckCircle, Trash, Search, Filter } from 'lucide-react';

interface MissedCallTableProps {
  onSelectCall: (call: MissedCall) => void;
}

export const MissedCallTable: React.FC<MissedCallTableProps> = ({ onSelectCall }) => {
  const { missedCalls, updateMissedCallStatus } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getStatusBadge = (status: MissedCall['status']) => {
    switch (status) {
      case 'Missed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Urgent Missed
          </span>
        );
      case 'Auto-Reply Sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Auto-Reply Sent
          </span>
        );
      case 'Customer Engaged':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Customer Engaged
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Resolved
          </span>
        );
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // Filter and search
  const filteredCalls = missedCalls.filter((call) => {
    const matchesStatus = filterStatus === 'All' || call.status === filterStatus;
    const matchesSearch = call.customerPhone.includes(searchQuery) || 
                          call.callId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          call.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="missed-call-hub">
      {/* Search and Filters Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-base font-bold text-slate-900 font-sans">Lead Recovery Feed</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">Real-time incoming missed calls and live AI conversational statuses.</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-calls-input"
              type="text"
              placeholder="Search phone, ID or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            {['All', 'Missed', 'Auto-Reply Sent', 'Customer Engaged', 'Resolved'].map((status) => (
              <button
                id={`filter-btn-${status.toLowerCase().replace(/\s+/g, '-')}`}
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {status === 'Missed' ? 'Urgent' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="missed-calls-table">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
              <th className="py-4 px-6">Caller ID</th>
              <th className="py-4 px-6">Phone Number</th>
              <th className="py-4 px-6">Time / Date</th>
              <th className="py-4 px-6">AI Recovery Status</th>
              <th className="py-4 px-6">Engagement Logs Preview</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-sans">
                  No missed calls match your active filters. Try simulating a call!
                </td>
              </tr>
            ) : (
              filteredCalls.map((call) => {
                const lastMsg = call.logs && call.logs.length > 0 ? call.logs[call.logs.length - 1] : null;
                return (
                  <tr 
                    id={`call-row-${call.id}`}
                    key={call.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectCall(call)}
                  >
                    <td className="py-4 px-6 text-xs font-mono font-bold text-slate-600">
                      {call.callId}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                      {call.customerPhone}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {formatTime(call.timestamp)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(call.status)}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate font-sans">
                      {lastMsg ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-700 capitalize text-[10px]">
                            {lastMsg.sender === 'system' ? 'AI Agent' : 'Customer'}
                          </span>
                          <span className="truncate block italic">"{lastMsg.text}"</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No activity logs recorded</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {call.status !== 'Resolved' && (
                          <button
                            id={`resolve-btn-${call.id}`}
                            onClick={() => updateMissedCallStatus(call.id, 'Resolved', 'Manually resolved by team.')}
                            title="Mark as Resolved"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          id={`open-chat-btn-${call.id}`}
                          onClick={() => onSelectCall(call)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View Conversation</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
