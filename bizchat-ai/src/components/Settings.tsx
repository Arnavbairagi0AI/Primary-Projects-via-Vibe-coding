import React, { useState } from 'react';
import { 
  Settings2, 
  Store, 
  Bot, 
  MapPin, 
  Phone, 
  Clock, 
  Save, 
  Sparkles, 
  Languages, 
  HelpCircle,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { BusinessSettings } from '../types';

interface SettingsProps {
  settings: BusinessSettings;
  onSaveSettings: (updated: BusinessSettings) => void;
  onAddNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function Settings({ settings, onSaveSettings, onAddNotification }: SettingsProps) {
  // Business Profile states
  const [shopName, setShopName] = useState(settings.shopName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [workingHours, setWorkingHours] = useState(settings.workingHours);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');

  // AI Settings states
  const [aiPersonality, setAiPersonality] = useState(settings.aiPersonality);
  const [language, setLanguage] = useState(settings.language);
  const [greetingMessage, setGreetingMessage] = useState(settings.greetingMessage);
  const [customInstructions, setCustomInstructions] = useState(settings.customInstructions);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const updated: BusinessSettings = {
      shopName,
      address,
      phone,
      workingHours,
      logoUrl,
      aiPersonality,
      language,
      greetingMessage,
      customInstructions
    };

    setTimeout(() => {
      onSaveSettings(updated);
      setSaving(false);
      setSavedSuccess(true);
      onAddNotification(
        'Settings Saved', 
        'Shop profile and AI Custom instructions updated successfully.', 
        'success'
      );
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 1000);
  };

  const handleLogoUploadSimulate = () => {
    const urls = [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200'
    ];
    // Select a random coffee/shop logo
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    setLogoUrl(randomUrl);
    onAddNotification('Logo Uploaded', 'Business banner and branding logo synced.', 'info');
  };

  return (
    <div id="settings-view" className="space-y-6 p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure your public business profile and fine-tune your Gemini AI instructions.</p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6 max-w-4xl">
        {/* Row 1: Business Profile */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Store className="w-4 h-4 text-indigo-605" />
            <h3 className="font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Business Profile Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Logo Upload Box */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/30 text-center">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Shop Logo preview" 
                  className="w-16 h-16 rounded-xl object-cover mb-2.5 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 mb-2.5">
                  <Store className="w-6 h-6" />
                </div>
              )}
              <h4 className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-0.5">Branding Store Logo</h4>
              <p className="text-[9px] text-slate-400 mb-3">PNG, JPG up to 2MB</p>
              
              <button
                type="button"
                onClick={handleLogoUploadSimulate}
                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-750 text-[10px] font-medium rounded-lg text-slate-705 dark:text-slate-200 transition-all shadow-none cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                Upload Logo
              </button>
            </div>

            {/* Profile inputs */}
            <div className="md:col-span-2 space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Shop Name</label>
                <input 
                  type="text" 
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Beans & Brews Coffee Shop" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Physical Address</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Silicon Circle, San Francisco, CA" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Shop Public Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567" 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Working Hours</label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      required
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      placeholder="Mon-Fri: 8AM-6PM, Weekend: 9AM-4PM" 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: AI Personality Configuration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Bot className="w-4 h-4 text-indigo-605" />
            <h3 className="font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              Gemini AI Tuning Engine
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-current" />
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">AI Agent Personality Vibe</label>
              <input 
                type="text" 
                required
                value={aiPersonality}
                onChange={(e) => setAiPersonality(e.target.value)}
                placeholder="Warm, professional, and coffee-loving" 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
              />
              <p className="text-[9px] text-slate-400 mt-1">Defines how the AI structures tone, warmth, and brand speech.</p>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Primary Assistant Language</label>
              <div className="relative">
                <Languages className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Chinese">Chinese (中文)</option>
                </select>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">AI supports multi-language queries but will reply natively in this language.</p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Initial Channel Greeting Message</label>
            <input 
              type="text" 
              required
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              placeholder="Hi! Welcome to Beans & Brews, I am your AI assistant. How can I help you?" 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
            />
            <p className="text-[9px] text-slate-400 mt-1">Sent automatically to clients as soon as they open the chat window.</p>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Custom System Instructions & Business Rules</label>
            <textarea 
              rows={4}
              required
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Be very polite. Recommend our premium cups if they are looking for accessories. Always mention in-stock beans..." 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none resize-none dark:text-white"
            />
            <p className="text-[9px] text-slate-400 mt-1">This context block is appended directly to the Gemini system prompts, determining response limits and order rules.</p>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end gap-2.5 items-center">
          {savedSuccess && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-650 font-medium bg-emerald-50 dark:bg-emerald-950/25 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configurations saved successfully!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-755 text-white font-medium rounded-lg shadow-sm transition-colors text-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save All Configurations'}
          </button>
        </div>
      </form>
    </div>
  );
}
