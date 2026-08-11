import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase/config';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Sparkles, Languages, HelpCircle, Check, Copy, AlertTriangle, 
  Lock, ArrowRight, ShieldCheck, RefreshCw, MessageSquareQuote, CheckSquare
} from 'lucide-react';
import { GeneratedReply, HistoryItem } from '../types';
import { analyzeSentiment } from '../utils/sentiment';

interface ReviewGeneratorTabProps {
  user: User;
  isActiveSubscription: boolean;
  trialCount: number;
  onNavigateToTab: (tab: 'dashboard' | 'generator' | 'history' | 'billing') => void;
  businessName: string;
}

export default function ReviewGeneratorTab({ 
  user, 
  isActiveSubscription, 
  trialCount,
  onNavigateToTab, 
  businessName 
}: ReviewGeneratorTabProps) {
  const [reviewText, setReviewText] = useState('');
  const [language] = useState('Auto-detect (Match Review Language)');
  const [replyTone] = useState('Auto-detect (Match Review Tone)');
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<GeneratedReply[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedReplyIndex, setSelectedReplyIndex] = useState<number | null>(null);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Load businessType and locality to provide highly relevant SEO keywords & context
  const [businessType, setBusinessType] = useState('Restaurant & Dining');
  const [locality, setLocality] = useState('Indiranagar, Bengaluru');

  useEffect(() => {
    async function fetchBusinessDetails() {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.businessType) setBusinessType(userData.businessType);
          if (userData.locality) setLocality(userData.locality);
        }
      } catch (err) {
        console.error("Error fetching details in generator:", err);
      }
    }
    fetchBusinessDetails();
  }, [user.uid]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setError("Please paste a customer review first.");
      return;
    }

    setLoading(true);
    setError(null);
    setReplies([]);
    setSavedToHistory(false);
    setSelectedReplyIndex(null);

    try {
      const response = await fetch('/api/generate-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewText,
          language,
          replyTone,
          businessName,
          businessType,
          locality,
        }),
      });

      const text = await response.text();
      let data: any = {};
      try {
        if (text.trim().startsWith('{')) {
          data = JSON.parse(text);
        } else {
          throw new Error("Invalid response format received from server.");
        }
      } catch (parseErr) {
        if (!response.ok) {
          throw new Error(`Server returned an error (${response.status}). Please try again later.`);
        }
        throw new Error("Failed to read server response. Please try again.");
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate replies (status ${response.status}).`);
      }

      if (data.replies && Array.isArray(data.replies)) {
        setReplies(data.replies);
        
        // If they are on a free plan, increment their trial usage count
        if (!isActiveSubscription) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { trialCount: trialCount + 1 }, { merge: true });
          } catch (docErr) {
            console.error("Error updating trial count:", docErr);
          }
        }
      } else {
        throw new Error("Invalid reply structure received from AI.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleSelectAndSave = async (reply: GeneratedReply, index: number) => {
    if (savedToHistory) return;
    
    setSelectedReplyIndex(index);
    try {
      const historyItem: HistoryItem = {
        userId: user.uid,
        customerReview: reviewText,
        language,
        replyTone,
        generatedReplies: replies,
        selectedReplyText: reply.text,
        businessName: businessName || 'My Local Business',
        sentiment: analyzeSentiment(reviewText),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'history'), historyItem);
      setSavedToHistory(true);
    } catch (err) {
      console.error("Error saving to history:", err);
      setError("Could not auto-save select action to Firestore logs.");
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* 🔒 SUBSCRIPTION PAYWALL GATE OVERLAY */}
      {!isActiveSubscription && showPaywall && (
        <div id="paywall-overlay" className="absolute inset-0 bg-slate-50/70 dark:bg-slate-950/70 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-4 rounded-2xl min-h-[450px]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 max-w-lg w-full border border-slate-100 dark:border-slate-800 shadow-xl space-y-6 text-center animate-fade-in">
            <div className="mx-auto bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 p-4 rounded-full w-14 h-14 flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
              <Lock className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">ReviewRanger Premium Business Gate</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                You have completed your <strong>2 free trial generations</strong>. Unlock our server-side <strong className="text-indigo-600 dark:text-indigo-400">Gemini 2.5 AI Reply Generator</strong> to craft unlimited, customized, 5-star localized SEO replies.
              </p>
            </div>

            {/* Premium pricing pricing grid */}
            <div className="bg-linear-to-b from-slate-50 to-slate-100/60 dark:from-slate-800/60 dark:to-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Premium Business Plan</span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold rounded-md uppercase">Popular in India</span>
              </div>
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-3xl font-extrabold text-slate-950 dark:text-white">₹999</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">/ month</span>
              </div>
              <ul className="text-left text-xs text-slate-600 dark:text-slate-300 space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Unlimited localized AI review generation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Tamil, Hindi, English & Hinglish scripts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Direct copy & Firestore historical tracking logs</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="paywall-billing-redirect-btn"
                onClick={() => onNavigateToTab('billing')}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-2"
              >
                <span>Upgrade to Premium</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                id="paywall-dismiss-btn"
                onClick={() => setShowPaywall(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition"
              >
                Dismiss & Edit
              </button>
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-1.5 font-sans">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>UPI, NetBanking & Cards processed via Razorpay API Secure Gateway</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Review Form Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
        <form onSubmit={handleGenerate} className="space-y-5">
          
          {/* Form Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-2 rounded-xl">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Customer Google Business Review Reply Builder</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Craft personalized, keyword-stuffed SEO business responses</p>
              </div>
            </div>
            
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 sm:mt-0">
              Business Context: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{businessName || 'Default Outlet'}</span>
            </span>
          </div>

          {error && (
            <div id="gen-error-alert" className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-2 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Paste review text box */}
          <div className="space-y-1.5">
            <label htmlFor="review-textarea" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Paste Customer Review Here
            </label>
            <textarea
              id="review-textarea"
              rows={4}
              required
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="e.g. 'I visited the outlet yesterday. The service was excellent but the mutton biryani was a bit dry. The staff was very polite though, special thanks to Rahul!'"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
            />
          </div>

          {/* Automated AI Detection Session Indicator */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-300">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold block text-slate-900 dark:text-white">Automated AI Detection Session Active</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Target reply language & response tone strategy are automatically detected from the review text</span>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full font-bold text-[10px] uppercase tracking-wider shrink-0">
              Automated Session
            </span>
          </div>

          {/* CTA Action Button */}
          <button
            id="generate-replies-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg hover:shadow-indigo-600/10 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin h-5 w-5" />
                <span>Ranger AI is formulating 3 replies...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate 3 Smart Replies</span>
              </>
            )}
          </button>

        </form>
      </div>

      {/* AI Generated Results Display */}
      {replies.length > 0 && (
        <div className="space-y-4 animate-fade-in" id="replies-display-container">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <MessageSquareQuote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>3 Alternative AI responses crafted successfully</span>
            </h4>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-3 py-1 rounded-full">
              SEO Optimized
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {replies.map((reply, idx) => {
              const isCopied = copiedIndex === idx;
              const isSelected = selectedReplyIndex === idx;
              return (
                <div 
                  key={idx} 
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border flex flex-col justify-between transition-all duration-150 ${
                    isSelected 
                      ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 dark:ring-indigo-500/40 shadow-md' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Option Number */}
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">Option {idx + 1}</span>
                      <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-md text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        {replyTone.split(' ')[0]}
                      </span>
                    </div>

                    {/* Reply Text Body */}
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic whitespace-pre-wrap">
                      "{reply.text}"
                    </p>

                    {/* SEO Keywords Badges */}
                    {reply.seoKeywords && reply.seoKeywords.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">SEO Keywords Inserted:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {reply.seoKeywords.map((keyword, kIdx) => (
                            <span key={kIdx} className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 rounded-md text-[9px] font-medium font-sans">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Local context description */}
                    {reply.explanation && (
                      <div className="p-2.5 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-lg text-[10px] text-indigo-950 dark:text-indigo-300 font-sans leading-relaxed border border-indigo-100/30 dark:border-indigo-900/20">
                        <strong className="text-indigo-900 dark:text-indigo-400 block font-bold">SEO/Local Strategy:</strong>
                        {reply.explanation}
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-slate-50 dark:border-slate-800">
                    <button
                      id={`copy-reply-btn-${idx}`}
                      type="button"
                      onClick={() => handleCopy(reply.text, idx)}
                      className="flex-1 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Reply</span>
                        </>
                      )}
                    </button>

                    <button
                      id={`select-reply-btn-${idx}`}
                      type="button"
                      onClick={() => handleSelectAndSave(reply, idx)}
                      disabled={savedToHistory}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1 ${
                        isSelected 
                          ? 'bg-emerald-600 text-white cursor-default' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckSquare className="h-3.5 w-3.5" />
                          <span>Saved to Logs</span>
                        </>
                      ) : (
                        <span>{savedToHistory ? 'Replied' : 'Select & Save'}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
