import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Building, Phone, Users, ShieldAlert, Sparkles } from 'lucide-react';

export const Auth: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, error, clearError } = useApp();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [role, setRole] = useState<'Admin' | 'Staff'>('Admin');
  
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setAuthLoading(true);

    try {
      if (isSignUp) {
        if (!businessName.trim() || !phoneNumber.trim()) {
          throw new Error('Business details are required for signup.');
        }
        await signUp(email.trim(), password, businessName.trim(), phoneNumber.trim(), role);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const prefillDemoCredentials = (type: 'new' | 'demo') => {
    setLocalError(null);
    clearError();
    if (type === 'demo') {
      setEmail('demo@missedcall.ai');
      setPassword('password123');
      setIsSignUp(false);
    } else {
      const randomID = Math.floor(100 + Math.random() * 900);
      setEmail(`store${randomID}@missedcall.ai`);
      setPassword('password123');
      setBusinessName(`Apex Store #${randomID}`);
      setPhoneNumber('+91 99999 88888');
      setRole('Admin');
      setIsSignUp(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" id="auth-view">
      {/* Visual Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Logo and Greeting */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto">
            <Lock className="w-5 h-5 text-slate-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans">MissedCall AI</h1>
          <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
            Recover lost clients and capture bookings automatically using smart conversational SMS routes.
          </p>
        </div>

        {/* Demo Credential quick buttons */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl" id="auth-demo-credential-selectors">
          <button
            id="use-demo-login-btn"
            type="button"
            onClick={() => prefillDemoCredentials('demo')}
            className="px-3 py-2 text-[10px] font-mono font-bold text-amber-400 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Pre-fill Demo Account</span>
          </button>
          <button
            id="use-demo-signup-btn"
            type="button"
            onClick={() => prefillDemoCredentials('new')}
            className="px-3 py-2 text-[10px] font-mono font-bold text-indigo-400 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Generate New Admin</span>
          </button>
        </div>

        {/* Error Handling */}
        {(localError || error) && (
          <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl text-xs text-red-300 flex items-start gap-2.5 font-sans">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{localError || error}</span>
          </div>
        )}

        {/* Auth form card */}
        <form onSubmit={handleSubmit} className="space-y-4" id="credentials-auth-form">
          
          {/* Email input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="e.g. name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password-input"
                type="password"
                required
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Conditional Sign-up business/role fields */}
          {isSignUp && (
            <div className="space-y-4 pt-2 border-t border-slate-800/60 animate-fadeIn" id="signup-extra-fields">
              
              {/* Business Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Business Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-business-name"
                    type="text"
                    required
                    placeholder="e.g. Apex Dental Clinic"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Business Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-phone-number"
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">User Account Role</label>
                <div className="grid grid-cols-2 gap-2" id="signup-role-selector">
                  <button
                    id="role-select-admin-btn"
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`p-2.5 border text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                      role === 'Admin' 
                        ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/15' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Admin Owner
                  </button>
                  <button
                    id="role-select-staff-btn"
                    type="button"
                    onClick={() => setRole('Staff')}
                    className={`p-2.5 border text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                      role === 'Staff' 
                        ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/15' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Office Staff
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Submit Action Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
          >
            {authLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-bounce delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-bounce delay-300"></span>
              </span>
            ) : (
              <span>{isSignUp ? 'Create Business Account' : 'Authenticate Session'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800/80"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-mono uppercase tracking-wider font-semibold">Or continue with</span>
          <div className="flex-grow border-t border-slate-800/80"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          id="google-signin-btn"
          type="button"
          disabled={authLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-3 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
        >
          {authLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-150"></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-300"></span>
            </span>
          ) : (
            <>
              {/* Google Vector Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.37 0 3.393 2.605 1.411 6.398l3.855 3.367z"
                />
                <path
                  fill="#34A853"
                  d="M16.04 15.34C15.003 16.035 13.6 16.455 12 16.455c-2.91 0-5.387-1.916-6.266-4.52L1.865 15.3A11.968 11.968 0 0 0 12 24c3.245 0 6.183-1.077 8.358-2.914l-4.318-5.746z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.275c0-.62-.069-1.295-.192-1.91H12v4.545h6.458a5.534 5.534 0 0 1-2.418 3.43l4.318 5.745c2.53-2.336 4.132-5.777 4.132-9.81z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.734 11.935a7.03 7.03 0 0 1 0-2.17L1.88 6.398a11.921 11.921 0 0 0 0 8.904l3.854-3.367z"
                />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Form Toggle Link */}
        <div className="pt-4 border-t border-slate-800/60 text-center">
          <button
            id="auth-toggle-mode-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setLocalError(null);
              clearError();
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
};
