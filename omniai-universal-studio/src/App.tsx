/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MegaChat from './components/MegaChat';
import ChatView from './components/ChatView';
import SecTestLab from './components/SecTestLab';
import DatabaseMonitor from './components/DatabaseMonitor';
import Diagnostics from './components/Diagnostics';
import VoiceMode from './components/VoiceMode';
import BillingPanel from './components/BillingPanel';
import { EngineType, TokenUsage } from './types';
import { 
  Sparkles, 
  Terminal, 
  Shield, 
  LogIn, 
  LogOut, 
  Key, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';

const DEFAULT_TOKEN_USAGE: TokenUsage = {
  chatgpt: { input: 476480, output: 714720, sessionsCount: 1489 },
  claude: { input: 364900, output: 578500, sessionsCount: 890 },
  gemini: { input: 571760, output: 796380, sessionsCount: 2042 },
  openclaw: { input: 74160, output: 90640, sessionsCount: 412 },
  blackbox: { input: 38440, output: 53320, sessionsCount: 124 }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('secLab');
  const [engine, setEngine] = useState<Exclude<EngineType, 'unified'>>('gemini');
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [lastResponseText, setLastResponseText] = useState('');
  const [subscribed, setSubscribed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('omniai_user_email') || '';
      if (email === 'neoedits2008@gmail.com' || email === 'shadowfall07042008@gmail.com') {
        return true;
      }
      return localStorage.getItem('omniai_premium_subscribed') === 'true';
    }
    return false;
  });

  const [tokenUsage, setTokenUsage] = useState<TokenUsage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omniai_token_usage');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return DEFAULT_TOKEN_USAGE;
  });

  const handleAddTokens = (eng: Exclude<EngineType, 'unified'>, prompt: string, response: string) => {
    const inputWords = prompt.trim().split(/\s+/).filter(Boolean).length;
    const outputWords = response.trim().split(/\s+/).filter(Boolean).length;
    
    const inputEst = Math.ceil(inputWords * 1.35) || 5;
    const outputEst = Math.ceil(outputWords * 1.35) || 8;
    
    setTokenUsage(prev => {
      const updated = {
        ...prev,
        [eng]: {
          input: prev[eng].input + inputEst,
          output: prev[eng].output + outputEst,
          sessionsCount: prev[eng].sessionsCount + 1
        }
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('omniai_token_usage', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const [showSignInModal, setShowSignInModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('omniai_user_email') || '';
    }
    return '';
  });
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  const handleSetSubscribed = (val: boolean) => {
    setSubscribed(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('omniai_premium_subscribed', String(val));
    }
  };

  const handleSignIn = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'neoedits2008@gmail.com' || cleanEmail === 'shadowfall07042008@gmail.com') {
      setUserEmail(cleanEmail);
      handleSetSubscribed(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('omniai_user_email', cleanEmail);
      }
      setLoginSuccess('Authentication successful! Lifetime VIP Access has been permanently activated.');
      setLoginError('');
      setTimeout(() => {
        setShowSignInModal(false);
        setLoginSuccess('');
        setLoginEmailInput('');
      }, 1500);
    } else {
      setLoginError('Unauthorized tester credential. Enter an authorized developer email.');
      setLoginSuccess('');
    }
  };

  const handleSignOut = () => {
    setUserEmail('');
    handleSetSubscribed(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('omniai_user_email');
    }
  };

  // Handle transcripts piped from voice microphone captures
  const handleVoiceTranscript = (text: string) => {
    setTranscriptInput(text);
  };

  // Triggered when any model finishes generating a text response stream
  const handleNewBotMessage = (text: string) => {
    setLastResponseText(text);
  };

  if (!userEmail) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#050505] text-gray-200 font-sans select-none border-4 border-[#1a1a1a]" id="applet-viewport">
        <div className="w-full max-w-md bg-[#0c0c0c] border border-cyan-950/85 rounded-xl shadow-2xl p-8 space-y-6 relative">
          {/* Header branding */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-700/30 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-950/30">
              <Key className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-widest font-mono uppercase">OmniAI Universal</h1>
              <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mt-1">v1.0.4 Developer Portal</p>
            </div>
            <p className="text-xs text-gray-400 max-w-[320px] mx-auto leading-relaxed">
              Enter your authorized developer credentials below to decrypt the secure sandbox environments and activate the zero-cost failover router.
            </p>
          </div>

          {/* Response Alerts */}
          {loginError && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg flex items-start gap-2.5 text-[11px] text-red-400 font-mono leading-normal">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {loginSuccess && (
            <div className="p-3 bg-green-950/20 border border-green-900/30 rounded-lg flex items-start gap-2.5 text-[11px] text-green-400 font-mono leading-normal">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500 mt-0.5 animate-bounce" />
              <span>{loginSuccess}</span>
            </div>
          )}

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSignIn(loginEmailInput);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-gray-500 uppercase block tracking-wider">Authorized Developer Email</label>
              <input
                type="email"
                required
                autoFocus
                placeholder="neoedits2008@gmail.com or shadowfall07042008@gmail.com"
                value={loginEmailInput}
                onChange={(e) => setLoginEmailInput(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-lg p-3 text-xs text-gray-200 focus:outline-none focus:border-cyan-700 font-mono placeholder-gray-600 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold py-3.5 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/30 active:translate-y-0.5"
            >
              <LogIn className="w-4 h-4" /> Sign In & Decrypt Sandbox
            </button>
          </form>

          <div className="pt-4 border-t border-gray-950/80 text-center">
            <p className="text-[10px] text-gray-600 font-mono">
              Systems Authorized: neoedits2008@gmail.com | shadowfall07042008@gmail.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0a] text-gray-200 font-sans select-none border-4 border-[#1a1a1a] overflow-hidden" id="applet-viewport">
      {/* Global Header / System Bar */}
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0f0f0f] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center font-bold text-white text-xs">Ω</div>
          <h1 className="text-sm font-semibold tracking-tight uppercase text-gray-400">OmniAI Universal <span className="text-gray-600">v1.0.4-stable</span></h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Sign In Header Control */}
          {userEmail ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider truncate max-w-[140px]">{userEmail}</span>
              <button 
                onClick={handleSignOut}
                title="Sign Out Developer"
                className="text-gray-500 hover:text-red-400 ml-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSignInModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all shadow-md shadow-cyan-950/20 active:translate-y-0.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Developer Sign In
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-800/50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Zero-Cost Router Active</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
            <span>DESKTOP: TAURI-LINUX</span>
            <span className="text-gray-700">|</span>
            <span>SQLITE: ONLINE</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          voiceModeEnabled={voiceModeEnabled}
          subscribed={subscribed}
          userEmail={userEmail}
          onSignInClick={() => setShowSignInModal(true)}
          onSignOut={handleSignOut}
        />

        {/* Main Content Workspace Layout */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative bg-[#050505]" id="main-workbench">
          
          {/* Dynamic Inner Tab View */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'mega' && (
              <MegaChat 
                voiceModeEnabled={voiceModeEnabled} 
                transcriptInput={transcriptInput}
                setTranscriptInput={setTranscriptInput}
                onNewBotMessage={handleNewBotMessage}
                subscribed={subscribed}
                onUpgradeClick={() => setActiveTab('billing')}
                onAddTokens={handleAddTokens}
              />
            )}

            {activeTab === 'single' && (
              <ChatView 
                engine={engine} 
                setEngine={setEngine} 
                voiceModeEnabled={voiceModeEnabled}
                transcriptInput={transcriptInput}
                setTranscriptInput={setTranscriptInput}
                onNewBotMessage={handleNewBotMessage}
                subscribed={subscribed}
                onUpgradeClick={() => setActiveTab('billing')}
                onAddTokens={handleAddTokens}
              />
            )}

            {activeTab === 'secLab' && (
              <SecTestLab />
            )}

            {activeTab === 'db' && (
              <DatabaseMonitor />
            )}

            {activeTab === 'diagnostics' && (
              <Diagnostics tokenUsage={tokenUsage} setTokenUsage={setTokenUsage} />
            )}

            {activeTab === 'billing' && (
              <BillingPanel 
                subscribed={subscribed}
                setSubscribed={handleSetSubscribed}
              />
            )}
          </div>

          {/* Floating Voice Engine Control Drawer - accessible fixed widget */}
          <VoiceMode 
            onTranscript={handleVoiceTranscript}
            voiceModeEnabled={voiceModeEnabled}
            setVoiceModeEnabled={setVoiceModeEnabled}
            lastResponseText={lastResponseText}
            subscribed={subscribed}
            onUpgradeClick={() => setActiveTab('billing')}
          />
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-7 border-t border-gray-800 bg-[#0d0d0d] flex items-center justify-between px-4 text-[10px] font-mono text-gray-600 shrink-0">
        <div className="flex gap-4 col-span-2">
          <span>PLATFORM: DARWIN_X64</span>
          <span>UPTIME: 12h 44m</span>
          <span className="text-emerald-600 underline">FREE_ROUTER_ACTIVE</span>
        </div>
        <div className="flex gap-4">
          <span>MEM: 242MB</span>
          <span className="text-cyan-500">API_KEY: NONE_REQUIRED</span>
        </div>
      </footer>

      {/* Developer Sign In Modal Overlay */}
      {showSignInModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-cyan-950/85 rounded-xl shadow-2xl p-6 relative space-y-5">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowSignInModal(false);
                setLoginError('');
                setLoginSuccess('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-all p-1"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Header branding */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-700/30 flex items-center justify-center mx-auto text-cyan-400">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Developer Auth Gateway</h2>
              <p className="text-[11px] text-gray-500 max-w-[280px] mx-auto leading-normal">
                Enter your registered developer email below to verify identity & unlock lifetime Enterprise Pro features.
              </p>
            </div>

            {/* Response Alerts */}
            {loginError && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded flex items-start gap-2.5 text-[10px] text-red-400 font-mono leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="p-3 bg-green-950/20 border border-green-900/30 rounded flex items-start gap-2.5 text-[10px] text-green-400 font-mono leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500 animate-bounce" />
                <span>{loginSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSignIn(loginEmailInput);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-gray-500 uppercase block tracking-wider">Authorized Email Address</label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="e.g. neoedits2008@gmail.com"
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 text-xs text-gray-200 focus:outline-none focus:border-cyan-700 font-mono placeholder-gray-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold py-3 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/30 active:translate-y-0.5"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In & Authorize
              </button>
            </form>

            <div className="pt-2 border-t border-gray-950/80 text-center">
              <p className="text-[9px] text-gray-600 font-mono">
                System Authorized: neoedits2008@gmail.com
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
