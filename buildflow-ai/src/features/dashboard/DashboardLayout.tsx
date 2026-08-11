import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useActivityLog } from '../../hooks/useActivityLog';
import { useToast } from '../../components/Toast';
import { seedCompanyTendersIfEmpty } from '../../utils/seeder';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Tender, Project, EmployeeProfile } from '../../types';

// Import sub-sections
import DashboardOverview from './DashboardOverview';
import TendersSection from './TendersSection';
import ProjectsSection from './ProjectsSection';
import TeamSection from './TeamSection';
import DocumentsSection from './DocumentsSection';
import CalendarSection from './CalendarSection';
import ReportsSection from './ReportsSection';
import SettingsSection from './SettingsSection';

// Import AI sub-sections
import AIDashboard from '../ai/AIDashboard';
import TenderSummary from '../ai/TenderSummary';
import EligibilityChecker from '../ai/EligibilityChecker';
import RiskAnalyzer from '../ai/RiskAnalyzer';
import ProposalGenerator from '../ai/ProposalGenerator';
import AIChat from '../ai/AIChat';
import DocIntel from '../ai/DocIntel';
import KnowledgeBase from '../ai/KnowledgeBase';

// Icons
import { 
  Building2, 
  Layers, 
  FileText, 
  Users, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bookmark,
  ChevronDown,
  User,
  ShieldAlert,
  Sparkles,
  VolumeX,
  Volume2,
  ClipboardCheck,
  MessageSquare,
  BookOpen,
  FileSignature,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { logActivity } = useActivityLog();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification, 
    triggerNotification 
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Firestore Data Streams
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [savedTenderIds, setSavedTenderIds] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [company, setCompany] = useState<any>(null);

  // Fetch company details stream
  useEffect(() => {
    if (!user || !user.companyId) return;

    const docRef = doc(db, 'companies', user.companyId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCompany({ id: docSnap.id, ...docSnap.data() });
      }
    }, (err) => {
      console.error("Failed to load company details stream:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // 1. Seed & listen to Tenders
  useEffect(() => {
    if (!user || !user.companyId) return;

    let unsubscribe: () => void = () => {};

    const loadTenders = async () => {
      await seedCompanyTendersIfEmpty(user.companyId!, user.id);
      
      const q = query(collection(db, 'tenders'), where('companyId', '==', user.companyId));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Tender[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Tender);
        });
        // Sort tenders by match score or publish date
        setTenders(list.sort((a, b) => (b.aiMatchScore ?? 0) - (a.aiMatchScore ?? 0)));
        setLoadingData(false);
      }, (err) => {
        console.error("Failed to load tenders stream:", err);
        setLoadingData(false);
      });
    };

    loadTenders();
    return () => unsubscribe();
  }, [user]);

  // 2. Listen to Projects
  useEffect(() => {
    if (!user || !user.companyId) return;

    const q = query(collection(db, 'projects'), where('companyId', '==', user.companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(list);
    }, (err) => {
      console.error("Failed to load projects stream:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Listen to Employees
  useEffect(() => {
    if (!user || !user.companyId) return;

    const q = query(collection(db, 'employees'), where('companyId', '==', user.companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: EmployeeProfile[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as EmployeeProfile);
      });
      
      // Auto enlist the creator as Admin if empty
      if (list.length === 0 && user) {
        enlistDefaultEmployee();
      }

      setEmployees(list);
    }, (err) => {
      console.error("Failed to load employees stream:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const enlistDefaultEmployee = async () => {
    if (!user || !user.companyId) return;
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'employees'), {
        companyId: user.companyId,
        userId: user.id,
        name: user.displayName,
        email: user.email,
        role: user.role,
        department: 'Executive Management',
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        status: 'active'
      });
    } catch (err) {
      console.error("Error writing default employee profile:", err);
    }
  };

  // 4. Toggle saved tender ids
  const toggleSaveTender = async (tenderId: string) => {
    const isCurrentlySaved = savedTenderIds.includes(tenderId);
    let updatedIds = [];
    if (isCurrentlySaved) {
      updatedIds = savedTenderIds.filter((id) => id !== tenderId);
      showToast("Tender removed from pins.", "info");
    } else {
      updatedIds = [...savedTenderIds, tenderId];
      showToast("Tender pinned successfully!", "success");
      await triggerNotification(
        "Tender Pinned", 
        `Tender was saved under watch lists for team evaluation.`, 
        'tender_match'
      );
    }
    setSavedTenderIds(updatedIds);
  };

  // 5. Convert tender to active project
  const convertTenderToProject = async (tender: Tender) => {
    if (!user || !user.companyId) return;
    try {
      const now = new Date().toISOString();
      const projRef = collection(db, 'projects');
      
      const newProjData = {
        companyId: user.companyId,
        tenderId: tender.id,
        title: tender.title,
        client: tender.authority,
        value: tender.value,
        valueUnit: tender.valueUnit,
        startDate: new Date().toISOString().split('T')[0],
        endDate: tender.deadlineDate,
        managerId: user.id,
        progress: 10,
        budgetSpent: 0,
        tasksCount: { total: 10, completed: 1 },
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        status: 'active'
      };

      await addDoc(projRef, newProjData);
      
      // Notify team
      await triggerNotification(
        "New Project Launched",
        `Won tender "${tender.title.substring(0, 30)}..." converted to active project.`,
        'project_update'
      );

      await logActivity(
        'Launched Construction Work',
        `Converted tender ${tender.tenderNumber} into active execution phase`
      );

      showToast("Tender converted to Project successfully! Initializing blueprints...", "success");
      setActiveTab('Projects');
    } catch (err) {
      console.error(err);
      showToast("Failed to initialize project.", "error");
    }
  };

  // 6. Manual project creation handler
  const handleAddProject = async (projectData: any) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        status: 'active'
      });
      await triggerNotification(
        "Manual Project Added",
        `Project "${projectData.title.substring(0, 30)}..." manually added.`,
        'project_update'
      );
    } catch (err) {
      console.error(err);
      showToast("Could not save manual project.", "error");
    }
  };

  // 7. Manual employee enrollment
  const handleAddEmployee = async (employeeData: any) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'employees'), {
        ...employeeData,
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        status: 'active'
      });
      await triggerNotification(
        "Roster Enrollment Complete",
        `${employeeData.name} invited as ${employeeData.role}.`,
        'team',
        employeeData.userId
      );
    } catch (err) {
      console.error(err);
      showToast("Could not invite team member.", "error");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (err) {
      console.error(err);
      showToast("Failed to remove employee record.", "error");
    }
  };

  // Navigation Item metadata
  const navItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'Tenders', label: 'Tender Management', icon: FileText, badge: tenders.length },
    { id: 'Projects', label: 'Projects', icon: Layers, badge: projects.length },
    { id: 'Documents', label: 'Documents', icon: FileText },
    { id: 'Calendar', label: 'Events Calendar', icon: CalendarIcon },
    { id: 'Team', label: 'Company Team', icon: Users, badge: employees.length },
    { id: 'Reports', label: 'Reports', icon: BarChart3 },
    { id: 'Settings', label: 'Settings', icon: Settings }
  ];

  const aiItems = [
    { id: 'AI_Dashboard', label: 'AI Dashboard', icon: Sparkles },
    { id: 'AI_Summary', label: 'Tender Summary', icon: FileText },
    { id: 'AI_Eligibility', label: 'Eligibility Checker', icon: ClipboardCheck },
    { id: 'AI_Risk', label: 'Risk Analyzer', icon: ShieldAlert },
    { id: 'AI_Proposal', label: 'Proposal Generator', icon: FileSignature },
    { id: 'AI_Chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'AI_DocIntel', label: 'Doc Intelligence', icon: FolderOpen },
    { id: 'AI_KnowledgeBase', label: 'Company Vault', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30">
      {/* Visual background ambient lighting */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.02] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/[0.02] blur-[120px]" />
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800/80 p-5 shrink-0 z-20 justify-between">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm text-white tracking-tight truncate block">BuildFlow AI</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Enterprise Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-800/50 pt-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">
                AI Assistant
              </span>
              <nav className="space-y-1.5">
                {aiItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold' 
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4.5 h-4.5 text-indigo-400" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-4 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2.5 p-1 bg-slate-950/40 rounded-xl border border-slate-800/30">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
              {user?.displayName ? user.displayName[0] : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-200 truncate">{user?.displayName}</p>
              <p className="text-[9px] text-slate-500 truncate">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full px-3.5 py-2.5 border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout Portal
          </button>
        </div>
      </aside>

      {/* --- MAIN INTERFACE PORT --- */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        
        {/* --- TOP HEADER NAVIGATION --- */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/30 backdrop-blur-md px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Path description */}
            <div className="hidden sm:block text-xs font-bold text-slate-500 font-mono">
              PORTAL <span className="text-slate-700">/</span> {activeTab.toUpperCase()}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex items-center gap-4">
            
            {/* Realtime Notification Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                  notificationOpen 
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse" />
                )}
              </button>

              {/* Notification dropdown drawer */}
              <AnimatePresence>
                {notificationOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotificationOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-4 z-40 space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-indigo-400" />
                          Notifications ({unreadCount} unread)
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-600 text-center py-6">No notifications received.</p>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                notif.read 
                                  ? 'bg-slate-950/20 border-slate-900 text-slate-500' 
                                  : 'bg-slate-900/60 border-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="space-y-1 flex-1 min-w-0" onClick={() => markAsRead(notif.id)}>
                                <h4 className="text-xs font-bold leading-tight truncate">{notif.title}</h4>
                                <p className="text-[10px] leading-snug line-clamp-2 text-slate-400">{notif.message}</p>
                              </div>
                              <button
                                onClick={() => deleteNotification(notif.id)}
                                className="p-1 rounded-lg hover:bg-slate-850 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Profile Panel */}
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-slate-200">{user?.displayName}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm shadow-md shadow-black/20">
                {user?.displayName ? user.displayName[0] : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* --- MAIN PAGE CONTENT --- */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto z-10 max-w-7xl w-full mx-auto">
          {loadingData ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-slate-600 space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs font-semibold">Synchronizing with Firestore secure streams...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'Dashboard' && (
                  <DashboardOverview 
                    stats={{
                      totalTenders: tenders.length,
                      savedTenders: tenders.filter(t => (t.aiMatchScore ?? 0) >= 80).length,
                      activeProjects: projects.length,
                      totalEmployees: employees.length
                    }}
                    setActiveTab={setActiveTab}
                    recentTenders={tenders}
                    tenders={tenders}
                    projects={projects}
                    employees={employees}
                  />
                )}
                {activeTab === 'Tenders' && (
                  <TendersSection 
                    tenders={tenders}
                    savedTenderIds={savedTenderIds}
                    onToggleSave={toggleSaveTender}
                    onConvertToProject={convertTenderToProject}
                    employees={employees}
                  />
                )}
                {activeTab === 'Projects' && (
                  <ProjectsSection 
                    projects={projects}
                    onAddProject={handleAddProject}
                  />
                )}
                {activeTab === 'Team' && (
                  <TeamSection 
                    employees={employees}
                    onAddEmployee={handleAddEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                  />
                )}
                {activeTab === 'Documents' && <DocumentsSection />}
                {activeTab === 'Calendar' && <CalendarSection />}
                {activeTab === 'Reports' && <ReportsSection tenders={tenders} projects={projects} />}
                {activeTab === 'Settings' && <SettingsSection />}

                {/* AI Assistant sections */}
                {activeTab === 'AI_Dashboard' && (
                  <AIDashboard 
                    setActiveTab={setActiveTab} 
                    company={company} 
                    tenders={tenders} 
                  />
                )}
                {activeTab === 'AI_Summary' && <TenderSummary tenders={tenders} />}
                {activeTab === 'AI_Eligibility' && <EligibilityChecker company={company} tenders={tenders} />}
                {activeTab === 'AI_Risk' && <RiskAnalyzer tenders={tenders} />}
                {activeTab === 'AI_Proposal' && <ProposalGenerator company={company} tenders={tenders} />}
                {activeTab === 'AI_Chat' && <AIChat tenders={tenders} />}
                {activeTab === 'AI_DocIntel' && <DocIntel />}
                {activeTab === 'AI_KnowledgeBase' && <KnowledgeBase />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* --- MOBILE DRAWER NAVIGATION --- */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Sidebar menu drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 p-5 z-50 flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Logo and close */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-extrabold text-sm text-white">BuildFlow AI</span>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-500 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Navigation links */}
                <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
                  <nav className="space-y-1.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold' 
                              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4.5 h-4.5" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="border-t border-slate-800/50 pt-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">
                      AI Assistant
                    </span>
                    <nav className="space-y-1.5">
                      {aiItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setMobileSidebarOpen(false);
                            }}
                            className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                              isActive 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold' 
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4.5 h-4.5 text-indigo-400" />
                              <span>{item.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </div>

              {/* Footer logout */}
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <button
                  onClick={() => logout()}
                  className="w-full px-3.5 py-2.5 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout Portal
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
