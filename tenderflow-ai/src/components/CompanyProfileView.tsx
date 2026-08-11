import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SUBSCRIPTION_PLANS } from '../mockData';
import { 
  Building2, 
  KeyRound, 
  CreditCard, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle,
  FileText,
  Mail,
  MapPin,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { Company } from '../types';

export const CompanyProfileView: React.FC = () => {
  const { currentCompany, updateCompanyProfile } = useApp();

  const [name, setName] = useState(currentCompany?.name || '');
  const [gst, setGst] = useState(currentCompany?.gstNumber || '');
  const [industry, setIndustry] = useState(currentCompany?.industry || 'Infrastructure');
  const [contactEmail, setContactEmail] = useState(currentCompany?.contactInfo?.email || '');
  const [contactPhone, setContactPhone] = useState(currentCompany?.contactInfo?.phone || '');
  const [contactAddress, setContactAddress] = useState(currentCompany?.contactInfo?.address || '');

  // Lists/chips states
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(currentCompany?.keywords || []);
  
  const [selectedStates, setSelectedStates] = useState<string[]>(currentCompany?.states || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCompany?.categories || []);

  // Previous projects
  const [projectTitle, setProjectTitle] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectValue, setProjectValue] = useState('');
  const [projectYear, setProjectYear] = useState('');
  const [projects, setProjects] = useState(currentCompany?.previousProjects || []);

  const [loading, setLoading] = useState(false);

  const availableStates = ['Delhi', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Kerala', 'Punjab', 'Gujarat', 'Uttar Pradesh'];
  const availableCategories = [
    'Civil Works & Construction', 
    'Information Technology', 
    'Energy & Power', 
    'Medical & Healthcare', 
    'Manufacturing & Heavy Industry', 
    'Chemicals & Materials'
  ];

  const handleAddKeyword = () => {
    if (keywordInput && !keywords.includes(keywordInput)) {
      setKeywords([...keywords, keywordInput]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleToggleState = (state: string) => {
    if (selectedStates.includes(state)) {
      setSelectedStates(selectedStates.filter(s => s !== state));
    } else {
      setSelectedStates([...selectedStates, state]);
    }
  };

  const handleToggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleAddProject = () => {
    if (!projectTitle || !projectClient || !projectValue) return;
    const newProj = {
      title: projectTitle,
      client: projectClient,
      value: Number(projectValue),
      year: Number(projectYear) || 2026
    };
    setProjects([...projects, newProj]);
    setProjectTitle('');
    setProjectClient('');
    setProjectValue('');
    setProjectYear('');
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated: Partial<Company> = {
        name,
        gstNumber: gst,
        industry,
        keywords,
        states: selectedStates,
        categories: selectedCategories,
        previousProjects: projects,
        contactInfo: {
          email: contactEmail,
          phone: contactPhone,
          address: contactAddress
        }
      };
      await updateCompanyProfile(updated);
      alert('Company profile updated successfully in Firestore!');
    } catch (e: any) {
      alert('Error updating company details: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const activePlan = SUBSCRIPTION_PLANS.find(p => p.id === currentCompany?.subscriptionPlan) || SUBSCRIPTION_PLANS[0];

  return (
    <div className="space-y-6">
      
      {/* Subscription banner summary */}
      <div className="bg-linear-to-r from-indigo-900/50 via-slate-900 to-slate-950 border border-indigo-500/15 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Corporate Subscription 
              <span className={`text-[10px] border px-2 py-0.5 rounded-full ${activePlan.badgeColor}`}>
                {activePlan.name}
              </span>
            </h2>
            <p className="text-xs text-emerald-400 font-semibold">Status: Full Enterprise Access Unlocked • No Subscription or Payment Required</p>
          </div>
        </div>

        <div>
          <button 
            onClick={() => alert("Full Enterprise Access is active. All features are 100% unlocked for everyone.")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Full Access Enabled
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Corporate Identifiers + Contacts) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Metadata form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> Corporate Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Registered Company Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">GST Registration Number</label>
                <input 
                  type="text" 
                  value={gst}
                  onChange={(e) => setGst(e.target.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Industry Sector</label>
                <select 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Information Technology">Information Technology (SaaS & Hardware)</option>
                  <option value="Civil Works & Construction">Civil Works & Construction</option>
                  <option value="Energy & Power">Energy, Power & Solar installations</option>
                  <option value="Medical & Healthcare">Medical Supply & Healthcare Procurements</option>
                  <option value="Chemicals & Materials">Chemical Procurements & Materials</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Physical Office Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Previous Projects track record */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <FileText className="h-4 w-4" /> Bidding Track Record
              </h3>
              <p className="text-xs text-slate-400">Previous projects are loaded into Gemini AI model to calculate eligibility fits automatically</p>
            </div>

            {/* Form to add a project */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl">
              <input 
                type="text"
                placeholder="Project title (e.g. Solar Rooftop)"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <input 
                type="text"
                placeholder="Client (e.g. NTPC)"
                value={projectClient}
                onChange={(e) => setProjectClient(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <input 
                type="number"
                placeholder="Value (INR)"
                value={projectValue}
                onChange={(e) => setProjectValue(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <button 
                type="button"
                onClick={handleAddProject}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-3 rounded-xl transition-all flex justify-center items-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Project
              </button>
            </div>

            {/* Active lists */}
            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/20 rounded-xl">
                  No prior track records added yet. Add projects to boost AI fit scoring.
                </div>
              ) : (
                projects.map((proj, idx) => (
                  <div 
                    key={idx}
                    className="flex justify-between items-center p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{proj.title}</span>
                      <span className="text-[10px] text-slate-400">Client: {proj.client} • Value: ₹{proj.value.toLocaleString('en-IN')} INR</span>
                    </div>

                    <button 
                      onClick={() => handleRemoveProject(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Right Column (Keywords, Category preferences, States preferences) */}
        <div className="space-y-6">
          
          {/* AI keywords & preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Smart Ingest Keywords
            </h3>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="solar, electrical, smart-grid" 
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <button 
                onClick={handleAddKeyword}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 rounded-xl transition-all cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {keywords.map((key) => (
                <span 
                  key={key} 
                  className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-full"
                >
                  {key}
                  <button 
                    onClick={() => handleRemoveKeyword(key)}
                    className="text-indigo-500 hover:text-indigo-700 font-bold text-[10px]"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Regional target states */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Bidding Jurisdictions
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal">Select states where your operations team is legally compliant to bid and construct projects.</p>
            
            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
              {availableStates.map((state) => {
                const isChecked = selectedStates.includes(state);
                return (
                  <label 
                    key={state}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/20 text-xs font-semibold text-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleToggleState(state)}
                      className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{state}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Corporate Sector preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> Tender Categories
            </h3>
            
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {availableCategories.map((category) => {
                const isChecked = selectedCategories.includes(category);
                return (
                  <label 
                    key={category}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/20 text-xs font-semibold text-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleToggleCategory(category)}
                      className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{category}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Centralized Save Button */}
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold text-xs py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/10 cursor-pointer flex justify-center items-center gap-1"
          >
            <Save className="h-4 w-4" /> {loading ? 'Saving details...' : 'Save Corporate Profile'}
          </button>

        </div>

      </div>

    </div>
  );
};
