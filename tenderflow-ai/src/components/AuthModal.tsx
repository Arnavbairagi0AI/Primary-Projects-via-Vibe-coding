import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, Mail, Building2, User, Loader2, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, resetPassword, loginAsDemoUser, loading } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gst, setGst] = useState('');
  const [role, setRole] = useState<'company_admin' | 'employee'>('company_admin');
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (isForgotPassword) {
        if (!email) {
          setError('Please enter your email address.');
          return;
        }
        await resetPassword(email);
        setMessage('Password reset instructions have been sent to your email.');
        return;
      }

      if (isSignUp) {
        if (!email || !password || !name) {
          setError('Name, email, and password are required.');
          return;
        }
        if (role === 'company_admin' && (!companyName || !gst)) {
          setError('Company details (Name & GST Number) are required for company setup.');
          return;
        }
        await register(email, password, name, companyName, gst, role);
        setMessage('Registration successful! Check your email for verification.');
        onClose();
      } else {
        if (!email || !password) {
          setError('Please provide email and password.');
          return;
        }
        await login(email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed.');
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError(null);
    setMessage(null);
    try {
      await loginAsDemoUser(demoEmail);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all"
        id="auth-dialog-card"
      >
        {/* Banner */}
        <div className="px-8 py-6 bg-linear-to-r from-blue-600 via-indigo-600 to-violet-700 text-white">
          <h2 className="text-2xl font-bold tracking-tight">TenderFlow AI</h2>
          <p className="text-slate-200 text-xs mt-1">Smart B2B Tender Intelligence & Bidding SaaS</p>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Resetting state */}
            {isForgotPassword ? (
              <>
                <h3 className="text-lg font-semibold text-slate-100">Reset Your Password</h3>
                <p className="text-xs text-slate-400">Enter your email and we'll send link instructions to reset your password credentials securely.</p>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. tarun@indotech.co.in"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Header text */}
                <h3 className="text-lg font-semibold text-slate-100">
                  {isSignUp ? 'Create your business account' : 'Sign in to TenderFlow AI'}
                </h3>

                {/* Sign up details */}
                {isSignUp && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Tarun Sharma"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Account Role</label>
                      <select 
                        value={role}
                        onChange={(e: any) => setRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="company_admin">Company Admin (CEO/Director)</option>
                        <option value="employee">Bidding Employee (Assigned officer)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. bidding_officer@indotech.co.in"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    {!isSignUp && (
                      <button 
                        type="button" 
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {isSignUp && role === 'company_admin' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input 
                          type="text" 
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="IndoTech Solutions Ltd"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">GST Registration Number</label>
                      <input 
                        type="text" 
                        value={gst}
                        onChange={(e) => setGst(e.target.value.toUpperCase())}
                        placeholder="e.g. 27AAAAA1111A1Z1"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white py-3 rounded-xl font-medium text-sm transition-colors flex justify-center items-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isForgotPassword ? 'Send Instructions' : (isSignUp ? 'Create SaaS Account' : 'Sign In')}
            </button>
          </form>

          {/* Toggle View */}
          <div className="mt-4 text-center">
            {isForgotPassword ? (
              <button 
                onClick={() => setIsForgotPassword(false)}
                className="text-xs text-slate-400 hover:text-slate-200 hover:underline"
              >
                Back to Sign In
              </button>
            ) : (
              <p className="text-xs text-slate-400">
                {isSignUp ? 'Already registered?' : 'Need a business console?'}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-indigo-400 ml-1 hover:underline font-semibold"
                >
                  {isSignUp ? 'Log in here' : 'Register your company'}
                </button>
              </p>
            )}
          </div>

          {/* Quick Demo Personas - High Quality Evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 text-indigo-400" /> Quick Demo Authentication Profiles
            </h4>
            <p className="text-[10px] text-slate-400 mb-4">Click to instantly login and test full-stack SaaS features from different security roles:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button 
                onClick={() => handleDemoLogin('admin@tenderflow.ai')}
                className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-bold text-rose-400">Super Admin</div>
                <div className="text-[9px] text-slate-400 truncate">admin@tenderflow.ai</div>
                <div className="text-[8px] text-slate-500 mt-0.5">Subscription + Settings</div>
              </button>

              <button 
                onClick={() => handleDemoLogin('ceo@indotech.co.in')}
                className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-bold text-emerald-400">Company Admin</div>
                <div className="text-[9px] text-slate-400 truncate">ceo@indotech.co.in</div>
                <div className="text-[8px] text-slate-500 mt-0.5">Profile, Team & Bidding</div>
              </button>

              <button 
                onClick={() => handleDemoLogin('bidding_head@indotech.co.in')}
                className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-bold text-blue-400">Employee</div>
                <div className="text-[9px] text-slate-400 truncate">bidding_head@indotech.co.in</div>
                <div className="text-[8px] text-slate-500 mt-0.5">Assigned bids & tasks</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-3 bg-slate-950/80 border-t border-slate-800 text-center flex justify-between items-center text-[10px] text-slate-500">
          <span>Secure Firebase Auth & Database</span>
          <button 
            onClick={onClose}
            className="text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
