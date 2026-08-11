/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Store, 
  MenuSquare, 
  Bot, 
  MessageSquareCode, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  businessName: string;
  isSuperAdmin: boolean;
  onSignOut: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  businessName,
  isSuperAdmin,
  onSignOut,
  isOpen,
  setIsOpen,
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Business Profile', icon: Store },
    { id: 'menu', label: 'Menu & Products', icon: MenuSquare },
    { id: 'ai-settings', label: 'AI Configuration', icon: Bot },
    { id: 'whatsapp', label: 'WhatsApp Live Chat', icon: MessageSquareCode },
    { id: 'orders', label: 'Order Management', icon: ShoppingBag },
    { id: 'customers', label: 'Customers Directory', icon: Users },
    { id: 'billing', label: 'Subscription & Billing', icon: CreditCard },
  ];

  return (
    <>
      {/* Sidebar background overlay on mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30 transition-opacity duration-300"
        />
      )}

      {/* Sidebar navigation container */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-40 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 rounded-lg text-black font-bold">
              <span className="text-sm tracking-tight italic font-black">L</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-lg leading-tight tracking-tight font-display">Leo AI</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">WhatsApp Assistant</span>
            </div>
          </div>

          {/* Close button for mobile slideout */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Business details summary */}
        <div className={`p-4 mx-3 my-3 rounded-xl flex items-center gap-3 border transition duration-300 ${
          isSuperAdmin 
            ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/5' 
            : 'bg-white/5 border-white/10'
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-black text-sm font-display ${
            isSuperAdmin
              ? 'bg-gradient-to-tr from-amber-400 to-amber-600 animate-pulse'
              : 'bg-gradient-to-tr from-emerald-500 to-emerald-600'
          }`}>
            {isSuperAdmin ? '👑' : (businessName ? businessName.charAt(0).toUpperCase() : 'B')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{isSuperAdmin ? 'Master Workspace' : (businessName || 'My Business')}</p>
            <p className={`text-[10px] font-medium flex items-center gap-1 ${
              isSuperAdmin ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
                isSuperAdmin ? 'bg-amber-400' : 'bg-emerald-500'
              }`}></span>
              {isSuperAdmin ? 'Supreme Owner & Tester' : 'AI Agent Active'}
            </p>
          </div>
        </div>

        {/* Navigation items list */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group/tooltip">
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 cursor-pointer border
                    ${isActive 
                      ? 'bg-white/5 text-emerald-400 border-white/10 shadow-sm' 
                      : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent'
                    }
                  `}
                >
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-white/60 group-hover:text-white'}`} />
                  {item.label}
                </button>

                {/* Floating Tooltip Overlay */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#0a0a0a] border border-white/10 text-white font-semibold text-xs rounded-lg shadow-xl opacity-0 translate-x-2 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap hidden lg:block">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white/10" />
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0a0a0a] mr-[-1px]" />
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Super Admin Section (Conditional) */}
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <span className="px-3 text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-2">Super Admin</span>
              <div className="relative group/tooltip">
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 cursor-pointer border
                    ${activeTab === 'admin' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-md shadow-rose-500/5' 
                      : 'text-rose-400 hover:text-white hover:bg-rose-950/20 border-transparent'
                    }
                  `}
                >
                  <ShieldCheck className="w-4.5 h-4.5 flex-shrink-0" />
                  Leo Admin Panel
                </button>

                {/* Floating Tooltip Overlay */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#0a0a0a] border border-white/10 text-rose-400 font-semibold text-xs rounded-lg shadow-xl opacity-0 translate-x-2 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap hidden lg:block">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white/10" />
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0a0a0a] mr-[-1px]" />
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    Leo Admin Panel
                  </span>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Footer - Logout */}
        <div className="p-4 border-t border-white/5">
          <div className="relative group/tooltip">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-400 hover:text-white hover:bg-red-950/30 rounded-xl transition duration-150 cursor-pointer animate-none"
            >
              <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
              Sign Out Session
            </button>

            {/* Floating Tooltip Overlay */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#0a0a0a] border border-white/10 text-red-400 font-semibold text-xs rounded-lg shadow-xl opacity-0 translate-x-2 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap hidden lg:block">
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white/10" />
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0a0a0a] mr-[-1px]" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Sign Out Session
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
