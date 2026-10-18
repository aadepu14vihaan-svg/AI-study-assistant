import React, { useState, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { getSupabaseClient } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    supabaseUser, 
    isSupabaseReady, 
    signIn, 
    signUp, 
    resetPassword, 
    signOut, 
    updateSupabaseConfig, 
    disconnectSupabase 
  } = useAcademic();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'reset' | 'config'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Email verification pending state & rate-limiting cooldown
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Supabase Config state
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('smart_school_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('smart_school_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');

  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(c => Math.max(0, c - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setStatusMessage({ text: error, isError: true });
    } else {
      setStatusMessage({ text: 'Successfully logged in!', isError: false });
      setTimeout(onClose, 800);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setLoading(true);

    const { error, message } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      setStatusMessage({ text: error, isError: true });
    } else {
      setVerificationPending(true);
      setResendCooldown(60);
      setStatusMessage({ 
        text: message || 'Account registered! Please check your email inbox to verify.', 
        isError: false 
      });
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !email.trim() || resendLoading) return;
    setResendLoading(true);
    setStatusMessage(null);

    const client = getSupabaseClient();
    if (!client) {
      setStatusMessage({ text: 'Supabase client is not connected.', isError: true });
      setResendLoading(false);
      return;
    }

    try {
      const { error } = await client.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setStatusMessage({ text: `Could not resend: ${error.message}`, isError: true });
      } else {
        setStatusMessage({ text: 'Verification email resent! Please check your inbox and spam folder.', isError: false });
        setResendCooldown(60);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error resending email';
      setStatusMessage({ text: msg, isError: true });
    } finally {
      setResendLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setLoading(true);

    const { error, message } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setStatusMessage({ text: error, isError: true });
    } else {
      setStatusMessage({ 
        text: message || 'Password reset link sent to your email!', 
        isError: false 
      });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setLoading(true);

    const res = await updateSupabaseConfig(supabaseUrl, supabaseKey);
    setLoading(false);

    if (res.success) {
      setStatusMessage({ text: res.message, isError: false });
    } else {
      setStatusMessage({ text: `Connection test failed: ${res.message}`, isError: true });
    }
  };

  const copySqlSchema = () => {
    const sql = `-- Smart School Homework Planner RLS Schema
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  grade text default 'Class 10',
  country text default 'India',
  state text default 'Telangana',
  education_board text default 'CBSE',
  state_board_name text,
  preferred_language text default 'English',
  subjects jsonb default '["Mathematics", "Science", "Social Science", "English", "Computer Science"]'::jsonb,
  academic_goals text,
  preferred_study_times text,
  learning_preferences jsonb,
  onboarding_completed boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);`;

    navigator.clipboard.writeText(sql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150 border border-surface-container">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">lock_person</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-on-surface">Supabase Student Authentication</h3>
              <p className="text-xs text-on-surface-variant">
                Enforcing student privacy &amp; Row Level Security (RLS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-xl hover:bg-surface-container cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2 ${
              statusMessage.isError
                ? 'bg-error-container text-on-error-container border border-error/30'
                : 'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30'
            }`}
          >
            <span className="material-symbols-outlined text-base shrink-0">
              {statusMessage.isError ? 'error' : 'check_circle'}
            </span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Verification Pending Screen */}
        {verificationPending ? (
          <div className="p-6 bg-surface-container-low rounded-2xl border border-surface-container flex flex-col items-center text-center gap-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">mark_email_unread</span>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-bold text-on-surface">Email Verification Pending</h4>
              <p className="text-xs text-on-surface-variant max-w-sm">
                We sent a confirmation link to <strong className="text-on-surface">{email}</strong>. Clicking the link will redirect you back to this platform.
              </p>
            </div>

            <div className="p-3 bg-primary-fixed/20 rounded-xl text-[11px] text-on-surface border border-primary/20 text-left">
              <strong>Next Step:</strong> After clicking the verification link in your inbox, sign in to customize your curriculum (Grade, Education Board, and Subjects).
            </div>

            <div className="flex items-center gap-2 pt-2 w-full">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || resendLoading}
                className="flex-1 bg-surface-container-high hover:bg-surface-container disabled:opacity-50 text-on-surface text-xs font-bold py-2.5 rounded-xl border border-surface-container transition-all cursor-pointer"
              >
                {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Verification Email'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerificationPending(false);
                  setActiveTab('signin');
                }}
                className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center bg-surface-container p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reset');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'reset'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('config');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'config'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">settings</span>
                <span>Config</span>
              </button>
            </div>

            {/* SIGN IN FORM */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Student Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.student@smartschool.edu"
                    className="w-full bg-surface-container-low text-on-surface text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary border border-surface-container"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-on-surface">Password</label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reset')}
                      className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-surface-container-low text-on-surface text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary border border-surface-container"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                  <span>Sign In</span>
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Vance"
                    className="w-full bg-surface-container-low text-on-surface text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary border border-surface-container"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">School Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.student@smartschool.edu"
                    className="w-full bg-surface-container-low text-on-surface text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary border border-surface-container"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-surface-container-low text-on-surface text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary border border-surface-container"
                  />
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl text-[11px] text-on-surface-variant flex items-center gap-2 border border-surface-container">
                  <span className="material-symbols-outlined text-tertiary text-base">verified_user</span>
                  <span>Row Level Security (RLS) guarantees only you can view your private assignments.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                  <span>Create Student Account</span>
                </button>
              </form>
            )}

            {/* PASSWORD RESET FORM */}
            {activeTab === 'reset' && (
              <form onSubmit={handleReset} className="flex flex-col gap-3">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Enter your registered student email address. Supabase will send a secure recovery link that redirects directly to this website.
                </p>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@school.edu"
                    className="w-full bg-surface-container-low text-on-surface text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary border border-surface-container"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                  <span>Send Recovery Email</span>
                </button>
              </form>
            )}

            {/* CONFIG TAB */}
            {activeTab === 'config' && (
              <form onSubmit={handleSaveConfig} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">Supabase URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-xl font-mono border border-surface-container outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-xl font-mono border border-surface-container outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={copySqlSchema}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    <span>{copiedSchema ? 'SQL Copied!' : 'Copy Schema'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isSupabaseReady && (
                      <button
                        type="button"
                        onClick={disconnectSupabase}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-error hover:bg-error-container cursor-pointer"
                      >
                        Disconnect
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl font-bold shadow-xs cursor-pointer"
                    >
                      Save &amp; Test
                    </button>
                  </div>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
