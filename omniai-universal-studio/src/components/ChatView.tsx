import React, { useState, useRef, useEffect } from 'react';
import { 
  Cpu, 
  Send, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Terminal, 
  Settings2,
  Trash2,
  Mic,
  Info,
  Radio,
  CheckCircle,
  Clock,
  Lock
} from 'lucide-react';
import { EngineType, Message, ChatSession } from '../types';

interface ChatViewProps {
  engine: Exclude<EngineType, 'unified'>;
  setEngine: (eng: Exclude<EngineType, 'unified'>) => void;
  voiceModeEnabled: boolean;
  transcriptInput: string;
  setTranscriptInput: (val: string) => void;
  onNewBotMessage: (text: string) => void;
  subscribed: boolean;
  onUpgradeClick: () => void;
  onAddTokens?: (engine: Exclude<EngineType, 'unified'>, prompt: string, response: string) => void;
}

export default function ChatView({ 
  engine, 
  setEngine, 
  voiceModeEnabled, 
  transcriptInput,
  setTranscriptInput,
  onNewBotMessage,
  subscribed,
  onUpgradeClick,
  onAddTokens
}: ChatViewProps) {
  const [showConfig, setShowConfig] = useState(true);
  const [cookieInput, setCookieInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [localUrlInput, setLocalUrlInput] = useState('http://localhost:11434');
  const [showSensitive, setShowSensitive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Maintain localized persistent state inside chat history list
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({
    chatgpt: { id: 's-cg', engine: 'chatgpt', title: 'ChatGPT free workspace', messages: [
      { id: 'm-1', sender: 'system', content: 'Connected to ChatGPT Free-Tier Engine. Active Route: DuckDuckGo Anoymous Proxy Mirror. Paste session cookies to enable direct ChatGPT Web Scraper mode.', timestamp: '10:00 AM' }
    ], createdAt: '10:00 AM' },
    claude: { id: 's-cl', engine: 'claude', title: 'Claude free workspace', messages: [
      { id: 'm-2', sender: 'system', content: 'Connected to Claude Space Engine. Active Route: Hugging Face Qwen 2.5 Sonnet Space. Paste organization cookies to enable Direct Claude.ai headless scraping.', timestamp: '10:01 AM' }
    ], createdAt: '10:01 AM' },
    gemini: { id: 's-ge', engine: 'gemini', title: 'Gemini free workspace', messages: [
      { id: 'm-3', sender: 'system', content: 'Connected to Google Gemini Developer API. Active Route: Google Developer Free Rate-Limit Tier. Exposes 15 requests per minute with zero billing requisites.', timestamp: '10:02 AM' }
    ], createdAt: '10:02 AM' },
    openclaw: { id: 's-op', engine: 'openclaw', title: 'Ollama local workspace', messages: [
      { id: 'm-4', sender: 'system', content: 'Connected to local offline LLM orchestrator (OpenClaw / Ollama). Requires local Ollama running on your workstation. Active Route: Localhost Socket Bridge.', timestamp: '10:03 AM' }
    ], createdAt: '10:03 AM' },
    blackbox: { id: 's-bb', engine: 'blackbox', title: 'Blackbox AI free workspace', messages: [
      { id: 'm-5', sender: 'system', content: 'Connected to Blackbox AI Engine. Active Route: Multi-language Code Search & Sandbox. Exposes automated autocomplete triggers with zero token constraints.', timestamp: '10:04 AM' }
    ], createdAt: '10:04 AM' },
    auto: { id: 's-au', engine: 'auto', title: 'Auto-Select Failover Router', messages: [
      { id: 'm-6', sender: 'system', content: 'Connected to intelligent Auto-Route Engine. The router dynamically analyzes input length, current model availability, and provider latencies to instantly forward your prompt to the highest-performing active pipeline.', timestamp: '10:05 AM' }
    ], createdAt: '10:05 AM' },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, engine]);

  // Handle voice transcript dictations
  useEffect(() => {
    if (transcriptInput) {
      setInputText(transcriptInput);
      setTranscriptInput('');
    }
  }, [transcriptInput]);

  const activeSession = sessions[engine];

  const clearHistory = () => {
    setSessions(prev => ({
      ...prev,
      [engine]: {
        ...prev[engine],
        messages: [{
          id: crypto.randomUUID(),
          sender: 'system',
          content: `Chat session refreshed. Active Engine: ${engine.toUpperCase()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]
      }
    }));
  };

  const getActiveRouteDesc = () => {
    switch (engine) {
      case 'chatgpt':
        return cookieInput 
          ? 'Route: Headless Browser Scraping Session (__Secure-next-auth.session-token)' 
          : 'Route: Free Mirror Proxy (DuckDuckGo IA Proxy Wrapper)';
      case 'claude':
        return cookieInput 
          ? 'Route: Organization Scraper Session (claude.ai cookies)' 
          : 'Route: Hugging Face Serverless space (Qwen 72B Sonnet equivalent)';
      case 'gemini':
        return apiKeyInput 
          ? 'Route: Custom Free Gemini API Token' 
          : 'Route: Default Google Generative Language Free Key (15 Requests/Min)';
      case 'openclaw':
        return `Route: Local Offline Port socket (${localUrlInput})`;
      case 'blackbox':
        return cookieInput 
          ? 'Route: Headless Autocomplete Session (blackbox.ai session cookies)' 
          : 'Route: Shared Free API Agent (Real-time Multi-language Code Search)';
      case 'auto':
        return 'Route: Intelligent Auto-Select Router (Token Availability & Latency Routing Mode)';
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update session state immediately
    setSessions(prev => ({
      ...prev,
      [engine]: {
        ...prev[engine],
        messages: [...prev[engine].messages, userMessage]
      }
    }));

    setInputText('');
    setIsStreaming(true);

    // Smart Router Decision logic if engine is 'auto'
    let targetEngine: Exclude<EngineType, 'unified' | 'auto'> = 'gemini';
    let routeReason = '';

    if (engine === 'auto') {
      if (!subscribed) {
        if (text.toLowerCase().includes('local') || text.toLowerCase().includes('offline')) {
          targetEngine = 'openclaw';
          routeReason = 'Offline/Local request pattern detected. Routing to local Ollama Node (GPU Util: 84%).';
        } else {
          targetEngine = 'gemini';
          routeReason = 'Standard pipeline request. Routing to lowest-latency free Google Gemini node (Latency: 380ms).';
        }
      } else {
        if (text.toLowerCase().includes('code') || text.toLowerCase().includes('function') || text.toLowerCase().includes('class')) {
          targetEngine = 'blackbox';
          routeReason = 'Code architecture pattern matched. Directed to Blackbox AI Code Sandbox (Latency: 490ms, 99.1% uptime).';
        } else if (text.length > 80 || text.toLowerCase().includes('blueprint') || text.toLowerCase().includes('architect')) {
          targetEngine = 'claude';
          routeReason = 'High-complexity structural prompt detected. Routed to Anthropic Claude unthrottled mirror (Latency: 820ms, 97.4% uptime).';
        } else if (text.toLowerCase().includes('local') || text.toLowerCase().includes('offline') || text.toLowerCase().includes('ollama')) {
          targetEngine = 'openclaw';
          routeReason = 'Local socket pattern detected. Routed to offline OpenClaw node (No internet dependency, 100% SLA).';
        } else if (text.length < 30) {
          targetEngine = 'gemini';
          routeReason = 'Short-form rapid query detected. Routed to high-availability Google Gemini (Latency: 340ms, 99.9% uptime).';
        } else {
          targetEngine = 'chatgpt';
          routeReason = 'General conversational query. Routed to ChatGPT unauthenticated IA proxy (Latency: 650ms, 98.2% uptime).';
        }
      }

      // Inject System Routing Alert Message
      const routingSystemMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'system',
        content: `🚦 ROUTER ROUTING DECISION:\n• Selected Target: ${targetEngine.toUpperCase()}\n• Reason: ${routeReason}\n⚡ Token Availability: 100% | Health status: ONLINE`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSessions(prev => ({
        ...prev,
        auto: {
          ...prev.auto,
          messages: [...prev.auto.messages, routingSystemMessage]
        }
      }));
    } else {
      targetEngine = engine;
    }

    // Stream bot response chunks
    let accumulatedText = '';
    const botMessageId = crypto.randomUUID();

    const botStreamMessage: Message = {
      id: botMessageId,
      sender: 'assistant',
      content: 'Thinking...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engine: engine === 'auto' ? targetEngine : undefined,
      isStreaming: true
    };

    setSessions(prev => ({
      ...prev,
      [engine]: {
        ...prev[engine],
        messages: [...prev[engine].messages, botStreamMessage]
      }
    }));

    // Trigger local SQLite simulation write logs
    const mockResponses: Record<Exclude<EngineType, 'unified' | 'auto'>, string[]> = {
      chatgpt: [
        "Hello from ChatGPT free scraping engine! I am fully functional via the unauthenticated IA proxy mirror. Since no premium API key is set, your wallet remains untouched.",
        "That's a great question! On the free tier, we maintain state inside your localized SQLite instance. If you configure ChatGPT session cookies, we can pull your real chat histories in real-time."
      ],
      claude: [
        "Welcome! I am running via the Claude space mirror. If you notice latency, that is due to queue rotations on free Hugging Face spaces.",
        "I can help with code snippets, blueprints, or system layouts. No API charges are ever incurred here."
      ],
      gemini: [
        "Greetings! I am connected to Google Gemini 2.5 Flash via our direct developer tier. Since Gemini supports a robust free package, this is our lowest latency route.",
        "Your request is processed on Google's free developer channel. Uptime is currently 99.8% with zero billing gates."
      ],
      openclaw: [
        "Offline Ollama engine reporting! Since I run 100% on your local GPU/CPU hardware, I can bypass internet interruptions entirely.",
        "Running local weights is the ultimate automated fault tolerance layer. If remote reverse proxies are blocked, I take over seamlessly."
      ],
      blackbox: [
        "Greetings from Blackbox AI! I am optimized for unconstrained rapid code execution and developer-specific contextual autocomplete searches.",
        "Blackbox AI unifies multi-language prompt completions. Paste your session cookies above to map directory paths in real-time."
      ]
    };

    const phrases = mockResponses[targetEngine];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    // Simulate word by word streaming response
    const words = phrase.split(' ');
    let wordIdx = 0;

    const interval = setInterval(() => {
      if (wordIdx < words.length) {
        accumulatedText += (wordIdx === 0 ? '' : ' ') + words[wordIdx];
        setSessions(prev => ({
          ...prev,
          [engine]: {
            ...prev[engine],
            messages: prev[engine].messages.map(m => 
              m.id === botMessageId ? { ...m, content: accumulatedText } : m
            )
          }
        }));
        wordIdx++;
      } else {
        clearInterval(interval);
        setSessions(prev => ({
          ...prev,
          [engine]: {
            ...prev[engine],
            messages: prev[engine].messages.map(m => 
              m.id === botMessageId ? { ...m, isStreaming: false } : m
            )
          }
        }));
        setIsStreaming(false);
        if (onAddTokens) {
          onAddTokens(targetEngine, text, accumulatedText);
        }
        onNewBotMessage(accumulatedText); // Triggers voice text to speech if enabled
      }
    }, 120);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-gray-200 font-sans" id="chatview-panel">
      {/* Upper Model Picker Header Bar */}
      <div className="p-4 bg-[#0f0f0f] border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#151515] border border-gray-800 text-cyan-400 rounded">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wide">{engine} Playground</span>
              <span className="text-[9px] font-mono text-green-400 bg-green-950/20 border border-green-900/30 px-1.5 py-0.5 rounded font-semibold uppercase">
                FREE ROUTE
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-500">{getActiveRouteDesc()}</p>
          </div>
        </div>

        {/* Picker Button Select */}
        <div className="flex items-center gap-2">
          {['chatgpt', 'claude', 'gemini', 'openclaw', 'blackbox', 'auto'].map((eng) => (
            <button
              key={eng}
              onClick={() => setEngine(eng as any)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold capitalize transition-all border ${
                engine === eng 
                  ? 'bg-[#1a1a1a] text-white border-gray-700' 
                  : 'bg-black/40 text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-800'
              }`}
            >
              {eng === 'openclaw' ? 'Offline Ollama' : eng === 'blackbox' ? 'Blackbox AI' : eng === 'auto' ? 'Auto-Select' : eng}
            </button>
          ))}
        </div>
      </div>

      {/* Config Credentials Accordion Panel */}
      <div className="border-b border-gray-800 shrink-0">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full px-5 py-3.5 bg-[#0f0f0f]/60 hover:bg-[#0f0f0f] flex items-center justify-between text-xs font-semibold text-gray-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-cyan-400" />
            <span>{engine.toUpperCase()} CREDENTIALS & AGENT SETTINGS</span>
          </div>
          {showConfig ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {showConfig && (
          <div className="p-5 bg-black/20 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-800/80">
            {/* Input fields */}
            <div className="space-y-4">
              {engine !== 'openclaw' && engine !== 'gemini' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase flex items-center justify-between">
                    <span>Web Scraper Session Cookie</span>
                    <button 
                      onClick={() => setShowSensitive(!showSensitive)} 
                      className="text-cyan-500 hover:underline flex items-center gap-1 normal-case text-[9px] font-sans font-normal"
                    >
                      {showSensitive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showSensitive ? 'Hide String' : 'Show Sensitive'}
                    </button>
                  </label>
                  <input
                    type={showSensitive ? 'text' : 'password'}
                    placeholder={`e.g. __Secure-next-auth.session-token=eyJhbGciOiJkaXIi...`}
                    value={cookieInput}
                    onChange={(e) => setCookieInput(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-gray-800 rounded p-2.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-700 font-mono"
                  />
                  <p className="text-[9px] text-gray-500 leading-normal">
                    Providing your login cookies forces the Tauri/CLI router to execute direct browser automation calls instead of shared mirrors, enabling absolute private prompts.
                  </p>
                </div>
              )}

              {engine === 'gemini' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block">Custom Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="Injected automatically from secrets. Paste override if desired."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-gray-800 rounded p-2.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-700 font-mono"
                  />
                </div>
              )}

              {engine === 'openclaw' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block">Localhost Ollama Endpoint Port</label>
                  <input
                    type="text"
                    value={localUrlInput}
                    onChange={(e) => setLocalUrlInput(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-gray-800 rounded p-2.5 text-xs text-gray-300 font-mono focus:outline-none focus:border-cyan-700"
                  />
                  <p className="text-[9px] text-gray-500 leading-normal">
                    Defaults to standard Ollama service path http://localhost:11434. Bypasses internet pipelines.
                  </p>
                </div>
              )}
            </div>

            {/* Instruction Guides */}
            <div className="p-4 bg-black/40 rounded border border-gray-800 space-y-3 font-sans">
              <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Cookie Harvesting Guide
              </h4>
              <ul className="space-y-2 text-[10px] text-gray-400 leading-normal">
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold shrink-0">1.</span>
                  <span>Open <strong className="text-gray-300">{engine === 'chatgpt' ? 'chatgpt.com' : engine === 'blackbox' ? 'blackbox.ai' : 'claude.ai'}</strong> on Google Chrome or Firefox.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold shrink-0">2.</span>
                  <span>Press <strong className="text-gray-300">F12</strong> (DevTools) {"→"} Go to <strong className="text-slate-300">Application</strong> {"→"} <strong className="text-slate-300">Cookies</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold shrink-0">3.</span>
                  <span>Copy the session cookie value and paste it into the field. Secure hardware storage handles encryption.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#050505]/60 scrollbar-thin">
        {activeSession.messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col max-w-[80%] ${
              msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            {/* Header info */}
            <div className="flex items-center gap-2 mb-1 px-1 text-[9px] font-mono text-gray-600 font-bold">
              <span>
                {msg.sender === 'user' 
                  ? 'YOU' 
                  : msg.sender === 'system' 
                  ? 'SYSTEM DIAGNOSTICS' 
                  : msg.engine 
                  ? `${engine.toUpperCase()} (${msg.engine.toUpperCase()})` 
                  : engine.toUpperCase()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div className={`p-4 rounded text-xs leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-cyan-900/20 border border-cyan-800 text-cyan-300 shadow-lg' 
                : msg.sender === 'system'
                ? 'bg-[#0f0f0f] border border-gray-800 text-gray-400 font-mono text-[10px]'
                : 'bg-[#0a0a0a] border border-gray-800 text-gray-300 leading-relaxed font-serif text-[13px]'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.isStreaming && (
                <span className="inline-flex gap-1.5 ml-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce delay-75" />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce delay-300" />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Lower Input Prompt Area */}
      <div className="p-4 bg-[#0f0f0f] border-t border-gray-800 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 font-bold px-1.5">
          <span>{getActiveRouteDesc()}</span>
          <button 
            onClick={clearHistory}
            className="flex items-center gap-1 text-gray-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Chat
          </button>
        </div>

        {(!subscribed && (engine === 'chatgpt' || engine === 'claude' || engine === 'blackbox')) ? (
          <div className="bg-[#0b0b0b] border border-cyan-950/40 p-5 rounded flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/20 border border-cyan-800/30 rounded text-cyan-400">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Premium Pipeline Gated</p>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Access to ChatGPT, Claude, and Blackbox AI unthrottled scraper sessions is locked under the Enterprise Pro tier. Please activate your license to run these pipelines.
                </p>
              </div>
            </div>
            <button
              onClick={onUpgradeClick}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-bold px-4 py-2 rounded uppercase tracking-wider transition-all whitespace-nowrap"
            >
              Upgrade License
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={voiceModeEnabled ? "Voice Dictation Active. Say something or type..." : `Prompt ${engine.toUpperCase()} free routing model...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage(inputText);
                }}
                className="w-full bg-[#0d0d0d] text-gray-200 border border-gray-800 rounded py-3 pl-4 pr-12 text-xs focus:outline-none focus:border-cyan-700 transition-all font-sans placeholder-gray-600"
              />
              {voiceModeEnabled && (
                <span className="absolute right-4 top-3.5 text-cyan-400 animate-pulse">
                  <Mic className="w-4 h-4" />
                </span>
              )}
            </div>
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={isStreaming || !inputText.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white p-3 rounded shadow-lg shadow-cyan-950/20 active:translate-y-0.5 transition-all"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
