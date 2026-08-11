import React from 'react';
import { User } from 'firebase/auth';
import { ShieldAlert, Sparkles, Menu, Bell, Globe, HelpCircle, Sun, Moon } from 'lucide-react';
import { TabType } from '../types';

interface HeaderProps {
  user: User;
  isActiveSubscription: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onMobileMenuToggle: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Header({ 
  user, 
  isActiveSubscription, 
  activeTab, 
  onTabChange, 
  onMobileMenuToggle,
  theme,
  onToggleTheme
}: HeaderProps) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'HQ Dashboard';
      case 'generator':
        return 'SEO Reply Generator';
      case 'history':
        return 'Historical Logs';
      case 'billing':
        return 'Billing & Subscriptions';
      default:
        return 'ReviewRanger AI';
    }
  };

  const isOwner = user?.email?.toLowerCase() === 'neoedits2009@gmail.com';

  return (
    <header id="header-container" className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 h-16 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
      {/* Mobile Menu Trigger & Title */}
      <div className="flex items-center space-x-3">
        <button
          id="mobile-menu-toggle-btn"
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white font-sans" id="header-page-title">
            {getTabTitle()}
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-400 hidden sm:block">
            SaaS console to manage and optimize customer reviews
          </p>
        </div>
      </div>

      {/* Global Actions Bar */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        
        {/* Localization Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full text-slate-500 dark:text-slate-300 font-medium text-xs">
          <Globe className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <span>India (GST Supported)</span>
        </div>

        {/* Subscription Status Badge */}
        <button
          id="header-subscription-badge"
          onClick={() => onTabChange('billing')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs border transition ${
            isOwner
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
          }`}
        >
          {isOwner ? (
            <>
              <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span>Supreme Owner Access</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 text-emerald-500 fill-emerald-500" />
              <span>Full Access Unlocked</span>
            </>
          )}
        </button>

        {/* 🌓 NEW: Theme Toggle Button */}
        <button
          id="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer flex items-center justify-center shadow-xs"
        >
          {theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5 text-amber-400 hover:text-amber-300 transition-colors" />
          ) : (
            <Moon className="h-4.5 w-4.5 text-indigo-600 hover:text-indigo-700 transition-colors" />
          )}
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-100 dark:bg-slate-800" />

        {/* User profile dropdown container */}
        <div className="flex items-center space-x-2">
          <div className="text-right hidden lg:block">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate max-w-36">
              {user.displayName || 'Business Owner'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-36">
              {user.email || 'operator'}
            </p>
          </div>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="User profile"
              className="h-8.5 w-8.5 rounded-full border border-slate-100 dark:border-slate-800 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-8.5 w-8.5 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
              {user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0) || 'B'}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
