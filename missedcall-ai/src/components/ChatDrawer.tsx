import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MissedCall } from '../types';
import { X, Send, BookOpen, Clock, AlertCircle, Save, CheckCircle } from 'lucide-react';

interface ChatDrawerProps {
  call: MissedCall | null;
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ call, onClose }) => {
  const { sendSimulatedCustomerMessage, updateMissedCallNotes, updateMissedCallStatus, user } = useApp();
  const [customerText, setCustomerText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [notesSaved, setNotesSaved] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync internal state with selected call
  useEffect(() => {
    if (call) {
      setNotes(call.notes || '');
      setNotesSaved(false);
    }
  }, [call]);

  // Scroll to bottom when logs change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [call?.logs]);

  if (!call) return null;

  const handleSendSimulatedCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerText.trim()) return;

    const textToSend = customerText;
    setCustomerText('');
    setIsTyping(true);

    // Send the simulated customer response
    await sendSimulatedCustomerMessage(call.id, textToSend);

    // Simulate AI system typing state for high-fidelity look
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleSaveNotes = async () => {
    await updateMissedCallNotes(call.id, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const formatMessageTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fadeIn"
      id="chat-simulation-drawer-backdrop"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slideLeft border-l border-slate-100"
        id="chat-simulation-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">Automated Conversation</span>
            <h3 className="text-base font-bold text-slate-900 font-sans mt-0.5">{call.customerPhone}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Call ID: {call.callId}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                call.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {call.status}
              </span>
            </div>
          </div>
          <button 
            id="close-drawer-btn"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
          {call.logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p className="text-xs text-slate-500 max-w-xs font-sans">
                No messaging history yet. When a customer calls and is missed, the AI Agent instantly initiates text contact.
              </p>
              <button
                id="drawer-trigger-reply-btn"
                onClick={() => updateMissedCallStatus(call.id, 'Auto-Reply Sent')}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Trigger Initial Auto-Reply SMS
              </button>
            </div>
          ) : (
            call.logs.map((msg, index) => {
              const isSystem = msg.sender === 'system';
              return (
                <div 
                  key={index} 
                  className={`flex flex-col max-w-[85%] ${isSystem ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                >
                  <span className="text-[9px] font-mono text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                    {isSystem ? `${user?.businessName || 'MissedCall'} AI Agent` : 'Customer'}
                  </span>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isSystem 
                      ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-xs' 
                      : 'bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/10'
                  }`}>
                    {msg.text.includes('/book/') ? (
                      <div>
                        <span>{msg.text.split('/book/')[0]}</span>
                        <div className="mt-2.5 p-3 bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-xl flex flex-col">
                          <span className="font-semibold text-[11px] flex items-center gap-1.5 text-indigo-900">
                            <BookOpen className="w-4 h-4 text-indigo-600" /> Public Booking URL
                          </span>
                          <span className="text-[10px] text-indigo-600 font-mono mt-1 break-all">
                            /book/{msg.text.split('/book/')[1]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="flex flex-col mr-auto items-start max-w-[85%] animate-pulse">
              <span className="text-[9px] font-mono text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                AI Rep is typing...
              </span>
              <div className="bg-white border border-slate-100 text-slate-400 p-3 rounded-2xl rounded-tl-none text-xs flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-300"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Live Simulator Chat Bar */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form onSubmit={handleSendSimulatedCustomer} className="flex gap-2" id="simulated-customer-chat-form">
            <input
              id="simulate-customer-message-input"
              type="text"
              placeholder="Simulate customer typing reply..."
              value={customerText}
              disabled={isTyping}
              onChange={(e) => setCustomerText(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              id="send-simulated-msg-btn"
              type="submit"
              disabled={!customerText.trim() || isTyping}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center shrink-0"
              title="Simulate customer sending SMS"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-2 font-mono text-center">
            💡 Type above to simulate customer text input, prompting AI generation!
          </p>
        </div>

        {/* Lead Internal Notes section */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-2">
            Internal Lead Activity Notes
          </label>
          <div className="flex gap-2">
            <textarea
              id="lead-notes-textarea"
              rows={2}
              placeholder="Add status updates, physical callback details, customer preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 p-3 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 resize-none font-sans"
            />
            <button
              id="save-lead-notes-btn"
              onClick={handleSaveNotes}
              className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex flex-col justify-center items-center gap-1.5 transition-colors shrink-0"
            >
              {notesSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-[9px]">Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="text-[9px]">Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
