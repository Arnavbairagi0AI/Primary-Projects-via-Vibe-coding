import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../data/education';
import confetti from 'canvas-confetti';
import { HelpCircle, Award, CheckCircle2, XCircle, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';

export const QuizGame: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const question = QUIZ_QUESTIONS[currentQuestionIndex];

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    setShowExplanation(true);

    if (index === question.correctAnswerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);

    if (currentQuestionIndex + 1 < QUIZ_QUESTIONS.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      if (score >= 3) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowExplanation(false);
    setQuizFinished(false);
  };

  return (
    <section id="quiz" className="py-20 bg-[#020617] text-white relative border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-widest font-bold mb-3">
            <HelpCircle className="w-3.5 h-3.5" /> Mountain Knowledge Challenge
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Mountain Explorer <span className="font-serif italic font-light text-emerald-200">Quiz</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Test your knowledge of high-altitude geology, mountaineering history, geography, and wildlife!
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
          {!quizFinished ? (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-4">
                <span className="font-bold text-sky-400 uppercase tracking-wider">
                  Category: {question.category}
                </span>
                <span className="font-mono">
                  Question {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
                </span>
              </div>

              {/* Question Text */}
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {question.question}
              </h3>

              {/* Options Grid */}
              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrect = i === question.correctAnswerIndex;

                  let btnStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-sky-500 hover:text-white';

                  if (selectedOption !== null) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
                    } else {
                      btnStyle = 'bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={selectedOption !== null}
                      onClick={() => handleOptionClick(i)}
                      className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {selectedOption !== null && (
                        <span>
                          {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                          {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {showExplanation && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 animate-fade-in">
                  <div className="font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Fact Explanation:
                  </div>
                  <p className="leading-relaxed">{question.explanation}</p>
                </div>
              )}

              {/* Next Button */}
              {selectedOption !== null && (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    Next Question <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Completed Results */
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>

              <h3 className="text-3xl font-black text-white">Quiz Completed!</h3>

              <p className="text-slate-300 text-sm">
                You scored <span className="font-bold text-emerald-400 text-xl">{score}</span> out of{' '}
                <span className="font-bold text-white text-xl">{QUIZ_QUESTIONS.length}</span>!
              </p>

              <button
                onClick={handleRestart}
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all flex items-center gap-2 mx-auto cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Try Quiz Again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
