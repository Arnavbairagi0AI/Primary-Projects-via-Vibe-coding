import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Tag, 
  Plus, 
  Trash2, 
  UserPlus, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { Company, Employee } from '../types';

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyOnboardingWizard: React.FC<OnboardingProps> = ({ isOpen, onClose }) => {
  const { currentCompany, updateCompanyProfile, currentUser, userProfile, logActivity } = useApp();
  const [step, setStep] = useState(1);

  // Step 1: Core Company Info
  const [name, setName] = useState(currentCompany?.name || '');
  const [gst, setGst] = useState(currentCompany?.gstNumber || '');
  const [industry, setIndustry] = useState(currentCompany?.industry || 'Industrial B2B');
  const [address, setAddress] = useState(currentCompany?.contactInfo?.address || '');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Delhi');

  // Step 2: Tender Preferences
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCompany?.categories || []);
  const [selectedStates, setSelectedStates] = useState<string[]>(currentCompany?.states || []);

  // Step 3: Keywords & Contacts
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(currentCompany?.keywords || []);
  const [contactEmail, setContactEmail] = useState(currentCompany?.contactInfo?.email || currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState(currentCompany?.contactInfo?.phone || '');

  // Step 4: Team Invitations
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'company_admin' | 'employee'>('employee');
  const [invitedMembers, setInvitedMembers] = useState<{ email: string; role: 'company_admin' | 'employee' }[]>([]);

  const availableStates = ['Delhi', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Kerala', 'Punjab', 'Gujarat', 'Uttar Pradesh'];
  const availableCategories = [
    'Civil Works & Construction', 
    'Information Technology', 
    'Energy & Power', 
    'Medical & Healthcare', 
    'Manufacturing & Heavy Industry', 
    'Chemicals & Materials'
  ];

  if (!isOpen) return null;

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleToggleState = (st: string) => {
    setSelectedStates(prev => 
      prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
    );
  };

  const handleAddKeyword = () => {
    if (keywordInput && !keywords.includes(keywordInput)) {
      setKeywords([...keywords, keywordInput]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw));
  };

  const handleAddInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    if (invitedMembers.some(m => m.email === inviteEmail)) {
      alert('This email is already in the invite list.');
      return;
    }
    setInvitedMembers([...invitedMembers, { email: inviteEmail, role: inviteRole }]);
    setInviteEmail('');
  };

  const handleRemoveInvitation = (email: string) => {
    setInvitedMembers(prev => prev.filter(m => m.email !== email));
  };

  const handleCompleteSetup = async () => {
    if (!currentUser || !userProfile?.companyId) return;

    try {
      const companyUpdates: Partial<Company> = {
        name,
        gstNumber: gst || 'Not Provided',
        industry,
        keywords,
        states: selectedStates.length > 0 ? selectedStates : [state],
        categories: selectedCategories,
        contactInfo: {
          email: contactEmail,
          phone: contactPhone,
          address: address ? `${address}, ${city}, ${state}` : address
        }
      };

      // 1. Update company profile in firestore
      await updateCompanyProfile(companyUpdates);

      // 2. Add invitations to 'employees' collection in Firestore
      for (const invite of invitedMembers) {
        const inviteId = `invite-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newEmployee: Employee = {
          id: inviteId,
          companyId: userProfile.companyId,
          name: invite.email.split('@')[0],
          email: invite.email,
          role: invite.role,
          status: 'invited',
          joinedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'employees', inviteId), newEmployee);
      }

      await logActivity('Onboarding Complete', `Successfully completed onboarding wizard for company: ${name}`, 'company');
      alert('Onboarding setup completed successfully!');
      onClose();
    } catch (err: any) {
      alert('Error during onboarding setup: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-linear-to-r from-blue-600 via-indigo-600 to-violet-700 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-300" /> Company Setup Wizard
            </h2>
            <p className="text-slate-200 text-xs mt-0.5">Configure your SaaS tender matching preferences in 5 simple steps.</p>
          </div>
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold font-mono text-white">
            Step {step} of 5
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full">
          <div 
            className="h-1 bg-indigo-500 transition-all duration-300" 
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* STEP 1: Core Company Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-wider">
                <Building2 className="h-4 w-4" /> 1. Business Profile Details
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. IndoTech Solutions Ltd"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GST Number</label>
                  <input 
                    type="text" 
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Industry vertical</label>
                  <select 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Infrastructure & Systems">Infrastructure & Systems</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Energy & Power">Energy & Power</option>
                    <option value="Healthcare Systems">Healthcare Systems</option>
                    <option value="Civil Construction">Civil Construction</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Address</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Unit 405, Tech Hub, Bandra"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">City</label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">State Headquarter</label>
                  <select 
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {availableStates.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Tender Preferences */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-wider">
                <Layers className="h-4 w-4" /> 2. Tender Categories & Regions
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block uppercase tracking-wider">Target Domain Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableCategories.map((cat) => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleToggleCategory(cat)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                          active 
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block uppercase tracking-wider">Target States (Regional Bids)</label>
                <div className="flex flex-wrap gap-2">
                  {availableStates.map((st) => {
                    const active = selectedStates.includes(st);
                    return (
                      <button
                        key={st}
                        onClick={() => handleToggleState(st)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                          active 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                            : 'border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-500'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Keywords & Contacts */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-wider">
                <Tag className="h-4 w-4" /> 3. Smart Match Tags & Contact
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">Target Keywords</label>
                <p className="text-[10px] text-slate-400">AI uses these keywords (e.g. solar, cabling, hardware) to recommend high-match NITs.</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="e.g. smart grid"
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                  />
                  <button 
                    onClick={handleAddKeyword}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {keywords.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No custom match keywords added yet.</span>
                  )}
                  {keywords.map((kw) => (
                    <span 
                      key={kw}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full border border-indigo-500/20"
                    >
                      {kw}
                      <button onClick={() => handleRemoveKeyword(kw)} className="text-[10px] text-rose-500 font-black cursor-pointer">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Email</label>
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@indotech.co.in"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Phone</label>
                  <input 
                    type="text" 
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Invite Team Members */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-wider">
                <UserPlus className="h-4 w-4" /> 4. Invite Bidding Officers
              </div>

              <form onSubmit={handleAddInvitation} className="space-y-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 leading-normal">Invite company employees to coordinate bids, review documents, and manage checklists collectively.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-end">
                  <div className="space-y-1 md:col-span-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="employee@indotech.co.in"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Role</label>
                    <select 
                      value={inviteRole}
                      onChange={(e: any) => setInviteRole(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="employee">Bidding Employee</option>
                      <option value="company_admin">Company Admin</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer flex justify-center items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Invite
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Invited Team (Will receive credentials)</h4>
                {invitedMembers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No invitations pending. You can add them above.</p>
                ) : (
                  <div className="space-y-1.5">
                    {invitedMembers.map((member) => (
                      <div 
                        key={member.email}
                        className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-500/10 text-indigo-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                            {member.role === 'company_admin' ? 'Admin' : 'Officer'}
                          </span>
                          <span>{member.email}</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveInvitation(member.email)} 
                          className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Complete Setup */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Ready to Launch!</h3>
                <p className="text-xs text-slate-400 mt-1">Review your corporate matching coordinates before establishing your live pipeline.</p>
              </div>

              <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-800/60 rounded-2xl text-left text-xs space-y-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Company Identity</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{name} (GST: {gst})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Vertical & Target States</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{industry} • Bidding in {selectedStates.join(', ') || state}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Keywords & Categories</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{keywords.join(', ') || 'None'} • {selectedCategories.length} Categories</span>
                </div>
                {invitedMembers.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Corporate Team Invites</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{invitedMembers.length} emails pending registration</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-800 flex justify-between">
          <button 
            disabled={step === 1}
            onClick={() => setStep(prev => prev - 1)}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>

          {step < 5 ? (
            <button 
              onClick={() => {
                if (step === 1 && !name) {
                  alert('Company Name is a mandatory field.');
                  return;
                }
                setStep(prev => prev + 1);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={handleCompleteSetup}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Complete Setup
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
