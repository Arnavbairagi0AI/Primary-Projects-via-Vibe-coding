import React, { useState } from 'react';
import { ARTICLES } from '../data/education';
import { Article } from '../types';
import { BookOpen, Clock, ArrowRight, X, Sparkles } from 'lucide-react';

export const EducationSection: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <section id="education" className="py-20 bg-[#020617] text-white relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] uppercase tracking-widest font-bold mb-3">
            <BookOpen className="w-3.5 h-3.5" /> High Altitude Earth Science
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Educational <span className="font-serif italic font-light text-sky-200">Articles & Guides</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Deep-dive into high-altitude biology, plate tectonics, glaciology, and mountaineering safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ARTICLES.map((art) => (
            <div
              key={art.id}
              className="group rounded-2xl overflow-hidden glass border border-white/10 border-l-4 border-l-sky-500 hover:border-sky-500/60 shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={art.coverImage} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-sky-300 border border-white/10">
                  {art.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                    <Clock className="w-3 h-3 text-sky-400" /> {art.readTimeMinutes} min read • {art.date}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedArticle(art)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700/80"
                >
                  Read Full Guide <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white space-y-6">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold inline-block">
              {selectedArticle.category}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black">{selectedArticle.title}</h2>

            <div className="text-xs text-slate-400 flex items-center gap-3 border-b border-slate-800 pb-4">
              <span>By {selectedArticle.author}</span>
              <span>•</span>
              <span>{selectedArticle.readTimeMinutes} min read</span>
            </div>

            <div className="prose prose-invert prose-xs sm:prose-sm leading-relaxed text-slate-300 space-y-4">
              {selectedArticle.contentMarkdown.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
