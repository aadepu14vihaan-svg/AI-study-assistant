import React from 'react';
import { ScreenTab } from '../components/layout/Sidebar';

interface LandingScreenProps {
  onEnterApp: (tab?: ScreenTab) => void;
  onOpenAuth: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onEnterApp, onOpenAuth }) => {
  return (
    <div className="flex flex-col w-full pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-container to-secondary-container text-on-primary p-6 md:p-12 shadow-xl my-2">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-secondary-fixed/20 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold w-fit shadow-xs">
            <span className="material-symbols-outlined text-sm text-tertiary-fixed">verified</span>
            <span>Smart School Academic Platform • Built for High Achievers</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            The intelligent academic workspace for high-performing students.
          </h1>

          <p className="text-sm md:text-lg text-primary-fixed-dim leading-relaxed font-medium max-w-2xl">
            Unify your homework deadlines, weekly timetable, course syllabi, and deep focus timers in one luminous dashboard. Protected by private Supabase Row Level Security.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onEnterApp('dashboard')}
              className="bg-surface-container-lowest hover:bg-white text-primary px-6 py-3 rounded-xl font-extrabold text-sm md:text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <span>Launch Student Dashboard</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>

            <button
              onClick={onOpenAuth}
              className="bg-white/15 hover:bg-white/25 border border-white/20 text-white px-5 py-3 rounded-xl font-bold text-sm md:text-base backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">lock</span>
              <span>Supabase Login / Sign Up</span>
            </button>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-primary-fixed-dim">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-tertiary-fixed">check_circle</span>
              <span>Row Level Security (RLS)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-tertiary-fixed">check_circle</span>
              <span>Kanban &amp; Timetable Views</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-tertiary-fixed">check_circle</span>
              <span>Offline &amp; Local Demo Mode</span>
            </span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-fixed px-3 py-1 rounded-full">
            Complete Feature Suite
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
            Engineered around how top students actually study
          </h2>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Designed according to Google Stitch specifications with high cognitive clarity and zero clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div
            onClick={() => onEnterApp('dashboard')}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">dashboard</span>
              </div>
              <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                Student Dashboard
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Live metrics, upcoming exams countdown, today&apos;s schedule timeline, and active course grade breakdown.
              </p>
            </div>
            <span className="text-xs font-bold text-primary flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
              <span>View Dashboard</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => onEnterApp('homework-tasks')}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">view_kanban</span>
              </div>
              <h3 className="text-base font-bold text-on-surface group-hover:text-secondary transition-colors">
                Homework &amp; Assignments Hub
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                4-column Kanban board and dense table list with subtasks, word counts, code sandboxes, and file attachments.
              </p>
            </div>
            <span className="text-xs font-bold text-secondary flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
              <span>Explore Kanban</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => onEnterApp('weekly-calendar')}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">calendar_month</span>
              </div>
              <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                Weekly Academic Planner
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                14-hour visual schedule grid from 7:00 to 20:00 with active time markers and quick event addition drawer.
              </p>
            </div>
            <span className="text-xs font-bold text-primary flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
              <span>Open Timetable</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>

          {/* Card 4 */}
          <div
            onClick={() => onEnterApp('subjects-courses')}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl text-tertiary">calculate</span>
              </div>
              <h3 className="text-base font-bold text-on-surface group-hover:text-tertiary transition-colors">
                Course GPA Modeling
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Interactive final exam slider calculator to simulate grade shifts, term credit standing, and Honors list tracking.
              </p>
            </div>
            <span className="text-xs font-bold text-tertiary flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
              <span>Simulate Grades</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>
        </div>
      </section>

      {/* Supabase RLS Explainer Card */}
      <section className="bg-surface-container-low p-6 md:p-8 rounded-3xl border border-surface-container my-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-base">security</span>
            <span>Security Architecture &amp; Privacy</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-on-surface">
            Private Data Guaranteed via Supabase Row Level Security
          </h3>
          <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
            Every homework assignment and course document is tied to the student&apos;s authenticated UUID (`auth.uid()`). Strict Postgres database policies ensure no student can ever view, query, or edit another student&apos;s homework.
          </p>
        </div>

        <button
          onClick={onOpenAuth}
          className="bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all whitespace-nowrap flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">settings</span>
          <span>View Supabase Setup &amp; RLS</span>
        </button>
      </section>
    </div>
  );
};
