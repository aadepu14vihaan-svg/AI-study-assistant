import React, { useState, useEffect, useRef } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { ScreenTab } from '../layout/Sidebar';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ScreenTab) => void;
  onSelectTask?: (taskId: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { assignments, courses, calendarEvents } = useAcademic();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
          // triggers open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingAssignments = q
    ? assignments.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.course.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      )
    : assignments.slice(0, 4);

  const matchingCourses = q
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q)
      )
    : courses.slice(0, 3);

  const matchingEvents = q
    ? calendarEvents.filter(
        (ev) =>
          ev.title.toLowerCase().includes(q) ||
          ev.course.toLowerCase().includes(q) ||
          ev.location?.toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-start justify-center p-4 pt-16 md:pt-24">
      <div className="bg-surface-container-lowest max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden border border-surface-container flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-surface-container">
          <span className="material-symbols-outlined text-on-surface-variant text-xl mr-2.5">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assignments, courses, schedule, notes..."
            className="w-full bg-transparent text-on-surface text-sm font-medium outline-none placeholder:text-outline"
          />
          <button
            onClick={onClose}
            className="text-[10px] bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded font-mono font-semibold"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-2">
          {/* Quick Nav Presets */}
          {!q && (
            <div className="p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline px-1">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1.5">
                {[
                  { tab: 'dashboard' as ScreenTab, label: 'Dashboard', icon: 'dashboard' },
                  { tab: 'homework-tasks' as ScreenTab, label: 'Homework', icon: 'assignment' },
                  { tab: 'weekly-calendar' as ScreenTab, label: 'Calendar', icon: 'calendar_month' },
                  { tab: 'subjects-courses' as ScreenTab, label: 'Courses', icon: 'school' },
                ].map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => {
                      onNavigate(item.tab);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-primary">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assignments */}
          {matchingAssignments.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline px-3">
                Homework & Tasks ({matchingAssignments.length})
              </span>
              <div className="flex flex-col gap-1 mt-1">
                {matchingAssignments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      onNavigate('homework-tasks');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-low text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`material-symbols-outlined text-lg ${a.completed ? 'text-tertiary' : 'text-primary'}`}>
                        {a.completed ? 'check_circle' : 'assignment'}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate group-hover:text-primary transition-colors ${a.completed ? 'line-through text-outline' : 'text-on-surface'}`}>
                          {a.title}
                        </p>
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-2">
                          <span>{a.course}</span>
                          <span>•</span>
                          <span className={a.priority === 'urgent' ? 'text-error font-semibold' : ''}>
                            {a.due_time_display || 'Upcoming'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant uppercase">
                      {a.status.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          {matchingCourses.length > 0 && (
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline px-3">
                Courses ({matchingCourses.length})
              </span>
              <div className="flex flex-col gap-1 mt-1">
                {matchingCourses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onNavigate('subjects-courses');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-low text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-lg text-secondary">school</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{c.title}</p>
                        <p className="text-[11px] text-on-surface-variant">{c.code} • {c.instructor}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">
                      {c.grade_pct}% ({c.grade_letter})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar Events */}
          {matchingEvents.length > 0 && (
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline px-3">
                Calendar Sessions
              </span>
              <div className="flex flex-col gap-1 mt-1">
                {matchingEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => {
                      onNavigate('weekly-calendar');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-low text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{ev.title}</p>
                        <p className="text-[11px] text-on-surface-variant">{ev.start_time_display} - {ev.end_time_display} • {ev.location || ev.course}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-outline">{ev.event_type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && matchingAssignments.length === 0 && matchingCourses.length === 0 && matchingEvents.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant text-xs flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-3xl text-outline">search_off</span>
              <span className="font-semibold text-on-surface">No academic matches found for &quot;{query}&quot;</span>
              <span className="text-[11px]">Try searching by course name, task topic, or teacher.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
