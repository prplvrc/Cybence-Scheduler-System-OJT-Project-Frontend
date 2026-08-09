import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { login } from "../api/auth.api";
import logo from "../assets/cybence-logo.png";

type LoginProps = {
  onLoginSuccess: (user: { id: string; name: string; role: string }) => void;
};

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const resetEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isForgotMode) {
      resetEmailRef.current?.focus();
    }
  }, [isForgotMode]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const result = await login({
        email,
        password,
      });

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      onLoginSuccess({
        id: String(result.user.id),
        name: result.user.name,
        role: result.user.role,
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid email or password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    window.setTimeout(() => {
      setIsLoading(false);
      setResetSent(true);
    }, 1200);
  };

  const clearError = () => {
    if (error) setError(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 p-4 overflow-hidden select-none">
      
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[50vh] rotate-[-25deg] rounded-[100%] bg-linear-to-br from-[#106fb8]/35 to-sky-300/20 blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[75vw] h-[55vh] rotate-20deg rounded-[100%] bg-linear-to-tl from-sky-400/35 to-[#106fb8]/20 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl h-100 rounded-full bg-sky-200/30 blur-[150px]" />
      </div>

      {/* Card Container */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 shadow-[0_15px_35px_rgba(0,0,0,0.06)] transition-all sm:p-7">
        
        {/* Accent Bar */}
        <div className="absolute left-0 top-0 h-1 w-full bg-linear-to-r from-sky-400 to-[#106fb8]" />

        {/* Header */}
        <div className="mb-5 flex flex-col items-center text-center">
          <img 
            src={logo} 
            alt="Cybence Logo" 
            className="mb-2 h-10 w-auto object-contain transition-all sm:h-12" 
          />
          <h1 className="text-[1.6rem] sm:text-[1.8rem] font-bold tracking-tight text-slate-900 leading-tight">
            Cybence IT Solutions <br /> Scheduler
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {isForgotMode ? "Reset your account password" : "Sign in to continue"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div 
            role="alert"
            aria-live="assertive"
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/80 p-2.5 text-xs font-semibold text-red-600"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {!isForgotMode ? (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="mb-1 block text-xs font-semibold text-slate-700">
                Email
              </label>
              <div className="group relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-[#106fb8]" />
                <input
                  id="username"
                  type="text"
                  placeholder="Email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    clearError();
                    setEmail(e.target.value);
                  }}
                  required
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-[#106fb8] focus:bg-white focus:ring-4 focus:ring-[#106fb8]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="group relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-[#106fb8]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    clearError();
                    setPassword(e.target.value);
                  }}
                  required
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-[#106fb8] focus:bg-white focus:ring-4 focus:ring-[#106fb8]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex cursor-pointer select-none items-center gap-1.5 text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-[#106fb8] focus:ring-[#106fb8]/30 accent-[#106fb8]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsForgotMode(true);
                }}
                className="font-medium text-[#106fb8] transition-colors hover:underline hover:text-[#0e5ea4] focus:outline-none cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            
            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#106fb8] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#106fb8]/20 transition-all hover:bg-[#0e5ea4] hover:shadow-lg hover:shadow-[#106fb8]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing In...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        ) : (
          /* Forgot Password Mode */
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            {resetSent ? (
              <div className="text-center space-y-3 py-1">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="text-xs text-slate-600">
                  Password reset link sent to <strong className="text-slate-800">{resetEmail}</strong>. Check your inbox.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResetSent(false);
                    setIsForgotMode(false);
                  }}
                  className="mt-1 text-xs font-semibold text-[#106fb8] hover:underline cursor-pointer"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="reset-email" className="mb-1 block text-xs font-semibold text-slate-700">
                    Email or Username
                  </label>
                  <div className="group relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-[#106fb8]" />
                    <input
                      id="reset-email"
                      ref={resetEmailRef}
                      type="text"
                      placeholder="Enter your email or username"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-[#106fb8] focus:bg-white focus:ring-4 focus:ring-[#106fb8]/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#106fb8] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#106fb8]/20 transition-all hover:bg-[#0e5ea4] hover:shadow-lg hover:shadow-[#106fb8]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(false)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back to sign in
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}