import React, { useState } from 'react';
import { Mountain as MountainIcon, Mail, Send, Download, MessageSquare, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <footer id="footer" className="bg-[#020617] text-white border-t border-white/5 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Top Grid: Newsletter & Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Newsletter Box */}
          <div className="p-8 rounded-3xl glass border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-widest">
              <Mail className="w-4 h-4" /> Alpine Dispatch Newsletter
            </div>
            <h3 className="text-2xl font-bold text-white">
              Join 45,000+ <span className="font-serif italic font-light text-sky-200">Mountain Explorers</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Receive monthly 3D terrain updates, high-altitude research insights, and alpine expedition stories straight to your inbox.
            </p>

            {!newsletterSubscribed ? (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase tracking-wider btn-glow transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
                >
                  Subscribe <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Thank you for subscribing to Alpine Dispatch!
              </div>
            )}
          </div>

          {/* Feedback & Contact Form */}
          <div className="p-8 rounded-3xl glass border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
              <MessageSquare className="w-4 h-4" /> Contact MountainVerse
            </div>
            <h3 className="text-2xl font-bold text-white">Send Feedback or Suggest Peaks</h3>

            {!contactSubmitted ? (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Your message or peak suggestion..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Send Message
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Message received! Thank you for helping improve MountainVerse.
              </div>
            )}
          </div>
        </div>

        {/* Resources & Downloadable Guides */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-sky-400" />
            <div>
              <span className="font-bold text-white block">Download Alpine Fact Cards (PDF Pack)</span>
              <span className="text-slate-400 text-[11px]">Printable high-resolution peak profiles, routes, and emergency specs.</span>
            </div>
          </div>
          <button
            onClick={() => alert('MountainVerse High-Res PDF Fact Card Pack initiated download!')}
            className="px-5 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 hover:text-white text-sky-300 font-bold text-xs transition-all border border-sky-500/30 cursor-pointer"
          >
            Download Resource Pack
          </button>
        </div>

        {/* Bottom Credits Footer Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <MountainIcon className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-slate-300">MountainVerse 3D</span> • Designed for World Alpine Education
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span>Crafted with Three.js & Passion for Earth Science</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
