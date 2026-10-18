import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';

interface HeaderProps {
  onOpenNewTask: () => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onToggleSidebarMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewTask,
  onOpenSearch,
  onOpenAuth,
  onToggleSidebarMobile,
}) => {
  const { user, supabaseUser, isSupabaseReady, signOut } = useAcademic();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 z-40 bg-surface/85 backdrop-blur-md border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-all">
      <div className="w-full h-16 px-4 lg:px-6 flex items-center justify-between gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          aria-label="Open sidebar menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {/* Quick Search Bar */}
        <div className="flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
            search
          </span>
          <input
            onClick={onOpenSearch}
            readOnly
            className="w-full bg-surface-container-lowest text-on-surface text-xs md:text-sm pl-9 pr-14 md:pr-16 py-2 rounded-lg outline-none ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary placeholder:text-outline cursor-pointer shadow-xs transition-all"
            placeholder="Quick search tasks, courses, notes..."
            type="text"
          />
          <button
            onClick={onOpenSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant text-[10px] md:text-xs font-semibold hover:bg-surface-container-highest transition-colors"
          >
            Cmd+K
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Supabase Status Pill */}
          <button
            onClick={onOpenAuth}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
              isSupabaseReady
                ? 'bg-tertiary-fixed/30 text-tertiary-container border-tertiary/20 hover:bg-tertiary-fixed/50'
                : 'bg-surface-container-high text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-highest'
            }`}
            title={isSupabaseReady ? 'Connected to Supabase' : 'Running in Local Demo Mode. Click to connect Supabase.'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseReady ? 'bg-tertiary animate-pulse' : 'bg-outline'
              }`}
            ></span>
            <span>{isSupabaseReady ? (supabaseUser ? 'Supabase Synced' : 'Supabase Live') : 'Demo Mode'}</span>
          </button>

          {/* + New Task Button */}
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            type="button"
          >
            <span className="material-symbols-outlined text-base md:text-lg">add</span>
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
              aria-label="View notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <span className="font-bold text-sm text-on-surface">Academic Alerts</span>
                  <span className="text-[10px] font-bold bg-error-container text-on-error-container px-1.5 py-0.5 rounded">2 Urgent</span>
                </div>
                <div className="flex flex-col gap-2 mt-2 max-h-72 overflow-y-auto">
                  <div className="p-2 rounded-lg bg-error-container/40 flex items-start gap-2 text-xs">
                    <span className="material-symbols-outlined text-error text-base shrink-0">alarm</span>
                    <div>
                      <p className="font-bold text-on-surface">Chemistry Lab Due Today 4:00 PM</p>
                      <p className="text-on-surface-variant text-[11px]">Calibration spectrophotometry submission closes in 2 hours.</p>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low flex items-start gap-2 text-xs">
                    <span className="material-symbols-outlined text-primary text-base shrink-0">event</span>
                    <div>
                      <p className="font-bold text-on-surface">Physics Midterm in 5 Days</p>
                      <p className="text-on-surface-variant text-[11px]">Chapters 1–4 limits & rotational review session scheduled.</p>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low flex items-start gap-2 text-xs">
                    <span className="material-symbols-outlined text-tertiary text-base shrink-0">grade</span>
                    <div>
                      <p className="font-bold text-on-surface">New Grade Recorded: 98/100</p>
                      <p className="text-on-surface-variant text-[11px]">Normal Distribution Quiz published by Dr. Sarah Vance.</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-full mt-2 pt-2 border-t border-surface-container text-center text-xs font-bold text-primary hover:underline"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <img
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                src={user.avatar_url}
              />
              <span className="material-symbols-outlined text-on-surface-variant text-base hidden md:inline">
                expand_more
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2.5 pb-3 border-b border-surface-container">
                  <img
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                    src={user.avatar_url}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{user.full_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    <span className="text-[10px] font-bold text-primary bg-primary-fixed px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      {user.current_term}
                    </span>
                  </div>
                </div>

                <div className="py-2 flex flex-col gap-1 text-xs font-semibold text-on-surface">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenAuth();
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container text-left transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-primary">cloud</span>
                    <span>Supabase Cloud Sync</span>
                  </button>
                  <div className="px-2.5 py-1.5 text-on-surface-variant text-[11px]">
                    Streak: <strong>{user.streak_days} days</strong> • Rank: <strong>#{user.honor_roll_rank}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-container">
                  {supabaseUser ? (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-error hover:bg-error-container hover:text-on-error-container text-xs font-bold transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      <span>Sign Out (Supabase)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenAuth();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary-fixed/40 text-xs font-bold transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-base">login</span>
                      <span>Sign In / Create Account</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
