import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { useActivityLog } from '../../hooks/useActivityLog';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Users, 
  CheckSquare, 
  LogOut 
} from 'lucide-react';

const constructionCategories = [
  "Roads & Highways",
  "Civil Buildings",
  "Bridges & Flyovers",
  "Water Supply & Sewerage",
  "Railways & Metros",
  "Power & Electrical",
  "Irrigation & Dams",
  "Urban Development",
  "Ports & Harbours",
  "Industrial Structures"
];

const indianStates = [
  "All India",
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal"
];

const turnoverOptions = [
  "Under 5 Crores",
  "5 - 25 Crores",
  "25 - 100 Crores",
  "100 - 500 Crores",
  "Above 500 Crores"
];

export default function OnboardingWizard() {
  const { completeOnboarding, logout } = useAuth();
  const { showToast } = useToast();
  const { logActivity } = useActivityLog();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Corporate credentials
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [pan, setPan] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Contact details
  const [businessEmail, setBusinessEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [website, setWebsite] = useState('');

  // Business Capacity
  const [yearsInBusiness, setYearsInBusiness] = useState(5);
  const [annualTurnover, setAnnualTurnover] = useState('5 - 25 Crores');
  const [employeeCount, setEmployeeCount] = useState(25);

  // Work Preferences
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>(['Maharashtra']);
  const [budgetMin, setBudgetMin] = useState(1); // In Crores
  const [budgetMax, setBudgetMax] = useState(100); // In Crores

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => 
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const toggleState = (st: string) => {
    setSelectedStates((prev) => {
      if (st === "All India") {
        return ["All India"];
      }
      const filtered = prev.filter((item) => item !== "All India");
      return filtered.includes(st) ? filtered.filter((item) => item !== st) : [...filtered, st];
    });
  };

  const handleNext = () => {
    // Basic validations
    if (step === 1) {
      if (!companyName || !gstNumber || !pan || !ownerName) {
        showToast("Please fill in all required credentials.", "error");
        return;
      }
      // Simple Indian GST & PAN check
      if (gstNumber.length !== 15) {
        showToast("GST Number must be exactly 15 characters.", "error");
        return;
      }
      if (pan.length !== 10) {
        showToast("PAN must be exactly 10 characters.", "error");
        return;
      }
    }

    if (step === 2) {
      if (!businessEmail || !phoneNumber || !address || !city || !pincode) {
        showToast("Please fill in contact details and address.", "error");
        return;
      }
      if (pincode.length !== 6 || isNaN(Number(pincode))) {
        showToast("Please enter a valid 6-digit PIN code.", "error");
        return;
      }
    }

    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      showToast("Please select at least one construction category.", "error");
      return;
    }
    if (selectedStates.length === 0) {
      showToast("Please select at least one preferred state.", "error");
      return;
    }

    setLoading(true);
    const companyId = 'comp_' + Math.random().toString(36).substring(2, 11);

    const companyData = {
      companyName,
      gstNumber: gstNumber.toUpperCase(),
      pan: pan.toUpperCase(),
      registrationNumber,
      ownerName,
      businessEmail,
      phoneNumber,
      address,
      state,
      city,
      pincode,
      website,
      yearsInBusiness,
      annualTurnover,
      employeeCount,
      constructionCategories: selectedCategories,
      preferredTenderCategories: selectedCategories,
      preferredStates: selectedStates,
      preferredBudgetRange: {
        min: budgetMin,
        max: budgetMax
      }
    };

    try {
      await completeOnboarding(companyId, companyData);
      
      // Log onboarding activity
      await logActivity('Completed Onboarding', `Registered construction firm ${companyName} (GST: ${gstNumber})`);

      showToast("Organization onboarding completed successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to finalize company onboarding.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-[#1C1B1F] flex flex-col justify-between relative selection:bg-[#2152FF]/20">
      {/* Header */}
      <header className="relative z-10 border-b border-[#E1E2E6] bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2152FF] flex items-center justify-center shadow-md shadow-[#2152FF]/10">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-[#1C1B1F]">BuildFlow AI</span>
        </div>
        <button
          onClick={() => logout()}
          className="text-xs font-semibold text-[#44474E] hover:text-[#1C1B1F] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#F1F3F8] border border-transparent hover:border-[#E1E2E6] transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {/* Main Form container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-6 md:py-12 flex flex-col justify-center">
        <div className="bg-white border border-[#E1E2E6] rounded-3xl p-6 md:p-10 shadow-sm">
          {/* Step indicators */}
          <div className="mb-10">
            <div className="flex items-center justify-between max-w-md mx-auto relative">
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-[#E1E2E6] z-0" />
              <div 
                className="absolute left-2 top-1/2 -translate-y-1/2 h-0.5 bg-[#2152FF] transition-all duration-300 z-0" 
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />

              {[
                { label: 'Firm Info', icon: Building2 },
                { label: 'Contacts', icon: MapPin },
                { label: 'Capacity', icon: TrendingUp },
                { label: 'Tenders', icon: FileText }
              ].map((item, idx) => {
                const stepNum = idx + 1;
                const Icon = item.icon;
                const isCompleted = step > stepNum;
                const isActive = step === stepNum;

                return (
                  <div key={idx} className="flex flex-col items-center relative z-10">
                    <button
                      onClick={() => !loading && stepNum < step && setStep(stepNum)}
                      disabled={loading || stepNum >= step}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-[#2152FF] border-[#2152FF] text-white shadow-lg shadow-[#2152FF]/20' 
                          : isActive 
                          ? 'bg-white border-2 border-[#2152FF] text-[#2152FF]' 
                          : 'bg-white border border-[#E1E2E6] text-[#44474E]'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </button>
                    <span className={`text-[10px] md:text-xs font-semibold mt-2.5 ${isActive ? 'text-[#2152FF] font-bold' : isCompleted ? 'text-[#1C1B1F]' : 'text-[#44474E]'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Views */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
            >
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="border-b border-[#E1E2E6] pb-3">
                      <h3 className="text-lg font-bold text-[#1C1B1F] flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#2152FF]" />
                        Company Legal Credentials
                      </h3>
                      <p className="text-xs text-[#44474E] mt-1">Provide corporate registration parameters for GST and PAN validation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-[#44474E]">Registered Company Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Larsen & Toubro Construction Ltd"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">GST Number (GSTIN) <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          maxLength={15}
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                          placeholder="e.g. 27AAAAA0000A1Z5"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all uppercase"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Company PAN <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={pan}
                          onChange={(e) => setPan(e.target.value.toUpperCase())}
                          placeholder="e.g. ABCDE1234F"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all uppercase"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Company Registration/CIN Number</label>
                        <input
                          type="text"
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          placeholder="e.g. U45200MH2018PLC309221"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Authorized Owner/MD Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="e.g. Rajesh Shah"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="border-b border-[#E1E2E6] pb-3">
                      <h3 className="text-lg font-bold text-[#1C1B1F] flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#2152FF]" />
                        Business Contact & Corporate Address
                      </h3>
                      <p className="text-xs text-[#44474E] mt-1">Please provide standard communication lines and localized pin parameters.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Official Business Email <span className="text-rose-500">*</span></label>
                        <input
                          type="email"
                          required
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                          placeholder="tender@firm.com"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Business Phone Number <span className="text-rose-500">*</span></label>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-[#44474E]">Head Office Address <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g. Unit 401, Crescent Towers, Bandra East"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">City <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Mumbai"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">State <span className="text-rose-500">*</span></label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] outline-none text-sm cursor-pointer"
                        >
                          {indianStates.filter(s => s !== "All India").map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Pincode <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="e.g. 400051"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Website URL</label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="e.g. www.firm.com"
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] placeholder-[#44474E]/60 outline-none text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div className="border-b border-[#E1E2E6] pb-3">
                      <h3 className="text-lg font-bold text-[#1C1B1F] flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#2152FF]" />
                        Financial Capacity & Workforce scale
                      </h3>
                      <p className="text-xs text-[#44474E] mt-1">This helps BuildFlow AI determine your eligibility thresholds for high-value tenders.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Years in Active Business</label>
                        <input
                          type="number"
                          value={yearsInBusiness}
                          onChange={(e) => setYearsInBusiness(Number(e.target.value))}
                          min={0}
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] outline-none text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Annual Turnover (INR)</label>
                        <select
                          value={annualTurnover}
                          onChange={(e) => setAnnualTurnover(e.target.value)}
                          className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] outline-none text-sm cursor-pointer"
                        >
                          {turnoverOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-[#44474E]">Current Corporate Employee Count (Workforce)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={1}
                            max={1000}
                            value={employeeCount}
                            onChange={(e) => setEmployeeCount(Number(e.target.value))}
                            className="flex-1 accent-[#2152FF] h-1.5 bg-[#E1E2E6] rounded-lg cursor-pointer"
                          />
                          <span className="px-4 py-1.5 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl text-xs font-bold text-[#2152FF] w-20 text-center shrink-0">
                            {employeeCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div className="border-b border-[#E1E2E6] pb-3">
                      <h3 className="text-lg font-bold text-[#1C1B1F] flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#2152FF]" />
                        Tender Categories & Geography Preferences
                      </h3>
                      <p className="text-xs text-[#44474E] mt-1">Configure your targets. Our Gemini matching engine will prioritize matching matching high-relevance alerts.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-[#44474E] flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-[#2152FF]" />
                        Select Construction Work Categories <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {constructionCategories.map((cat) => {
                          const isSelected = selectedCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleCategory(cat)}
                              className={`px-3 py-2.5 rounded-xl text-left border text-xs font-medium transition-all duration-150 flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#E8EDFF] border-[#2152FF] text-[#2152FF] font-bold' 
                                  : 'bg-[#F8F9FB] border-[#E1E2E6] text-[#44474E] hover:border-[#44474E]'
                              }`}
                            >
                              <span>{cat}</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#2152FF] shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#44474E]">Preferred State Geographies <span className="text-rose-500">*</span></label>
                        <div className="h-44 overflow-y-auto border border-[#E1E2E6] bg-[#F8F9FB] rounded-xl p-3 space-y-2 select-none">
                          {indianStates.map((st) => {
                            const isSelected = selectedStates.includes(st);
                            return (
                              <div
                                key={st}
                                onClick={() => toggleState(st)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                  isSelected ? 'bg-[#E8EDFF] text-[#2152FF] font-bold' : 'text-[#44474E] hover:bg-[#F1F3F8]'
                                }`}
                              >
                                <span>{st}</span>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="h-3.5 w-3.5 rounded bg-white border-[#E1E2E6] text-[#2152FF] focus:ring-0"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#44474E]">Target Budget Min (INR Crores)</label>
                          <input
                            type="number"
                            value={budgetMin}
                            onChange={(e) => setBudgetMin(Number(e.target.value))}
                            min={0}
                            className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] text-sm transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#44474E]">Target Budget Max (INR Crores)</label>
                          <input
                            type="number"
                            value={budgetMax}
                            onChange={(e) => setBudgetMax(Number(e.target.value))}
                            min={1}
                            className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] text-[#1C1B1F] text-sm transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wizard navigation footer */}
                <div className="pt-6 border-t border-[#E1E2E6] flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={step === 1 || loading}
                    className="px-5 py-2.5 rounded-xl border border-[#E1E2E6] hover:border-[#44474E] bg-white text-[#44474E] hover:text-[#1C1B1F] text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 rounded-xl bg-[#2152FF] hover:bg-[#1E49E6] text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-md shadow-[#2152FF]/10 transition-all cursor-pointer"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-600/10 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Finalize Onboarding
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 px-6 border-t border-[#E1E2E6] bg-white text-center text-xs text-[#44474E] font-sans shadow-sm">
        BuildFlow AI Enterprise Panel. Strictly Confidential.
      </footer>
    </div>
  );
}
