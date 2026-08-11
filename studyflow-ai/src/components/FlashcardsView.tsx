/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, FlashcardSet, Flashcard } from '../types';
import { useFeatureGuard } from './FeatureGuard';

interface FlashcardsViewProps {
  userProfile: UserProfile;
  flashcardSets: FlashcardSet[];
  onAddFlashcardSet: (set: FlashcardSet) => void;
  onUpdateFlashcardSet: (set: FlashcardSet) => void;
  onUpdatePlan?: (plan: 'free' | 'pro' | 'premium') => void;
  onIncrementUsage?: (key: 'aiChatsToday' | 'notesGeneratedThisMonth' | 'pdfSummariesGeneratedThisMonth' | 'quizGeneratedThisMonth' | 'flashcardsGeneratedThisMonth') => void;
}

export default function FlashcardsView({
  userProfile,
  flashcardSets,
  onAddFlashcardSet,
  onUpdateFlashcardSet,
  onUpdatePlan,
  onIncrementUsage
}: FlashcardsViewProps) {
  const { checkAccessAndRun, UpgradeDialog } = useFeatureGuard(userProfile, 'flashcards', onUpdatePlan || (() => {}));

  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  
  // Generation state
  const [topic, setTopic] = useState('');
  const [contentContext, setContentContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Manual entry state
  const [isManual, setIsManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualFront, setManualFront] = useState('');
  const [manualBack, setManualBack] = useState('');
  const [tempCards, setTempCards] = useState<Flashcard[]>([]);

  // Study game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Card editor state
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  const handleGenerateFlashcards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    checkAccessAndRun(async () => {
      setError('');
      setLoading(true);

      try {
        const response = await fetch('/api/generate-flashcards', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-uid': userProfile.uid
          },
          body: JSON.stringify({
            title: topic,
            content: contentContext || "Generate general core flashcards on this academic topic."
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate flashcards.');
        }

        const data = await response.json();
        if (onIncrementUsage) onIncrementUsage('flashcardsGeneratedThisMonth');

        const newSet: FlashcardSet = {
          id: 'cards_' + Date.now(),
          userId: userProfile.uid,
          title: data.title || topic,
          cards: (data.cards || []).map((c: any, i: number) => ({
            id: `card_${Date.now()}_${i}`,
            front: c.front,
            back: c.back,
            mastered: false,
            lastReviewedAt: null
          })),
          createdAt: new Date().toISOString()
        };

        // Save to Firestore
        try {
          await setDoc(doc(db, 'flashcards', newSet.id), newSet);
        } catch (fErr) {
          console.warn("Firestore save skip:", fErr);
        }

        onAddFlashcardSet(newSet);
        setSelectedSet(newSet);
        setCurrentIndex(0);
        setIsFlipped(false);
        setTopic('');
        setContentContext('');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error generating flashcards from Gemini.');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleAddManualCard = () => {
    if (!manualFront.trim() || !manualBack.trim()) return;
    const newCard: Flashcard = {
      id: `card_manual_${Date.now()}_${tempCards.length}`,
      front: manualFront,
      back: manualBack,
      mastered: false,
      lastReviewedAt: null
    };
    setTempCards([...tempCards, newCard]);
    setManualFront('');
    setManualBack('');
  };

  const handleSaveManualSet = async () => {
    if (!manualTitle.trim() || tempCards.length === 0) {
      setError('Please provide a title and add at least one card.');
      return;
    }

    const newSet: FlashcardSet = {
      id: 'cards_' + Date.now(),
      userId: userProfile.uid,
      title: manualTitle,
      cards: tempCards,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'flashcards', newSet.id), newSet);
    } catch (fErr) {
      console.warn("Firestore save skip:", fErr);
    }

    onAddFlashcardSet(newSet);
    setSelectedSet(newSet);
    setCurrentIndex(0);
    setIsFlipped(false);

    // Reset fields
    setManualTitle('');
    setTempCards([]);
    setIsManual(false);
  };

  // Flip or navigate active set cards
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (!selectedSet) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % selectedSet.cards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (!selectedSet) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + selectedSet.cards.length) % selectedSet.cards.length);
    }, 150);
  };

  const handleToggleMastered = async () => {
    if (!selectedSet) return;
    const updatedCards = [...selectedSet.cards];
    const currentCard = updatedCards[currentIndex];
    currentCard.mastered = !currentCard.mastered;
    currentCard.lastReviewedAt = new Date().toISOString();

    const updatedSet = {
      ...selectedSet,
      cards: updatedCards
    };

    onUpdateFlashcardSet(updatedSet);
    setSelectedSet(updatedSet);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'flashcards', selectedSet.id), updatedSet);
    } catch (err) {
      console.warn("Skip firestore update:", err);
    }
  };

  // Editing existing set card logic
  const handleStartEditCard = (index: number) => {
    const card = selectedSet?.cards[index];
    if (!card) return;
    setEditingCardIndex(index);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const handleSaveEditCard = async () => {
    if (!selectedSet || editingCardIndex === null) return;
    const updatedCards = [...selectedSet.cards];
    updatedCards[editingCardIndex] = {
      ...updatedCards[editingCardIndex],
      front: editFront,
      back: editBack
    };

    const updatedSet = {
      ...selectedSet,
      cards: updatedCards
    };

    onUpdateFlashcardSet(updatedSet);
    setSelectedSet(updatedSet);
    setEditingCardIndex(null);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'flashcards', selectedSet.id), updatedSet);
    } catch (err) {
      console.warn("Skip firestore update:", err);
    }
  };

  const currentCard = selectedSet?.cards[currentIndex];
  const masteredCount = selectedSet?.cards.filter(c => c.mastered).length || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Sidebar - Creator */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Toggle Creator Type */}
        <div className="study-card p-6 bg-white space-y-4">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => { setIsManual(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!isManual ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-stone-500'}`}
            >
              🤖 AI Flashcards
            </button>
            <button 
              onClick={() => { setIsManual(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${isManual ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-stone-500'}`}
            >
              ✍️ Manual Entry
            </button>
          </div>

          {!isManual ? (
            <form onSubmit={handleGenerateFlashcards} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Topic of Interest</label>
                <input 
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Periodic Table Elements"
                  className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Context / Notes Reference</label>
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
                          setTopic(file.name.replace(/\.[^/.]+$/, ""));
                          if (file.name.endsWith('.pdf')) {
                            const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
                            const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
                            setContentContext(lines.slice(0, 150).join('\n'));
                          } else {
                            setContentContext(text);
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
                  value={contentContext}
                  onChange={(e) => setContentContext(e.target.value)}
                  rows={4}
                  placeholder="Paste context notes or definitions, and the AI will convert them into professional flashcards..."
                  className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all resize-none"
                />
              </div>

              {error && <p className="text-[10px] text-red-500 font-bold">⚠️ {error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-sage hover:bg-[#494933] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Generating Set...' : 'Generate with AI'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Set Title</label>
                <input 
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. History Final Exam"
                  className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 space-y-3">
                <p className="text-[9px] uppercase tracking-wider text-stone-400 font-black">Add Card Details</p>
                <div className="space-y-1">
                  <input 
                    type="text"
                    value={manualFront}
                    onChange={(e) => setManualFront(e.target.value)}
                    placeholder="Front (Question/Concept)"
                    className="w-full bg-white border border-black/5 focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <input 
                    type="text"
                    value={manualBack}
                    onChange={(e) => setManualBack(e.target.value)}
                    placeholder="Back (Answer/Explanation)"
                    className="w-full bg-white border border-black/5 focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddManualCard}
                  className="w-full bg-brand-sand text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Add Card to Queue ({tempCards.length})
                </button>
              </div>

              {error && <p className="text-[10px] text-red-500 font-bold">⚠️ {error}</p>}

              <button
                onClick={handleSaveManualSet}
                className="w-full bg-[#5A5A40] hover:bg-[#494933] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Save Flashcard Set
              </button>
            </div>
          )}
        </div>

        {/* List of sets */}
        <div className="study-card p-6 bg-white">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-black mb-4">Your Revision Sets</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {flashcardSets.length > 0 ? flashcardSets.map(set => (
              <div
                key={set.id}
                onClick={() => { setSelectedSet(set); setCurrentIndex(0); setIsFlipped(false); }}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer border transition-all ${selectedSet?.id === set.id ? 'bg-[#5A5A40]/10 text-brand-sage border-[#5A5A40]/20' : 'border-transparent text-stone-500 hover:bg-stone-50'}`}
              >
                <span className="truncate">⚡ {set.title}</span>
                <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-bold">{set.cards.length} Cards</span>
              </div>
            )) : (
              <p className="text-[11px] text-stone-400 font-medium text-center py-4">No flashcards created.</p>
            )}
          </div>
        </div>

      </div>

      {/* Study Board Display */}
      <div className="lg:col-span-2 space-y-6">
        
        {selectedSet && selectedSet.cards.length > 0 ? (
          <div className="space-y-6">
            
            {/* Header / Tracker */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-black/5">
              <div>
                <h3 className="font-bold text-sm text-stone-800">{selectedSet.title}</h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                  Active Sprint • Card {currentIndex + 1} of {selectedSet.cards.length}
                </p>
              </div>
              <span className="text-xs bg-[#D4A373]/10 text-[#8B5E3C] px-3 py-1 rounded-full font-bold">
                Mastered: {masteredCount}/{selectedSet.cards.length}
              </span>
            </div>

            {/* Flipped Card board with premium Natural Tones style */}
            <div 
              onClick={handleFlip}
              className="h-72 w-full cursor-pointer relative perspective"
            >
              <div 
                className={`w-full h-full duration-500 transform preserve-3d relative rounded-[32px] border border-[#D4A373]/30 shadow-xl p-8 flex flex-col justify-between items-center text-center transition-transform ${isFlipped ? 'rotate-y-180 bg-stone-50' : 'bg-white'}`}
              >
                
                {/* Front Side */}
                {!isFlipped ? (
                  <div className="flex-1 flex flex-col justify-between w-full h-full">
                    <p className="text-[10px] text-[#8B5E3C] font-black uppercase tracking-[0.2em]">Revision Concept</p>
                    <p className="text-lg md:text-xl font-serif italic text-stone-800 leading-relaxed font-bold max-w-md mx-auto">
                      {currentCard?.front}
                    </p>
                    <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest">Click card to reveal answer</p>
                  </div>
                ) : (
                  // Back Side
                  <div className="flex-1 flex flex-col justify-between w-full h-full transform rotate-y-180">
                    <p className="text-[10px] text-brand-sage font-black uppercase tracking-[0.2em]">Verified Explanation</p>
                    <p className="text-sm md:text-md text-stone-600 leading-relaxed max-w-md mx-auto">
                      {currentCard?.back}
                    </p>
                    <p className="text-[9px] text-[#8B5E3C] uppercase font-black tracking-widest">Click to view concept front</p>
                  </div>
                )}

              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex justify-between items-center gap-4">
              <button 
                onClick={handlePrev}
                className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider"
              >
                ◀ Prev
              </button>

              <button 
                onClick={handleToggleMastered}
                className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all ${currentCard?.mastered ? 'bg-[#D4A373] text-white' : 'bg-[#5A5A40] text-white'}`}
              >
                {currentCard?.mastered ? '🌟 Mastered (Unmark)' : '✓ Mark as Learned'}
              </button>

              <button 
                onClick={handleNext}
                className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider"
              >
                Next ▶
              </button>
            </div>

            {/* List and edit individual cards in the active set */}
            <div className="study-card p-6 bg-white space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-black">All Cards in Set</p>
              <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto pr-1">
                {selectedSet.cards.map((card, idx) => (
                  <div key={card.id} className="py-3 flex justify-between items-start text-xs">
                    {editingCardIndex === idx ? (
                      <div className="space-y-2 w-full pr-4">
                        <input 
                          type="text" 
                          value={editFront} 
                          onChange={(e) => setEditFront(e.target.value)} 
                          className="w-full bg-[#F5F5F0] rounded-lg px-2 py-1.5 border border-stone-200"
                        />
                        <input 
                          type="text" 
                          value={editBack} 
                          onChange={(e) => setEditBack(e.target.value)} 
                          className="w-full bg-[#F5F5F0] rounded-lg px-2 py-1.5 border border-stone-200"
                        />
                        <div className="flex gap-2">
                          <button onClick={handleSaveEditCard} className="bg-brand-sage text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Save</button>
                          <button onClick={() => setEditingCardIndex(null)} className="bg-stone-100 text-stone-500 px-3 py-1 rounded text-[10px] font-bold uppercase">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="pr-4 space-y-1 flex-1">
                          <p className="font-bold text-stone-700">Q: {card.front}</p>
                          <p className="text-stone-400">A: {card.back}</p>
                          {card.mastered && <span className="inline-block text-[9px] bg-amber-50 text-amber-700 px-1.5 rounded font-black uppercase">Mastered</span>}
                        </div>
                        <button 
                          onClick={() => handleStartEditCard(idx)}
                          className="text-brand-sage text-[10px] uppercase font-bold hover:underline"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="study-card p-12 bg-white flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
            <span className="text-4xl">⚡</span>
            <h3 className="text-lg font-serif italic text-stone-700">No Flashcard Set selected</h3>
            <p className="text-stone-400 text-xs max-w-sm">Use the parameters on the left to generate sets using Gemini, or design manual cards. Flip and tap to review concept cards before major exams!</p>
          </div>
        )}

      </div>

      {UpgradeDialog}
    </div>
  );
}
