import React, { useState } from 'react';
import { 
  Radio, 
  Activity, 
  Settings, 
  RefreshCw, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Zap, 
  ShieldAlert,
  ServerCrash,
  Coins,
  Trash2,
  Sparkles
} from 'lucide-react';
import { ProxyRoute, TokenUsage } from '../types';

interface DiagnosticsProps {
  tokenUsage?: TokenUsage;
  setTokenUsage?: React.Dispatch<React.SetStateAction<TokenUsage>>;
}

const DEFAULT_TOKEN_USAGE: TokenUsage = {
  chatgpt: { input: 476480, output: 714720, sessionsCount: 1489 },
  claude: { input: 364900, output: 578500, sessionsCount: 890 },
  gemini: { input: 571760, output: 796380, sessionsCount: 2042 },
  openclaw: { input: 74160, output: 90640, sessionsCount: 412 },
  blackbox: { input: 38440, output: 53320, sessionsCount: 124 }
};

const COST_RATES = {
  chatgpt: { name: 'ChatGPT DDG Mirror', inRate: 0.0015, outRate: 0.0020, label: 'Bypassed OpenAI mini rates' },
  claude: { name: 'Claude Space Mirror', inRate: 0.0030, outRate: 0.0150, label: 'Bypassed Anthropic rates' },
  gemini: { name: 'Google Gemini REST', inRate: 0.00015, outRate: 0.0006, label: 'Google developer tier' },
  openclaw: { name: 'Ollama Local Host', inRate: 0.0005, outRate: 0.0015, label: 'Local Offline equivalents' },
  blackbox: { name: 'Blackbox API Agent', inRate: 0.0010, outRate: 0.0020, label: 'Developer Sandbox savings' },
};

