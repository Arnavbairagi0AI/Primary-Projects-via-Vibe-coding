import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Play, 
  RotateCw, 
  HelpCircle, 
  Mic,
  ArrowRight,
  TrendingUp,
  Cpu,
  Trash2,
  Lock,
  WifiOff,
  CloudLightning,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { EngineType } from '../types';

interface MegaChatProps {
  voiceModeEnabled: boolean;
  transcriptInput: string;
  setTranscriptInput: (val: string) => void;
  onNewBotMessage: (text: string) => void;
  subscribed: boolean;
  onUpgradeClick: () => void;
  onAddTokens?: (engine: Exclude<EngineType, 'unified'>, prompt: string, response: string) => void;
}

export default function MegaChat({ 
  voiceModeEnabled, 
  transcriptInput, 
  setTranscriptInput,
  onNewBotMessage,
  subscribed,
  onUpgradeClick,
  onAddTokens
}: MegaChatProps) {
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'tabs'>('tabs');
  const [selectedEngineTab, setSelectedEngineTab] = useState<string>('gemini');
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  
  // Simulated streaming values for each quadrant
  const [streams, setStreams] = useState<Record<string, { text: string; latency: number; route: string; active: boolean }>>({
    chatgpt: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'DuckDuckGo Proxy Mirror', active: false },
    claude: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'Hugging Face Space Mirror', active: false },
    gemini: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'Google Developer Free Key', active: false },
    openclaw: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'Localhost Ollama Socket', active: false },
    blackbox: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'Shared Free API Agent', active: false },
  });

  // Handle voice transcripts dictation
  useEffect(() => {
    if (transcriptInput) {
      setInputText(transcriptInput);
      setTranscriptInput('');
    }
  }, [transcriptInput]);

  const templatePrompts = [
    { title: "Bypass CORS Tauri", desc: "Rust handlers for scraping bypass on Tauri desktop.", query: "Write a Rust handler for Tauri desktop that intercepts a POST request, injects cookies, bypasses browser CORS blockades, and streams the text response back." },
    { title: "Capacitor Mobile Sync", desc: "Sync web assets to Android containers.", query: "Provide a complete capacitor.config.ts setup that enables native webview wrapping and navigates external secure scraping sessions safely." },
    { title: "Node CLI CLI Link", desc: "Link Node executable globally.", query: "How do I configure package.json bin parameters and bin executable files to link Commander and Inquirer CLI globally to terminal namespace?" },
    { title: "Failover Engine Logic", desc: "Multi-model rotating router logic.", query: "Provide a TypeScript class that takes an array of providers, catches 401/429 HTTP status failures, and failovers dynamically." }
  ];

  const triggerParallelPrompt = (prompt: string) => {
    if (!prompt.trim() || isStreaming) return;
    
    setIsStreaming(true);
    
    // Clear initial panels
    setStreams({
      chatgpt: { text: 'Orchestrating unauthenticated mirror proxy stream...', latency: 0, route: 'DuckDuckGo Proxy Mirror', active: true },
      claude: { text: 'Consulting Qwen 72B serverless Space...', latency: 0, route: 'Hugging Face Space Mirror', active: true },
      gemini: { text: 'Establishing secure Developer API stream...', latency: 0, route: 'Google Developer Free Key (v1beta)', active: true },
      openclaw: { text: 'Connecting local Ollama model instance...', latency: 0, route: 'Localhost Ollama Socket (Port 11434)', active: true },
      blackbox: { text: 'Consulting Blackbox AI auto-complete routing agent...', latency: 0, route: 'Shared Free API Agent Route', active: true },
    });

    const mockDocs: Record<string, string> = {
      chatgpt: `### Rust Tauri Scraping Handler Bypass
To bypass CORS restrictions during browser-based session scraping, write raw native HTTP client commands in Rust. This totally isolates browser credentials.

\`\`\`rust
#[tauri::command]
async fn execute_raw_scraping_request(url: String, cookie: String, body: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert(USER_AGENT, HeaderValue::from_static("Mozilla/5.0"));
    
    let res = client.post(&url).headers(headers).body(body).send().await.map_err(|e| e.to_string())?;
    Ok(res.text().await.map_err(|e| e.to_string())?)
}
\`\`\``,
      claude: `### Capacitor Mobile Container Sync Setup
Using Capacitor, you wrap React assets into Native Shell Containers. Configure Android Schemes:

\`\`\`typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omniai.universal',
  appName: 'OmniAI Universal',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['chatgpt.com', 'claude.ai']
  }
};
export default config;
\`\`\``,
      gemini: `### Node CLI global linkage & execution logic
Link Node.js executables globally to terminal space using commander and "bin" declarations:

\`\`\`json
{
  "name": "omniai-cli",
  "bin": {
    "omniai": "./dist/index.js"
  }
}
\`\`\`

Ensure you include \`#!/usr/bin/env node\` as the very first line of your entry script. Run \`npm link\` in packages root directory.`,
      openclaw: `### Local OpenClaw Offline Ollama Adapter
Offline failovers guarantee total automation when remote sessions drop.

\`\`\`typescript
export class OpenClawProvider {
  async *streamPrompt(prompt: string, localUrl = 'http://localhost:11434') {
    const response = await axios.post(\`\${localUrl}/api/generate\`, {
      model: 'llama3',
      prompt
    });
    yield response.data.response;
  }
}
\`\`\``,
      blackbox: `### Blackbox AI Coding Sandbox Output
Multi-language execution is fully functional on our serverless playground. Here is your unconstrained autocomplete optimization report:

\`\`\`typescript
export function optimizeCallRoute(urls: string[], timeoutMs = 1200): Promise<any> {
  const controller = new AbortController();
  const promises = urls.map(url => 
    fetch(url, { signal: controller.signal })
      .then(r => { if (r.ok) { controller.abort(); return r.json(); } })
  );
  return Promise.any(promises);
}
\`\`\``
    };

    // Parallel streaming simulation - only premium models are simulated if subscribed
    const engines = subscribed 
      ? ['chatgpt', 'claude', 'gemini', 'openclaw', 'blackbox']
      : ['gemini'];

    let completedCount = 0;

    engines.forEach((eng) => {
      const fullText = mockDocs[eng];
      const words = fullText.split(' ');
      let currentIdx = 0;
      let streamingText = '';
      const stepInterval = Math.floor(50 + Math.random() * 80); // varying stream rates

      const interval = setInterval(() => {
        if (currentIdx < words.length) {
          streamingText += (currentIdx === 0 ? '' : ' ') + words[currentIdx];
          setStreams(prev => ({
            ...prev,
            [eng]: {
              ...prev[eng],
              text: streamingText,
              latency: Math.floor(250 + Math.random() * 900) // update latency tracking
            }
          }));
          currentIdx++;
        } else {
          clearInterval(interval);
          completedCount++;
          setStreams(prev => ({
            ...prev,
            [eng]: {
              ...prev[eng],
              active: false
            }
          }));

          if (onAddTokens) {
            onAddTokens(eng as any, inputText, fullText);
          }

          if (completedCount === engines.length) {
            setIsStreaming(false);
            onNewBotMessage(subscribed 
              ? "Mega Prompt completed on all 5 active routing models side-by-side."
              : "Mega Prompt completed on free Gemini channel. Upgrade to run all channels in parallel."
            );
          }
        }
      }, stepInterval);
    });
  };

  const clearGrid = () => {
    setStreams({
      chatgpt: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'DuckDuckGo Proxy Mirror', active: false },
      claude: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'Hugging Face Space Mirror', active: false },
      gemini: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'Google Developer Free Key', active: false },
      openclaw: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'Localhost Ollama Socket', active: false },
      blackbox: { text: 'Ready to receive parallel prompts...', latency: 0, route: 'Shared Free API Agent', active: false },
    });
    setInputText('');
  };

  const handleSpeak = (key: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (speakingText === key) {
        setSpeakingText(null);
        return;
      }
    }

    setSpeakingText(key);
    const cleanText = text
      .replace(/[\*#_`]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .slice(0, 300);
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) || voices.find(v => v.lang.startsWith('en'));
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onend = () => {
      setSpeakingText(null);
    };
    utterance.onerror = () => {
      setSpeakingText(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const quadrantMeta: Record<string, { title: string; colorClass: string; isItalic: boolean }> = {
    chatgpt: { title: '[01] CHATGPT_SCRAPER_V4', colorClass: 'text-emerald-500', isItalic: true },
    claude: { title: '[02] CLAUDE_MIRROR_PXP', colorClass: 'text-purple-400', isItalic: false },
    gemini: { title: '[03] GEMINI_REST_PUBLIC', colorClass: 'text-blue-400', isItalic: false },
    openclaw: { title: '[04] OPENCLAW_LOCAL_LLAMA3', colorClass: 'text-orange-400', isItalic: false },
    blackbox: { title: '[05] BLACKBOX_CODE_SANDBOX', colorClass: 'text-pink-400', isItalic: false },
  };

  const renderEngineCard = (key: string, value: { text: string; latency: number; route: string; active: boolean }, isLarge: boolean = false) => {
    const isModelActive = value.active;
    const meta = quadrantMeta[key] || { title: key.toUpperCase(), colorClass: 'text-gray-400', isItalic: false };
    const isGated = false;

    if (isGated) {
      return (
        <div key={key} className="bg-[#0b0b0b]/80 border border-gray-900/40 p-5 flex flex-col justify-between relative overflow-hidden select-none h-full min-h-[220px]">
          <div className="flex items-center justify-between mb-2.5 shrink-0">
            <h3 className={`text-xs font-mono font-bold tracking-wider opacity-40 ${meta.colorClass}`}>
              {meta.title}
            </h3>
            <span className="text-[10px] bg-cyan-950/20 text-cyan-500 border border-cyan-900/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider text-[8px]">
              PRO
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2.5 p-4">
            <Lock className="w-5 h-5 text-cyan-500/80" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Channel Gated</h4>
              <p className="text-[10px] text-gray-500 leading-normal max-w-[180px] mx-auto mt-0.5">
                Activate Pro license to execute parallel prompts on this scraper engine.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-950/60 text-center shrink-0">
            <button
              onClick={onUpgradeClick}
              className="text-[10px] font-mono font-bold text-cyan-400 hover:underline uppercase"
            >
              Unlock Channel
            </button>
          </div>
        </div>
      );
    }

    const isSpeaking = speakingText === key;

    return (
      <div key={key} className="bg-[#0a0a0a] flex flex-col justify-between p-5 relative overflow-hidden select-text h-full">
        {/* Header section */}
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between mb-2.5 shrink-0 select-none">
            <h3 className={`text-xs font-mono font-bold tracking-wider ${meta.colorClass}`}>
              {meta.title}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSpeak(key, value.text)}
                className={`p-1 rounded hover:bg-gray-900 transition-colors ${
                  isSpeaking ? 'text-cyan-400' : 'text-gray-500 hover:text-white'
                }`}
                title={isSpeaking ? "Stop speech" : "Narrate with Natural TTS"}
              >
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-500" />
                )}
              </button>
              <span className="text-[9px] font-mono text-gray-600">
                {value.latency > 0 ? `latency: ${(value.latency / 1000).toFixed(1)}s` : key === 'openclaw' ? 'gpu_util: 84%' : 'standby'}
              </span>
            </div>
          </div>

          {/* Content text display block */}
          <div className={`text-[13px] text-gray-400 font-serif leading-relaxed overflow-y-auto select-text scrollbar-thin flex-1 pr-1 ${
            isLarge ? 'max-h-none text-[14px]' : 'max-h-[340px]'
          } ${meta.isItalic ? 'italic' : ''}`}>
            <p className="whitespace-pre-wrap leading-relaxed">
              {value.text}
            </p>
            {isModelActive && (
              <span className="inline-flex gap-1.5 ml-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce delay-75" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce delay-150" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce delay-300" />
              </span>
            )}
          </div>
        </div>

        {/* Lower boundary indicators */}
        <div className="mt-3 pt-2.5 border-t border-gray-900/60 flex items-center justify-between text-[9px] font-mono text-gray-600 shrink-0 select-none">
          <span className="truncate max-w-[220px]">{value.route}</span>
          <span className="text-emerald-600 underline uppercase font-bold tracking-wider text-[8px]">FREE_ROUTE</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#050505] text-gray-200 font-sans overflow-hidden" id="mega-chat-root">
      
      {/* Left Prompt Selection Workspace Panel */}
      <div className="w-full md:w-80 bg-[#0f0f0f] border-r border-gray-800 p-5 shrink-0 flex flex-col justify-between overflow-y-auto scrollbar-thin">
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-cyan-400" />
              Unified Mega-Chat
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Parallel 5-Engine Prompting workspace. Send one request to ChatGPT, Claude, Gemini, Blackbox AI, and OpenClaw simultaneously and audit results in real-time.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-4 space-y-3">
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block tracking-wider">
              Blueprint Prompt Templates
            </span>
            <div className="space-y-2">
              {templatePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(p.query)}
                  className="w-full p-3 rounded text-left bg-black/40 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/20 transition-all group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">{p.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal line-clamp-1">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lower Prompt Trigger Module */}
        <div className="border-t border-gray-800 pt-5 mt-5 space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-cyan-500">user@omniai:~$</span>
              <span className="text-[10px] font-mono text-gray-600">omniai --mega-chat --no-cost</span>
            </div>

            <div className="relative">
              <textarea
                placeholder={voiceModeEnabled ? "Mic on. Speak now..." : "Compose prompt to parallel dispatch..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                className="w-full bg-[#0d0d0d] border border-gray-800 rounded p-3 text-sm text-gray-300 focus:outline-none focus:border-cyan-700 resize-none font-sans"
              />
              {voiceModeEnabled && (
                <span className="absolute right-3.5 bottom-3.5 text-cyan-400 animate-pulse">
                  <Mic className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => triggerParallelPrompt(inputText)}
                disabled={isStreaming || !inputText.trim()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-mono text-xs font-bold py-2.5 px-3 rounded flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/20 active:translate-y-0.5 transition-all uppercase tracking-wider"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Execute
              </button>
              <button
                onClick={clearGrid}
                className="bg-[#151515] hover:bg-gray-800 text-gray-400 hover:text-white p-2.5 rounded border border-gray-700 transition-colors"
                title="Clear Grid"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side Multi-Engine Display Panel */}
      <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
        {/* Layout Control Bar */}
        <div className="h-12 border-b border-gray-800 bg-[#0c0c0c] flex items-center justify-between px-4 shrink-0 font-mono text-[11px] select-none">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 uppercase font-bold tracking-wider mr-1">Display Layout:</span>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                layoutMode === 'grid' 
                  ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/50' 
                  : 'bg-black text-gray-500 hover:text-gray-300 border border-gray-900/40'
              }`}
            >
              Grid View (All 5)
            </button>
            <button
              onClick={() => setLayoutMode('tabs')}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                layoutMode === 'tabs' 
                  ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/50' 
                  : 'bg-black text-gray-500 hover:text-gray-300 border border-gray-900/40'
              }`}
            >
              Focus Tabs (One-by-One)
            </button>
          </div>

          {/* Tab Selector when in 'tabs' layout mode */}
          {layoutMode === 'tabs' && (
            <div className="flex items-center gap-1 bg-black p-0.5 border border-gray-900 rounded-lg">
              {Object.keys(streams).map((key) => {
                const isSelected = selectedEngineTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedEngineTab(key)}
                    className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                      isSelected 
                        ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/40' 
                        : 'text-gray-500 hover:text-gray-400 hover:bg-gray-900/30'
                    }`}
                  >
                    {key === 'openclaw' ? 'Ollama' : key === 'chatgpt' ? 'ChatGPT' : key === 'claude' ? 'Claude' : key === 'blackbox' ? 'Blackbox' : 'Gemini'}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quadrants Content Container */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[#050505]">
          {layoutMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-gray-800 h-full">
              {Object.entries(streams).map(([key, val]) => renderEngineCard(key, val as any))}
            </div>
          ) : (
            <div className="h-full p-6 flex flex-col justify-center items-center">
              <div className="w-full max-w-4xl h-full bg-[#0a0a0a] border border-gray-800 rounded-xl flex flex-col justify-between p-6 overflow-hidden">
                {renderEngineCard(selectedEngineTab, streams[selectedEngineTab] as any, true)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
