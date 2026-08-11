import React, { useState } from "react";
import { 
  TrendingUp, Users, CalendarCheck, DollarSign, Target, Award,
  Plus, Edit, Eye, MessageSquare, ShieldAlert, BadgeInfo, FileText, CheckCircle
} from "lucide-react";
import { Lead } from "../types";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface DashboardViewProps {
  leads: Lead[];
  onSelectLead: (leadId: string) => void;
  onNavigateToTab: (tab: string) => void;
  onRefreshLeads: () => void;
}

export default function DashboardView({ 
  leads, 
  onSelectLead, 
  onNavigateToTab,
  onRefreshLeads
}: DashboardViewProps) {
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  // 1. Calculate CRM Metrics
  const totalLeads = leads.length;
  const trialsBooked = leads.filter(l => l.trialStatus === "booked").length;
  const conversions = leads.filter(l => l.status === "converted").length;
  
  // Calculate revenue from membership sales
  const calculateRevenue = () => {
    let rev = 0;
    leads.forEach(l => {
      if (l.status === "converted") {
        const interest = l.membershipInterest;
        if (interest === "Monthly") rev += 79;
        else if (interest === "Quarterly") rev += 199;
        else if (interest === "Half-Yearly") rev += 349;
        else if (interest === "Annual") rev += 599;
        else rev += 150; // Default average sale
      }
    });
    return rev;
  };
  
  const totalRevenue = calculateRevenue();
  const conversionRate = totalLeads > 0 ? Math.round((conversions / totalLeads) * 100) : 0;

  // 2. Open Edit Lead Sidebar
  const handleOpenEdit = (lead: Lead) => {
    setSelectedLeadForEdit(lead);
    setEditForm({ ...lead });
    setIsEditing(true);
  };

  const handleSaveLead = async () => {
    if (!selectedLeadForEdit) return;
    try {
      const leadDocRef = doc(db, "leads", selectedLeadForEdit.id);
      await updateDoc(leadDocRef, {
        name: editForm.name || "",
        age: editForm.age || "",
        gender: editForm.gender || "",
        city: editForm.city || "",
        occupation: editForm.occupation || "",
        goal: editForm.goal || "",
        experienceLevel: editForm.experienceLevel || "",
        preferredTime: editForm.preferredTime || "",
        medicalConditions: editForm.medicalConditions || "",
        membershipInterest: editForm.membershipInterest || "",
        trialStatus: editForm.trialStatus || "none",
        notes: editForm.notes || "",
        status: editForm.status || "active",
        leadScore: calculateLeadScore(editForm)
      });
      setIsEditing(false);
      setSelectedLeadForEdit(null);
      onRefreshLeads();
    } catch (e) {
      console.error(e);
    }
  };

  function calculateLeadScore(lead: Partial<Lead>): number {
    let score = 0;
    if (lead.name) score += 10;
    if (lead.age) score += 10;
    if (lead.gender) score += 10;
    if (lead.city) score += 10;
    if (lead.occupation) score += 10;
    if (lead.goal) score += 10;
    if (lead.experienceLevel) score += 10;
    if (lead.preferredTime) score += 10;
    if (lead.medicalConditions) score += 10;
    if (lead.membershipInterest) score += 10;
    if (lead.trialStatus === "booked" || lead.trialStatus === "visited") score += 20;
    return Math.min(score, 100);
  }

  // Create a new lead from Dashboard
  const handleCreateNewLead = async () => {
    const randomPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const newId = `lead_${Date.now()}`;
    const nowIso = new Date().toISOString();
    
    const newLead: Lead = {
      id: newId,
      name: "New Guest",
      phone: randomPhone,
      age: "",
      gender: "",
      city: "",
      occupation: "",
      goal: "",
      experienceLevel: "",
      preferredTime: "",
      medicalConditions: "",
      membershipInterest: "",
      trialStatus: "none",
      leadScore: 10,
      notes: "Created manually from CRM Dashboard.",
      status: "active",
      createdAt: nowIso,
      lastInteractionAt: nowIso
    };

    try {
      await setDoc(doc(db, "leads", newId), newLead);
      onRefreshLeads();
      handleOpenEdit(newLead);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 relative">
      
      {/* 1. Dashboard Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-4 transition hover:bg-white/10">
          <div className="p-3 bg-[#CCFF00]/10 text-[#CCFF00] rounded-xl border border-[#CCFF00]/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 tracking-wider uppercase font-mono">Today's Leads</span>
            <p className="text-xl font-bold font-mono text-white">{totalLeads}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-4 transition hover:bg-white/10">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 tracking-wider uppercase font-mono">Trials Booked</span>
            <p className="text-xl font-bold font-mono text-white">{trialsBooked}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-4 transition hover:bg-white/10">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 tracking-wider uppercase font-mono">Memberships</span>
            <p className="text-xl font-bold font-mono text-[#CCFF00]">{conversions}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-4 transition hover:bg-white/10">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 tracking-wider uppercase font-mono">Total Revenue</span>
            <p className="text-xl font-bold font-mono text-[#CCFF00]">${totalRevenue}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-4 col-span-2 lg:col-span-1 transition hover:bg-white/10">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 tracking-wider uppercase font-mono">Conversion Rate</span>
            <p className="text-xl font-bold font-mono text-white">{conversionRate}%</p>
          </div>
        </div>

      </div>

      {/* 2. Lead Management Table */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Client CRM Pipeline</h2>
            <p className="text-xs text-white/60">All fitness leads acquired and tracked automatically via WhatsApp conversations.</p>
          </div>
          <button
            onClick={handleCreateNewLead}
            className="self-start sm:self-center bg-[#CCFF00] hover:bg-[#b5e600] text-black font-bold px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)] text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" /> Add Lead Manually
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-white/40 font-mono text-[10px] uppercase tracking-wider">
                <th className="p-4 pl-6">Client Info</th>
                <th className="p-4">Demographics</th>
                <th className="p-4">Fitness Goals</th>
                <th className="p-4">Membership Interest</th>
                <th className="p-4">Trial Workout</th>
                <th className="p-4">Score</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition-all">
                  <td className="p-4 pl-6">
                    <div>
                      <p className="font-semibold text-white text-sm">{lead.name || "Enquiry Guest"}</p>
                      <p className="text-[10px] font-mono text-white/40">{lead.phone}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <p className="text-white/90">{lead.age ? `Age ${lead.age}` : "Age: —"}</p>
                      <p className="text-[10px] text-white/40">{lead.occupation || "Occupation: —"}</p>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-[#CCFF00]">
                    {lead.goal || "—"}
                  </td>
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <p className="font-medium text-blue-400">{lead.membershipInterest || "—"}</p>
                      {lead.preferredTime && (
                        <p className="text-[10px] text-white/40 font-mono">Time: {lead.preferredTime}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                      lead.trialStatus === "booked" ? "bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/25 shadow-[0_0_8px_rgba(204,255,0,0.1)]" :
                      lead.trialStatus === "visited" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      lead.trialStatus === "no-show" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      lead.trialStatus === "offered" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-white/5 text-white/40 border-white/5"
                    }`}>
                      {lead.trialStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-white/90">
                    {lead.leadScore}%
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      lead.status === "converted" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                      lead.status === "human_takeover" ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse" :
                      lead.status === "inactive" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                      "bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/25"
                    }`}>
                      {lead.status === "human_takeover" ? "TAKEOVER" : lead.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onSelectLead(lead.id)}
                      className="p-2 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-xl transition-all active:scale-95"
                      title="Open chat session"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(lead)}
                      className="p-2 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-xl transition-all active:scale-95"
                      title="Edit CRM details"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#CCFF00]" />
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-white/40">
                    No leads discovered yet. Send a simulated message in the Chat Simulator to create one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Sliding Edit Lead Details Side-panel */}
      {isEditing && selectedLeadForEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-end z-50">
          <div className="w-full max-w-lg bg-[#0F0F0F]/90 backdrop-blur-xl border-l border-white/10 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">CRM Client Profile: Edit</h3>
                  <p className="text-xs text-white/50">Modify client profiles manually to override AI-extracted values.</p>
                </div>
                <button
                  onClick={() => { setIsEditing(false); setSelectedLeadForEdit(null); }}
                  className="text-white/60 hover:text-white text-sm font-mono transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Form fields */}
              <div className="space-y-4 text-xs text-white/80">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Full Name</label>
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">WhatsApp Number</label>
                    <input
                      type="text"
                      disabled
                      value={editForm.phone || ""}
                      className="w-full bg-white/5 px-3 py-2 rounded-xl border border-white/10 text-white/30 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Age</label>
                    <input
                      type="text"
                      value={editForm.age || ""}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      className="w-full bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Gender</label>
                    <input
                      type="text"
                      value={editForm.gender || ""}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">City</label>
                    <input
                      type="text"
                      value={editForm.city || ""}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 mb-1 font-medium">Occupation</label>
                  <input
                    type="text"
                    value={editForm.occupation || ""}
                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                    className="w-full bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Fitness Goal</label>
                    <select
                      value={editForm.goal || ""}
                      onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                      className="w-full bg-white/5 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white/90 transition-all"
                    >
                      <option value="">Select goals</option>
                      <option value="Weight Loss">Weight Loss</option>
                      <option value="Muscle Gain">Muscle Gain</option>
                      <option value="Fat Loss">Fat Loss</option>
                      <option value="Strength Training">Strength Training</option>
                      <option value="General Fitness">General Fitness</option>
                      <option value="Bodybuilding">Bodybuilding</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Athletic Performance">Athletic Performance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Experience Level</label>
                    <select
                      value={editForm.experienceLevel || ""}
                      onChange={(e) => setEditForm({ ...editForm, experienceLevel: e.target.value as any })}
                      className="w-full bg-white/5 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white/90 transition-all"
                    >
                      <option value="">Select Level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Preferred Time</label>
                    <select
                      value={editForm.preferredTime || ""}
                      onChange={(e) => setEditForm({ ...editForm, preferredTime: e.target.value as any })}
                      className="w-full bg-white/5 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white/90 transition-all"
                    >
                      <option value="">Select time</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Membership Interest</label>
                    <select
                      value={editForm.membershipInterest || ""}
                      onChange={(e) => setEditForm({ ...editForm, membershipInterest: e.target.value as any })}
                      className="w-full bg-white/5 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white/90 transition-all"
                    >
                      <option value="">Select membership</option>
                      <option value="Monthly">Monthly ($79/mo)</option>
                      <option value="Quarterly">Quarterly ($199)</option>
                      <option value="Half-Yearly">Half-Yearly ($349)</option>
                      <option value="Annual">Annual ($599)</option>
                      <option value="Personal Training">Personal Training ($299/mo)</option>
                      <option value="Group Classes">Group Classes ($99/mo)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 mb-1 font-medium">Medical Conditions / Injuries</label>
                  <input
                    type="text"
                    value={editForm.medicalConditions || ""}
                    onChange={(e) => setEditForm({ ...editForm, medicalConditions: e.target.value })}
                    className="w-full bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white transition-all"
                    placeholder="E.g. old knee ligament tear, none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Trial Workout Status</label>
                    <select
                      value={editForm.trialStatus || "none"}
                      onChange={(e) => setEditForm({ ...editForm, trialStatus: e.target.value as any })}
                      className="w-full bg-white/5 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white/90 transition-all"
                    >
                      <option value="none">None</option>
                      <option value="offered">Offered</option>
                      <option value="accepted">Accepted</option>
                      <option value="booked">Booked</option>
                      <option value="visited">Visited</option>
                      <option value="no-show">No-Show</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Lead CRM Status</label>
                    <select
                      value={editForm.status || "active"}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full bg-white/5 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white/90 transition-all"
                    >
                      <option value="active">Active Enquiry</option>
                      <option value="inactive">Inactive</option>
                      <option value="human_takeover">Human Takeover</option>
                      <option value="converted">Official Gym Member</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 mb-1 font-medium">Internal Staff Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 text-white text-xs transition-all"
                    placeholder="Enter sales executive logs, preferences, or appointment notes."
                  />
                </div>

              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex gap-3">
              <button
                onClick={() => { setIsEditing(false); setSelectedLeadForEdit(null); }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-semibold py-2.5 rounded-xl transition text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLead}
                className="flex-1 bg-[#CCFF00] hover:bg-[#b5e600] text-black font-bold py-2.5 rounded-xl transition text-xs shadow-[0_0_15px_rgba(204,255,0,0.3)]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
