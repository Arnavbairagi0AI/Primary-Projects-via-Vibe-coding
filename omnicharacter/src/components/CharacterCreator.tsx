/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Character } from '../types';
import { CATEGORIES } from '../initialData';
import { 
  ArrowLeft, 
  Save, 
  Sliders, 
  Info, 
  Sparkles, 
  HelpCircle, 
  Image as ImageIcon,
  ShieldCheck,
  Brain,
  MessageSquareCode
} from 'lucide-react';

interface CharacterCreatorProps {
  onBack: () => void;
  onSave: (char: Character) => void;
  activeUserId: string;
}

export default function CharacterCreator({
  onBack,
  onSave,
  activeUserId
}: CharacterCreatorProps) {
  // Simple fields
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [greeting, setGreeting] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800');
  const [category, setCategory] = useState('Anime');
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');

  // Personality fields
  const [personality, setPersonality] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [scenario, setScenario] = useState('');
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [writingStyle, setWritingStyle] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [backstory, setBackstory] = useState('');
  const [memoryInstructions, setMemoryInstructions] = useState('');

  // Advanced configurations
  const [temperature, setTemperature] = useState(0.8);
  const [maxTokens, setMaxTokens] = useState(500);
  const [safetyLevel, setSafetyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [mode, setMode] = useState<Character['mode']>('Companion');
  const [reasoningMode, setReasoningMode] = useState(false);

  const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'advanced'>('basic');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  // Generate vector avatar inline
  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    try {
      const response = await fetch('/api/imagine-expression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterPrompt: `${name} ${subtitle}`, style: 'glassmorphism vector anime' })
      });
      const data = await response.json();
      if (data.url) {
        setAvatar(data.url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Character name is required!");
      return;
    }
    if (!greeting.trim()) {
      alert("A friendly greeting message is required so the chat can initiate!");
      return;
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const newChar: Character = {
      id: 'char_' + Date.now().toString(),
      name,
      subtitle: subtitle || 'AI Companion',
      description: description || 'No short description provided.',
      greeting,
      avatar,
      banner,
      category,
      tags: tags.length > 0 ? tags : [category, 'custom'],
      visibility,
      creatorId: activeUserId,
      creatorName: 'You (Creator)',
      
      personality: personality || `${name} is helpful and conversational.`,
      longDescription,
      systemPrompt: systemPrompt || `You are ${name}. Play this role dynamically.`,
      scenario,
      speakingStyle,
      writingStyle,
      age,
      occupation,
      backstory,
      memoryInstructions,
      
      temperature,
      topP: 0.9,
      topK: 40,
      frequencyPenalty: 0.2,
      presencePenalty: 0.2,
      maxTokens,
      contextWindow: 4096,
      reasoningMode,
      streaming: true,
      safetyLevel,
      memoryLength: 15,
      mode,
      
      likesCount: 0,
      chatsCount: 0,
      createdAt: new Date().toISOString()
    };

    onSave(newChar);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-extrabold text-white tracking-tight">Create AI Personality</h1>
            <p className="text-slate-500 text-xs">Design custom speaking styles, scenarios, memories, and limits</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-400 to-indigo-500 hover:opacity-90 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-teal-500/10"
        >
          <Save className="w-4 h-4" />
          Forge Character
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl max-w-md text-xs">
        <button 
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'basic' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          1. Core Info
        </button>
        <button 
          onClick={() => setActiveTab('personality')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'personality' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          2. Mind & Logic
        </button>
        <button 
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'advanced' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          3. Hyper-Params
        </button>
      </div>

      {/* BASIC TAB */}
      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5 bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Character Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Gojo, Seraphina" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Subtitle / Role</label>
                <input 
                  type="text" 
                  placeholder="e.g., Elven Sage, Principal Developer" 
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Short Summary</label>
              <input 
                type="text" 
                placeholder="A precise, one-sentence tagline summarizing their mission." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Opening Greeting Message *</label>
                <span className="text-[10px] text-slate-500">First line character speaks</span>
              </div>
              <textarea 
                rows={3}
                placeholder="*looks at you carefully and smiles* Welcome! Let us begin our path..." 
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white font-serif"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Visibility</label>
                <select 
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300"
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="private">Private (Only You)</option>
                  <option value="unlisted">Unlisted (Link Sharing)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Behavioral Mode</label>
                <select 
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300"
                >
                  <option value="Companion">Companion (Warm & Friend)</option>
                  <option value="Roleplay">Roleplay (High Detail Scenarios)</option>
                  <option value="Game Master">Game Master (D&D Campaigns)</option>
                  <option value="Tutor">Tutor (Educational Guidance)</option>
                  <option value="Therapist">Therapist (CBT Counselor)</option>
                  <option value="Coding Assistant">Coding Assistant (Code/Refactor)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tags / Traits</label>
              <input 
                type="text" 
                placeholder="comma separated values, e.g., smart, playful, sarcastic" 
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

          </div>

          {/* Visual Avatar sidebar card */}
          <div className="space-y-5 bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 self-start">Visual Design</h3>
            
            <div className="w-36 h-36 rounded-3xl overflow-hidden border border-slate-800 relative group shadow-xl">
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              {isGeneratingAvatar && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-xs text-teal-400 font-bold">
                  Drawing...
                </div>
              )}
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={handleGenerateAvatar}
                disabled={isGeneratingAvatar || !name}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  name 
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-teal-400' 
                    : 'bg-slate-950 border-slate-950 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Generate Vector Avatar
              </button>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Custom Image URL</label>
                <input 
                  type="text" 
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Banner Image URL</label>
                <input 
                  type="text" 
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl text-[11px] text-slate-500 leading-relaxed text-left">
              <span className="font-semibold text-slate-400 block mb-1">💡 Avatar Generation Tip</span>
              Write the Character Name first, then click "Generate" to construct a customized futuristic inline vector graphic!
            </div>
          </div>
        </div>
      )}

      {/* PERSONALITY TAB */}
      {activeTab === 'personality' && (
        <div className="space-y-5 bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Core personality parameters</label>
              <textarea 
                rows={4}
                placeholder="e.g., Sarcastic, incredibly fast thinker, loyal to friends, struggles with vulnerability." 
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">System Instructions / Prompt Builder</label>
              <textarea 
                rows={4}
                placeholder="Tell the underlying model exactly how to behave. (e.g. Always play the role of Marcus. Speak stoically and with humility.)" 
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Character Age</label>
              <input 
                type="text" 
                placeholder="e.g. 24, 400" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Occupation</label>
              <input 
                type="text" 
                placeholder="e.g. Space Architect, High Sorcerer" 
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Scenario</label>
              <input 
                type="text" 
                placeholder="e.g. The user walked into your ancient sanctum..." 
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Speaking style instructions</label>
              <input 
                type="text" 
                placeholder="e.g. Quiet, slightly technical, uses phrases like 'chrono-link'" 
                value={speakingStyle}
                onChange={(e) => setSpeakingStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Writing Style guidelines</label>
              <input 
                type="text" 
                placeholder="e.g. Highly descriptive, writes actions in asterisks." 
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Memory Instructions</label>
            <textarea 
              rows={3}
              placeholder="Guide how the character stores details: e.g. Always memorize user preference and state of relationship meter" 
              value={memoryInstructions}
              onChange={(e) => setMemoryInstructions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>
        </div>
      )}

      {/* ADVANCED TAB */}
      {activeTab === 'advanced' && (
        <div className="space-y-6 bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                Hyperparameter Sliders
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Creativity / Temperature</span>
                  <span className="text-teal-400 font-mono font-bold">{temperature}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.5" 
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 bg-slate-800 h-1.5 rounded-full"
                />
                <p className="text-[10px] text-slate-500">Lower means more precise and predictable; higher means creative and dramatic.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Maximum Output Tokens</span>
                  <span className="text-teal-400 font-mono font-bold">{maxTokens}</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="1000" 
                  step="50"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-teal-400 bg-slate-800 h-1.5 rounded-full"
                />
                <p className="text-[10px] text-slate-500">Controls maximum response length per message turn.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Safety & Advanced Reasoning
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Safety filter Level</label>
                <select 
                  value={safetyLevel}
                  onChange={(e) => setSafetyLevel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300"
                >
                  <option value="high">High (Strict moderation filters)</option>
                  <option value="medium">Medium (Standard community settings)</option>
                  <option value="low">Low (Unfiltered roleplay mode)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Gemini Pro Reasoning Mode</h4>
                  <p className="text-[10px] text-slate-500">Enable advanced multi-step thought planning for complex scenarios.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reasoningMode}
                    onChange={(e) => setReasoningMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
