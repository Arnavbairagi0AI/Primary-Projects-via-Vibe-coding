import React, { useState, useEffect } from "react";
import { 
  Users, MessageSquare, Calendar, Layers, Activity, Dumbbell, 
  HelpCircle, RefreshCw, Sparkles, Server, CheckCircle2 
} from "lucide-react";
import { Lead } from "./types";
import { collection, onSnapshot, query, orderBy, doc, setDoc, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

// Import custom views
import DashboardView from "./components/DashboardView";
import ChatSimulator from "./components/ChatSimulator";
import CalendarView from "./components/CalendarView";
import IntegrationsView from "./components/IntegrationsView";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // 1. Fetch leads from Firestore in real-time
  useEffect(() => {
    const leadsRef = collection(db, "leads");
    const q = query(leadsRef, orderBy("lastInteractionAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const leadsList: Lead[] = [];
        snapshot.forEach((doc) => {
          leadsList.push({ id: doc.id, ...doc.data() } as Lead);
        });
        setLeads(leadsList);
      },
      (error) => {
        console.error("Firestore onSnapshot error (leads):", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRefreshLeads = async () => {
    // Explicit pull if needed
  };

  // 2. Select lead and open chat simulator
  const handleSelectLeadToChat = (leadId: string) => {
    setSelectedLeadId(leadId);
    setActiveTab("chat");
  };

  // 3. Database Sandbox Seeder for seamless review
  const handleSeedSandboxDatabase = async () => {
    setIsSeeding(true);
    setSeedSuccess(false);
    try {
      // Clear existing leads and bookings to restart clean
      const leadsSnapshot = await getDocs(collection(db, "leads"));
      for (const d of leadsSnapshot.docs) {
        await deleteDoc(doc(db, "leads", d.id));
      }
      
      const bookingsSnapshot = await getDocs(collection(db, "bookings"));
      for (const d of bookingsSnapshot.docs) {
        await deleteDoc(doc(db, "bookings", d.id));
      }

      const logsSnapshot = await getDocs(collection(db, "logs"));
      for (const d of logsSnapshot.docs) {
        await deleteDoc(doc(db, "logs", d.id));
      }

      // Seeding Lead 1 (Sarah)
      const sarahId = "+14155552671";
      const sarahLead = {
        id: sarahId,
        name: "Sarah Jenkins",
        phone: "+14155552671",
        age: "28",
        gender: "Female",
        city: "San Francisco",
        occupation: "Software Engineer",
        goal: "Fat Loss",
        experienceLevel: "Beginner",
        preferredTime: "Evening",
        medicalConditions: "None",
        membershipInterest: "Quarterly",
        trialStatus: "offered",
        leadScore: 70,
        notes: "Very interested in evening group HIIT and spinning classes. Prefers low-intensity cardio start.",
        status: "active",
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        lastInteractionAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      };
      await setDoc(doc(db, "leads", sarahId), sarahLead);

      const sarahMsgs = [
        { sender: "bot", text: "Hey Sarah! FitBot here from Apex Elite Fitness. Thanks for checking in! How can I help you crush your goals today?", timestamp: new Date(Date.now() - 3 * 3600 * 1000 - 30000).toISOString() },
        { sender: "customer", text: "Hi! I want to join the gym. I want to lose weight and fat.", timestamp: new Date(Date.now() - 3 * 3600 * 1000 - 20000).toISOString() },
        { sender: "bot", text: "That's fantastic! Fat loss is our absolute specialty. To suggest the perfect program, what do you do for work day-to-day?", timestamp: new Date(Date.now() - 3 * 3600 * 1000 - 10000).toISOString() },
        { sender: "customer", text: "I'm a software engineer, so I sit at my desk all day.", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() }
      ];
      for (const m of sarahMsgs) {
        await addDoc(collection(db, "leads", sarahId, "messages"), m);
      }

      // Seeding Lead 2 (Marcus - Already Booked)
      const marcusId = "+12125559823";
      const marcusLead = {
        id: marcusId,
        name: "Marcus Aurelius",
        phone: "+12125559823",
        age: "35",
        gender: "Male",
        city: "New York",
        occupation: "Financial Analyst",
        goal: "Strength Training",
        experienceLevel: "Advanced",
        preferredTime: "Morning",
        medicalConditions: "Lower back stiffness",
        membershipInterest: "Annual",
        trialStatus: "booked",
        leadScore: 90,
        notes: "Enjoys heavy lifting and Olympic lifting platforms. Wants to test the barbell specs.",
        status: "active",
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        lastInteractionAt: new Date(Date.now() - 11 * 3600 * 1000).toISOString()
      };
      await setDoc(doc(db, "leads", marcusId), marcusLead);

      const marcusMsgs = [
        { sender: "bot", text: "Hi Marcus! Welcome to Apex Elite Fitness. What are your primary fitness goals?", timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
        { sender: "customer", text: "I'm looking for serious strength training, squat racks, and certified coaches.", timestamp: new Date(Date.now() - 11 * 3600 * 1000 - 40000).toISOString() },
        { sender: "bot", text: "You found the right place! We have top-tier Hammer Strength gear and certified elite coaches. What experience level are we starting at?", timestamp: new Date(Date.now() - 11 * 3600 * 1000 - 30000).toISOString() },
        { sender: "customer", text: "Advanced. Been lifting for 8 years.", timestamp: new Date(Date.now() - 11 * 3600 * 1000 - 20000).toISOString() },
        { sender: "bot", text: "Incredible! Would you like to book a FREE trial session to try the gear yourself?", timestamp: new Date(Date.now() - 11 * 3600 * 1000 - 10000).toISOString() },
        { sender: "customer", text: "Yes, tomorrow morning.", timestamp: new Date(Date.now() - 11 * 3600 * 1000).toISOString() }
      ];
      for (const m of marcusMsgs) {
        await addDoc(collection(db, "leads", marcusId, "messages"), m);
      }

      // Save Booking for Marcus
      const bookingId = `book_${Date.now()}`;
      await setDoc(doc(db, "bookings", bookingId), {
        id: bookingId,
        leadId: marcusId,
        customerName: "Marcus Aurelius",
        customerPhone: "+12125559823",
        date: "2026-07-10",
        timeSlot: "07:00 AM - 09:00 AM",
        status: "scheduled",
        createdAt: new Date().toISOString()
      });

      // Seeding Lead 3 (Emily - Human Takeover)
      const emilyId = "+13125554390";
      const emilyLead = {
        id: emilyId,
        name: "Emily Watson",
        phone: "+13125554390",
        age: "31",
        gender: "Female",
        city: "Chicago",
        occupation: "Graphic Designer",
        goal: "General Fitness",
        experienceLevel: "Intermediate",
        preferredTime: "Afternoon",
        medicalConditions: "None",
        membershipInterest: "Monthly",
        trialStatus: "none",
        leadScore: 40,
        notes: "Asked complex questions about custom supplement plans and whey stacks. Triggered human support request.",
        status: "human_takeover",
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        lastInteractionAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      };
      await setDoc(doc(db, "leads", emilyId), emilyLead);

      const emilyMsgs = [
        { sender: "bot", text: "Hey Emily! Welcome. What fitness goals can we help you achieve?", timestamp: new Date(Date.now() - 24 * 3600 * 1000 - 10000).toISOString() },
        { sender: "customer", text: "Hi, I just want general fitness. Do you sell custom whey proteins or supplement bundles directly at the gym?", timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
      ];
      for (const m of emilyMsgs) {
        await addDoc(collection(db, "leads", emilyId, "messages"), m);
      }

      // Add Starter Logs
      const logsRef = collection(db, "logs");
      await addDoc(logsRef, { type: "system", status: "success", title: "CRM Sandbox Initialized", details: "Seeded 3 high-quality leads, conversations, and calendar bookings.", timestamp: new Date().toISOString() });
      await addDoc(logsRef, { type: "sheets", status: "success", title: "Google Sheets Sync Status", details: "Uploaded active leads sheet to shared corporate directory.", timestamp: new Date(Date.now() - 1000).toISOString() });

      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans select-none antialiased relative overflow-hidden">
      
      {/* Dynamic Frosted Background Glow Orbs */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#CCFF00] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Banner: Full Unlocked Access Notice */}
      <div className="relative z-20 bg-[#CCFF00]/10 border-b border-[#CCFF00]/25 px-6 py-2 flex items-center justify-between text-xs font-mono text-[#CCFF00]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
          <span><strong className="font-bold">FULL ACCESS UNLOCKED:</strong> All features are 100% free and open to everyone — no email sign-in or Razorpay subscription required.</span>
        </div>
        <span className="hidden md:inline-block bg-[#CCFF00] text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          No Paywall • Free Access
        </span>
      </div>

      {/* 1. Header Section */}
      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#CCFF00] text-black rounded-xl shadow-lg shadow-[#CCFF00]/25">
            <Dumbbell className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                FITBOT <span className="text-[#CCFF00] font-extrabold">PRO</span>
              </h1>
              <span className="bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                Full Unlocked Access
              </span>
            </div>
            <p className="text-xs text-white/60">AI Gym Sales Executive & CRM Dashboard — Instant Direct Access for Everyone</p>
          </div>
        </div>

        {/* Sandbox setup buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedSandboxDatabase}
            disabled={isSeeding}
            className="bg-white/5 hover:bg-white/10 text-white font-semibold px-4 py-2 rounded-xl transition text-xs flex items-center gap-1.5 border border-white/10 shadow-md shadow-black/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin text-[#CCFF00]" : ""}`} />
            {isSeeding ? "Seeding..." : seedSuccess ? "Database Seeded!" : "Reset Sandbox Data"}
          </button>
        </div>
      </header>

      {/* 2. Top Tabs Navigation */}
      <div className="relative z-10 bg-white/5 border-b border-white/10 px-6 py-2 flex gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 border border-transparent ${
            activeTab === "dashboard"
              ? "bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)] font-bold"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === "dashboard" ? "text-black" : "text-[#CCFF00]"}`} /> CRM Dashboard
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 border border-transparent ${
            activeTab === "chat"
              ? "bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)] font-bold"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${activeTab === "chat" ? "text-black" : "text-blue-400"}`} /> WhatsApp Chat Simulator
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 border border-transparent ${
            activeTab === "calendar"
              ? "bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)] font-bold"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === "calendar" ? "text-black" : "text-indigo-400"}`} /> Trial Calendar
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 border border-transparent ${
            activeTab === "integrations"
              ? "bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)] font-bold"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === "integrations" ? "text-black" : "text-amber-400"}`} /> Connections & Settings
        </button>
      </div>

      {/* 3. Main Stage Context */}
      <main className="relative z-10 flex-1 p-6 overflow-y-auto">
        {activeTab === "dashboard" && (
          <DashboardView 
            leads={leads} 
            onSelectLead={handleSelectLeadToChat}
            onNavigateToTab={setActiveTab}
            onRefreshLeads={handleRefreshLeads}
          />
        )}
        
        {activeTab === "chat" && (
          <ChatSimulator 
            leads={leads}
            selectedLeadId={selectedLeadId}
            onSelectLead={setSelectedLeadId}
            onRefreshLeads={handleRefreshLeads}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarView 
            onRefreshLeads={handleRefreshLeads}
          />
        )}

        {activeTab === "integrations" && (
          <IntegrationsView 
            onRefreshLeads={handleRefreshLeads}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="relative z-10 py-4 border-t border-white/5 bg-black/40 px-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-white/40 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse shadow-[0_0_8px_#CCFF00]"></span>
          <span>FitBot Core Node Online & Synced</span>
        </div>
        <p>© 2026 FitBot. Certified Premium Fitness Assistant Software.</p>
      </footer>

    </div>
  );
}
