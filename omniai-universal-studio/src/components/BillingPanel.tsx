import React, { useState } from 'react';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Lock, 
  HelpCircle,
  Radio,
  Sliders,
  AlertCircle
} from 'lucide-react';

interface BillingPanelProps {
  subscribed: boolean;
  setSubscribed: (val: boolean) => void;
}

export default function BillingPanel({ subscribed, setSubscribed }: BillingPanelProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tester/Owner state
  const [testerEmail, setTesterEmail] = useState('');
  const [testerSuccessMsg, setTesterSuccessMsg] = useState('');

  const handleUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOnCard.trim() || cardNumber.replace(/\s/g, '').length < 16) {
      setErrorMsg('Please enter a valid card holder name and 16-digit card number.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    // Simulate modern network processor delay
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setSubscribed(true);
    }, 1800);
  };

  const handleVerifyTester = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = testerEmail.trim().toLowerCase();
    if (cleanEmail === 'neoedits2008@gmail.com' || cleanEmail === 'shadowfall07042008@gmail.com') {
      setSubscribed(true);
      setSuccess(true);
      setTesterSuccessMsg(`Welcome Owner & Developer: ${cleanEmail}! Lifetime VIP Access has been permanently activated.`);
      setErrorMsg('');
    } else {
      setErrorMsg('Unauthorized tester credential. Enter an authorized developer email.');
      setTesterSuccessMsg('');
    }
  };

  const handleDowngrade = () => {
    if (window.confirm('Are you sure you want to revert to the Free Basic Tier? All advanced multi-model scrapers and voice capabilities will be gated.')) {
      setSubscribed(false);
      setSuccess(false);
      setTesterSuccessMsg('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setNameOnCard('');
      setTesterEmail('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-gray-200 overflow-y-auto p-6 scrollbar-thin" id="billing-panel-root">
      
      {/* Banner Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            Billing & License Manager
          </h2>
          <p className="text-xs text-gray-400">
            Configure system license keys, toggle mock premium plans, or upgrade endpoints to unlock advanced scraping routes.
          </p>
        </div>
        <div>
          {subscribed ? (
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-800/30 px-3 py-1.5 rounded flex items-center gap-1.5 font-bold uppercase tracking-widest animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 fill-current" />
              Enterprise Pro Active
            </span>
          ) : (
            <span className="text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded flex items-center gap-1.5 font-bold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-gray-500" />
              Basic Free Account
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto w-full">
        {/* Left Side: Tier Comparison */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0f0f0f] border border-gray-800 rounded p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Compare Subscription Tiers</h3>
            
            <div className="space-y-3">
              {/* Row 1: Gemini API */}
              <div className="flex items-center justify-between py-2 border-b border-gray-900/60 text-xs">
                <span className="text-gray-400 font-medium">Gemini 2.5 Dev API</span>
                <div className="flex gap-4 font-mono text-[10px]">
                  <span className="text-green-500">Free (15 RPM)</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-cyan-400 font-bold">Pro (60 RPM)</span>
                </div>
              </div>

              {/* Row 2: Claude Scrapers */}
              <div className="flex items-center justify-between py-2 border-b border-gray-900/60 text-xs">
                <span className="text-gray-400 font-medium">Claude Mirror & Cookie Scrapers</span>
                <div className="flex gap-4 font-mono text-[10px]">
                  <span className="text-amber-500">Limited (Mirror only)</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-cyan-400 font-bold">Unlimited + Headers</span>
                </div>
              </div>

              {/* Row 3: Blackbox AI */}
              <div className="flex items-center justify-between py-2 border-b border-gray-900/60 text-xs">
                <span className="text-gray-400 font-medium">Blackbox AI Code Executor</span>
                <div className="flex gap-4 font-mono text-[10px]">
                  <span className="text-red-500">Locked 🔒</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-cyan-400 font-bold">Full Access ⚡</span>
                </div>
              </div>

              {/* Row 4: Parallel Mega-Chat */}
              <div className="flex items-center justify-between py-2 border-b border-gray-900/60 text-xs">
                <span className="text-gray-400 font-medium">Parallel Multi-Model Prompting</span>
                <div className="flex gap-4 font-mono text-[10px]">
                  <span className="text-amber-500">1 Engine Only</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-cyan-400 font-bold">5 Engines Side-by-Side</span>
                </div>
              </div>

              {/* Row 5: Voice pipeline */}
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-gray-400 font-medium">Microphone STT Speech Engine</span>
                <div className="flex gap-4 font-mono text-[10px]">
                  <span className="text-amber-500">Simulated/Mock Only</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-cyan-400 font-bold">Real Voice Streaming</span>
                </div>
              </div>
            </div>
          </div>

          {/* Value proposition bullet list */}
          <div className="bg-[#0f0f0f] border border-gray-800 rounded p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Premium Account Benefits</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-800/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200">Blackbox AI Integration</h4>
                  <p className="text-[10px] text-gray-500">Unlocks our newly integrated Blackbox AI coding executor and sandbox weights.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-800/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200">Full 5-Engine Grid</h4>
                  <p className="text-[10px] text-gray-500">Simultaneously prompt Gemini, Claude, ChatGPT, Blackbox, and local Ollama.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-800/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200">True Voice STT Pipeline</h4>
                  <p className="text-[10px] text-gray-500">Activate live microphone access with high-fidelity speech recognition filters.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-800/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200">Cookie Credential Caching</h4>
                  <p className="text-[10px] text-gray-500">Direct headless browser scraper automation bypasses cloud proxies entirely.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form / Upgrade Status */}
        <div className="lg:col-span-5">
          {success ? (
            <div className="bg-[#0f0f0f] border border-cyan-900/30 rounded p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-cyan-950/20 border border-cyan-500/50 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-white font-sans">Upgrade Complete!</h3>
                {testerSuccessMsg ? (
                  <p className="text-xs text-green-400 font-mono leading-relaxed bg-green-950/10 border border-green-900/20 p-2 rounded">
                    {testerSuccessMsg}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your local terminal environment has been synced with the Enterprise Pro license key. All models and voice modules are now fully unlocked.
                  </p>
                )}
              </div>
              <div className="pt-2">
                <button
                  onClick={handleDowngrade}
                  className="w-full py-2 bg-transparent hover:bg-red-950/10 border border-gray-800 hover:border-red-900/40 rounded text-[10px] font-mono text-gray-500 hover:text-red-400 transition-all uppercase tracking-wider"
                >
                  Downgrade to Free Basic
                </button>
              </div>
            </div>
          ) : subscribed ? (
            <div className="bg-[#0f0f0f] border border-gray-800 rounded p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-cyan-950/40 border border-cyan-800/20 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Subscription Active</h3>
                  <p className="text-[10px] text-cyan-500 font-medium font-mono">LIFETIME AUTHORIZATION INSTALLED</p>
                </div>
              </div>
              {testerSuccessMsg ? (
                <p className="text-xs text-green-400 font-mono leading-relaxed bg-green-950/10 border border-green-900/20 p-2.5 rounded">
                  {testerSuccessMsg}
                </p>
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your license was retrieved successfully from local configurations. You have unlimited parallel scraper capabilities, offline Ollama failovers, and live voice speech recognition.
                </p>
              )}
              <div className="pt-2 border-t border-gray-900">
                <button
                  onClick={handleDowngrade}
                  className="w-full py-2 bg-transparent hover:bg-red-950/10 border border-gray-800 hover:border-red-900/40 rounded text-[10px] font-mono text-gray-500 hover:text-red-400 transition-all uppercase tracking-wider"
                >
                  Downgrade to Free Basic
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#0f0f0f] border border-gray-800 rounded p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Simulate Pro Upgrade</h3>
                  <p className="text-[10px] text-gray-500">
                    Activate premium routes instantly. This is a fully simulated developer billing form—no real money or cards are charged.
                  </p>
                </div>

                {errorMsg && !testerEmail && (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 rounded flex items-start gap-2 text-[10px] text-red-400 font-medium leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpgrade} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-gray-500 uppercase block">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alexis Dev"
                      value={nameOnCard}
                      onChange={(e) => setNameOnCard(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-700 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-gray-500 uppercase block">Simulated Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        // autoformat spaces
                        const raw = e.target.value.replace(/\s/g, '');
                        const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
                        setCardNumber(formatted);
                      }}
                      className="w-full bg-[#0d0d0d] border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-700 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-gray-500 uppercase block">Expiry Date</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        maxLength={5}
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-700 font-mono text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-gray-500 uppercase block">CVC / CVV</label>
                      <input
                        type="password"
                        required
                        placeholder="***"
                        maxLength={3}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-700 font-mono text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 font-mono text-xs font-bold py-2.5 rounded flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/20 active:translate-y-0.5 transition-all uppercase tracking-wider text-white"
                  >
                    {isLoading ? (
                      <>
                        <Sliders className="w-3.5 h-3.5 animate-spin" />
                        Authorizing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Upgrade to Enterprise Pro
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Owner & Tester Authorization Portal */}
              <div className="bg-[#090909] border border-cyan-950/40 rounded p-5 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 fill-current" />
                    Owner & Tester Portal
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Enter your registered email to grant instant, permanent lifetime access to all scraping pipelines.
                  </p>
                </div>

                {errorMsg && testerEmail && (
                  <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded text-[10px] text-red-400 font-mono">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleVerifyTester} className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-gray-500 uppercase block">Authorized Email</label>
                    <input
                      type="email"
                      required
                      placeholder="neoedits2008@gmail.com"
                      value={testerEmail}
                      onChange={(e) => setTesterEmail(e.target.value)}
                      className="w-full bg-black border border-gray-850 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-700 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-950/50 hover:bg-cyan-900/40 border border-cyan-800/40 text-cyan-400 font-mono text-xs font-bold py-2 rounded transition-all uppercase tracking-wider"
                  >
                    Verify Owner Access
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
