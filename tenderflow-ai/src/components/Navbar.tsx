import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  MapPin, 
  ChevronDown, 
  Building2, 
  CheckCircle2, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  onSetActiveView: (view: string) => void;
  activeView: string;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSetActiveView, activeView, onOpenAuth }) => {
  const { 
    currentUser, 
    userProfile, 
    currentCompany, 
    notifications, 
    clearNotification,
    markAllNotificationsRead,
    theme, 
    toggleTheme, 
    logout,
    selectedStateFilter,
    setSelectedStateFilter
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read);
  const availableStates = ['All States', 'Delhi', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Kerala', 'Punjab'];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSetActiveView('dashboard')}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-blue-600 to-sky-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <span className="text-white font-extrabold text-sm">TF</span>
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 dark:text-slate-50 tracking-tight block">TenderFlow AI</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-1 font-semibold">Indian B2B SaaS</span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => onSetActiveView('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'dashboard' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onSetActiveView('tenders')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'tenders' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              Search Tenders
            </button>

            <button 
              onClick={() => onSetActiveView('workflow')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'workflow' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              My Bid Board
            </button>
            <button 
              onClick={() => onSetActiveView('crm')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'crm' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              Bid CRM Pipeline
            </button>
            <button 
              onClick={() => onSetActiveView('calendar')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'calendar' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              Bidding Calendar
            </button>
            <button 
              onClick={() => onSetActiveView('company')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'company' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              Company Profile
            </button>
            <button 
              onClick={() => onSetActiveView('admin')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'admin' 
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              Admin Control
            </button>
          </nav>

          {/* Right Accessories (State Picker, Theme, Auth, Alerts) */}
          <div className="flex items-center gap-2">
            
            {/* Global State Picker */}
            <div className="relative hidden lg:block">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                <select 
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="bg-transparent font-semibold border-none focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {availableStates.map(state => (
                    <option key={state} value={state} className="dark:bg-slate-900 dark:text-slate-100">{state}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Toggle Dark/Light Mode"
              id="theme-switcher-button"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Auth Block */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                
                {/* Notifications Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative cursor-pointer"
                    id="notification-bell-button"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifs.length > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {unreadNotifs.length}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Drawer */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Alert Center</span>
                        {unreadNotifs.length > 0 && (
                          <button 
                            onClick={markAllNotificationsRead}
                            className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                            No active notifications.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-3.5 transition-colors flex flex-col gap-1 ${notif.read ? 'opacity-65' : 'bg-blue-500/5'}`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                                  {notif.title}
                                </span>
                                {!notif.read && (
                                  <button 
                                    onClick={() => clearNotification(notif.id)}
                                    className="text-[9px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                                  >
                                    Dismiss
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Role Info Profile Dropdown */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      {userProfile?.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="text-[9px] text-slate-400 block leading-none font-semibold">
                      {userProfile?.role === 'super_admin' ? (
                        <span className="text-rose-500 font-bold">Super Admin</span>
                      ) : userProfile?.role === 'company_admin' ? (
                        <span className="text-emerald-500 font-bold">Company Admin</span>
                      ) : (
                        <span className="text-blue-500 font-bold">Employee</span>
                      )}
                    </span>
                  </div>

                  {/* Sign Out Button */}
                  <button 
                    onClick={logout}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                    title="Sign Out"
                    id="signout-icon-button"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-md hover:shadow-blue-500/20 cursor-pointer"
                id="login-trigger-button"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Icon Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer list */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-2 animate-fade-in">
          {/* Mobile State Picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 w-full mb-2">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <select 
              value={selectedStateFilter}
              onChange={(e) => {
                setSelectedStateFilter(e.target.value);
                setIsMobileMenuOpen(false);
              }}
              className="bg-transparent font-medium border-none focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 w-full cursor-pointer"
            >
              {availableStates.map(state => (
                <option key={state} value={state} className="dark:bg-slate-900 dark:text-slate-100">{state}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => { onSetActiveView('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold block cursor-pointer ${
              activeView === 'dashboard' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => { onSetActiveView('tenders'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold block cursor-pointer ${
              activeView === 'tenders' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Search Tenders
          </button>

          <button 
            onClick={() => { onSetActiveView('workflow'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold block cursor-pointer ${
              activeView === 'workflow' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            My Bid Board
          </button>
          <button 
            onClick={() => { onSetActiveView('crm'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold block cursor-pointer ${
              activeView === 'crm' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Bid CRM Pipeline
          </button>
          <button 
            onClick={() => { onSetActiveView('calendar'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold block cursor-pointer ${
              activeView === 'calendar' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Bidding Calendar
          </button>
          <button 
            onClick={() => { onSetActiveView('company'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold block cursor-pointer ${
              activeView === 'company' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Company Profile
          </button>
          <button 
            onClick={() => { onSetActiveView('admin'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold block cursor-pointer ${
              activeView === 'admin' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Admin Control
          </button>
        </div>
      )}

    </header>
  );
};
