import React, { useState } from 'react';
import { monorepoFiles } from '../data/monorepoFiles';
import { MonorepoFile } from '../types';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  Copy, 
  Check, 
  Terminal, 
  Search,
  BookOpen,
  ArrowRight,
  Download
} from 'lucide-react';

export default function BlueprintExplorer() {
  const [selectedFile, setSelectedFile] = useState<MonorepoFile>(monorepoFiles[0]);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'packages': true,
    'packages/engine': true,
    'packages/engine/src': true,
    'packages/engine/src/providers': true,
    'packages/core': true,
    'packages/core/src': true,
    'apps': true,
    'apps/cli': true,
    'apps/cli/src': true,
    'apps/desktop': true,
    'apps/desktop/src-tauri': true,
    'apps/desktop/src-tauri/src': true,
    'apps/mobile': true,
  });

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFiles = monorepoFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    file.path.toLowerCase().includes(searchTerm.toLowerCase()) || 
    file.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // High-fidelity directory tree definitions matching the architecture
  const treeNodes = [
    {
      id: 'packages',
      name: 'packages',
      type: 'folder',
      children: [
        {
          id: 'packages/engine',
          name: 'engine',
          type: 'folder',
          children: [
            {
              id: 'packages/engine/src',
              name: 'src',
              type: 'folder',
              children: [
                { id: 'packages/engine/src/Router.ts', name: 'Router.ts', type: 'file' },
                {
                  id: 'packages/engine/src/providers',
                  name: 'providers',
                  type: 'folder',
                  children: [
                    { id: 'packages/engine/src/providers/ChatGPTProvider.ts', name: 'ChatGPTProvider.ts', type: 'file' },
                    { id: 'packages/engine/src/providers/ClaudeProvider.ts', name: 'ClaudeProvider.ts', type: 'file' },
                    { id: 'packages/engine/src/providers/GeminiProvider.ts', name: 'GeminiProvider.ts', type: 'file' },
                    { id: 'packages/engine/src/providers/OpenClawProvider.ts', name: 'OpenClawProvider.ts', type: 'file' },
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'packages/core',
          name: 'core',
          type: 'folder',
          children: [
            {
              id: 'packages/core/src',
              name: 'src',
              type: 'folder',
              children: [
                { id: 'packages/core/src/db.ts', name: 'db.ts', type: 'file' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'apps',
      name: 'apps',
      type: 'folder',
      children: [
        {
          id: 'apps/cli',
          name: 'cli',
          type: 'folder',
          children: [
            { id: 'apps/cli/package.json', name: 'package.json', type: 'file' },
            {
              id: 'apps/cli/src',
              name: 'src',
              type: 'folder',
              children: [
                { id: 'apps/cli/src/index.ts', name: 'index.ts', type: 'file' }
              ]
            }
          ]
        },
        {
          id: 'apps/desktop',
          name: 'desktop',
          type: 'folder',
          children: [
            {
              id: 'apps/desktop/src-tauri',
              name: 'src-tauri',
              type: 'folder',
              children: [
                { id: 'apps/desktop/src-tauri/tauri.conf.json', name: 'tauri.conf.json', type: 'file' },
                {
                  id: 'apps/desktop/src-tauri/src',
                  name: 'src',
                  type: 'folder',
                  children: [
                    { id: 'apps/desktop/src-tauri/src/main.rs', name: 'main.rs', type: 'file' }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'apps/mobile',
          name: 'mobile',
          type: 'folder',
          children: [
            { id: 'apps/mobile/capacitor.config.ts', name: 'capacitor.config.ts', type: 'file' }
          ]
        }
      ]
    }
  ];

  const renderTree = (nodes: any[], depth = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === 'folder';
      const isExpanded = expandedFolders[node.id];
      const hasSelectedChild = selectedFile.path.startsWith(node.id);
      
      if (isFolder) {
        return (
          <div key={node.id} className="select-none">
            <button
              onClick={() => toggleFolder(node.id)}
              className={`w-full flex items-center gap-2 py-1.5 px-2 hover:bg-gray-800/30 rounded text-left transition-colors font-mono text-xs ${
                hasSelectedChild ? 'text-cyan-400 font-semibold' : 'text-gray-400'
              }`}
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-cyan-600 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </button>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      } else {
        const fileData = monorepoFiles.find(f => f.path === node.id);
        const isCurrent = selectedFile.path === node.id;
        if (!fileData) return null;

        return (
          <button
            key={node.id}
            onClick={() => setSelectedFile(fileData)}
            className={`w-full flex items-center gap-2 py-1.5 px-2 hover:bg-[#151515] rounded text-left transition-colors font-mono text-xs ${
              isCurrent 
                ? 'bg-[#151515] border border-gray-750 text-cyan-400 font-semibold' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            <FileCode className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-cyan-400' : 'text-gray-600'}`} />
            <span className="truncate">{node.name}</span>
          </button>
        );
      }
    });
  };

  const getPlatformSummary = (path: string) => {
    if (path.startsWith('apps/desktop')) {
      return {
        platform: 'DESKTOP APP (TAURI + RUST)',
        buildDesc: 'Tauri bindings bridge the React frontend with a native Rust backend wrapper. This allows raw HTTP operations bypassing browser CORS limits, cookie harvesting, and secure OS credential storage storage.',
        commands: [
          '# Install Tauri CLI globally',
          'npm install -g @tauri-apps/cli',
          '# Boot the development client with hot reload',
          'npm run tauri dev',
          '# Package into a self-contained, lightweight executable',
          'npm run tauri build'
        ]
      };
    } else if (path.startsWith('apps/mobile')) {
      return {
        platform: 'MOBILE APP (CAPACITOR / REACT NATIVE)',
        buildDesc: 'Capacitor wraps our responsive React layout within an optimized iOS/Android webview. Custom secure storage plugins securely lock down session cookies inside iOS Keychain / Android Keystore.',
        commands: [
          '# Add Android and iOS support layers',
          'npx cap add android',
          'npx cap add ios',
          '# Sync code assets directly to native containers',
          'npx cap sync',
          '# Compile and run on active phone or simulator',
          'npx cap open android'
        ]
      };
    } else if (path.startsWith('apps/cli')) {
      return {
        platform: 'CLI TERMINAL TOOL (NODE.JS)',
        buildDesc: 'A lightweight Node.js executable featuring Commander and Inquirer libraries. It loads the exact same shared free-provider routing engine and outputs response chunks directly to stdout for immediate streaming.',
        commands: [
          '# Compile TypeScript source trees',
          'npm run build',
          '# Link CLI binary globally to terminal space',
          'npm link',
          '# Run immediately from anywhere',
          'omniai "How does fault-tolerant free routing work?"'
        ]
      };
    } else {
      return {
        platform: 'SHARED CORE ROUTING ENGINE',
        buildDesc: 'The shared engine logic that isolates model implementations. It exposes standard async-generator stream utilities, handles API rotations, checks free proxy diagnostic metrics, and manages local SQLite history wrappers.',
        commands: [
          '# Run engine-specific unit tests',
          'npm run test:engine',
          '# Measure proxy failover latency budgets',
          'npm run test:proxies'
        ]
      };
    }
  };

  const spec = getPlatformSummary(selectedFile.path);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-gray-200" id="blueprint-explorer-root">
      {/* Search Header Banner */}
      <div className="p-4 bg-[#0f0f0f] border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Monorepo Platform Blueprint
          </h2>
          <p className="text-xs text-gray-400">
            Explore the exact architecture, config files, Rust bridges, and routing scripts powering the desktop, mobile, and CLI runtimes.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search files or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-gray-800 rounded pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
          />
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Explorer Bar */}
        <div className="w-72 bg-[#0f0f0f] border-r border-gray-800 flex flex-col overflow-y-auto p-3 shrink-0 scrollbar-thin">
          <div className="text-[10px] font-mono font-bold tracking-wider text-gray-500 mb-3 uppercase px-2">
            Workspace Directory
          </div>
          <div className="space-y-1">
            {searchTerm.length > 0 ? (
              filteredFiles.length > 0 ? (
                filteredFiles.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-center gap-2 py-2 px-3 rounded text-left font-mono text-xs ${
                      selectedFile.path === file.path ? 'bg-[#151515] border border-gray-750 text-cyan-400 font-semibold' : 'text-gray-500 hover:text-gray-300 hover:bg-[#151515]/30'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <p className="truncate text-white text-[11px] font-semibold">{file.name}</p>
                      <p className="truncate text-gray-500 text-[9px]">{file.path}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-gray-500 font-mono">
                  No files matched query.
                </div>
              )
            ) : (
              renderTree(treeNodes)
            )}
          </div>
        </div>

        {/* Middle Code Pane & Platform Details split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Code View Editor */}
          <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden border-r border-gray-800">
            {/* Editor tab heading bar */}
            <div className="bg-[#0f0f0f] border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs font-mono font-bold text-gray-200">{selectedFile.name}</span>
                  <span className="text-[10px] font-mono text-gray-500 ml-3">/{selectedFile.path}</span>
                </div>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151515] border border-gray-750 hover:bg-gray-800 text-gray-300 hover:text-white rounded text-[10px] font-semibold transition-colors font-mono"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY CODE</span>
                  </>
                )}
              </button>
            </div>

            {/* Code lines list area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed select-text scrollbar-thin bg-[#080808]">
              <pre className="text-gray-350">
                <code>
                  {selectedFile.content.split('\n').map((line, idx) => (
                    <div key={idx} className="flex hover:bg-gray-900/30 py-0.5 rounded px-1 group">
                      <span className="w-10 text-gray-600 select-none text-right pr-4 text-[10px]">{idx + 1}</span>
                      <span className="text-gray-200 whitespace-pre-wrap">{line || ' '}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>

          {/* Right Platform Action Drawer (CLI commands and summaries) */}
          <div className="w-full md:w-80 bg-[#0f0f0f] overflow-y-auto p-5 space-y-6 shrink-0 scrollbar-thin">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono bg-cyan-900/20 text-cyan-400 border border-cyan-800/30 px-2 py-0.5 rounded font-semibold uppercase">
                TARGET LAYER
              </span>
              <h3 className="text-xs font-bold text-white tracking-wide">{spec.platform}</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans pt-1">
                {spec.buildDesc}
              </p>
            </div>

            <div className="border-t border-gray-800 pt-5 space-y-3">
              <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                Build & Launch Instructions
              </h4>
              <div className="bg-black/40 p-3.5 rounded border border-gray-800 space-y-2.5 font-mono text-[10px]">
                {spec.commands.map((cmd, i) => (
                  <div key={i} className={cmd.startsWith('#') ? 'text-gray-500 italic' : 'text-cyan-400'}>
                    {cmd}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-5 space-y-4 font-sans">
              <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Cross-Platform Compilation Notes
              </h4>
              <div className="space-y-3 text-xs leading-relaxed text-gray-400">
                <div className="flex gap-2.5">
                  <ArrowRight className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-gray-300">Zero CORS Overhead:</strong> The Tauri Rust module handles native socket networking, avoiding browser CORS blockades.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <ArrowRight className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-gray-300">Local DB Parity:</strong> SQLite acts as a unified persistence driver across CLI (via better-sqlite3) and Tauri, maintaining strict history sync.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
