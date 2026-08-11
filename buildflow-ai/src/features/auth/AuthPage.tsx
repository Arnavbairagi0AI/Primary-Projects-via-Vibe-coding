import React, { useState } from 'react';
import { useAuth, DEFAULT_GUEST_USER } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { motion } from 'motion/react';
import { Mail, Lock, User, Briefcase, Eye, EyeOff, Key, ShieldCheck, Sparkles } from 'lucide-react';
import { UserRole } from '../../types';

export default function AuthPage() {
  const { login, signup, googleLogin, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Company Admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email', 'error');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email);
        showToast('Password reset email sent. Please check your inbox.', 'info');
        setMode('login');
      } catch (err: any) {
        showToast(err.message || 'Failed to send password reset email', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (mode === 'signup' && !fullName) {
      showToast('Please enter your full name', 'error');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        showToast('Welcome back to BuildFlow AI', 'success');
      } else {
        await signup(email, password, role, fullName);
        showToast('Account created successfully! Let\'s onboard your company.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await googleLogin();
      showToast('Successfully signed in with Google', 'success');
    } catch (err: any) {
      showToast(err.message || 'Google authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8F9FB] font-sans text-[#1C1B1F] overflow-hidden relative selection:bg-[#2152FF]/20">
      {/* Visual Left Panel - Brand Display */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r border-[#E1E2E6] p-16 flex-col justify-between relative z-10 overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2152FF] flex items-center justify-center shadow-md shadow-[#2152FF]/10">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1C1B1F]">
            BuildFlow AI
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Designed for Indian Construction Companies
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl xl:text-5xl font-extrabold tracking-tight text-[#1C1B1F] leading-none"
          >
            Discover, track and match <span className="text-[#2152FF]">tenders with AI</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-[#44474E] leading-relaxed"
          >
            Streamline your construction business. Analyze complex CPWD, NHAI, PWD, and municipal tenders instantly using tailored Gemini AI matchmaking, document extraction, and project compliance checking.
          </motion.p>
        </div>

        <div className="relative z-10 pt-8 border-t border-[#E1E2E6] flex items-center gap-8 text-xs text-[#44474E]">
          <div>
            <div className="text-[#1C1B1F] font-bold text-sm">10,000+</div>
            <div>Tenders Analyzed</div>
          </div>
          <div>
            <div className="text-[#1C1B1F] font-bold text-sm">98.4%</div>
            <div>Matching Accuracy</div>
          </div>
          <div>
            <div className="text-[#1C1B1F] font-bold text-sm">4.8★</div>
            <div>Industry Rating</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white border border-[#E1E2E6] rounded-3xl p-8 shadow-sm relative"
        >
          {/* Form Header */}
          <div className="space-y-2 mb-8 text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-[#1C1B1F]">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Enterprise Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-sm text-[#44474E]">
              {mode === 'login' && 'Enter details to access your BuildFlow dashboard'}
              {mode === 'signup' && 'Start discovering qualified construction tenders today'}
              {mode === 'forgot' && 'Provide your registered business email address'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#44474E]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474E]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-11 pr-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] focus:ring-1 focus:ring-[#2152FF]/10 text-[#1C1B1F] placeholder-[#44474E]/60 transition-all outline-none text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#44474E]">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474E]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] focus:ring-1 focus:ring-[#2152FF]/10 text-[#1C1B1F] placeholder-[#44474E]/60 transition-all outline-none text-sm"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#44474E]">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs font-medium text-[#2152FF] hover:text-[#1E49E6] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474E]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] focus:ring-1 focus:ring-[#2152FF]/10 text-[#1C1B1F] placeholder-[#44474E]/60 transition-all outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#44474E] hover:text-[#1C1B1F] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#44474E] font-sans">Business Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474E]" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-11 pr-4 py-3 bg-[#F8F9FB] border border-[#E1E2E6] rounded-xl focus:border-[#2152FF] focus:ring-1 focus:ring-[#2152FF]/10 text-[#1C1B1F] transition-all outline-none text-sm appearance-none cursor-pointer"
                  >
                    <option value="Company Admin">Company Admin (Access & Set up Company)</option>
                    <option value="Tender Manager">Tender Manager (Scan & Bid Tenders)</option>
                    <option value="Project Manager">Project Manager (Execution & Onsite)</option>
                    <option value="Finance Manager">Finance Manager (Accounts & Billing)</option>
                    <option value="Employee">Employee / Engineer</option>
                  </select>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded bg-white border-[#E1E2E6] text-[#2152FF] focus:ring-0 transition"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs font-medium text-[#44474E] select-none cursor-pointer">
                  Remember my company details
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#2152FF] hover:bg-[#1E49E6] text-white font-semibold text-sm shadow-md shadow-[#2152FF]/10 hover:shadow-[#2152FF]/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Sign In to Portal'}
                  {mode === 'signup' && 'Register Organization'}
                  {mode === 'forgot' && 'Send Reset Instructions'}
                </>
              )}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[#E1E2E6]" />
            </div>
            <div className="relative flex justify-center text-xs font-semibold uppercase">
              <span className="bg-white px-3 text-[#44474E]">Or continue with</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                showToast('Welcome to BuildFlow AI! Full Access Granted.', 'success');
                window.location.reload();
              }}
              className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Instant Full Access (No Email Required)
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-[#F8F9FB] hover:bg-[#F1F3F8] border border-[#E1E2E6] text-[#44474E] hover:text-[#1C1B1F] rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google Workspace
            </button>
          </div>

          {/* Footer controls */}
          <div className="mt-8 text-center text-xs text-[#44474E]">
            {mode === 'login' ? (
              <p>
                First time?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-semibold text-[#2152FF] hover:text-[#1E49E6] transition-colors"
                >
                  Create business account
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-semibold text-[#2152FF] hover:text-[#1E49E6] transition-colors"
                >
                  Sign In to organization
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
