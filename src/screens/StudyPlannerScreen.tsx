import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { ScreenTab } from '../components/layout/Sidebar';

interface StudyPlannerScreenProps {
  onNavigate: (tab: ScreenTab) => void;
}

export const StudyPlannerScreen: React.FC<StudyPlannerScreenProps> = ({ onNavigate }) => {
  const { 
    user, 
    assignments, 
    studyPlan, 
    togglePlanTaskCompleted, 
    regeneratePlan, 
    quizAttempts 
  } = useAcademic();

  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regeneratePlan();
    } finally {
      setIsRegenerating(false);
    }
  };

  const weakTopics = Array.from(new Set(quizAttempts.flatMap(q => q.weak_topics)));
  const pendingAssignments = assignments.filter(a => !a.completed);

  // Overall completion for today's plan
  const todayTasks = studyPlan[0]?.tasks || [];
  const todayDone = todayTasks.filter(t => t.completed).length;
  const todayTotal = todayTasks.length;
  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">event_repeat</span>
            <span>Intelligent Workload Balancing</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Personalized Smart Study Planner
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Dynamically synthesized around your deadlines, weak concepts, and target study velocity
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
        >
          {isRegenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Rebalancing Schedule...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <span>Regenerate AI Schedule</span>
            </>
          )}
        </button>
      </div>

      {/* Top Parameter Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant font-semibold">Today&apos;s Plan Completion</span>
            <div className="text-2xl font-extrabold text-on-surface mt-0.5">{todayDone} / {todayTotal}</div>
            <span className="text-[11px] text-tertiary font-bold">{todayPct}% Complete</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">fact_check</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant font-semibold">Pending Deadlines</span>
            <div className="text-2xl font-extrabold text-on-surface mt-0.5">{pendingAssignments.length}</div>
            <span className="text-[11px] text-error font-semibold">Prioritized automatically</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">hourglass_top</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant font-semibold">Weak Topics Inserted</span>
            <div className="text-2xl font-extrabold text-on-surface mt-0.5">{weakTopics.length}</div>
            <span className="text-[11px] text-secondary font-semibold">From quiz diagnostics</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">psychology_alt</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant font-semibold">Target Academic Goal</span>
            <div className="text-sm font-bold text-on-surface mt-1 truncate max-w-[150px]">
              {user.academic_goals || 'Exam Excellence'}
            </div>
            <span className="text-[11px] text-outline">{user.grade} • {user.education_board}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">flag</span>
          </div>
        </div>
      </div>

      {/* Main Study Plan Days List */}
      <div className="flex flex-col gap-6">
        {studyPlan.map((planDay, dayIdx) => (
          <div
            key={planDay.day}
            className="bg-surface-container-lowest rounded-3xl p-5 md:p-6 shadow-sm border border-surface-container flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
                <div>
                  <h2 className="text-base font-extrabold text-on-surface">{planDay.day}</h2>
                  <span className="text-xs text-on-surface-variant">{planDay.date}</span>
                </div>
              </div>

              <span className="text-xs font-bold bg-surface-container text-on-surface px-3 py-1 rounded-full">
                {planDay.tasks.filter(t => t.completed).length} of {planDay.tasks.length} Completed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {planDay.tasks.map((task) => {
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-xs ${
                      task.completed
                        ? 'bg-surface-container-lowest opacity-75 border-surface-container'
                        : 'bg-surface-container-low hover:bg-surface-container border-transparent shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase bg-surface-container px-2 py-0.5 rounded text-primary">
                          {task.subject}
                        </span>

                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            task.priority === 'urgent'
                              ? 'bg-error-container text-on-error-container'
                              : task.priority === 'high'
                              ? 'bg-secondary-fixed text-secondary'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => togglePlanTaskCompleted(dayIdx, task.id)}
                          className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                        <div className="flex flex-col">
                          <span
                            className={`font-bold text-sm text-on-surface leading-snug ${
                              task.completed ? 'line-through text-outline' : ''
                            }`}
                          >
                            {task.topic}
                          </span>
                          <span className="text-[11px] text-on-surface-variant mt-0.5 font-medium">
                            🕒 {task.time}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-on-surface-variant bg-surface-container-lowest p-2 rounded-lg border border-surface-container">
                        <strong>Reason:</strong> {task.reason}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                      <span className="text-[10px] uppercase font-bold text-outline">
                        {task.taskType.replace('_', ' ')}
                      </span>

                      <button
                        onClick={() => onNavigate('study-sessions-timer')}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">timer</span>
                        <span>Focus Room</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
