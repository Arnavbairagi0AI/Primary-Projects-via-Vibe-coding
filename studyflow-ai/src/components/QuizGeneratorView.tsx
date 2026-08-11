/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Quiz, Question } from '../types';
import { useFeatureGuard } from './FeatureGuard';

interface QuizGeneratorViewProps {
  userProfile: UserProfile;
  quizzes: Quiz[];
  onAddQuiz: (quiz: Quiz) => void;
  onUpdateQuiz: (quiz: Quiz) => void;
  onUpdatePlan?: (plan: 'free' | 'pro' | 'premium') => void;
  onIncrementUsage?: (key: 'aiChatsToday' | 'notesGeneratedThisMonth' | 'pdfSummariesGeneratedThisMonth' | 'quizGeneratedThisMonth' | 'flashcardsGeneratedThisMonth') => void;
}

export default function QuizGeneratorView({
  userProfile,
  quizzes,
  onAddQuiz,
  onUpdateQuiz,
  onUpdatePlan,
  onIncrementUsage
}: QuizGeneratorViewProps) {
  const { checkAccessAndRun, UpgradeDialog } = useFeatureGuard(userProfile, 'quiz', onUpdatePlan || (() => {}));

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  
  // Generation state
  const [title, setTitle] = useState('');
  const [contextText, setContextText] = useState('');
  const [quizType, setQuizType] = useState<'mix' | 'multiple_choice' | 'true_false'>('mix');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Playing state
  const [answers, setAnswers] = useState<{ [qId: string]: string }>({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contextText.trim()) return;

    checkAccessAndRun(async () => {
      setError('');
      setLoading(true);

      try {
        const response = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-uid': userProfile.uid
          },
          body: JSON.stringify({
            title,
            content: contextText,
            quizType,
            questionCount
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate AI quiz.');
        }

        const data = await response.json();
        if (onIncrementUsage) onIncrementUsage('quizGeneratedThisMonth');

        const newQuiz: Quiz = {
          id: 'quiz_' + Date.now(),
          userId: userProfile.uid,
          title: data.title || title,
          sourceType: 'manual',
          questions: (data.questions || []).map((q: any, i: number) => ({
            id: q.id || `q_${Date.now()}_${i}`,
            type: q.type || 'multiple_choice',
            question: q.question,
            options: q.options || (q.type === 'true_false' ? ["True", "False"] : []),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
          })),
          score: null,
          completedAt: null,
          createdAt: new Date().toISOString()
        };

        // Save to Firestore
        try {
          await setDoc(doc(db, 'quizzes', newQuiz.id), newQuiz);
        } catch (fErr) {
          console.warn("Firestore save skip:", fErr);
        }

        onAddQuiz(newQuiz);
        setSelectedQuiz(newQuiz);
        
        // Reset quiz playing states
        setAnswers({});
        setCompleted(false);
        setScore(null);

        // Clear generation state
        setTitle('');
        setContextText('');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error generating quiz with Gemini.');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSelectAnswer = (qId: string, value: string) => {
    if (completed) return;
    setAnswers({
      ...answers,
      [qId]: value
    });
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;

    let correctCount = 0;
    selectedQuiz.questions.forEach((q) => {
      const uAns = answers[q.id] || '';
      if (uAns.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / selectedQuiz.questions.length) * 100);
    setScore(finalScore);
    setCompleted(true);

    const updatedQuiz = {
      ...selectedQuiz,
      score: finalScore,
      completedAt: new Date().toISOString()
    };

    onUpdateQuiz(updatedQuiz);
    setSelectedQuiz(updatedQuiz);

    // Save Score to Firestore
    try {
      await setDoc(doc(db, 'quizzes', selectedQuiz.id), updatedQuiz);
    } catch (err) {
      console.warn("Skipping firestore score write:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Quiz Creator Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Create Card */}
        <div className="study-card p-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h3 className="text-md font-bold text-stone-800">Generate Mock Test</h3>
          </div>

          <form onSubmit={handleGenerateQuiz} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Subject / Exam Topic</label>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. JEE Thermodynamics Exam"
                className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Notes / Textbook Syllabus Context</label>
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
                          setContextText(lines.slice(0, 150).join('\n'));
                        } else {
                          setContextText(text);
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
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                rows={4}
                required
                placeholder="Paste revision text, textbook details, or equations, and the AI will auto-construct test questions..."
                className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-black text-stone-400">Quiz Mode</label>
                <select 
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value as any)}
                  className="w-full bg-[#F5F5F0] border border-black/5 rounded-xl px-2.5 py-2.5 text-[11px] font-bold outline-none cursor-pointer"
                >
                  <option value="mix">Mixed Formats</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-black text-stone-400">Questions Count</label>
                <select 
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border border-black/5 rounded-xl px-2.5 py-2.5 text-[11px] font-bold outline-none cursor-pointer"
                >
                  <option value="3">3 Questions</option>
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                </select>
              </div>
            </div>

            {error && <p className="text-[10px] text-red-500 font-bold">⚠️ {error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] hover:bg-[#494933] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Assembling Quiz...' : 'Assemble AI Quiz'}
            </button>
          </form>
        </div>

        {/* History repository */}
        <div className="study-card p-6 bg-white">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-black mb-4">Past Quiz Sessions</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {quizzes.length > 0 ? quizzes.map(q => (
              <div
                key={q.id}
                onClick={() => { setSelectedQuiz(q); setAnswers({}); setCompleted(q.score !== null); setScore(q.score); }}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer border transition-all ${selectedQuiz?.id === q.id ? 'bg-[#5A5A40]/10 text-brand-sage border-[#5A5A40]/20' : 'border-transparent text-stone-500 hover:bg-stone-50'}`}
              >
                <span className="truncate">🏆 {q.title}</span>
                <span className="text-[9px] font-mono font-bold uppercase">
                  {q.score !== null ? `${q.score}%` : 'Draft'}
                </span>
              </div>
            )) : (
              <p className="text-[11px] text-stone-400 font-medium text-center py-4">No quizzes attempted yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Main Panel - Quiz Board */}
      <div className="lg:col-span-2 space-y-6">
        
        {selectedQuiz ? (
          <div className="study-card p-8 bg-white space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <div>
                <span className="text-[9px] font-black uppercase bg-[#D4A373]/10 text-[#8B5E3C] px-2.5 py-0.5 rounded-full">
                  Exam Mode
                </span>
                <h3 className="text-xl font-serif italic font-bold text-stone-800 mt-1">{selectedQuiz.title}</h3>
              </div>

              {completed && (
                <div className="text-right">
                  <span className="text-3xl font-black text-brand-sage">{score}%</span>
                  <p className="text-[9px] text-stone-400 uppercase tracking-wider font-bold">Your Score</p>
                </div>
              )}
            </div>

            {/* Questions list */}
            <div className="space-y-6">
              {selectedQuiz.questions.map((q, idx) => {
                const isSelectedAnswerCorrect = (answers[q.id] || '').toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                return (
                  <div key={q.id} className="space-y-3">
                    <p className="text-xs font-bold text-stone-800">
                      Q{idx + 1}. {q.question}
                    </p>

                    {/* MCQs or T/F */}
                    {q.options && q.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const isSelected = answers[q.id] === opt;
                          const isCorrect = opt === q.correctAnswer;
                          
                          let optStyle = "bg-stone-50 text-stone-700 hover:bg-stone-100 border-transparent";
                          if (isSelected) optStyle = "bg-[#5A5A40]/10 text-brand-sage border-[#5A5A40]/30 font-bold";
                          if (completed) {
                            if (isCorrect) optStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold";
                            else if (isSelected) optStyle = "bg-red-50 text-red-800 border-red-200";
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectAnswer(q.id, opt)}
                              className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${optStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      // Short Answer input box
                      <div className="space-y-2">
                        <input 
                          type="text"
                          disabled={completed}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                          placeholder="Type your brief answer here..."
                          className="w-full bg-[#F5F5F0] border border-black/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#5A5A40]"
                        />
                        {completed && (
                          <p className="text-[11px] text-emerald-700 font-bold">
                            ✓ Correct Answer: {q.correctAnswer}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Explanations shown only after scoring completed */}
                    {completed && (
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-[11px] leading-relaxed text-stone-500">
                        <strong className="text-stone-700 font-bold">Analytic Review:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            {!completed ? (
              <button
                onClick={handleSubmitQuiz}
                className="w-full bg-[#5A5A40] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#494933] cursor-pointer"
              >
                Submit and Score Quiz
              </button>
            ) : (
              <button
                onClick={() => { setSelectedQuiz(null); setAnswers({}); setCompleted(false); setScore(null); }}
                className="w-full bg-stone-100 text-stone-600 hover:bg-stone-200 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest"
              >
                Launch Another Mock Test
              </button>
            )}

          </div>
        ) : (
          <div className="study-card p-12 bg-white flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
            <span className="text-4xl">🏆</span>
            <h3 className="text-lg font-serif italic text-stone-700">No active Quiz attempt</h3>
            <p className="text-stone-400 text-xs max-w-sm">Use the parameters on the left to generate custom Multiple Choice or True/False exams with instant scores, correct reviews, and comprehensive AI explanations!</p>
          </div>
        )}

      </div>

      {UpgradeDialog}
    </div>
  );
}
