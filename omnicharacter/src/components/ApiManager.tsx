/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ApiProviderConfig } from '../types';
import { Server, Save, Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';

interface ApiManagerProps {
  onBack: () => void;
}

export default function ApiManager({ onBack }: ApiManagerProps) {
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'claude' | 'openrouter' | 'groq' | 'deepseek' | 'ollama' | 'lmstudio' | 'koboldcpp'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load existing configurations if any
  useEffect(() => {
    const saved = localStorage.getItem('omnichar_api_config');
    if (saved) {
      const parsed: ApiProviderConfig = JSON.parse(saved);
      setProvider(parsed.provider);
      setApiKey(parsed.apiKey);
      setBaseUrl(parsed.baseUrl || '');
      setModel(parsed.model);
    }
  }, []);

  const handleSave = () => {
    const config: ApiProviderConfig = {
      provider,
      apiKey,
      baseUrl: baseUrl || undefined,
      model
    };
    localStorage.setItem('omnichar_api_config', JSON.stringify(config));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const getModelOptions = (prov: string) => {
    switch (prov) {
      case 'gemini':
        return ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];
      case 'openai':
        return ['gpt-4o', 'gpt-4o-mini', 'o1-mini'];
      case 'claude':
        return ['claude-3-5-sonnet-latest', 'claude-3-opus-latest'];
      case 'deepseek':
        return ['deepseek-chat', 'deepseek-coder'];
      case 'groq':
        return ['llama3-8b-8192', 'mixtral-8x7b-32768'];
      default:
        return ['default-model'];
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-900 pb-4">
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Server className="w-5 h-5 text-teal-400" />
          API Provider Configuration
        </h1>
        <p className="text-slate-500 text-xs">Configure third-party key orchestrators, model parameters, and local proxy hooks</p>
      </div>

      <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6 space-y-5">
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Provider</label>
          <select 
            value={provider}
            onChange={(e) => {
              const nextProv = e.target.value as any;
              setProvider(nextProv);
              const opts = getModelOptions(nextProv);
              setModel(opts[0]);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300"
          >
            <option value="gemini">Google Gemini AI (Default Node)</option>
            <option value="openai">OpenAI (Direct API)</option>
            <option value="claude">Anthropic Claude (Experimental)</option>
            <option value="deepseek">DeepSeek AI (Direct REST)</option>
            <option value="groq">Groq Cloud (Llama-3)</option>
            <option value="ollama">Ollama (Localhost 11434)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom Provider API Key</label>
            <button 
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-[10px] text-slate-500 hover:text-white"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="relative">
            <input 
              type={showKey ? 'text' : 'password'} 
              placeholder={provider === 'gemini' ? 'Optional (Defaults to system-provided key)' : 'Enter custom API key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferred Model</label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300"
            >
              {getModelOptions(provider).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom Base API URL (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. http://localhost:11434/v1" 
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3 bg-gradient-to-r from-teal-400 to-indigo-500 hover:opacity-90 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaved ? 'Configuration Saved!' : 'Save Connection Details'}
        </button>

      </div>

      <div className="bg-teal-500/5 border border-teal-500/10 p-5 rounded-2xl flex gap-3.5 items-start">
        <Sparkles className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white">Default Server Engine is Live!</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            By default, OmniCharacter AI uses the server-side **Google Gemini SDK** securely powered by the host node. You do not need to fill in an API key to test the application!
          </p>
        </div>
      </div>

    </div>
  );
}
