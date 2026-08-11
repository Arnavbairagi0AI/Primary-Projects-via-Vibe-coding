import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "motion/react";
import { Shield, Sparkles, Building, Link, Mail, Lock, UserCheck } from "lucide-react";

export const Auth: React.FC = () => {
  const { signUpUser, loginUser, loginWithGoogle, loginWithApple } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithApple();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Apple Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState("");
  const [role, setRole] = useState<"Admin" | "Staff">("Admin");
  
  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!email || !password || !businessName) {
          throw new Error("Please fill in all required fields (Email, Password, Business Name)");
        }
        await signUpUser(email, password, businessName, googleBusinessUrl, role);
      } else {
        if (!email || !password) {
          throw new Error("Please enter your Email and Password");
        }
        await loginUser(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || "Authentication failed. Please check your inputs.";
      if (err.code === "auth/email-already-in-use") {
        errorMsg = "This email is already registered.";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        errorMsg = "Invalid email or password.";
      } else if (err.code === "auth/weak-password") {
        errorMsg = "Password must be at least 6 characters.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl shadow-xl shadow-indigo-500/10 text-white">
            <Sparkles className="h-8 w-8" id="logo-icon" />
          </div>
        </motion.div>
        
        <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
          ReviewMagnet AI
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {isSignUp ? "Boost your business reviews with AI automations" : "Log in to manage your customer reputation"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-[#0e131f] py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-800/80"
        >
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border-l-4 border-rose-500 rounded text-sm text-rose-400 flex items-start gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="block w-full pl-10 pr-3 py-2 bg-[#131a26] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 bg-[#131a26] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            {isSignUp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="space-y-4 overflow-hidden pt-1"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Business Name *
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      id="auth-business-name"
                      type="text"
                      required={isSignUp}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Star Dental Clinic"
                      className="block w-full pl-10 pr-3 py-2 bg-[#131a26] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Google Business Review URL
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Link className="h-4 w-4" />
                    </div>
                    <input
                      id="auth-business-url"
                      type="url"
                      value={googleBusinessUrl}
                      onChange={(e) => setGoogleBusinessUrl(e.target.value)}
                      placeholder="https://g.page/r/your-id/review"
                      className="block w-full pl-10 pr-3 py-2 bg-[#131a26] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Your Role
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      id="role-btn-admin"
                      type="button"
                      onClick={() => setRole("Admin")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 border rounded-lg text-xs font-medium focus:outline-none transition-colors ${
                        role === "Admin"
                          ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400"
                          : "bg-[#131a26] border-slate-800 text-slate-300 hover:bg-[#1a2333]"
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Admin (Owner)
                    </button>
                    <button
                      id="role-btn-staff"
                      type="button"
                      onClick={() => setRole("Staff")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 border rounded-lg text-xs font-medium focus:outline-none transition-colors ${
                        role === "Staff"
                          ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400"
                          : "bg-[#131a26] border-slate-800 text-slate-300 hover:bg-[#1a2333]"
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Staff Member
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </div>
              ) : isSignUp ? (
                "Create Business Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0e131f] px-3 text-slate-500 font-semibold tracking-wider">Or continue with</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              id="google-login-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-[#131a26] hover:bg-[#1c2638] border border-slate-800/80 rounded-xl text-xs font-bold text-slate-200 focus:outline-none transition-all cursor-pointer shadow-md shadow-black/10 hover:border-slate-700/80 disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google
            </button>

            <button
              id="apple-login-btn"
              type="button"
              onClick={handleAppleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-[#131a26] hover:bg-[#1c2638] border border-slate-800/80 rounded-xl text-xs font-bold text-slate-200 focus:outline-none transition-all cursor-pointer shadow-md shadow-black/10 hover:border-slate-700/80 disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.15.67-2.87 1.52-.63.73-1.18 1.87-1.03 2.97 1.1.09 2.21-.55 2.91-1.43z" />
              </svg>
              Apple (iOS)
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              id="auth-toggle-mode-btn"
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 focus:outline-none hover:underline"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
