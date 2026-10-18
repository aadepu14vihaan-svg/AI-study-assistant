import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { Assignment, AssignmentStatus, Priority } from '../types';

interface HomeworkScreenProps {
  onOpenNewTask: (defaultStatus?: AssignmentStatus) => void;
  onEditTask: (task: Assignment) => void;
}

export const HomeworkScreen: React.FC<HomeworkScreenProps> = ({
  onOpenNewTask,
  onEditTask,
}) => {
  const {
    assignments,
    courses,
    deleteAssignment,
    toggleAssignmentComplete,
    updateAssignmentStatus,
  } = useAcademic();

  const [activeTab, setActiveTab] = useState<'all' | AssignmentStatus>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [sortBy, setSortBy] = useState<'due_earliest' | 'due_latest' | 'priority'>('due_earliest');
  const [searchFilter, setSearchFilter] = useState('');
  const [filterDueThisWeek, setFilterDueThisWeek] = useState(false);
  const [filterHasAttachments, setFilterHasAttachments] = useState(false);

  // Status Counts
  const todoTasks = assignments.filter((a) => a.status === 'todo');
  const inProgressTasks = assignments.filter((a) => a.status === 'in_progress');
  const underReviewTasks = assignments.filter((a) => a.status === 'under_review');
  const completedTasks = assignments.filter((a) => a.status === 'completed');

  // Filtered assignments
  const filteredAssignments = assignments.filter((task) => {
    // Status tab filter
    if (activeTab !== 'all' && task.status !== activeTab) return false;
    // Subject filter
    if (selectedSubject !== 'All' && task.course !== selectedSubject) return false;
    // Priority filter
    if (selectedPriority !== 'All' && task.priority !== selectedPriority) return false;
    // Text search
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const match =
        task.title.toLowerCase().includes(q) ||
        task.course.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q);
      if (!match) return false;
    }
    // Has attachments filter chip
    if (filterHasAttachments && task.attachments.length === 0) return false;
    return true;
  });

  // Sorting
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if (sortBy === 'due_earliest') {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (sortBy === 'due_latest') {
      return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
    }
    if (sortBy === 'priority') {
      const pWeights: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      return pWeights[b.priority] - pWeights[a.priority];
    }
    return 0;
  });

  // Kanban column assignments
  const getTasksByStatus = (status: AssignmentStatus) => {
    return sortedAssignments.filter((a) => a.status === status);
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
            <span className="material-symbols-outlined text-xs">warning</span> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="bg-error-container text-on-error-container text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">flag</span> High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded">
            Medium
          </span>
        );
      default:
        return (
          <span className="bg-surface-container text-on-surface-variant text-[10px] font-medium px-2 py-0.5 rounded">
            Standard
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Hero KPI & Context Bar */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold">
            <span>Academics</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-bold">Fall Semester 2024</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              Homework &amp; Assignments
            </h1>
            <span className="inline-flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold px-3 py-1 rounded-full shadow-xs">
              <span className="material-symbols-outlined text-xs">local_fire_department</span>
              <span>14 Day Streak</span>
            </span>
          </div>
        </div>

        {/* Quick Stats Metric Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-surface-container-lowest px-4 py-2 rounded-xl shadow-xs border border-surface-container flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">pending_actions</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Pending Tasks</span>
              <span className="text-lg font-extrabold text-on-surface leading-none">{todoTasks.length + inProgressTasks.length}</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest px-4 py-2 rounded-xl shadow-xs border border-surface-container flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-variant flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-xl">grade</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Term GPA Avg</span>
              <span className="text-lg font-extrabold text-on-surface leading-none">3.94</span>
            </div>
          </div>

          <button
            onClick={() => onOpenNewTask()}
            className="bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container transition-all shadow-md px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-[0.98]"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
            <span>+ Add Homework Assignment</span>
          </button>
        </div>
      </div>

      {/* Command Strip: Status Tabs, Filters & Layout Toggle */}
      <div className="w-full bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-4 flex flex-col gap-4 mt-2">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
            {[
              { id: 'all' as const, label: 'All Assignments', count: assignments.length },
              { id: 'todo' as const, label: 'To Do', count: todoTasks.length },
              { id: 'in_progress' as const, label: 'In Progress', count: inProgressTasks.length },
              { id: 'under_review' as const, label: 'Submitted', count: underReviewTasks.length },
              { id: 'completed' as const, label: 'Graded', count: completedTasks.length },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`text-xs md:text-sm px-3 md:px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active
                        ? 'bg-primary-fixed text-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Switcher (Kanban vs Table) */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex items-center bg-surface-container p-1 rounded-xl">
              <button
                onClick={() => setViewMode('kanban')}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">view_kanban</span>
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">table_rows</span>
                <span className="hidden sm:inline">Table List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search Tag Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-surface-container">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Subject Dropdown */}
            <div className="relative inline-block">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="appearance-none bg-surface-container-low text-on-surface text-xs md:text-sm pl-3 pr-8 py-2 rounded-lg cursor-pointer outline-none hover:bg-surface-container transition-all border border-transparent font-semibold"
              >
                <option value="All">All Subjects</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                unfold_more
              </span>
            </div>

            {/* Priority Dropdown */}
            <div className="relative inline-block">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="appearance-none bg-surface-container-low text-on-surface text-xs md:text-sm pl-3 pr-8 py-2 rounded-lg cursor-pointer outline-none hover:bg-surface-container transition-all border border-transparent font-semibold"
              >
                <option value="All">Priority: All</option>
                <option value="urgent">Urgent / Critical</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                unfold_more
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="relative inline-block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'due_earliest')}
                className="appearance-none bg-surface-container-low text-on-surface text-xs md:text-sm pl-3 pr-8 py-2 rounded-lg cursor-pointer outline-none hover:bg-surface-container transition-all border border-transparent font-semibold"
              >
                <option value="due_earliest">Sort: Due Date (Earliest)</option>
                <option value="due_latest">Sort: Due Date (Latest)</option>
                <option value="priority">Sort: Highest Priority</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                sort
              </span>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                type="button"
                onClick={() => setFilterDueThisWeek(!filterDueThisWeek)}
                className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-colors font-semibold ${
                  filterDueThisWeek
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span>Due This Week</span>
                {filterDueThisWeek && <span className="material-symbols-outlined text-xs">close</span>}
              </button>
              <button
                type="button"
                onClick={() => setFilterHasAttachments(!filterHasAttachments)}
                className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-colors font-semibold ${
                  filterHasAttachments
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span>Has Attachments</span>
                {filterHasAttachments && <span className="material-symbols-outlined text-xs">close</span>}
              </button>
            </div>
          </div>

          {/* Quick Search Inside View */}
          <div className="relative w-full lg:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
              filter_list
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter task titles..."
              className="w-full bg-surface-container-low text-on-surface text-xs md:text-sm pl-8 pr-3 py-2 rounded-lg outline-none focus:bg-surface-container-lowest ring-1 ring-transparent focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Weekly Progress Micro-Banner */}
      <div className="w-full bg-gradient-to-r from-primary-container/10 via-surface-container-high to-tertiary-container/10 rounded-2xl p-4 mt-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs border border-surface-container">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center bg-surface-container-lowest rounded-full shadow-sm">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-variant"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray="70, 100"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span className="absolute text-xs font-extrabold text-primary">70%</span>
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm md:text-base font-bold text-on-surface">Weekly Milestone Velocity</h4>
            <p className="text-xs text-on-surface-variant">
              7 of 10 primary curriculum assignments finished on schedule. You are 1.2 days ahead of schedule.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex -space-x-2 overflow-hidden py-1">
            <img
              className="inline-block h-7 w-7 rounded-full ring-2 ring-surface-container-lowest object-cover"
              alt="Cohort member"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8ZBBiqVg0KqPBgxibgilul2jc5COkJzjaJ-BJ8dlO3eeVwK4zpR7mXYUJDZXuKcVdn5FvKHmr9kngZK0R_oBSrB72zFYow4ZuRMiUx-9U1b8_tEbeNWx_Ryes6EZTgPwDV-8LTze9w2WsSdsfGN8pWdikT6EyLJF-Ba_OItKKM-bbydnIWlaXwSoA2SN3IL6ja-6Gzz19ub5kYAlxoj1H7exup55fMQDQoULYpxwQGf8Gb_DgpKM_"
            />
            <img
              className="inline-block h-7 w-7 rounded-full ring-2 ring-surface-container-lowest object-cover"
              alt="Cohort member"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl4fIb7pv8FUvionP-wqFn6WsVaZNQYjWKwChgqxR-ZOnetv3aBSjayxH9mCuifFCitgJMGtpqk4bydMjyNxyxC8FCJDZl6Mhxf_-l-bW51qslweHFNTKefHURMPro7JtPCM1qZToLILGJX5d0Yfibp_b6N5-k71U3F1DmvCE6EGQWOj3xDaQCtsi8rc5MNMgvoC9E_PTGgmMpecnTW74TBSlhsyZ6vsMtHMUzFHDrwA2EGnCOgcQ0"
            />
            <div className="h-7 w-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-[10px] font-bold ring-2 ring-surface-container-lowest">
              +4
            </div>
          </div>
          <span className="text-xs text-on-surface-variant font-semibold">Study Cohort Active</span>
        </div>
      </div>

      {/* KANBAN BOARD CONTAINER */}
      {viewMode === 'kanban' && (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4 items-start">
          {/* COLUMN 1: TO DO */}
          <div className="bg-surface-container-low rounded-2xl p-3 flex flex-col gap-3 border border-surface-container">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <h3 className="text-sm font-bold text-on-surface">To Do</h3>
                <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full text-xs font-bold">
                  {getTasksByStatus('todo').length}
                </span>
              </div>
              <button
                onClick={() => onOpenNewTask('todo')}
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-container"
                title="Add task to To Do"
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>

            {getTasksByStatus('todo').map((task) => (
              <div
                key={task.id}
                className="bg-surface-container-lowest rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group border border-surface-container"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-primary-fixed text-primary text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    {task.course}
                  </span>
                  {getPriorityBadge(task.priority)}
                </div>

                <h4
                  onClick={() => onEditTask(task)}
                  className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer pt-0.5"
                >
                  {task.title}
                </h4>

                {task.description && (
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Subtasks Progress */}
                {task.subtasks.length > 0 && (
                  <div className="bg-surface-container-low p-2 rounded-lg flex flex-col gap-1 my-0.5">
                    <div className="flex items-center justify-between text-on-surface-variant text-[11px] font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary">checklist</span>
                        Subtasks
                      </span>
                      <span className="font-bold text-on-surface">
                        {task.subtasks.filter((s) => s.completed).length} / {task.subtasks.length} completed
                      </span>
                    </div>
                    <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{
                          width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Metadata tags */}
                {task.metadata?.rubric_note && (
                  <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                    <span className="bg-surface-container px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">menu_book</span>
                      <span>{task.metadata.rubric_note}</span>
                    </span>
                    <span className="bg-surface-container px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">hourglass_empty</span>
                      <span>Est. {task.est_hours} hrs</span>
                    </span>
                  </div>
                )}

                {/* Footer Meta & Column Move Action */}
                <div className="flex items-center justify-between pt-1 border-t border-surface-container text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1 text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{task.due_time_display || 'Upcoming'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateAssignmentStatus(task.id, 'in_progress')}
                      className="text-[10px] font-bold bg-primary-fixed text-primary px-2 py-0.5 rounded hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-0.5"
                      title="Move to In Progress"
                    >
                      <span>Start</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => onOpenNewTask('todo')}
              className="w-full py-2 rounded-xl border-dashed border-2 border-outline-variant/40 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all text-xs font-bold flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add item to To Do</span>
            </button>
          </div>

          {/* COLUMN 2: IN PROGRESS */}
          <div className="bg-surface-container-low rounded-2xl p-3 flex flex-col gap-3 border border-surface-container">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <h3 className="text-sm font-bold text-on-surface">In Progress</h3>
                <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full text-xs font-bold">
                  {getTasksByStatus('in_progress').length}
                </span>
              </div>
              <button
                onClick={() => onOpenNewTask('in_progress')}
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>

            {getTasksByStatus('in_progress').map((task) => (
              <div
                key={task.id}
                className="bg-surface-container-lowest rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group border border-surface-container"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-secondary-fixed text-secondary text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    {task.course}
                  </span>
                  {getPriorityBadge(task.priority)}
                </div>

                <h4
                  onClick={() => onEditTask(task)}
                  className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer pt-0.5"
                >
                  {task.title}
                </h4>

                {task.description && (
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Dynamic Word Count Progress if present */}
                {task.metadata?.word_count && (
                  <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col gap-1 my-0.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-secondary">edit_document</span>
                        Draft Milestone
                      </span>
                      <span className="font-bold text-on-surface">
                        {task.metadata.word_count.current} / {task.metadata.word_count.target} words
                      </span>
                    </div>
                    <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-secondary h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (task.metadata.word_count.current / task.metadata.word_count.target) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Code repo metadata box if present */}
                {task.metadata?.code_repo && (
                  <div className="bg-inverse-surface text-inverse-on-surface p-2 rounded-lg flex items-center justify-between text-xs my-0.5 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-tertiary-fixed">terminal</span>
                      <span>{task.metadata.code_repo.file}</span>
                    </div>
                    <div className="flex items-center gap-1 text-tertiary-fixed-dim text-[11px]">
                      <span className="material-symbols-outlined text-xs">fork_right</span>
                      <span>{task.metadata.code_repo.branch}</span>
                    </div>
                  </div>
                )}

                {/* Footer Meta & Move Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-surface-container text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1 text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{task.due_time_display || 'Due Soon'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateAssignmentStatus(task.id, 'under_review')}
                      className="text-[10px] font-bold bg-secondary-fixed text-secondary px-2 py-0.5 rounded hover:bg-secondary hover:text-on-secondary transition-colors flex items-center gap-0.5"
                    >
                      <span>Submit</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => onOpenNewTask('in_progress')}
              className="w-full py-2 rounded-xl border-dashed border-2 border-outline-variant/40 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all text-xs font-bold flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add item to In Progress</span>
            </button>
          </div>

          {/* COLUMN 3: UNDER REVIEW */}
          <div className="bg-surface-container-low rounded-2xl p-3 flex flex-col gap-3 border border-surface-container">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <h3 className="text-sm font-bold text-on-surface">Under Review</h3>
                <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full text-xs font-bold">
                  {getTasksByStatus('under_review').length}
                </span>
              </div>
              <button
                onClick={() => onOpenNewTask('under_review')}
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>

            {getTasksByStatus('under_review').map((task) => (
              <div
                key={task.id}
                className="bg-surface-container-lowest rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group border border-surface-container"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-surface-tint"></div>
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-surface-container-high text-on-surface text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    {task.course}
                  </span>
                  <span className="bg-surface-container-highest text-on-surface-variant text-[10px] px-2 py-0.5 rounded font-bold">
                    Pending Review
                  </span>
                </div>

                <h4
                  onClick={() => onEditTask(task)}
                  className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer pt-0.5"
                >
                  {task.title}
                </h4>

                {task.description && (
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Cloud Submission Box */}
                {task.metadata?.file_upload && (
                  <div className="bg-surface-container-low p-2 rounded-lg flex items-center justify-between text-xs my-0.5">
                    <div className="flex items-center gap-1.5 text-primary font-semibold">
                      <span className="material-symbols-outlined text-base">cloud_done</span>
                      <span>{task.metadata.file_upload.provider}</span>
                    </div>
                    <span className="text-[11px] text-on-surface font-mono">
                      {task.metadata.file_upload.name}
                    </span>
                  </div>
                )}

                {/* Audio snippet */}
                {task.metadata?.audio_file && (
                  <div className="bg-surface-container-low p-2 rounded-lg flex items-center justify-between text-xs my-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">graphic_eq</span>
                      <span className="font-semibold text-on-surface font-mono text-[11px]">
                        {task.metadata.audio_file.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-outline">{task.metadata.audio_file.duration}</span>
                  </div>
                )}

                {/* Footer Meta */}
                <div className="flex items-center justify-between pt-1 border-t border-surface-container text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">done_all</span>
                    <span>{task.due_time_display || 'Submitted'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateAssignmentStatus(task.id, 'completed')}
                      className="text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded hover:bg-tertiary hover:text-on-tertiary transition-colors flex items-center gap-0.5"
                    >
                      <span>Grade ✓</span>
                    </button>
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => onOpenNewTask('under_review')}
              className="w-full py-2 rounded-xl border-dashed border-2 border-outline-variant/40 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all text-xs font-bold flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Submit External Work</span>
            </button>
          </div>

          {/* COLUMN 4: COMPLETED & GRADED */}
          <div className="bg-surface-container-low rounded-2xl p-3 flex flex-col gap-3 border border-surface-container">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></span>
                <h3 className="text-sm font-bold text-on-surface">Completed &amp; Graded</h3>
                <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full text-xs font-bold">
                  {getTasksByStatus('completed').length}
                </span>
              </div>
            </div>

            {getTasksByStatus('completed').map((task) => (
              <div
                key={task.id}
                className="bg-surface-container-lowest rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group border border-surface-container"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-container"></div>
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    {task.course}
                  </span>
                  <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    {task.grade_badge || 'Grade: 100%'}
                  </span>
                </div>

                <h4
                  onClick={() => onEditTask(task)}
                  className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer pt-0.5 line-through opacity-85"
                >
                  {task.title}
                </h4>

                {task.description && (
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Score Showcase */}
                <div className="bg-surface-container-low p-2.5 rounded-lg flex items-center justify-between my-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-on-surface leading-none">
                        {task.score || 98} / {task.max_score || 100}
                      </span>
                      <span className="text-[10px] font-bold text-tertiary">
                        {task.metadata?.completed_time_display || 'Graded Submission'}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-tertiary text-xl">workspace_premium</span>
                </div>

                {/* Footer Meta */}
                <div className="flex items-center justify-between pt-1 border-t border-surface-container text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-tertiary">event_available</span>
                    <span>{task.due_time_display || 'Turned In'}</span>
                  </div>
                  <button
                    onClick={() => onEditTask(task)}
                    className="text-[11px] font-bold text-tertiary hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}

            <div className="p-2.5 text-center text-on-surface-variant text-[11px] flex items-center justify-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-sm">archive</span>
              <span>24 older graded assignments archived</span>
            </div>
          </div>
        </div>
      )}

      {/* TABLE VIEW (Toggleable) */}
      {viewMode === 'table' && (
        <div className="w-full bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider border-b border-surface-container">
                  <th className="py-3.5 px-4 font-bold">Assignment Name</th>
                  <th className="py-3.5 px-4 font-bold">Course</th>
                  <th className="py-3.5 px-4 font-bold">Due Date</th>
                  <th className="py-3.5 px-4 font-bold">Priority</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Progress / Checklist</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-xs md:text-sm text-on-surface">
                {sortedAssignments.map((task) => (
                  <tr key={task.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleAssignmentComplete(task.id)}
                          className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                        />
                        <span className={`font-bold ${task.completed ? 'line-through text-outline' : 'text-on-surface'}`}>
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-primary-fixed text-primary text-xs px-2 py-0.5 rounded font-bold">
                        {task.course}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={task.priority === 'urgent' && !task.completed ? 'text-error font-bold' : 'text-on-surface-variant'}>
                        {task.due_time_display || 'Upcoming'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getPriorityBadge(task.priority)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-surface-container text-on-surface-variant text-xs px-2 py-0.5 rounded font-bold uppercase">
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-on-surface-variant">
                      {task.subtasks.length > 0
                        ? `${task.subtasks.filter((s) => s.completed).length} / ${task.subtasks.length} Subtasks`
                        : `${task.est_hours} hrs est.`}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => deleteAssignment(task.id)}
                          className="p-1 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
