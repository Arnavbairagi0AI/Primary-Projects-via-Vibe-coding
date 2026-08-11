/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Character, Conversation } from '../types';
import { 
  BarChart4, 
  ShieldCheck, 
  Activity, 
  Server, 
  Settings, 
  Terminal, 
  Layers, 
  Users 
} from 'lucide-react';

interface AdminPanelProps {
  characters: Character[];
  conversations: Conversation[];
  onBack: () => void;
}

export default function AdminPanel({
  characters,
  conversations,
  onBack
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'characters' | 'logs'>('metrics');

  const totalMockMessages = conversations.length * 12 + 10452;
  const popularCategory = 'Anime';
  
  const mockSystemLogs = [
    { id: 1, time: '10:14:28', type: 'INFO', msg: 'OmniCharacter AI container started on port 3000.' },
    { id: 2, time: '10:14:32', type: 'DEBUG', msg: 'Firebase client configured with DB: ai-studio-a8e08db2...' },
    { id: 3, time: '10:15:02', type: 'SUCCESS', msg: 'Gemini server client lazily initialized with local fallback.' },
    { id: 4, time: '10:18:37', type: 'INFO', msg: 'User session verified: shadowfall07042008@gmail.com.' },
    { id: 5, time: '10:19:12', type: 'WARN', msg: 'HMR disabled by platform constraint.' }
  ];

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart4 className="w-5 h-5 text-teal-400" />
            System Console & Diagnostics
          </h1>
          <p className="text-slate-500 text-xs">Real-time telemetry, model usage trackers, and sandbox logs</p>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button 
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'metrics' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Telemetry
          </button>
          <button 
            onClick={() => setActiveTab('characters')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'characters' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            AI Catalog
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'logs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Terminal Logs
          </button>
        </div>
      </div>

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Active Connections</span>
              <h4 className="text-xl font-extrabold text-white mt-1.5 font-mono">1 Node (Local)</h4>
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Model Inferences</span>
              <h4 className="text-xl font-extrabold text-white mt-1.5 font-mono">{totalMockMessages.toLocaleString()}</h4>
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Catalog Count</span>
              <h4 className="text-xl font-extrabold text-white mt-1.5 font-mono">{characters.length} characters</h4>
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Platform Ingress</span>
              <h4 className="text-xl font-extrabold text-teal-400 mt-1.5 font-mono">Port 3000</h4>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* System Performance Diagnostics */}
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                Service Health
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/40">
                  <span className="text-slate-400">Node Ingress Node</span>
                  <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 font-bold rounded-md">HEALTHY</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/40">
                  <span className="text-slate-400">Google Gemini API Connection</span>
                  <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 font-bold rounded-md">CONNECTED</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/40">
                  <span className="text-slate-400">Firebase Synchronization Layer</span>
                  <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 font-bold rounded-md">ONLINE</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Offline Memory Indexer</span>
                  <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 font-bold rounded-md">SYNCHRONIZED</span>
                </div>
              </div>
            </div>

            {/* AI Providers Overview */}
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Supported LLM Orchestrator
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
                  <p className="font-bold text-white">Google Gemini</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Primary Model: 2.5 Flash</p>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl opacity-75">
                  <p className="font-bold text-white">OpenAI GPT-4o</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Compatible proxy gateway</p>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl opacity-75">
                  <p className="font-bold text-white">Claude 3.5 Sonnet</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Custom endpoint allowed</p>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl opacity-75">
                  <p className="font-bold text-white">Local Ollama / LMStudio</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Ollama: port 11434</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'characters' && (
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Character</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Temp</th>
                  <th className="py-3 px-4">Safety</th>
                  <th className="py-3 px-4">Total Chats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {characters.map(char => (
                  <tr key={char.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img src={char.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                      <span className="font-bold text-white">{char.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{char.category}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold">{char.mode}</span></td>
                    <td className="py-3 px-4 font-mono">{char.temperature}</td>
                    <td className="py-3 px-4 uppercase font-bold text-[10px]">{char.safetyLevel}</td>
                    <td className="py-3 px-4 font-mono">{char.chatsCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6 font-mono text-xs text-slate-300 space-y-4">
          <div className="flex items-center gap-2 text-teal-400 font-bold border-b border-slate-800 pb-3">
            <Terminal className="w-4 h-4" />
            <span>Interactive Terminal logs: docker-run --sandbox-node-3000</span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {mockSystemLogs.map(log => (
              <div key={log.id} className="flex gap-4">
                <span className="text-slate-500">[{log.time}]</span>
                <span className={`font-bold ${
                  log.type === 'ERROR' ? 'text-red-500' :
                  log.type === 'WARN' ? 'text-yellow-500' :
                  log.type === 'SUCCESS' ? 'text-teal-400' : 'text-indigo-400'
                }`}>{log.type}</span>
                <span className="text-slate-300">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
