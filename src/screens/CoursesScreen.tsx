import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { Course } from '../types';

interface CoursesScreenProps {
  onOpenEnrollModal: () => void;
  onOpenGradeModal: (course: Course) => void;
  onOpenNewTaskForCourse: (courseTitle: string) => void;
}

export const CoursesScreen: React.FC<CoursesScreenProps> = ({
  onOpenEnrollModal,
  onOpenGradeModal,
  onOpenNewTaskForCourse,
}) => {
  const { courses, assignments } = useAcademic();

  const [selectedSemester, setSelectedSemester] = useState('Fall Semester 2024');
  const [filterText, setFilterText] = useState('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const filteredCourses = courses.filter((c) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleAuditTranscript = () => {
    alert(
      `Academic Transcript Audit Generated:\n\n• Term: ${selectedSemester}\n• GPA: 3.88 (Unweighted)\n• Enrolled Credits: 24.0 Units\n• Standing: Honors Dean's List Eligible (Top 2%)\n• Verified via Registrar System`
    );
  };

  const pendingHomeworkTotal = assignments.filter((a) => !a.completed).length;

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Utility & Header Bar */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-primary uppercase font-bold tracking-wider bg-primary-fixed px-2 py-0.5 rounded">
              Academic Workspace
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
            <span className="text-xs text-on-surface-variant flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-xs text-tertiary">check_circle</span>
              <span>{courses.length} Courses Active</span>
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              Subjects &amp; Courses
            </h1>
            <div className="relative inline-flex items-center">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="appearance-none bg-surface-container-low text-primary text-sm md:text-base font-bold pl-2 pr-7 py-1 rounded-lg outline-none cursor-pointer hover:bg-surface-container transition-all"
              >
                <option value="Fall Semester 2024">Fall Semester 2024</option>
                <option value="Spring Semester 2025 (Upcoming)">Spring Semester 2025 (Upcoming)</option>
                <option value="Spring Semester 2024 (Archived)">Spring Semester 2024 (Archived)</option>
              </select>
              <span className="material-symbols-outlined absolute right-1 pointer-events-none text-primary text-lg">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Actions & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
              filter_list
            </span>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter courses or teachers..."
              className="w-full bg-surface-container-lowest text-on-surface text-xs md:text-sm pl-8 pr-3 py-2 rounded-lg outline-none shadow-xs border border-surface-container focus:ring-2 focus:ring-primary transition-all placeholder:text-outline"
            />
          </div>

          <div className="inline-flex p-1 bg-surface-container-low rounded-lg border border-surface-container">
            <button
              onClick={() => setLayoutMode('grid')}
              type="button"
              className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
                layoutMode === 'grid'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              type="button"
              className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
                layoutMode === 'list'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="List View"
            >
              <span className="material-symbols-outlined text-base">view_list</span>
            </button>
          </div>

          <button
            onClick={onOpenEnrollModal}
            type="button"
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Enroll / Add Course</span>
          </button>
        </div>
      </section>

      {/* Performance Metabar & Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 my-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Current Term GPA</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-on-surface">3.88</span>
              <span className="text-xs text-tertiary font-bold flex items-center">
                <span className="material-symbols-outlined text-xs">trending_up</span>+0.12
              </span>
            </div>
            <span className="text-xs text-outline">Unweighted Scale 4.0</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Enrolled Credits</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-on-surface">24</span>
              <span className="text-xs text-on-surface-variant font-semibold">Credits</span>
            </div>
            <span className="text-xs text-outline">6 AP &amp; Honors Tracks</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-2xl">auto_stories</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Pending Homework</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-on-surface">{pendingHomeworkTotal}</span>
              <span className="text-xs text-error font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">priority_high</span> 2 Due Today
              </span>
            </div>
            <span className="text-xs text-outline">Across 4 subjects</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Sync Status</span>
            <div className="flex items-center gap-1 pt-1">
              <span className="inline-flex items-center gap-1 text-xs bg-surface-container px-2 py-0.5 rounded text-tertiary font-bold">
                <span className="material-symbols-outlined text-sm">sync</span> Google Classroom
              </span>
            </div>
            <span className="text-xs text-outline pt-1">Auto-updated 12m ago</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-2xl">cloud_sync</span>
          </div>
        </div>
      </section>

      {/* 6 Rich Academic Course Cards Bento Grid */}
      <section
        className={`my-3 gap-6 ${
          layoutMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            : 'grid grid-cols-1'
        }`}
      >
        {filteredCourses.map((course) => {
          // Color bar top class
          let topBarClass = 'bg-primary-container';
          if (course.accent_color === 'tertiary') topBarClass = 'bg-tertiary-container';
          else if (course.accent_color === 'secondary') topBarClass = 'bg-secondary';
          else if (course.accent_color === 'error') topBarClass = 'bg-error';
          else if (course.accent_color === 'surface-tint') topBarClass = 'bg-surface-tint';

          const pendingCount = assignments.filter((a) => a.course === course.title && !a.completed).length;

          return (
            <article
              key={course.id}
              className="bg-surface-container-lowest rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group border border-surface-container"
            >
              {/* Accent Color Bar */}
              <div className={`h-2 w-full ${topBarClass}`}></div>

              <div className="p-5 flex flex-col gap-4">
                {/* Header Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="bg-primary-fixed text-primary text-[10px] uppercase px-2 py-0.5 rounded font-bold">
                        {course.code}
                      </span>
                      <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary">meeting_room</span>
                        <span>{course.room}</span>
                      </span>
                    </div>
                    <h2 className="text-base md:text-lg font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {course.title}
                    </h2>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-sm">person</span>
                      <span>{course.instructor}</span>
                    </p>
                  </div>

                  {/* Grade Pill */}
                  <div className="flex flex-col items-end">
                    <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold">
                      <span className="text-sm md:text-base font-extrabold">{course.grade_pct}%</span>
                      <span className="text-[10px] bg-primary text-on-primary px-1 rounded">
                        {course.grade_letter}
                      </span>
                    </div>
                    <span className="text-[10px] text-outline mt-1 font-semibold">{course.credits.toFixed(1)} Weighted</span>
                  </div>
                </div>

                {/* Contact & Schedule Details */}
                <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1 text-on-surface-variant text-xs border border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-outline truncate mr-2">
                      <span className="material-symbols-outlined text-xs">mail</span>
                      <span>{course.email}</span>
                    </span>
                    <button
                      onClick={() => handleCopyEmail(course.email)}
                      className="text-[10px] font-bold text-primary hover:underline shrink-0"
                    >
                      {copiedEmail === course.email ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-outline pt-0.5">
                    <span className="material-symbols-outlined text-xs">event_available</span>
                    <span className="truncate">Office Hours: <strong>{course.office_hours}</strong></span>
                  </div>
                </div>

                {/* Curriculum Progress Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-medium">Curriculum Progress</span>
                    <span className="text-xs font-bold text-primary">{course.progress_pct}% Covered</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${topBarClass}`}
                      style={{ width: `${course.progress_pct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Active Deliverables Badges */}
                <div className="flex flex-col gap-1.5 pt-0.5">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                    Active Deliverables
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <div className="bg-surface-container px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-on-surface text-xs font-medium">
                      <span className="material-symbols-outlined text-sm text-primary">assignment</span>
                      <span>{pendingCount} Pending Tasks</span>
                    </div>
                    {course.active_deliverables.map((deliv, i) => (
                      <div
                        key={i}
                        className="bg-error-container text-on-error-container px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs font-semibold"
                      >
                        <span className="material-symbols-outlined text-xs">notification_important</span>
                        <span>{deliv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Links Hub */}
                <div className="flex items-center gap-3 pt-1 text-on-surface-variant text-xs border-t border-surface-container">
                  <span className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-sm">description</span> Syllabus
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-sm">slideshow</span> Lecture Slides
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="text-outline font-semibold">{course.resources.notes_count} Notes</span>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="p-3.5 bg-surface-container-low flex items-center justify-between gap-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => onOpenGradeModal(course)}
                  className="flex items-center gap-1 text-primary hover:text-on-primary-container hover:bg-primary-container/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-base">calculate</span>
                  <span>Calc Grade</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenNewTaskForCourse(course.title)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    title="Add Task for this Course"
                  >
                    <span className="material-symbols-outlined text-base">add_task</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenGradeModal(course)}
                    className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1 shadow-xs"
                  >
                    <span>Course Hub</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Semester GPA Projection & Credit Breakdown Summary Bar */}
      <section className="mt-4 bg-surface-container-lowest p-5 md:p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4">
            {/* Circular Progress Ring Graphic */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-high"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-tertiary transition-all duration-1000 ease-out"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="96, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute text-base font-extrabold text-on-surface">3.88</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-on-surface">Fall 2024 Cumulative Standing</span>
              <span className="text-xs text-outline">Targeting Valedictorian Standard (Current rank: Top 2%)</span>
            </div>
          </div>

          {/* Honors Dean's List Badge */}
          <div className="flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed px-3 py-2 rounded-xl">
            <span className="material-symbols-outlined text-2xl text-tertiary">workspace_premium</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">Honors Dean&apos;s List Eligible</span>
              <span className="text-[10px] opacity-90 font-medium">Maintained &gt; 3.80 across &ge; 20 Credits</span>
            </div>
          </div>
        </div>

        {/* Credit Breakdown Blocks */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-surface-container">
            <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase font-bold">STEM Credits</span>
              <span className="text-xs font-bold text-on-surface">16.0 Units</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-surface-container">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase font-bold">Humanities</span>
              <span className="text-xs font-bold text-on-surface">8.0 Units</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-surface-container">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase font-bold">Total Term</span>
              <span className="text-xs font-bold text-on-surface">24.0 Credits</span>
            </div>
          </div>

          <button
            onClick={handleAuditTranscript}
            type="button"
            className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Audit Transcript</span>
          </button>
        </div>
      </section>
    </div>
  );
};
