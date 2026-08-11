import React, { useState } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  ShoppingBag, 
  ArrowRight, 
  Check, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Phone, 
  MapPin, 
  Zap, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const features = [
    {
      icon: <Bot className="w-6 h-6 text-indigo-500" />,
      title: "24/7 Smart AI Agent",
      description: "Answer customer FAQs, explain product details, and capture customer contacts even while you sleep."
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-emerald-500" />,
      title: "Automated Ordering",
      description: "The AI recognizes purchase intent, highlights products, and dynamically prepares customer order slips."
    },
    {
      icon: <Users className="w-6 h-6 text-amber-500" />,
      title: "Customer CRM",
      description: "Keep a rich list of all contact profiles, tags, notes, and previous chat transcripts in one secure dashboard."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-pink-500" />,
      title: "Omnichannel-Ready",
      description: "Prepared for multi-channel integrations (Web widget, WhatsApp, and SMS) so you're always connected."
    }
  ];

  const plans = [
    {
      name: "Starter Free",
      price: "$0",
      period: "forever free",
      description: "Instant access to all core AI chatbot and order collection tools.",
      features: [
        "Unlimited AI Replies",
        "Unlimited Product Catalog",
        "Full Customer CRM Directory",
        "Standard Web Chat Widget",
        "Instant Order Drafting"
      ],
      cta: "Access Free Now",
      popular: false,
      tier: 'free'
    },
    {
      name: "Pro Partner",
      price: "$0",
      period: "100% free",
      description: "All premium features included free for all shop merchants.",
      features: [
        "Unlimited AI Replies & Custom Persona",
        "Unlimited Products & Orders",
        "Unlimited Customer Contacts",
        "WhatsApp & SMS Integrations",
        "Priority Support & Full Admin Access"
      ],
      cta: "Access Free Now",
      popular: true,
      tier: 'pro'
    },
    {
      name: "Enterprise Unlocked",
      price: "$0",
      period: "100% free",
      description: "Complete full-stack platform capability with no credentials or paywall.",
      features: [
        "Unlimited Everything",
        "Multiple Shop Managers",
        "Whitelabel Web Widget",
        "Full Admin Console Privileges",
        "24/7 Priority Automated AI Tuning"
      ],
      cta: "Access Free Now",
      popular: false,
      tier: 'business'
    }
  ];

  const testimonials = [
    {
      quote: "BizChat completely automated my flower shop customer inquiries. I wake up to prepared orders in my dashboard!",
      author: "Sarah Jenkins",
      title: "Owner, Flora & Co",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
    },
    {
      quote: "The order slip creation is genius. Customers chat, decide what they want, and BizChat AI creates the draft order for me to fulfill.",
      author: "David Chang",
      title: "Founder, Brews & Beans",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
    }
  ];

  const faqs = [
    {
      q: "How does the AI order collection system work?",
      a: "Our AI model listens to conversational prompts. When a customer says they want to order a specific product, the AI references your catalog, suggests options, and appends a structured order proposal. This shows up instantly in your dashboard as a pending order for you to approve and fulfill."
    },
    {
      q: "Can I connect this to my actual WhatsApp or SMS numbers?",
      a: "Yes! BizChat AI is built with flexible webhooks. The Pro and Business tiers include ready-to-connect middleware configurations for Twilio and official WhatsApp Cloud APIs."
    },
    {
      q: "Is there a free trial for the paid plans?",
      a: "Absolutely. When you register, you are started on our generous Free tier. You can upgrade or downgrade between Pro and Business at any time from your settings menu."
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div id="landing-page" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <nav id="landing-nav" className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-650 rounded-lg flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-850">BizChat<span className="text-indigo-600">AI</span></span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#features" className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">Features</a>
          <a href="#pricing" className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">Pricing</a>
          <a href="#faq" className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">FAQ</a>
          <button 
            id="nav-login-btn"
            onClick={onLogin} 
            className="text-xs font-medium bg-emerald-600 text-white rounded-lg px-3.5 py-1.5 hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
          >
            ⚡ Open Free App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-16 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-slate-50 to-emerald-50/15 -z-10" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium px-3.5 py-1 rounded-full text-[10px] mb-6">
            <Zap className="w-3 h-3 fill-current text-emerald-600" />
            100% Free - Instant Access - No Login or Credentials Required
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight leading-tight mb-5 max-w-3xl mx-auto">
            The AI Chatbot That Answers Questions & <span className="text-indigo-600 underline decoration-indigo-100 decoration-4 underline-offset-2">Collects Orders</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            BizChat AI is the ultimate 24/7 automated agent for small shops. Connect with customers, explain products, build a robust client directory, and draft order invoices automatically. All features are 100% free for everyone.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-12">
            <button 
              id="hero-get-started"
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-indigo-650 text-white font-medium rounded-lg hover:bg-indigo-755 transition-all flex items-center justify-center gap-1.5 text-xs group cursor-pointer"
            >
              Start Free Workspace (No Credentials Needed)
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a 
              href="#pricing"
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center text-xs"
            >
              View Pricing
            </a>
          </div>

          {/* Feature Mockup Preview */}
          <div className="relative max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white shadow-md p-1.5 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-100 bg-slate-50/80 rounded-t-lg">
              <div className="w-2.5 h-2.5 bg-rose-400 rounded-full" />
              <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
              <div className="ml-3 bg-white px-4 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-100">
                https://bizchat.ai/dashboard
              </div>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200" 
              alt="BizChat AI SaaS App Interface Dashboard mockup" 
              className="w-full h-auto object-cover rounded-b-lg max-h-[380px]"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white border-y border-slate-100 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight mb-3">
              Everything You Need to Automate Customer Service
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-xs leading-relaxed">
              A comprehensive toolbelt of features specifically crafted to save time, capture contact lists, and capture revenue.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200/60 transition-all shadow-none">
                <div className="w-10 h-10 bg-white rounded-lg border border-slate-200/40 flex items-center justify-center mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-sm text-slate-805 mb-1.5">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight mb-3">
              Simple, Transparent Plans
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-xs leading-relaxed">
              Start on our Free tier and scale up only as your monthly chat volume and order flow grow. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`relative bg-white rounded-xl border p-6 flex flex-col justify-between transition-all ${
                  plan.popular 
                    ? 'border border-indigo-600 shadow-md scale-100 z-10' 
                    : 'border-slate-200/80'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="font-semibold text-base text-slate-850 mb-0.5">{plan.name}</h3>
                  <p className="text-[11px] text-slate-400 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-400 text-xs">/{plan.period}</span>
                  </div>
                  <ul className="space-y-3 border-t border-slate-100/80 pt-4 mb-5">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-500">
                        <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={onGetStarted}
                  className={`w-full py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    plan.popular
                      ? 'bg-indigo-650 text-white hover:bg-indigo-755'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Loved by Small Business Owners</h2>
            <p className="text-slate-500 text-xs">See how merchants are reclaiming hours and converting leads seamlessly.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 italic leading-relaxed text-xs mb-5">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <img src={t.avatar} alt={t.author} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-semibold text-slate-800 text-xs">{t.author}</h4>
                    <p className="text-[10px] text-slate-400">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50 px-6 border-t border-slate-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-white border border-slate-200/80 rounded-xl overflow-hidden transition-all">
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold text-slate-800 hover:bg-slate-50/50 transition-colors text-xs cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-0.5 text-slate-500 text-[11px] leading-relaxed border-t border-slate-100 bg-slate-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">Let's Connect</h2>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              Have questions about integrations or enterprise features? Drop us a message, and our local team will guide you through setting up BizChat AI for your company.
            </p>
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="w-4 h-4 text-indigo-605" />
                <span className="text-xs">support@bizchatai.example.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Phone className="w-4 h-4 text-indigo-605" />
                <span className="text-xs">+1 (555) 321-7654</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <MapPin className="w-4 h-4 text-indigo-605" />
                <span className="text-xs">456 Startup Circle, San Francisco, CA</span>
              </div>
            </div>
          </div>
          <form onSubmit={handleContactSubmit} className="bg-slate-50 border border-slate-200/60 p-6 rounded-xl space-y-3.5">
            <h3 className="font-semibold text-sm text-slate-800">Send us a message</h3>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Your Name</label>
              <input 
                type="text" 
                required
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="John Doe" 
                className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="john@example.com" 
                className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Your Message</label>
              <textarea 
                rows={4}
                required
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="How can we help?" 
                className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>
            {submitted ? (
              <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg text-[11px] font-semibold text-center border border-emerald-200">
                Message sent successfully! We'll reply within 24 hours.
              </div>
            ) : (
              <button 
                type="submit" 
                className="w-full py-2 bg-indigo-650 text-white font-semibold rounded-lg hover:bg-indigo-755 transition-colors text-xs cursor-pointer shadow-none"
              >
                Send Message
              </button>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-10 px-6 border-t border-slate-900 text-center text-xs">
        <p className="mb-2">© 2026 BizChat AI, Inc. All rights reserved.</p>
        <p className="text-[10px] text-slate-600">Built in partnership with Google DeepMind for Google AI Studio Builders.</p>
      </footer>
    </div>
  );
}
