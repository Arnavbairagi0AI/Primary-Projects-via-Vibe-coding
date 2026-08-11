import React, { useState } from 'react';
import { NoteItem, Flashcard } from '../types';

export const NotesTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz'>('notes');
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  const [notes] = useState<NoteItem[]>([
    {
      id: '1',
      title: 'Cellular Respiration & Krebs Cycle',
      subject: 'Biology',
      date: 'Aug 2, 2026',
      summary: 'Comprehensive breakdown of glycolysis, pyruvate oxidation, the citric acid cycle (Krebs cycle), and oxidative phosphorylation with electron transport chains.',
      flashcardCount: 12,
      tags: ['Cell Bio', 'Bioenergetics', 'Exam Prep']
    },
    {
      id: '2',
      title: 'Heisenberg Uncertainty & Wave Functions',
      subject: 'Physics',
      date: 'Jul 30, 2026',
      summary: 'Quantum mechanical model of electron probability density, Schrödinger equation overview, and Copenhagen interpretation.',
      flashcardCount: 15,
      tags: ['Quantum Physics', 'Schrödinger', 'Midterm']
    },
    {
      id: '3',
      title: 'Derivatives & Chain Rule Applications',
      subject: 'Mathematics',
      date: 'Jul 28, 2026',
      summary: 'Differentiation rules including product rule, quotient rule, chain rule, and optimization problems in real-world modeling.',
      flashcardCount: 10,
      tags: ['Calculus', 'Optimization']
    }
  ]);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    {
      id: 'fc1',
      question: 'Where does the Krebs Cycle take place in eukaryotic cells?',
      answer: 'In the mitochondrial matrix.',
      subject: 'Biology',
      mastered: false
    },
    {
      id: 'fc2',
      question: 'What is Heisenberg’s Uncertainty Principle formula?',
      answer: 'Δx · Δp ≥ ℏ / 2 (Location and momentum cannot both be precisely known simultaneously).',
      subject: 'Physics',
      mastered: true
    },
    {
      id: 'fc3',
      question: 'State the Chain Rule for f(g(x)).',
      answer: "d/dx [f(g(x))] = f'(g(x)) · g'(x).",
      subject: 'Mathematics',
      mastered: false
    }
  ]);

  const toggleMastered = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlashcards(cards =>
      cards.map(c => (c.id === id ? { ...c, mastered: !c.mastered } : c))
    );
  };

  return (
    <div className="pt-20 pb-28 px-4 md:px-12 max-w-[1280px] mx-auto animate-fadeIn">
      {/* Title & Subtitle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 mt-2 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0b1c30]">
            Smart Notes & Flashcards
          </h2>
          <p className="text-sm md:text-base text-[#464555]">
            AI-generated summaries and active-recall review decks.
          </p>
        </div>

        <button className="h-11 px-5 rounded-full bg-[#3525cd] text-white font-semibold text-sm flex items-center gap-2 hover:bg-[#3525cd]/90 active:scale-95 transition-all shadow-md">
          <span className="material-symbols-outlined text-xl">upload_file</span>
          <span>Upload PDF / Scan</span>
        </button>
      </div>

      {/* Mode Navigation Pills */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'notes'
              ? 'bg-[#3525cd] text-white shadow-xs'
              : 'text-[#464555] hover:bg-[#eff4ff]'
          }`}
        >
          My Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
            activeTab === 'flashcards'
              ? 'bg-[#3525cd] text-white shadow-xs'
              : 'text-[#464555] hover:bg-[#eff4ff]'
          }`}
        >
          Active-Recall Decks ({flashcards.length})
        </button>
      </div>

      {activeTab === 'notes' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {notes.map(note => (
            <div
              key={note.id}
              className="m3-card p-6 flex flex-col justify-between hover:border-[#3525cd]/40 transition-all cursor-pointer group"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#4f46e5]/10 text-[#3525cd]">
                    {note.subject}
                  </span>
                  <span className="text-xs text-[#464555]">{note.date}</span>
                </div>

                <h3 className="text-lg font-bold text-[#0b1c30] mb-2 group-hover:text-[#3525cd] transition-colors">
                  {note.title}
                </h3>

                <p className="text-sm text-[#464555] leading-relaxed mb-4 line-clamp-3">
                  {note.summary}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {note.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-[#eff4ff] text-[#464555] px-2.5 py-0.5 rounded-md font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-[#3525cd]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">style</span>
                    {note.flashcardCount} Flashcards
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform inline-flex items-center">
                    Review →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {flashcards.map(card => {
            const isFlipped = flippedCardId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setFlippedCardId(isFlipped ? null : card.id)}
                className={`m3-card p-6 min-h-[220px] flex flex-col justify-between cursor-pointer transition-all duration-300 relative ${
                  isFlipped ? 'bg-gradient-to-br from-[#3525cd] to-[#712ae2] text-white' : 'bg-white text-[#0b1c30]'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      isFlipped
                        ? 'bg-white/20 text-white'
                        : 'bg-[#4f46e5]/10 text-[#3525cd]'
                    }`}
                  >
                    {card.subject}
                  </span>

                  <button
                    onClick={(e) => toggleMastered(card.id, e)}
                    className={`p-1.5 rounded-full transition-colors ${
                      card.mastered
                        ? 'text-amber-400 bg-amber-400/20'
                        : isFlipped ? 'text-white/60' : 'text-slate-300'
                    }`}
                    title={card.mastered ? 'Mastered' : 'Mark as mastered'}
                  >
                    <span className="material-symbols-outlined text-xl fill">star</span>
                  </button>
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                    {isFlipped ? 'Answer' : 'Question (Click to flip)'}
                  </p>
                  <p className="text-base md:text-lg font-bold leading-snug">
                    {isFlipped ? card.answer : card.question}
                  </p>
                </div>

                <div className="text-center text-xs opacity-60 font-medium">
                  {isFlipped ? 'Click to see Question' : 'Click to see Answer'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
