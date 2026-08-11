import React from 'react';
import { 
  Terminal, 
  Cpu, 
  Database, 
  LayoutGrid, 
  Code2, 
  Radio, 
  HelpCircle,
  Menu,
  Sparkles,
  CreditCard,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  voiceModeEnabled: boolean;
  subscribed: boolean;
  userEmail: string;
  onSignInClick: () => void;
  onSignOut: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  voiceModeEnabled, 
  subscribed, 
  userEmail, 
  onSignInClick, 
  onSignOut 
}: SidebarProps) {
  const menuItems = [
    { id: 'mega', name: 'Unified Mega-Chat', icon: LayoutGrid, desc: 'Parallel 5-Engine Grid' },
    { id: 'single', name: 'Model Studio', icon: Cpu, desc: 'Individual Chat & Credentials' },
    { id: 'secLab', name: 'Aegis Sec-Audit Lab', icon: ShieldAlert, desc: 'App Pentesting & Corrections' },
    { id: 'db', name: 'Database Monitor', icon: Database, desc: 'Simulated SQLite Ledger' },
    { id: 'diagnostics', name: 'Diagnostics', icon: Radio, desc: 'Uptime & Proxy Rotations' },
    { id: 'billing', name: 'Billing & License', icon: CreditCard, desc: 'Manage Pro Subscription' },
  ];

  return (
    <nav className="w-64 border-r border-gray-800 bg-[#0d0d0d] flex flex-col justify-between h-full select-none" id="sidebar-container">
      {/* Upper Navigation Header */}
      <div className="flex flex-col">
        {/* Brand Banner */}
        <div className="p-4 border-b border-gray-800">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Models & Engines</p>
          <ul className="space-y-1">
            {subscribed ? (
              <li className="flex items-center justify-between px-3 py-2 rounded bg-cyan-950/20 border border-cyan-800/40">
                <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  Enterprise Pro
                </span>
                <span className="text-[9px] bg-cyan-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">ACTIVE</span>
              </li>
            ) : (
              <button 
                onClick={() => setActiveTab('billing')}
                className="w-full flex items-center justify-between px-3 py-2 rounded bg-gray-900 hover:bg-gray-850 border border-gray-800 transition-all text-left"
              >
                <span className="text-xs text-gray-400 font-semibold">Free Basic Account</span>
                <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono animate-pulse">UPGRADE</span>
              </button>
            )}
          </ul>
        </div>

        {/* Tab Selection */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-left transition-all group ${
                  isSelected 
                    ? 'bg-[#151515] border border-gray-700 text-cyan-400 font-medium' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <div>
                  <p className="text-xs font-semibold">{item.name}</p>
                  <p className="text-[9px] text-gray-600 group-hover:text-gray-500 font-sans">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Downward Telemetry Status Panel */}
      <div className="p-4 border-t border-gray-800 bg-black/20 space-y-4">
        {/* Sign In Status Area */}
        <div className="p-3 bg-black/50 rounded border border-cyan-950/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider">Access Portal</span>
            {userEmail ? (
              <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-1 py-0.5 rounded font-mono font-bold uppercase">OWNER</span>
            ) : (
              <span className="text-[8px] bg-gray-900 text-gray-500 border border-gray-800 px-1 py-0.5 rounded font-mono font-bold uppercase">UNAUTHORIZED</span>
            )}
          </div>
          {userEmail ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono text-gray-300 truncate">{userEmail}</p>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] text-green-400 font-sans flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 shrink-0" /> Lifetime VIP
                </span>
                <button 
                  onClick={onSignOut}
                  className="text-[9px] font-mono text-red-400/80 hover:text-red-400 hover:underline flex items-center gap-0.5"
                >
                  <LogOut className="w-2.5 h-2.5" /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[9px] text-gray-500 leading-normal font-sans">
                Unlock lifetime unthrottled API scrapers & GPT/Claude parallel lines.
              </p>
              <button
                onClick={onSignInClick}
                className="w-full py-1.5 bg-cyan-950 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-850 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
              >
                <LogIn className="w-3 h-3" /> Developer Sign In
              </button>
            </div>
          )}
        </div>

        {/* Voice Recognition Badge */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider font-mono">Voice Mode</span>
          <button 
            onClick={() => {}}
            className={`w-8 h-4 rounded-full relative transition-colors ${voiceModeEnabled ? 'bg-cyan-900' : 'bg-gray-800'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${voiceModeEnabled ? 'right-0.5 bg-cyan-400' : 'left-0.5 bg-gray-500'}`}></div>
          </button>
        </div>

        <div className="p-3 bg-black/40 rounded border border-gray-800 text-[10px] font-mono leading-relaxed text-gray-500">
          [SYS] Native TTS: Available<br/>
          [SYS] STT: WebSpeech Pipeline
        </div>
      </div>
    </nav>
  );
}
