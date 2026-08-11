import React, { useState } from 'react';
import { 
  Database, 
  Terminal, 
  Play, 
  Search, 
  HelpCircle, 
  RefreshCw,
  Server,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { DatabaseRow } from '../types';

export default function DatabaseMonitor() {
  const [activeTable, setActiveTable] = useState<'conversations' | 'transcripts' | 'credentials_cache' | 'routing_logs'>('routing_logs');
  const [customQuery, setCustomQuery] = useState('SELECT * FROM routing_logs ORDER BY timestamp DESC;');
  const [queryOutput, setQueryOutput] = useState<any[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initial rich database mock ledger matching SQLite structure
  const databaseRows: DatabaseRow[] = [
    {
      id: 'r-101',
      table: 'routing_logs',
      timestamp: '2026-07-02 10:14:12',
      data: {
        event_id: 12042,
        action: 'ROUTE_ATTEMPT',
        provider: 'chatgpt',
        status: 'FAILED',
        route_path: 'https://chatgpt.com/backend-api/conversation',
        failure_reason: '401 Unauthorized - Web Session Cookie Expired',
        failover_target: 'claude_huggingface_mirror'
      }
    },
    {
      id: 'r-102',
      table: 'routing_logs',
      timestamp: '2026-07-02 10:14:14',
      data: {
        event_id: 12043,
        action: 'FAILOVER_ROUTE',
        provider: 'claude',
        status: 'SUCCESS',
        route_path: 'https://huggingface.co/api/spaces/Qwen/Qwen2.5-72B-Instruct-demo/predict',
        latency_ms: 1840,
        failover_target: 'None'
      }
    },
    {
      id: 'r-103',
      table: 'routing_logs',
      timestamp: '2026-07-02 10:15:30',
      data: {
        event_id: 12044,
        action: 'ROUTE_ATTEMPT',
        provider: 'gemini',
        status: 'SUCCESS',
        route_path: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash',
        latency_ms: 480,
        failover_target: 'None'
      }
    },
    {
      id: 'r-104',
      table: 'routing_logs',
      timestamp: '2026-07-02 10:17:05',
      data: {
        event_id: 12045,
        action: 'ROUTE_ATTEMPT',
        provider: 'openclaw',
        status: 'DEGRADED',
        route_path: 'http://localhost:11434/api/generate',
        failure_reason: 'Connection Refused (Local Ollama daemon not running)',
        failover_target: 'gemini_free_tier'
      }
    },
    {
      id: 'c-01',
      table: 'conversations',
      timestamp: '2026-07-02 09:44:00',
      data: {
        id: 'conv-f0e2',
        engine: 'unified',
        title: 'Compare routing speed on 4 platforms',
        messages_count: 8,
        sync_status: 'SYNCED'
      }
    },
    {
      id: 'c-02',
      table: 'conversations',
      timestamp: '2026-07-02 10:11:15',
      data: {
        id: 'conv-aa83',
        engine: 'chatgpt',
        title: 'Bypass CORS strategies on Tauri Rust',
        messages_count: 4,
        sync_status: 'SYNCED'
      }
    },
    {
      id: 't-01',
      table: 'transcripts',
      timestamp: '2026-07-02 09:44:12',
      data: {
        id: 'tr-99',
        duration_sec: 14,
        spoken_text: 'Prompt all 4 engines on our automated zero API cost router',
        confidence_score: 0.98,
        engine: 'WebKitSpeechRecognition'
      }
    },
    {
      id: 'cr-01',
      table: 'credentials_cache',
      timestamp: '2026-07-01 18:22:00',
      data: {
        provider: 'chatgpt',
        store_type: 'SecureKeychainBridge',
        cookie_harvested: 'true',
        cookie_preview: '__Secure-next-auth.session-token=eyJhbGciOiJkaXIi...',
        status: 'EXPIRED'
      }
    },
    {
      id: 'cr-02',
      table: 'credentials_cache',
      timestamp: '2026-07-02 10:00:00',
      data: {
        provider: 'claude',
        store_type: 'SecureKeychainBridge',
        cookie_harvested: 'true',
        cookie_preview: 'intercom-session-id-9f2h8...; sessionKey=sk_claude_free...',
        status: 'ACTIVE'
      }
    }
  ];

  const runQuery = (queryText: string) => {
    const text = queryText.trim().toUpperCase();
    if (!text) return;

    if (text.includes('DELETE') || text.includes('DROP') || text.includes('UPDATE')) {
      setSuccessMsg('⚠️ DDL & Destructive operations are locked on this local simulation console.');
      return;
    }

    setSuccessMsg('⚡ Query Executed Successfully against Local SQLite SQLite3/Better-sqlite3 core.');

    // Custom filtering simulator depending on SQL prompt content
    let selectedTable: 'conversations' | 'transcripts' | 'credentials_cache' | 'routing_logs' = 'routing_logs';
    if (text.includes('CONVERSATION_LOGS') || text.includes('CONVERSATIONS')) selectedTable = 'conversations';
    else if (text.includes('TRANSCRIPTS')) selectedTable = 'transcripts';
    else if (text.includes('SESSION_CREDENTIALS') || text.includes('CREDENTIALS')) selectedTable = 'credentials_cache';
    else selectedTable = 'routing_logs';

    let result = databaseRows.filter(row => row.table === selectedTable);

    // If query filter exists (e.g. status = 'FAILED' or provider = 'chatgpt')
    if (text.includes("'FAILED'")) {
      result = result.filter(r => r.data.status === 'FAILED');
    } else if (text.includes("'CHATGPT'")) {
      result = result.filter(r => r.data.provider === 'chatgpt');
    }

    setQueryOutput(result.map(r => ({ id: r.id, timestamp: r.timestamp, ...r.data })));
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const activeTableRows = databaseRows.filter(row => row.table === activeTable && 
    (searchTerm === '' || JSON.stringify(row.data).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tablesMeta = [
    { id: 'routing_logs', name: 'routing_logs', rows: 4, desc: 'Failure sequence fallbacks and proxy latencies' },
    { id: 'conversations', name: 'conversation_logs', rows: 2, desc: 'Persistent chat index records' },
    { id: 'transcripts', name: 'voice_transcripts', rows: 1, desc: 'Local native voice input speech audits' },
    { id: 'credentials_cache', name: 'session_credentials', rows: 2, desc: 'Secure Keychain cookies & free developer tokens' },
  ];

  const getTableSchema = (table: string) => {
    switch(table) {
      case 'routing_logs':
        return ['event_id', 'action', 'provider', 'status', 'route_path', 'latency/reason'];
      case 'conversations':
        return ['id', 'engine', 'title', 'messages_count', 'sync_status'];
      case 'transcripts':
        return ['id', 'duration_sec', 'spoken_text', 'confidence_score', 'engine'];
      case 'credentials_cache':
        return ['provider', 'store_type', 'cookie_preview', 'status'];
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-gray-200" id="database-monitor-root">
      {/* Top Header Section */}
      <div className="p-4 bg-[#0f0f0f] border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Local SQL Ledger Monitor
          </h2>
          <p className="text-xs text-gray-400">
            Audit conversation metadata, decrypted scrape session cookies, and voice speech transcripts stored securely inside the host platform SQLite shell.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-green-400 bg-green-950/20 border border-green-900/30 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
            <Server className="w-3.5 h-3.5" />
            SQLITE CORE: ACTIVE
          </span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left tables selection panel */}
        <div className="w-72 bg-[#0f0f0f] border-r border-gray-800 flex flex-col p-4 shrink-0 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-mono font-bold text-gray-500 mb-3 tracking-wider uppercase">
            Database Tables Schema
          </div>
          <div className="space-y-2 flex-1">
            {tablesMeta.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTable(tab.id as any);
                  setQueryOutput(null);
                  setCustomQuery(`SELECT * FROM ${tab.name};`);
                }}
                className={`w-full p-3 rounded text-left border transition-all ${
                  activeTable === tab.id && queryOutput === null
                    ? 'bg-[#151515] border-gray-700 text-white shadow-cyan-950/10 shadow-lg' 
                    : 'bg-black/20 border-gray-850 text-gray-500 hover:border-gray-800 hover:text-gray-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono font-semibold">{tab.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-900/20 font-bold">
                    {tab.rows} Rows
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-normal">{tab.desc}</p>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-4 mt-4 space-y-2 text-xs text-gray-400">
            <span className="text-[10px] font-mono font-bold text-gray-500 block uppercase">
              SQL Engine Parity
            </span>
            <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
              The Desktop Tauri wrapper calls native SQLite3 databases. The mobile client hooks into localized phone Storage. Both engines expose synchronized APIs.
            </p>
          </div>
        </div>

        {/* Right Live Ledger Database Rows & Interactive Console split */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* SQL terminal editor console (Interactive) */}
          <div className="bg-[#0f0f0f] border-b border-gray-800 p-4 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 flex items-center gap-1.5 uppercase">
                <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                Interactive SQL Query CLI
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCustomQuery("SELECT * FROM routing_logs WHERE status = 'FAILED';")}
                  className="text-[9px] font-mono text-gray-400 hover:text-white bg-[#151515] hover:bg-gray-800 px-2 py-1 rounded border border-gray-800"
                >
                  Failures
                </button>
                <button
                  onClick={() => setCustomQuery("SELECT * FROM session_credentials;")}
                  className="text-[9px] font-mono text-gray-400 hover:text-white bg-[#151515] hover:bg-gray-800 px-2 py-1 rounded border border-gray-800"
                >
                  Cookies
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative font-mono text-xs">
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="w-full bg-[#0d0d0d] text-cyan-300 border border-gray-800 rounded py-2.5 px-3.5 font-bold focus:outline-none focus:border-cyan-700 transition-colors"
                />
              </div>
              <button
                onClick={() => runQuery(customQuery)}
                className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-xs font-bold px-4 rounded flex items-center gap-1.5 shadow-lg shadow-cyan-950/20 transition-all shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                EXECUTE
              </button>
            </div>

            {successMsg && (
              <div className="p-2.5 bg-[#0a0a0a] rounded border border-gray-850 flex items-center gap-2 text-[10px] font-mono text-green-400">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                {successMsg}
              </div>
            )}
          </div>

          {/* Table content view logs ledger */}
          <div className="flex-1 overflow-auto bg-[#050505] p-4 scrollbar-thin">
            {queryOutput !== null ? (
              // SQL custom query rendering output
              <div className="space-y-4">
                <div className="flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                    QUERY RESPONSE LEDGER ({queryOutput.length} RECORDS MATCHED)
                  </span>
                  <button 
                    onClick={() => setQueryOutput(null)}
                    className="text-[10px] font-mono text-gray-500 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Table View
                  </button>
                </div>

                {queryOutput.length > 0 ? (
                  <div className="overflow-x-auto rounded border border-gray-800 bg-[#080808]">
                    <table className="w-full text-left font-mono text-[11px] leading-relaxed border-collapse">
                      <thead>
                        <tr className="bg-[#0f0f0f] text-gray-400 border-b border-gray-800">
                          <th className="py-2.5 px-4 font-bold border-r border-gray-800/60">id</th>
                          <th className="py-2.5 px-4 font-bold border-r border-gray-800/60">timestamp</th>
                          <th className="py-2.5 px-4 font-bold">fields</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {queryOutput.map((row, idx) => (
                           <tr key={idx} className="hover:bg-gray-900/20">
                            <td className="py-2.5 px-4 text-cyan-400 font-bold border-r border-gray-800/60">{row.id}</td>
                            <td className="py-2.5 px-4 text-gray-500 border-r border-gray-800/60">{row.timestamp}</td>
                            <td className="py-2.5 px-4 text-gray-300">
                              <pre className="text-[10px] font-bold text-gray-300">
                                {JSON.stringify({ ...row, id: undefined, timestamp: undefined }, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 border border-dashed border-gray-800 text-center rounded text-xs text-gray-500 font-mono">
                    Zero rows returned.
                  </div>
                )}
              </div>
            ) : (
              // Default Table rows listing
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
                      TABLE LEDGER ROWS: {activeTable.toUpperCase()}
                    </span>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search active table ledger..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-gray-800 rounded pl-8 pr-3 py-1.5 text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-550 font-sans"
                    />
                  </div>
                </div>

                {activeTableRows.length > 0 ? (
                  <div className="overflow-x-auto rounded border border-gray-800 bg-[#080808]">
                    <table className="w-full text-left font-mono text-[10px] leading-relaxed border-collapse">
                      <thead>
                        <tr className="bg-[#0f0f0f] text-gray-400 border-b border-gray-800">
                          {getTableSchema(activeTable).map((col, i) => (
                            <th key={i} className="py-3 px-4 font-bold uppercase tracking-wider">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850 text-gray-300">
                        {activeTableRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-900/20">
                            {activeTable === 'routing_logs' && (
                              <>
                                <td className="py-3 px-4 font-bold text-gray-400">{row.data.event_id}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-1.5 py-0.5 rounded font-semibold text-[9px] ${
                                    row.data.action === 'ROUTE_ATTEMPT' ? 'bg-[#151515] border border-gray-800 text-gray-300' : 'bg-cyan-950/20 text-cyan-400 border border-cyan-900/20'
                                  }`}>
                                    {row.data.action}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-bold text-white capitalize">{row.data.provider}</td>
                                <td className="py-3 px-4">
                                  <span className={`flex items-center gap-1 text-[9px] font-bold ${
                                    row.data.status === 'SUCCESS' ? 'text-green-400' : row.data.status === 'DEGRADED' ? 'text-amber-400' : 'text-rose-400'
                                  }`}>
                                    {row.data.status === 'SUCCESS' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                    {row.data.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-400 truncate max-w-[120px]">{row.data.route_path}</td>
                                <td className="py-3 px-4 text-gray-200">
                                  {row.data.latency_ms ? `${row.data.latency_ms}ms` : <span className="text-rose-400 text-[9px] leading-normal">{row.data.failure_reason}</span>}
                                </td>
                              </>
                            )}

                            {activeTable === 'conversations' && (
                              <>
                                <td className="py-3 px-4 font-bold text-cyan-400">{row.data.id}</td>
                                <td className="py-3 px-4 font-semibold uppercase text-cyan-500">{row.data.engine}</td>
                                <td className="py-3 px-4 text-white font-medium">{row.data.title}</td>
                                <td className="py-3 px-4 text-gray-400 text-center font-bold">{row.data.messages_count}</td>
                                <td className="py-3 px-4 text-green-400 text-center font-bold font-sans text-[9px] bg-green-950/20 px-2 py-0.5 rounded border border-green-900/20">
                                  {row.data.sync_status}
                                </td>
                              </>
                            )}

                            {activeTable === 'transcripts' && (
                              <>
                                <td className="py-3 px-4 font-bold text-gray-400">{row.data.id}</td>
                                <td className="py-3 px-4 font-bold text-cyan-400">{row.data.duration_sec}s</td>
                                <td className="py-3 px-4 text-white leading-normal italic font-serif text-[12px]">"{row.data.spoken_text}"</td>
                                <td className="py-3 px-4 text-green-400 font-bold">{(row.data.confidence_score * 100).toFixed(0)}%</td>
                                <td className="py-3 px-4 text-gray-500 font-bold">{row.data.engine}</td>
                              </>
                            )}

                            {activeTable === 'credentials_cache' && (
                              <>
                                <td className="py-3 px-4 font-bold text-white capitalize">{row.data.provider}</td>
                                <td className="py-3 px-4 text-gray-400">{row.data.store_type}</td>
                                <td className="py-3 px-4 text-cyan-500 font-mono truncate max-w-[200px]">{row.data.cookie_preview}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                                    row.data.status === 'ACTIVE' ? 'bg-green-950/20 text-green-400 border border-green-900/20' : 'bg-rose-950/20 text-rose-400 border border-rose-900/20'
                                  }`}>
                                    {row.data.status}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-14 border border-dashed border-gray-800 text-center rounded text-xs text-gray-500 font-mono">
                    No records found matching query filter.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
