import React from 'react';
import { useAcademic } from '../context/AcademicContext';

export const AnalyticsScreen: React.FC = () => {
  const { user, courses, assignments } = useAcademic();

  const completedCount = assignments.filter((a) => a.completed).length;
  const totalCount = assignments.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between py-3 mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">insights</span>
            <span>Academic Performance Telemetry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Analytics &amp; Insights
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-tertiary-fixed text-on-tertiary-fixed font-bold px-3 py-1 rounded-full">
            Top 2% Overall Standing
          </span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex flex-col justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Current Term GPA</span>
          <div className="text-3xl font-extrabold text-on-surface mt-2 flex items-baseline gap-2">
            <span>3.88</span>
            <span className="text-xs text-tertiary font-bold">+0.12 (A Avg)</span>
          </div>
          <span className="text-xs text-outline mt-2">Targeting Valedictorian: 3.90+</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex flex-col justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Assignment Velocity</span>
          <div className="text-3xl font-extrabold text-on-surface mt-2 flex items-baseline gap-2">
            <span>{completionPercentage}%</span>
            <span className="text-xs text-primary font-bold">{completedCount}/{totalCount} Finished</span>
          </div>
          <span className="text-xs text-outline mt-2">1.2 days ahead of syllabus schedule</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex flex-col justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Study Consistency</span>
          <div className="text-3xl font-extrabold text-secondary mt-2 flex items-baseline gap-2">
            <span>{user.streak_days} Days</span>
            <span className="text-xs text-secondary font-bold">Streak 🔥</span>
          </div>
          <span className="text-xs text-outline mt-2">Personal best streak: 21 days</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex flex-col justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Weekly Study Hours</span>
          <div className="text-3xl font-extrabold text-on-surface mt-2 flex items-baseline gap-2">
            <span>14.5</span>
            <span className="text-xs text-on-surface-variant font-normal">/ 18.0 Target</span>
          </div>
          <span className="text-xs text-tertiary font-bold mt-2">80.5% of weekly goal completed</span>
        </div>
      </div>

      {/* Course Grade Matrix */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 md:p-6 shadow-sm border border-surface-container mb-6">
        <h2 className="text-base font-bold text-on-surface mb-4">Course Grade Standing &amp; Weights</h2>

        <div className="flex flex-col gap-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-primary shrink-0"></span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">{course.title}</h3>
                  <p className="text-xs text-on-surface-variant">{course.code} • {course.instructor}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:justify-end">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-on-surface-variant">Curriculum Progress</span>
                  <div className="w-32 bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${course.progress_pct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-on-surface">{course.grade_pct}%</span>
                  <span className="text-xs font-bold bg-primary text-on-primary px-2 py-0.5 rounded">
                    {course.grade_letter}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
