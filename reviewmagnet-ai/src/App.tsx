import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Auth } from "./components/Auth";
import { ReviewHub } from "./components/ReviewHub";
import { QrEngine } from "./components/QrEngine";
import { Billing } from "./components/Billing";
import { AdminConsole } from "./components/AdminConsole";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  MessageSquare, 
  QrCode, 
  CreditCard, 
  Zap, 
  LogOut, 
  Menu, 
  X, 
  Building, 
  Shield, 
  User,
  Clock,
  ExternalLink
} from "lucide-react";

type ActivePage = "reviews" | "qr-engine" | "billing" | "admin-console";

function AppContent() {
  const { user, loading, logoutUser } = useApp();
  const [activePage, setActivePage] = useState<ActivePage>("reviews");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authenticated Workspace Layout - Full Unlocked Access
  const navigationItems = [
    { id: "reviews" as const, label: "Review Hub", icon: MessageSquare },
    { id: "qr-engine" as const, label: "QR Engine", icon: QrCode },
    { id: "billing" as const, label: "Billing Portal", icon: CreditCard, badge: "Free" },
    { id: "admin-console" as const, label: "Admin Console", icon: Zap, badge: "Full Access" },
  ];

  return (
    <div id="saas-workspace" className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      {/* Sidebar for Desktop / Large Screens */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-[#0e131f] text-white shrink-0 border-r border-slate-800/80 shadow-2xl">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800/80">
          <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm tracking-tight text-white">ReviewMagnet AI</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none mt-0.5">SaaS Booster</p>
          </div>
        </div>

        {/* Current User Quick Badge */}
        <div className="px-4 py-4 border-b border-slate-800/80 bg-[#141b2b]/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-slate-800/80 flex items-center justify-center text-indigo-400 border border-slate-700/80">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{user.businessName}</p>
              {user.isSystemOwner || user.email.toLowerCase() === "neoedits2008@gmail.com" ? (
                <div className="flex flex-col gap-1 mt-0.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 border border-amber-400/40 text-center">
                    System Owner
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 text-center">
                    Primary Tester
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    user.role === "Admin" ? "bg-indigo-950/60 text-indigo-300 border border-indigo-900/40" : "bg-slate-800/80 text-slate-300 border border-slate-700/40"
                  }`}>
                    {user.role}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    user.subscriptionStatus === "Active" 
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40" 
                      : "bg-amber-950/60 text-amber-400 border border-amber-900/40"
                  }`}>
                    {user.subscriptionStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide focus:outline-none transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-400 hover:bg-[#151c2d]/60 hover:text-indigo-400"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded text-[9px] font-bold uppercase">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            id="sidebar-logout-btn"
            onClick={logoutUser}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#0e131f] text-white z-50 flex flex-col md:hidden border-r border-slate-800"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <span className="font-extrabold text-sm text-white">ReviewMagnet AI</span>
                </div>
                <button 
                  id="close-mobile-sidebar-btn"
                  onClick={() => setSidebarOpen(false)} 
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile User Profile */}
              <div className="px-4 py-4 border-b border-slate-800 bg-[#141b2b]/40">
                <p className="text-xs font-bold text-slate-200">{user.businessName}</p>
                {user.isSystemOwner || user.email.toLowerCase() === "neoedits2008@gmail.com" ? (
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 border border-amber-400/40">
                      System Owner
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-900/40">
                      Primary Tester
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 uppercase">{user.role}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 uppercase">{user.subscriptionStatus}</span>
                  </div>
                )}
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`mobile-sidebar-link-${item.id}`}
                      onClick={() => {
                        setActivePage(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg"
                          : "text-slate-400 hover:bg-[#151c2d]/60 hover:text-indigo-400"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4.5 w-4.5" />
                        {item.label}
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded text-[9px] font-bold uppercase">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800">
                <button
                  id="mobile-sidebar-logout"
                  onClick={logoutUser}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-all cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header bar */}
        <header className="h-16 bg-[#0e131f]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-md shadow-black/5">
          <div className="flex items-center gap-3">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800/50 md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-400" />
              <span className="font-extrabold text-slate-200 text-sm">{user.businessName}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time active monthly subscription status label */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Billing Status:</span>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                user.subscriptionStatus === "Active"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-950/20"
                  : user.subscriptionStatus === "Trial"
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-sm shadow-indigo-950/20"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-sm shadow-rose-950/20"
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${
                  user.subscriptionStatus === "Active"
                    ? "bg-emerald-400 animate-pulse"
                    : user.subscriptionStatus === "Trial"
                    ? "bg-indigo-400 animate-pulse"
                    : "bg-rose-400"
                }`} />
                {user.subscriptionStatus}
              </div>
              {user.subscriptionStatus !== "Active" && (
                <button
                  id="header-upgrade-btn"
                  onClick={() => setActivePage("billing")}
                  className="px-2.5 py-1 text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 rounded-md transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  Upgrade
                </button>
              )}
            </div>

            {/* Quick business url shortcut */}
            {user.googleBusinessUrl && (
              <a
                href={user.googleBusinessUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-1.5 text-xs text-indigo-400 font-semibold hover:text-indigo-300 hover:underline"
              >
                Google Page
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </header>

        {/* Central main content viewport */}
        <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activePage === "reviews" && <ReviewHub />}
              {activePage === "qr-engine" && <QrEngine />}
              {activePage === "billing" && <Billing />}
              {activePage === "admin-console" && <AdminConsole />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
