import React from 'react';
import { useAcademic } from '../../context/AcademicContext';

export type ScreenTab =
  | 'dashboard'
  | 'homework-tasks'
  | 'weekly-calendar'
  | 'subjects-courses'
  | 'study-assistant'
  | 'ai-notes'
  | 'quiz-practice'
  | 'study-planner'
  | 'official-resources'
  | 'study-sessions-timer'
  | 'analytics-insights'
  | 'settings'
  | 'landing';

interface SidebarProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAuth: () => void;
}

const NAV_ITEMS: { id: ScreenTab; label: string; icon: string; badge?: string; badgeColor?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'homework-tasks', label: 'Homework & Tasks', icon: 'assignment' },
  { id: 'weekly-calendar', label: 'Weekly Calendar', icon: 'calendar_month' },
  { id: 'subjects-courses', label: 'Subjects & Courses', icon: 'school' },
  { id: 'study-assistant', label: 'AI Study Assistant', icon: 'psychology', badge: 'Gemini', badgeColor: 'bg-primary-fixed text-primary' },
  { id: 'ai-notes', label: 'AI Notes & Revision', icon: 'auto_stories' },
  { id: 'quiz-practice', label: 'AI Quiz Practice', icon: 'quiz', badge: 'Adaptive', badgeColor: 'bg-secondary-fixed text-secondary' },
  { id: 'study-planner', label: 'Smart Study Planner', icon: 'event_repeat' },
  { id: 'official-resources', label: 'Official Resources', icon: 'verified', badge: 'NCERT', badgeColor: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  { id: 'study-sessions-timer', label: 'Study Sessions & Timer', icon: 'timer' },
  { id: 'analytics-insights', label: 'Analytics & Insights', icon: 'insights' },
  { id: 'settings', label: 'Settings & Profile', icon: 'settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  onOpenAuth,
}) => {
  const { lastSyncedText, isSyncing, supabaseUser, signOut } = useAcademic();

  const handleNav = (tab: ScreenTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col justify-between py-3.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-3 min-h-0 flex-1">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between px-4 shrink-0">
            <button
              onClick={() => handleNav('dashboard')}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity text-left"
            >
              <img
                alt="Smart School Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1VgWaFFlJgTv-jxyQgkaAczvjPC14o5f9UnVYQxgaIA9HcnK2ZAA_JtbMLoej8-oySgRN-Duluh8BGCYBmnISiauqYIdhNXV4nWytdsBJmpm_bE11ZvQeRMTiaYPHD4bmAPORS7Atgko87K6NnsOmJCEzTwIlLjYiH7fcPv0aeZpu-5etUxkEwINX8guWIqmBXqSiNbOps-SsxmNZbP181Xksc4Hk3WKbiLtuGA9-xo6WIhktD1pWniWQw"
              />
              <div>
                <span className="text-base text-primary font-extrabold tracking-tight block leading-tight">Smart School</span>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">AI Learning Platform</span>
              </div>
            </button>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5 px-2.5 overflow-y-auto flex-1 pr-1.5 custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="material-symbols-outlined text-lg shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${item.badgeColor || 'bg-surface-container text-on-surface-variant'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: Sync status & User session */}
        <div className="px-3.5 flex flex-col gap-1.5 pt-2 border-t border-surface-container shrink-0">
          {/* Quick link to Landing page presentation */}
          <button
            onClick={() => handleNav('landing')}
            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentTab === 'landing'
                ? 'bg-primary-fixed text-primary'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">explore</span>
              <span>Landing &amp; Tour</span>
            </span>
            <span className="text-[9px] uppercase font-bold bg-surface-container-high px-1.5 py-0.5 rounded">
              Tour
            </span>
          </button>

          {/* Sync indicator */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-container">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSyncing ? 'bg-secondary animate-ping' : 'bg-tertiary-container'
                }`}
              ></span>
              <span className="text-[11px] font-semibold text-on-surface-variant truncate">
                {isSyncing ? 'Syncing...' : lastSyncedText}
              </span>
            </div>
            <span className="material-symbols-outlined text-base text-tertiary shrink-0">cloud_done</span>
          </div>

          {/* Log Out or Sign In */}
          {supabaseUser ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-colors text-xs font-bold"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Log Out</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-primary hover:bg-primary-fixed/40 transition-colors text-xs font-bold"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">login</span>
                <span>Sign In / Connect</span>
              </span>
              <span className="text-[9px] font-bold bg-primary text-on-primary px-1.5 py-0.5 rounded">
                Cloud
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
