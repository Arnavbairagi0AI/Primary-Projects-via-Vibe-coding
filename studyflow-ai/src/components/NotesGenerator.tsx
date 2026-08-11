/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Note } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { useFeatureGuard } from './FeatureGuard';

interface NotesGeneratorProps {
  userProfile: UserProfile;
  notes: Note[];
  onAddNote: (note: Note) => void;
  onUpdatePlan?: (plan: 'free' | 'pro' | 'premium') => void;
  onIncrementUsage?: (key: 'aiChatsToday' | 'notesGeneratedThisMonth' | 'pdfSummariesGeneratedThisMonth' | 'quizGeneratedThisMonth' | 'flashcardsGeneratedThisMonth') => void;
}

export default function NotesGenerator({
  userProfile,
  notes,
  onAddNote,
  onUpdatePlan,
  onIncrementUsage
}: NotesGeneratorProps) {
  const { checkAccessAndRun, UpgradeDialog } = useFeatureGuard(userProfile, 'aiNotes', onUpdatePlan || (() => {}));

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [detailLevel, setDetailLevel] = useState<'short' | 'detailed'>('detailed');
  const [language, setLanguage] = useState<'en' | 'hi' | 'both'>('en');
  const [easyLanguage, setEasyLanguage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    checkAccessAndRun(async () => {
      setError('');
      setLoading(true);

      try {
        const response = await fetch('/api/generate-notes', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-uid': userProfile.uid
          },
          body: JSON.stringify({
            title,
            content,
            detailLevel,
            language: language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Both English and Hindi',
            easyLanguage
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate study notes from AI.');
        }

        const data = await response.json();
        if (onIncrementUsage) onIncrementUsage('notesGeneratedThisMonth');

        const newNote: Note = {
          id: 'note_' + Date.now(),
          userId: userProfile.uid,
          title: data.title || title,
          content: content,
          summary: data.summary || '',
          detailedNotes: data.detailedNotes || '',
          keyPoints: data.keyPoints || [],
          formulas: data.formulas || [],
          definitions: (data.definitions || []).map((d: any) => `${d.term}: ${d.definition}`),
          mindMapOutline: data.mindMapOutline || '',
          language: language,
          createdAt: new Date().toISOString()
        };

        // Save to Firestore
        try {
          await setDoc(doc(db, 'notes', newNote.id), newNote);
        } catch (fErr) {
          console.warn("Firestore save skip:", fErr);
        }

        onAddNote(newNote);
        setSelectedNote(newNote);
        
        // Clear Inputs
        setTitle('');
        setContent('');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error communicating with Gemini model.');
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Sidebar: New Notes & List of Notes */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Create Note Card */}
        <div className="study-card p-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h3 className="text-md font-bold text-stone-800">Generate Revision Notes</h3>
          </div>
          
          <form onSubmit={handleGenerateNotes} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Topic Title</label>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Newton's Laws of Motion"
                className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Raw Source Text / Outline</label>
                <label className="text-[10px] text-[#5A5A40] hover:underline font-bold cursor-pointer flex items-center gap-1">
                  <span>📎 Upload PDF/TXT</span>
                  <input 
                    type="file" 
                    accept=".pdf,.txt,.md,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLoading(true);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const text = event.target?.result as string;
                        setTitle(file.name.replace(/\.[^/.]+$/, ""));
                        if (file.name.endsWith('.pdf')) {
                          const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
                          const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
                          setContent(lines.slice(0, 150).join('\n'));
                        } else {
                          setContent(text);
                        }
                        setLoading(false);
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden" 
                  />
                </label>
              </div>
              <textarea 
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Paste book chapters, wikipedia texts, lectures, or draft outlines..."
                className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all resize-none"
              />
            </div>

            {/* Custom parameters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-black text-stone-400">Depth</label>
                <select 
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(e.target.value as any)}
                  className="w-full bg-[#F5F5F0] border border-black/5 rounded-xl px-2.5 py-2.5 text-[11px] font-bold outline-none cursor-pointer"
                >
                  <option value="short">Short Notes</option>
                  <option value="detailed">Detailed Notes</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-black text-stone-400">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full bg-[#F5F5F0] border border-black/5 rounded-xl px-2.5 py-2.5 text-[11px] font-bold outline-none cursor-pointer"
                >
                  <option value="en">English Only</option>
                  <option value="hi">Hindi Only</option>
                  <option value="both">Both (Hinglish)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-stone-700">Simplification Mode</span>
                <span className="text-[9px] text-stone-400 font-medium">Explain to absolute beginner</span>
              </div>
              <input 
                type="checkbox"
                checked={easyLanguage}
                onChange={(e) => setEasyLanguage(e.target.checked)}
                className="w-4 h-4 accent-brand-sage cursor-pointer"
              />
            </div>

            {error && <p className="text-[10px] text-red-500 font-bold">⚠️ {error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-sage hover:bg-[#494933] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Synthesizing with AI...' : 'Generate Premium Notes'}
            </button>
          </form>
        </div>

        {/* List of past notes */}
        <div className="study-card p-6 bg-white">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-black mb-4">Past Note Repositories</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {notes.length > 0 ? notes.map(note => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer border transition-all ${selectedNote?.id === note.id ? 'bg-[#5A5A40]/10 text-brand-sage border-[#5A5A40]/20' : 'border-transparent text-stone-500 hover:bg-stone-50'}`}
              >
                <span className="truncate">{note.title}</span>
                <span className="text-[9px] text-stone-400 font-mono">{note.language.toUpperCase()}</span>
              </div>
            )) : (
              <p className="text-[11px] text-stone-400 font-medium text-center py-4">No notes generated yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Main Panel: View Notes details */}
      <div className="lg:col-span-2 space-y-6">
        
        {selectedNote ? (
          <div className="study-card p-8 bg-white space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-stone-100 pb-5">
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 bg-brand-sand/10 text-[#8B5E3C] rounded-full text-[10px] font-black uppercase tracking-wider">
                  Verified Revision Document
                </span>
                <h2 className="text-2xl font-serif italic text-stone-800 font-bold">{selectedNote.title}</h2>
                <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest">
                  Created {new Date(selectedNote.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    exportToPDF({
                      title: selectedNote.title,
                      subtitle: `Generated on ${new Date(selectedNote.createdAt).toLocaleDateString()} - Study Language: ${selectedNote.language.toUpperCase()}`,
                      summary: selectedNote.summary,
                      keyPoints: selectedNote.keyPoints,
                      formulas: selectedNote.formulas,
                      definitions: selectedNote.definitions,
                      extraText: selectedNote.detailedNotes ? [
                        { label: "Interactive Detailed Notes", content: selectedNote.detailedNotes }
                      ] : undefined
                    });
                  }}
                  className="px-3 py-1.5 bg-[#5A5A40] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#494933] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  📄 Download PDF
                </button>
                <button 
                  onClick={() => {
                    const blob = new Blob([selectedNote.summary + "\n\n" + selectedNote.detailedNotes], {type: "text/plain"});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedNote.title.replace(/\s+/g, '_')}_notes.txt`;
                    a.click();
                  }}
                  className="px-3 py-1.5 border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1"
                >
                  📥 Export txt
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-widest font-black text-stone-400">Brief Overview</h4>
              <p className="text-stone-600 text-xs leading-relaxed bg-[#FDFBF7] p-4 rounded-2xl border border-stone-100 italic">
                {selectedNote.summary}
              </p>
            </div>

            {/* Key Bullets */}
            {selectedNote.keyPoints && selectedNote.keyPoints.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-widest font-black text-stone-400">Key Points</h4>
                <ul className="space-y-1.5">
                  {selectedNote.keyPoints.map((pt, i) => (
                    <li key={i} className="text-xs text-stone-600 flex items-start gap-2.5">
                      <span className="text-[#5A5A40] mt-0.5">✦</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formula box */}
            {selectedNote.formulas && selectedNote.formulas.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-widest font-black text-stone-400">Important Equations</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedNote.formulas.map((formula, i) => (
                    <div key={i} className="p-3 bg-brand-sage/5 border border-brand-sage/10 rounded-xl font-mono text-xs text-brand-sage flex items-center justify-center">
                      {formula}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VocabularyDefinitions */}
            {selectedNote.definitions && selectedNote.definitions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-widest font-black text-stone-400">Jargon & Glossary</h4>
                <div className="divide-y divide-stone-100 bg-[#FDFBF7] rounded-2xl border border-stone-100 overflow-hidden">
                  {selectedNote.definitions.map((def, i) => {
                    const splitIdx = def.indexOf(':');
                    const term = splitIdx !== -1 ? def.substring(0, splitIdx) : "Concept";
                    const definition = splitIdx !== -1 ? def.substring(splitIdx + 1) : def;
                    return (
                      <div key={i} className="p-3 text-xs">
                        <strong className="text-stone-800 block sm:inline-block sm:w-28 font-bold">{term}:</strong>
                        <span className="text-stone-500 sm:pl-2">{definition}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mind Map Tree */}
            {selectedNote.mindMapOutline && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-widest font-black text-stone-400">Mind Map Indented Tree</h4>
                <pre className="bg-[#2C2C2B] text-green-300 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed">
                  {selectedNote.mindMapOutline}
                </pre>
              </div>
            )}

          </div>
        ) : (
          <div className="study-card p-12 bg-white flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
            <span className="text-4xl">📝</span>
            <h3 className="text-lg font-serif italic text-stone-700">No Revision note is active</h3>
            <p className="text-stone-400 text-xs max-w-sm">Use the parameters on the left to input academic content. AI will generate an optimized revision docket with summaries, key points, formulas, definitions, and interactive mind maps instantly!</p>
          </div>
        )}

      </div>

      {UpgradeDialog}
    </div>
  );
}