export default function Diagnostics({ tokenUsage, setTokenUsage }: DiagnosticsProps) {
  const [testing, setTesting] = useState(false);
  const [strategy, setStrategy] = useState<'latency' | 'failover' | 'local_first'>('failover');
  
  // Custom router sequence config state
  const [sequence, setSequence] = useState<string[]>(['gemini', 'chatgpt', 'claude', 'openclaw']);

  const [routes, setRoutes] = useState<ProxyRoute[]>([
    {
      id: 'r-01',
      name: 'Google Gemini Free-Tier API',
      type: 'free_api',
      status: 'active',
      latency: 420,
      uptime: 99.8,
      requestsRotated: 2042,
      description: 'Official API developer key wrapping with native Google free rate-limits (up to 15 RPM).'
    },
    {
      id: 'r-02',
      name: 'ChatGPT DDG Reverse-Proxy Mirror',
      type: 'mirror',
      status: 'active',
      latency: 780,
      uptime: 94.6,
      requestsRotated: 1489,
      description: 'Public reverse-proxy endpoints maintaining anonymous user states and TLS signatures.'
    },
    {
      id: 'r-03',
      name: 'Claude Hugging Face Space Mirror',
      type: 'mirror',
      status: 'active',
      latency: 1150,
      uptime: 92.1,
      requestsRotated: 890,
      description: 'Edge spaces hosted on Hugging Face deploying serverless weights models with zero access token gates.'
    },
    {
      id: 'r-04',
      name: 'Local Ollama Offline Wrapper',
      type: 'local_claw',
      status: 'degraded',
      latency: 0,
      uptime: 100.0,
      requestsRotated: 412,
      description: 'Ollama framework socket on http://localhost:11434. Bypasses internet dependencies entirely.'
    }
  ]);

  const usage = tokenUsage || DEFAULT_TOKEN_USAGE;

  const calculateStats = () => {
    let totalInput = 0;
    let totalOutput = 0;
    let totalCostSaved = 0;
    let totalSessions = 0;

    Object.entries(usage).forEach(([key, val]) => {
      totalInput += val.input;
      totalOutput += val.output;
      totalSessions += val.sessionsCount;

      const rate = COST_RATES[key as keyof typeof COST_RATES];
      if (rate) {
        totalCostSaved += ((val.input * rate.inRate) + (val.output * rate.outRate)) / 1000;
      }
    });

    return {
      totalInput,
      totalOutput,
      totalCombined: totalInput + totalOutput,
      totalCostSaved,
      totalSessions,
      averageDensity: totalSessions > 0 ? Math.round((totalInput + totalOutput) / totalSessions) : 0
    };
  };

  const stats = calculateStats();

  const runDiagnosticsTest = () => {
    setTesting(true);
    
    // Simulate updating route states during health check
    setTimeout(() => {
      setRoutes(prev => prev.map(route => {
        if (route.type === 'local_claw') {
          return {
            ...route,
            status: 'active',
            latency: 48, // Now mock connected
          };
        }
        return {
          ...route,
          latency: Math.floor(route.latency * (0.8 + Math.random() * 0.4)),
        };
      }));
      setTesting(false);
    }, 2000);
  };

  const shiftSequence = (index: number, direction: 'up' | 'down') => {
    const nextSeq = [...sequence];
    if (direction === 'up' && index > 0) {
      const temp = nextSeq[index];
      nextSeq[index] = nextSeq[index - 1];
      nextSeq[index - 1] = temp;
    } else if (direction === 'down' && index < sequence.length - 1) {
      const temp = nextSeq[index];
      nextSeq[index] = nextSeq[index + 1];
      nextSeq[index + 1] = temp;
    }
    setSequence(nextSeq);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden" id="diagnostics-root">
      {/* Top Header Banner */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            Provider Diagnostics & Route Engine
          </h2>
          <p className="text-xs text-slate-400">
            Monitor real-time server latencies, adjust active retry sequences, and execute diagnostics on scraping mirror links.
          </p>
        </div>
        <button
          onClick={runDiagnosticsTest}
          disabled={testing}
          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-950/20 active:translate-y-0.5 transition-all shrink-0 ${
            testing ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'PINGING PROXIES...' : 'TEST PIPELINE METRICS'}
        </button>
      </div>

      {/* Main Workspace content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        
        {/* Core telemetry metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Average Failover Latency</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">584ms</span>
              <span className="text-[10px] text-emerald-400 font-bold font-mono">(-12.4%)</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none">Healthy response window</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Global Uptime Budget</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">99.1%</span>
              <span className="text-[10px] text-emerald-400 font-bold font-mono">OPTIMAL</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none">Based on 4 redundant slots</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Total Automated Rotations</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-indigo-400">{stats.totalSessions.toLocaleString()}</span>
              <span className="text-[10px] text-indigo-400 font-bold font-mono">+saved log</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none">Auto-failover operations triggered</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Active Scrape Sessions</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">2 / 3 OK</span>
              <span className="text-[10px] text-amber-400 font-bold font-mono">1 DEGRADED</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none">Session cookies active state</p>
          </div>
        </div>

        {/* Token Consumption & Cost Saved Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5" id="token-ledger-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
                Resource Consumption & Value Savings Dashboard
              </h3>
              <p className="text-xs text-slate-400">
                Calculated equivalents of tokens routed through public unauthenticated endpoints and developer slots.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  if (setTokenUsage) {
                    setTokenUsage(prev => {
                      const engines: (keyof TokenUsage)[] = ['chatgpt', 'claude', 'gemini', 'openclaw', 'blackbox'];
                      const randomEngine = engines[Math.floor(Math.random() * engines.length)];
                      const inputInc = Math.floor(250 + Math.random() * 500);
                      const outputInc = Math.floor(400 + Math.random() * 1000);
                      const updated = {
                        ...prev,
                        [randomEngine]: {
                          input: prev[randomEngine].input + inputInc,
                          output: prev[randomEngine].output + outputInc,
                          sessionsCount: prev[randomEngine].sessionsCount + 1
                        }
                      };
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('omniai_token_usage', JSON.stringify(updated));
                      }
                      return updated;
                    });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-cyan-400 hover:text-cyan-300 border border-slate-800 rounded text-[10px] font-mono font-bold uppercase transition-all"
                title="Simulate random input/output payload trigger to watch metrics increment"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                SIMULATE ROUTE TRAFFIC
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to reset the token ledger records back to zero?")) {
                    const resetStats: TokenUsage = {
                      chatgpt: { input: 0, output: 0, sessionsCount: 0 },
                      claude: { input: 0, output: 0, sessionsCount: 0 },
                      gemini: { input: 0, output: 0, sessionsCount: 0 },
                      openclaw: { input: 0, output: 0, sessionsCount: 0 },
                      blackbox: { input: 0, output: 0, sessionsCount: 0 }
                    };
                    if (setTokenUsage) {
                      setTokenUsage(resetStats);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('omniai_token_usage', JSON.stringify(resetStats));
                      }
                    }
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-red-950/30 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-950/40 rounded text-[10px] font-mono font-bold uppercase transition-all"
                title="Clear tracking cache"
              >
                <Trash2 className="w-3.5 h-3.5" />
                RESET LEDGER
              </button>
            </div>
          </div>

          {/* Quick Stats Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Estimated Bypassed Tokens</span>
              <span className="text-lg font-bold font-mono text-white block">{stats.totalCombined.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block font-mono">
                In: {stats.totalInput.toLocaleString()} | Out: {stats.totalOutput.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Cumulative Bypassed Cost</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-amber-400 block">${stats.totalCostSaved.toFixed(3)}</span>
                <span className="text-[9px] text-green-400 font-mono font-bold uppercase block">SAVED</span>
              </div>
              <span className="text-[10px] text-slate-500 block leading-none">Bypassing official fee thresholds</span>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Engine Sessions Run</span>
              <span className="text-lg font-bold font-mono text-indigo-400 block">{stats.totalSessions.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block leading-none">Logged queries count</span>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Payload Mean Density</span>
              <span className="text-lg font-bold font-mono text-emerald-400 block">{stats.averageDensity.toLocaleString()} <span className="text-xs text-slate-600">t/req</span></span>
              <span className="text-[10px] text-slate-400 block leading-none">Average payload per trigger</span>
            </div>
          </div>

          {/* Individual progress-bar grids */}
          <div className="space-y-3 pt-2">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block tracking-wider">Per-Model Routed Proportions</span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(usage).map(([key, val]) => {
                const config = COST_RATES[key as keyof typeof COST_RATES];
                if (!config) return null;
                const total = val.input + val.output;
                const cost = ((val.input * config.inRate) + (val.output * config.outRate)) / 1000;
                
                // percentage split
                const inputPct = total > 0 ? (val.input / total) * 100 : 0;
                const outputPct = total > 0 ? (val.output / total) * 100 : 0;

                return (
                  <div key={key} className="p-3 bg-slate-950 rounded-lg border border-slate-850/80 flex flex-col justify-between space-y-3.5">
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <h4 className="text-xs font-bold text-white capitalize flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            key === 'chatgpt' ? 'bg-emerald-400' :
                            key === 'claude' ? 'bg-purple-400' :
                            key === 'gemini' ? 'bg-blue-400' :
                            key === 'openclaw' ? 'bg-orange-400' : 'bg-pink-400'
                          }`} />
                          {config.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-none">{config.label}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-mono text-amber-400 block">${cost.toFixed(4)}</span>
                        <p className="text-[8px] text-slate-500 font-mono uppercase tracking-wider leading-none">saved</p>
                      </div>
                    </div>

                    {/* Progress visual split bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-900 rounded h-2 overflow-hidden flex">
                        {total > 0 ? (
                          <>
                            <div 
                              style={{ width: `${inputPct}%` }}
                              title={`Input: ${val.input.toLocaleString()} (${inputPct.toFixed(0)}%)`}
                              className="bg-indigo-500 h-full hover:opacity-85 transition-all cursor-help"
                            />
                            <div 
                              style={{ width: `${outputPct}%` }}
                              title={`Output: ${val.output.toLocaleString()} (${outputPct.toFixed(0)}%)`}
                              className="bg-cyan-500 h-full hover:opacity-85 transition-all cursor-help"
                            />
                          </>
                        ) : (
                          <div className="w-full bg-slate-900 h-full text-[8px] text-slate-600 flex items-center justify-center font-mono font-bold uppercase tracking-wider">No traffic routed</div>
                        )}
                      </div>

                      {/* Legend and specific values */}
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-indigo-500" />
                            In: <span className="text-slate-300 font-bold">{val.input.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-cyan-500" />
                            Out: <span className="text-slate-300 font-bold">{val.output.toLocaleString()}</span>
                          </span>
                        </div>
                        <div>
                          Total: <span className="text-slate-200 font-bold">{total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Rotations List and Priorities Drag split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 column endpoints list cards */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Active Route Targets
            </h3>

            <div className="space-y-3">
              {routes.map((route) => {
                // Map the rotated requests dynamically to match our token ledger sessions!
                const mapId = route.id === 'r-01' ? 'gemini' : route.id === 'r-02' ? 'chatgpt' : route.id === 'r-03' ? 'claude' : 'openclaw';
                const sessionCount = usage[mapId as keyof TokenUsage]?.sessionsCount || route.requestsRotated;

                return (
                  <div key={route.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          route.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                        }`} />
                        <h4 className="text-xs font-bold text-white">{route.name}</h4>
                        <span className="text-[9px] font-mono font-bold bg-slate-950 px-2 py-0.5 rounded text-slate-400 uppercase border border-slate-800">
                          {route.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans pr-10">
                        {route.description}
                      </p>
                    </div>

                    <div className="text-right space-y-1 shrink-0 font-mono">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">LATENCY</p>
                      <p className="text-xs font-bold text-cyan-400">
                        {route.latency === 0 ? 'CONNECTION REFUSED' : `${route.latency}ms`}
                      </p>
                      <p className="text-[10px] text-slate-500 pt-1">
                        UPTIME: <span className="text-slate-300 font-bold">{route.uptime}%</span>
                      </p>
                      <p className="text-[9px] text-slate-400">
                        QUERIES: <span className="text-indigo-400 font-bold">{sessionCount.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column sequence re-ordering module */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                Failover Prioritization
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Order the priority sequence. The engine rotates chronologically from top to bottom when an API call fails.
              </p>
            </div>

            {/* Sequence list elements */}
            <div className="space-y-2 font-mono text-xs">
              {sequence.map((item, idx) => {
                return (
                  <div key={item} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-850">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-950/40 w-5 h-5 rounded-full flex items-center justify-center border border-indigo-900/40">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white capitalize">{item === 'openclaw' ? 'Offline Ollama' : item}</p>
                        <p className="text-[9px] text-slate-500">
                          {idx === 0 ? 'Primary Active Gate' : `Tier ${idx + 1} Failback`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => shiftSequence(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-slate-900"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => shiftSequence(idx, 'down')}
                        disabled={idx === sequence.length - 1}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-slate-900"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2 font-sans">
              <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">
                Zero Cost Failover Protocol
              </span>
              <p className="text-[10px] text-slate-500 leading-normal">
                If the active route (e.g. Gemini Key) drops due to HTTP 429 Rate Limits, the router instantly switches tasks to ChatGPT/Claude mirrors without interrupting the active streaming container session!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
