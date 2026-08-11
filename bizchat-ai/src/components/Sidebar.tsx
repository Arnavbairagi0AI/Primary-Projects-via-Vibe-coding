import React from 'react';
import { 
  Bot, 
  LayoutDashboard, 
  MessageSquareCode, 
  UsersRound, 
  ShoppingCart, 
  Coffee, 
  Settings2, 
  ShieldCheck, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  X
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  user: UserProfile;
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

export default function Sidebar({
  user,
  currentTab,
  onChangeTab,
  onLogout,
  darkMode,
  onToggleDarkMode,
  mobileOpen,
  onToggleMobile
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'chat', label: 'AI Chat', icon: <MessageSquareCode className="w-5 h-5" /> },
    { id: 'customers', label: 'Customers', icon: <UsersRound className="w-5 h-5" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'products', label: 'Products', icon: <Coffee className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings2 className="w-5 h-5" /> },
  ];

  if (user.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: <ShieldCheck className="w-5 h-5 text-amber-500" /> });
  }

  const handleTabClick = (tabId: string) => {
    onChangeTab(tabId);
    if (mobileOpen) {
      onToggleMobile();
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-6">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-semibold text-base text-slate-850 dark:text-white tracking-tight">BizChat<span className="text-indigo-600">AI</span></span>
              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider -mt-1">
                100% Free Unlocked
              </div>
            </div>
          </div>
          <button 
            onClick={onToggleMobile} 
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-650 text-white shadow-sm font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Settings & Logout */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-4">
        {/* User Card */}
        <div className="flex items-center gap-3 px-2 py-1.5">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
            alt={user.displayName} 
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.displayName}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.shopName || 'Owner'}</p>
          </div>
        </div>

        {/* Theme Toggle & Logout */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onToggleDarkMode}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs font-medium"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 h-screen shrink-0 sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onToggleMobile} 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside 
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sticky Menu Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={onToggleMobile} 
            className="p-1.5 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-extrabold text-slate-800 dark:text-white text-base">
            {currentTab.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
            {user.shopName ? user.shopName.split(' ')[0] : 'Merchant'}
          </span>
        </div>
      </header>
    </>
  );
}
