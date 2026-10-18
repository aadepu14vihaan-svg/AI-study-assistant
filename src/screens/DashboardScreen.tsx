import React, { useState, useEffect } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { Assignment } from '../types';
import { ScreenTab } from '../components/layout/Sidebar';

interface DashboardScreenProps {
  onNavigate: (tab: ScreenTab) => void;
  onOpenNewTask: () => void;
  onEditTask: (task: Assignment) => void;
  onOpenOnboarding?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onOpenNewTask,
  onEditTask,
  onOpenOnboarding,
}) => {
  const { 
    user, 
    assignments, 
    courses, 
    studyPlan,
    togglePlanTaskCompleted,
    quizAttempts,
    toggleAssignmentComplete, 
    deleteAssignment,
    isAudioPlaying,
    toggleAudio,
    audioSoundscape,
    setAudioSoundscape,
    focusSessions,
  } = useAcademic();

  const safeSubjects = Array.isArray(user?.subjects) && user.subjects.length > 0 
    ? user.subjects 
    : ['Mathematics', 'Science', 'Social Science', 'English Literature', 'Computer Science'];

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<25 | 50>(25);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(`${safeSubjects[0]} Deep Study`);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(focusSessions.length || 3);

  // Timer interval effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setCompletedSessionsCount((c) => c + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const handleModeChange = (mode: 25 | 50) => {
    setTimerMode(mode);
    const secs = mode * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  // Timer format display
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Circular gauge math (radius 42, circumference ~ 264)
  const circumference = 264;
  const timerOffset = circumference - (remainingSeconds / totalSeconds) * circumference;

  // Filter tasks for Today / Upcoming (taking first 4)
  const todayTasks = assignments.slice(0, 4);

  // Metric counts
  const pendingCount = assignments.filter((a) => !a.completed).length;
  const urgentCount = assignments.filter((a) => a.priority === 'urgent' && !a.completed).length;
  const completedCount = assignments.filter((a) => a.completed).length;

  // Study plan for today
  const todayPlanDay = studyPlan[0] || { day: 'Today', date: '', tasks: [] };
  const todayPlanTasks = todayPlanDay.tasks;

  // Recent quiz attempts
  const recentQuizzes = quizAttempts.slice(0, 3);
  const weakTopics = Array.from(new Set(quizAttempts.flatMap(q => q.weak_topics)));

  // Total logged focus hours
  const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.actual_minutes || 0), 0);
  const studyHours = (totalFocusMinutes / 60 + 14.5).toFixed(1);

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Welcome & Motivation Banner */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-primary via-primary-container to-secondary-container text-on-primary p-6 md:p-8 shadow-md mb-6">
        <div className="absolute -right-8 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="absolute right-36 bottom-[-30px] w-40 h-40 rounded-full bg-secondary-fixed/20 blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap text-primary-fixed text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                <span className="material-symbols-outlined text-sm">school</span>
                <span>{user.grade} • {user.education_board}</span>
                {user.education_board === 'State Board' && user.state_board_name ? ` (${user.state_board_name})` : ''}
              </span>
              <span>•</span>
              <span className="text-white/80">{user.preferred_language}</span>
              {onOpenOnboarding && (
                <button
                  onClick={onOpenOnboarding}
                  className="text-white/90 hover:text-white underline text-[11px] font-semibold ml-1 cursor-pointer"
                  title="Edit Grade, Board and Subjects"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              Good day, {user.full_name.split(' ')[0]} <span className="inline-block animate-bounce text-2xl">👋</span>
            </h1>

            <p className="text-sm md:text-base text-primary-fixed-dim font-medium leading-relaxed">
              {pendingCount > 0
                ? `You have ${pendingCount} pending assignment${pendingCount === 1 ? '' : 's'} today. Stick to your dynamic study schedule to stay ahead!`
                : `All clear! Your curriculum for ${user.grade} is up to date. Keep up the high study momentum!`}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => onNavigate('study-sessions-timer')}
                className="bg-white text-primary hover:bg-white/95 px-5 py-2.5 rounded-xl text-xs md:text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">play_circle</span>
                <span>Continue Studying</span>
              </button>

              <button
                onClick={() => onNavigate('study-assistant')}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">psychology</span>
                <span>Ask AI Tutor</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm text-on-primary text-xs font-semibold">
                <span className="material-symbols-outlined text-sm text-tertiary-fixed">local_fire_department</span>
                <span>{user.streak_days}-Day Streak</span>
              </div>
            </div>
          </div>

          {/* Weekly Goal Progress Ring Widget */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl self-start md:self-auto min-w-[260px] border border-white/10 shadow-sm">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-tertiary-fixed-dim"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="82, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-lg font-bold leading-none text-white">82%</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">Weekly Curriculum</span>
              <span className="text-xs text-primary-fixed-dim">24 of 29 topics covered</span>
              <span className="text-xs text-tertiary-fixed mt-1 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-xs">trending_up</span> On Track for Goal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS ACTION STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <button
          onClick={() => onNavigate('ai-notes')}
          className="bg-surface-container-lowest hover:bg-surface-container-low p-3.5 rounded-2xl border border-surface-container shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-xl">auto_stories</span>
          </div>
          <span className="text-xs font-bold text-on-surface">AI Notes</span>
          <span className="text-[10px] text-on-surface-variant font-medium">Revision Guides</span>
        </button>

        <button
          onClick={() => onNavigate('quiz-practice')}
          className="bg-surface-container-lowest hover:bg-surface-container-low p-3.5 rounded-2xl border border-surface-container shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-xl">quiz</span>
          </div>
          <span className="text-xs font-bold text-on-surface">AI Quizzes</span>
          <span className="text-[10px] text-on-surface-variant font-medium">Adaptive Practice</span>
        </button>

        <button
          onClick={() => onNavigate('study-assistant')}
          className="bg-surface-container-lowest hover:bg-surface-container-low p-3.5 rounded-2xl border border-surface-container shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-xl">psychology</span>
          </div>
          <span className="text-xs font-bold text-on-surface">AI Tutor</span>
          <span className="text-[10px] text-on-surface-variant font-medium">Gemini Explainer</span>
        </button>

        <button
          onClick={() => onNavigate('study-planner')}
          className="bg-surface-container-lowest hover:bg-surface-container-low p-3.5 rounded-2xl border border-surface-container shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-xl">event_repeat</span>
          </div>
          <span className="text-xs font-bold text-on-surface">Smart Planner</span>
          <span className="text-[10px] text-on-surface-variant font-medium">Balanced Daily Plan</span>
        </button>

        <button
          onClick={() => onNavigate('official-resources')}
          className="bg-surface-container-lowest hover:bg-surface-container-low p-3.5 rounded-2xl border border-surface-container shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
          <span className="text-xs font-bold text-on-surface">NCERT / Books</span>
          <span className="text-[10px] text-on-surface-variant font-medium">Official Syllabi</span>
        </button>

        <button
          onClick={() => onNavigate('study-sessions-timer')}
          className="bg-surface-container-lowest hover:bg-surface-container-low p-3.5 rounded-2xl border border-surface-container shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-secondary-fixed/40 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-xl">timer</span>
          </div>
          <span className="text-xs font-bold text-on-surface">Focus Room</span>
          <span className="text-[10px] text-on-surface-variant font-medium">Soundscapes</span>
        </button>
      </div>

      {/* Key Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Stat 1 */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-surface-container">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-on-surface-variant">Due Today</span>
              <div className="text-3xl font-extrabold text-on-surface mt-1">{pendingCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">pending_actions</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-surface-container">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-error text-xs bg-error-container/60 font-bold">
              {urgentCount} Urgent
            </span>
            <span className="text-xs text-on-surface-variant truncate">
              {urgentCount > 0 ? 'Approaching submission' : 'No urgent alerts'}
            </span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-surface-container">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-on-surface-variant">Completed This Week</span>
              <div className="text-3xl font-extrabold text-on-surface mt-1">
                {completedCount} <span className="text-sm font-normal text-on-surface-variant">Tasks</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">task_alt</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-surface-container">
            <span className="inline-flex items-center text-tertiary-container text-xs font-bold bg-tertiary-fixed/30 px-2 py-0.5 rounded">
              <span className="material-symbols-outlined text-xs mr-0.5">arrow_upward</span> Active
            </span>
            <span className="text-xs text-on-surface-variant">across {safeSubjects.length} subjects</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-surface-container">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-on-surface-variant">Study Time Completed</span>
              <div className="text-3xl font-extrabold text-on-surface mt-1">
                {studyHours} <span className="text-sm font-normal text-on-surface-variant">hrs</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">timelapse</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container">
            <div className="flex justify-between text-xs text-on-surface-variant mb-1 font-semibold">
              <span>Weekly Target</span>
              <span>18 hrs</span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: '80%' }}></div>
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-surface-container">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-on-surface-variant">Target Exam Goal</span>
              <div className="text-sm font-extrabold text-on-surface mt-1 line-clamp-1">
                {user.academic_goals || 'Top Honor Roll'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/40 text-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">workspace_premium</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant text-xs mt-3 pt-2 border-t border-surface-container">
            <span>{user.grade} Board Prep</span>
            <span className="text-xs text-tertiary font-bold bg-surface-container px-2 py-0.5 rounded">Rank #{user.honor_roll_rank}</span>
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 of 12 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Today's Personalized Study Plan Widget */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 md:p-6 shadow-sm border border-surface-container">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">event_repeat</span>
                <h2 className="text-base md:text-lg font-bold text-on-surface">Today&apos;s Personalized Study Plan</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-xs text-primary font-bold">
                  {todayPlanTasks.filter(t => t.completed).length} of {todayPlanTasks.length} Done
                </span>
              </div>
              <button
                onClick={() => onNavigate('study-planner')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>Full Planner</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {todayPlanTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                    task.completed
                      ? 'bg-surface-container-lowest opacity-70 border-surface-container'
                      : 'bg-surface-container-low hover:bg-surface-container border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => togglePlanTaskCompleted(0, task.id)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-surface-container px-2 py-0.5 rounded text-primary">
                          {task.subject}
                        </span>
                        <span className={`font-bold text-on-surface truncate ${task.completed ? 'line-through text-outline' : ''}`}>
                          {task.topic}
                        </span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant mt-0.5">
                        🕒 {task.time} • Reason: {task.reason}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
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
              ))}
            </div>
          </div>

          {/* Today & Upcoming Deadlines Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 md:p-6 shadow-sm border border-surface-container">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <h2 className="text-base md:text-lg font-bold text-on-surface">Homework &amp; Assignments</h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-xs text-primary font-bold">
                  {todayTasks.length} Tasks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('homework-tasks')}
                  className="px-3 py-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">view_kanban</span>
                  <span>Board View</span>
                </button>
                <button
                  onClick={onOpenNewTask}
                  className="px-3 py-1 rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary text-xs font-bold transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {todayTasks.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-surface-container flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">assignment_add</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">No homework tasks logged yet</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 max-w-sm">
                    Add your current chapter homework to start receiving AI-balanced study plans and deadline alerts.
                  </p>
                </div>
                <button
                  onClick={onOpenNewTask}
                  className="bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  + Add Your First Assignment
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {todayTasks.map((task) => {
                  const isUrgent = task.priority === 'urgent';
                  return (
                    <div
                      key={task.id}
                      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all gap-3 border ${
                        task.completed
                          ? 'bg-surface-container-lowest opacity-75 border-surface-container'
                          : 'bg-surface-container-low hover:bg-surface-container border-transparent'
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r ${
                          task.completed
                            ? 'bg-tertiary'
                            : isUrgent
                            ? 'bg-error'
                            : task.priority === 'high'
                            ? 'bg-secondary'
                            : 'bg-surface-tint'
                        }`}
                      ></div>

                      <div className="flex items-start gap-3 pl-2.5">
                        <label className="relative flex items-center mt-0.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleAssignmentComplete(task.id)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                          />
                        </label>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-primary bg-surface-container px-2 py-0.5 rounded">
                              {task.course}
                            </span>
                            <span
                              className={`text-xs font-bold text-on-surface ${
                                task.completed ? 'line-through text-outline' : ''
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1.5">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              <span>{task.due_time_display || task.due_date}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">timer</span>
                              <span>~{task.est_hours} hrs</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                          title="Edit Task"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => deleteAssignment(task.id)}
                          className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container transition-colors"
                          title="Delete Task"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Quizzes & Adaptive Diagnostics */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 md:p-6 shadow-sm border border-surface-container">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">quiz</span>
                <h2 className="text-base md:text-lg font-bold text-on-surface">Recent Quizzes &amp; Scores</h2>
              </div>
              <button
                onClick={() => onNavigate('quiz-practice')}
                className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
              >
                <span>Practice More</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {recentQuizzes.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-2">
                No quizzes attempted yet. Generate an AI quiz on any chapter to calibrate your strengths!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentQuizzes.map((q) => (
                  <div key={q.id} className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase bg-surface-container px-2 py-0.5 rounded text-primary">
                          {q.subject}
                        </span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${
                          q.score >= 80 ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-fixed text-primary'
                        }`}>
                          {q.score}%
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-on-surface mt-1.5 line-clamp-1">{q.title}</h4>
                    </div>
                    {q.weak_topics?.length > 0 && (
                      <span className="text-[10px] text-error font-semibold truncate">
                        Focus: {q.weak_topics[0]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (4 of 12 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Integrated Pomodoro Focus Room Timer */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 md:p-6 shadow-sm border border-surface-container flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 pb-2 border-b border-surface-container">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-lg">timer</span>
                <h2 className="text-base font-bold text-on-surface">Focus Room</h2>
              </div>
              <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() => handleModeChange(25)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    timerMode === 25 ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
                  }`}
                >
                  25m
                </button>
                <button
                  onClick={() => handleModeChange(50)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    timerMode === 50 ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
                  }`}
                >
                  50m
                </button>
              </div>
            </div>

            {/* Circular Gauge Display */}
            <div className="relative w-44 h-44 flex items-center justify-center my-1">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-surface-container-high stroke-current"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-primary stroke-current transition-all duration-300"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={timerOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold tracking-tight font-mono text-on-surface">
                  {timeFormatted}
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant mt-0.5">
                  {isTimerRunning ? 'Deep Focus' : 'Ready to begin'}
                </span>
              </div>
            </div>

            {/* Subject Tag Selector */}
            <div className="w-full mt-3">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full text-xs font-semibold bg-surface-container-low text-on-surface p-2.5 rounded-xl border border-surface-container outline-none truncate cursor-pointer"
              >
                {safeSubjects.map((sub) => (
                  <option key={sub} value={`${sub} Study Block`}>{sub} Focus</option>
                ))}
              </select>
            </div>

            {/* Timer Controls */}
            <div className="w-full flex items-center gap-2 mt-3">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">
                  {isTimerRunning ? 'pause' : 'play_arrow'}
                </span>
                <span>{isTimerRunning ? 'Pause' : 'Start Timer'}</span>
              </button>

              <button
                onClick={handleResetTimer}
                className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
                title="Reset Timer"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
              </button>
            </div>

            {/* Ambient Sound Player */}
            <div className="w-full mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-secondary">graphic_eq</span>
                <select
                  value={audioSoundscape}
                  onChange={(e) => setAudioSoundscape(e.target.value as 'lofi')}
                  className="bg-transparent text-xs font-bold text-on-surface cursor-pointer outline-none"
                >
                  <option value="lofi">Lo-Fi Synthesizer</option>
                  <option value="rain">Gentle Rain</option>
                  <option value="whitenoise">Pink Noise</option>
                </select>
              </div>

              <button
                onClick={toggleAudio}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  isAudioPlaying
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {isAudioPlaying ? 'Mute' : 'Play Sound'}
              </button>
            </div>
          </div>

          {/* Subjects & Active Deliverables */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-surface-container">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-container">
              <h2 className="text-base font-bold text-on-surface">Registered Subjects</h2>
              <span className="text-xs text-on-surface-variant font-bold">{safeSubjects.length} Active</span>
            </div>

            <div className="flex flex-col gap-2">
              {safeSubjects.map((s, idx) => {
                const pendingForSub = assignments.filter((a) => a.course === s && !a.completed).length;
                return (
                  <div
                    key={idx}
                    onClick={() => onNavigate('subjects-courses')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
                      <span className="text-xs font-bold text-on-surface truncate">{s}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-on-surface-variant">
                      {pendingForSub} task{pendingForSub === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
