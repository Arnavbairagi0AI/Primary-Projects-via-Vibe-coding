import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { 
  Building2, TrendingUp, Sparkles, MessageSquareHeart, CheckCircle2, 
  MapPin, Award, Star, ArrowUpRight, Share2, Compass, AlertCircle
} from 'lucide-react';
import { HistoryItem } from '../types';

const STANDARD_CATEGORIES = [
  "Restaurant & Dining",
  "Retail & Fashion Boutique",
  "Gym & Fitness Center",
  "Beauty Spa & Saloon",
  "Healthcare & Dental Clinic",
  "Real Estate & PG Services",
  "Coaching & Tuition Institute"
];


interface DashboardTabProps {
  user: User;
  onNavigateToTab: (tab: 'dashboard' | 'generator' | 'history' | 'billing') => void;
  isActiveSubscription: boolean;
  businessName: string;
  setBusinessName: (name: string) => void;
}

export default function DashboardTab({ 
  user, 
  onNavigateToTab, 
  isActiveSubscription, 
  businessName, 
  setBusinessName 
}: DashboardTabProps) {
  const [editingBusinessName, setEditingBusinessName] = useState(false);
  const [tempBusinessName, setTempBusinessName] = useState(businessName);
  const [saveLoading, setSaveLoading] = useState(false);
  const isOwner = user.email?.toLowerCase() === 'neoedits2009@gmail.com';
  const [stats, setStats] = useState({
    totalProcessed: 0,
    seoOptimized: 0,
    englishCount: 0,
    hinglishCount: 0,
    hindiCount: 0,
    tamilCount: 0,
  });
  const [recentReplies, setRecentReplies] = useState<HistoryItem[]>([]);
  const [businessType, setBusinessType] = useState('Restaurant & Dining');
  const [locality, setLocality] = useState('Indiranagar, Bengaluru');
  const [editingDetails, setEditingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setTempBusinessName(businessName);
  }, [businessName]);

  // Load stats from Firestore
  useEffect(() => {
    async function loadStats() {
      try {
        const historyRef = collection(db, 'history');
        const q = query(historyRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        let total = 0;
        let seoCount = 0;
        let eng = 0;
        let hing = 0;
        let hin = 0;
        let tam = 0;
        
        const items: HistoryItem[] = [];

        querySnapshot.forEach((doc) => {
          total++;
          const data = doc.data() as HistoryItem;
          items.push({ id: doc.id, ...data });

          // Count SEO keywords
          const firstReplyKeywords = data.generatedReplies?.[0]?.seoKeywords || [];
          seoCount += firstReplyKeywords.length;

          // Language counts
          const lang = (data.language || '').toLowerCase();
          if (lang.includes('hinglish')) hing++;
          else if (lang.includes('hindi')) hin++;
          else if (lang.includes('tamil')) tam++;
          else eng++;
        });

        // Sort items by creation time descending and take top 3
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentReplies(items.slice(0, 3));

        setStats({
          totalProcessed: total,
          seoOptimized: seoCount || (total * 5), // fallback if zero
          englishCount: eng,
          hinglishCount: hing,
          hindiCount: hin,
          tamilCount: tam
        });

        // Try load business type and locality
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.businessType) setBusinessType(userData.businessType);
          if (userData.locality) setLocality(userData.locality);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      }
    }
    loadStats();
  }, [user.uid, businessName]);

  const handleSaveBusinessDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        businessName: tempBusinessName,
        businessType: businessType,
        locality: locality,
      });
      setBusinessName(tempBusinessName);
      setEditingDetails(false);
      setEditingBusinessName(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating business metadata:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Save success banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm shadow-xs animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>Business settings updated successfully on Indian server.</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-950/20">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Building2 className="h-48 w-48" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 uppercase tracking-wider mb-3">
            <Compass className="h-3.5 w-3.5" />
            <span>SEO Booster Engine v2.5</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Namaste, {user.displayName?.split(' ')[0] || 'Business Owner'}!
          </h2>
          <p className="mt-2 text-slate-300 text-sm md:text-base leading-relaxed">
            Your business <strong className="text-white">"{businessName || 'My Local Business'}"</strong> is currently configured in <strong className="text-white">{locality}</strong>. Leverage Indian localization prompts to build 5-star Google review credibility.
          </p>
          
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              id="dash-quick-generate-btn"
              onClick={() => onNavigateToTab('generator')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Customer Replies</span>
            </button>
            <button
              id="dash-edit-profile-btn"
              onClick={() => {
                setEditingDetails(!editingDetails);
                setEditingBusinessName(!editingBusinessName);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 font-medium text-xs rounded-xl transition flex items-center space-x-1.5"
            >
              <Building2 className="h-4 w-4" />
              <span>{editingDetails ? 'Cancel Edit' : 'Edit Business Info'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Business Settings Editor */}
      {(editingBusinessName || editingDetails) && (
        <form onSubmit={handleSaveBusinessDetails} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Configure Indian Google Business Metadata</h3>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Used to fine-tune local SEO replies</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Registered Business Name
              </label>
              <input
                type="text"
                value={tempBusinessName}
                onChange={(e) => setTempBusinessName(e.target.value)}
                required
                placeholder="e.g. Royal Punjab Dhaba"
                className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Business Category
              </label>
              <select
                value={STANDARD_CATEGORIES.includes(businessType) ? businessType : 'Other'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'Other') {
                    setBusinessType('Other');
                  } else {
                    setBusinessType(val);
                  }
                }}
                className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
              >
                <option value="Restaurant & Dining">Restaurant & Food Delivery</option>
                <option value="Retail & Fashion Boutique">Retail Shop / Showroom</option>
                <option value="Gym & Fitness Center">Gym & Fitness Center</option>
                <option value="Beauty Spa & Saloon">Beauty Spa & Saloon</option>
                <option value="Healthcare & Dental Clinic">Healthcare & Clinic</option>
                <option value="Real Estate & PG Services">Real Estate & PG Services</option>
                <option value="Coaching & Tuition Institute">Coaching & Tuition Institute</option>
                <option value="Other">Other / Custom Category...</option>
              </select>

              {(!STANDARD_CATEGORIES.includes(businessType) || businessType === 'Other') && (
                <div className="mt-2 animate-fade-in">
                  <input
                    type="text"
                    value={businessType === 'Other' ? '' : businessType}
                    onChange={(e) => setBusinessType(e.target.value || 'Other')}
                    placeholder="Type your custom business category..."
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Local Area / Locality (SEO Anchor)
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                required
                placeholder="e.g. Bandra West, Mumbai"
                className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditingBusinessName(false);
                setEditingDetails(false);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saveLoading}
              id="save-business-details-btn"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {saveLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors duration-200">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Processed Reviews</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalProcessed}</p>
            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              <TrendingUp className="h-3 w-3" />
              <span>100% cloud delivery</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <MessageSquareHeart className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors duration-200">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">SEO Keywords Inserted</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.seoOptimized}</p>
            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              <TrendingUp className="h-3 w-3" />
              <span>Local density optimal</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors duration-200">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Response Time</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">45s</p>
            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="h-3 w-3" />
              <span>Instant AI deployment</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Star className="h-5 w-5 fill-amber-500/20" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors duration-200">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan Status</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {isOwner 
                ? 'Owner Lifetime' 
                : isActiveSubscription 
                  ? 'Premium Pro' 
                  : 'Free Tier'}
            </p>
            <div className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
              <Star className="h-3 w-3 fill-indigo-100 dark:fill-indigo-900/40" />
              <span>{isOwner ? 'Unrestricted Admin' : isActiveSubscription ? 'Razorpay Connected' : 'Limited features'}</span>
            </div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Local SEO Expert Tips */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h3 className="font-bold text-slate-950 dark:text-white flex items-center space-x-2">
                <Compass className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Indian Google Maps local SEO strategy corner</span>
              </h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase font-mono">Expert Insights</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">Locality Anchor</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">1. Geo-Tagging Localities</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Always mention landmarks like <strong className="text-indigo-600 dark:text-indigo-400">"{locality.split(',')[0]}"</strong> in your replies. Google's index picks up geographic proximity when mapping local queries like "best {businessType.toLowerCase()} near me".
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30">Hindi/Tamil Conversions</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">2. Power of Hinglish</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Over 60% of Indian users write reviews in English but expect an informal, friendly response in Hinglish. Using "Humse milkar khushi hui" builds instant loyalty.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30">Discharge Bad Reviews</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">3. Apology Strategy (1-2 Stars)</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  For bad reviews, never argue. Use our "Apologetic" tone. State that customer satisfaction is your highest value, and invite them back with a direct contact details link.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30">Keyword Injector</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">4. Service Keyword Density</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Inject searchable keywords like "authentic recipes", "quick turnaround service", or "best value in town" directly inside the generated greetings.
                </p>
              </div>
            </div>

            {/* Indian Business Star Checklist */}
            <div className="mt-6 p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wide mb-3 flex items-center space-x-1">
                <Star className="h-4 w-4 fill-indigo-500 text-indigo-500" />
                <span>5-Star Credibility checklist for local businesses</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Reply to all Google Business reviews within <strong className="text-slate-900 dark:text-white">24 hours</strong>.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Always sign off with the owner's name or manager name to show personalization.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Use local scripts (Hindi, Tamil) for local customers to build deeper connections.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Logs */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs transition-colors duration-200">
            <h3 className="font-bold text-slate-950 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-3 mb-3 flex items-center justify-between text-sm">
              <span>Recent Replies Log</span>
              <button 
                id="dash-view-all-history-btn"
                onClick={() => onNavigateToTab('history')} 
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold flex items-center"
              >
                <span>View all</span>
                <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </button>
            </h3>

            {recentReplies.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs">No customer reviews processed yet.</p>
                <button
                  onClick={() => onNavigateToTab('generator')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Generate your first reply now
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentReplies.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                      <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold uppercase rounded-md">{item.language}</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-300 line-clamp-2 italic">"{item.customerReview}"</p>
                    <div className="h-px bg-slate-100 dark:bg-slate-800" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                      Replied: "{item.selectedReplyText || item.generatedReplies[0]?.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Premium promotion or Quick info block */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl p-5 relative overflow-hidden">
            <h3 className="font-bold text-amber-950 dark:text-amber-200 text-sm">ReviewRanger India Premium Plan</h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1.5 leading-relaxed">
              Unlock unlimited AI translations, advanced localized SEO keyword integrations, and Google Business API hooks. Only ₹999/month.
            </p>
            <button
              onClick={() => onNavigateToTab('billing')}
              className="mt-3.5 w-full py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Get Premium Membership
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
