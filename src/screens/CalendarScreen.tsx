import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { CalendarEvent, EventType } from '../types';

export const CalendarScreen: React.FC = () => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent } = useAcademic();

  const [activeView, setActiveView] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    'AP Calculus BC',
    'AP Chemistry',
    'Computer Science: Data Structures & TS',
    'World Literature & Composition',
    'AP Physics C: Mechanics',
  ]);

  // Today's action items checklist state
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: 'Print Wordsworth poem annotations', sub: 'English Lit • Done at 8:15 AM', completed: true },
    { id: 2, text: 'Submit bibliography citations', sub: 'History Essay • Done at 11:40 AM', completed: true },
    { id: 3, text: 'Submit Final History Essay PDF', sub: 'Due today at 2:00 PM', completed: false, isUrgent: true },
    { id: 4, text: 'Bring Formula Sheet to Study Group', sub: 'Physics • 4:00 PM', completed: false },
  ]);

  // Quick Add Event Form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCourse, setQuickCourse] = useState('AP Calculus BC');
  const [quickType, setQuickType] = useState<EventType>('independent_study');
  const [quickDay, setQuickDay] = useState(3); // Thursday default
  const [quickStartTime, setQuickStartTime] = useState('16:00');
  const [quickEndTime, setQuickEndTime] = useState('17:30');
  const [quickLocation, setQuickLocation] = useState('Science Library 2nd Fl');
  const [showEventSuccess, setShowEventSuccess] = useState(false);

  const toggleChecklistItem = (id: number) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleQuickAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    // Parse start & end hours
    const [startH, startM] = quickStartTime.split(':').map(Number);
    const [endH, endM] = quickEndTime.split(':').map(Number);
    const startHourDec = startH + (startM || 0) / 60;
    const endHourDec = endH + (endM || 0) / 60;

    await addCalendarEvent({
      title: quickTitle.trim(),
      course: quickCourse,
      event_type: quickType,
      day_index: quickDay,
      start_hour: startHourDec,
      end_hour: endHourDec,
      start_time_display: quickStartTime,
      end_time_display: quickEndTime,
      location: quickLocation.trim(),
    });

    setQuickTitle('');
    setShowEventSuccess(true);
    setTimeout(() => setShowEventSuccess(false), 3000);
  };

  const toggleCourseFilter = (courseName: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseName) ? prev.filter((c) => c !== courseName) : [...prev, courseName]
    );
  };

  // 14 hours (7 AM to 8 PM) -> index 0 to 13
  const hours = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const days = [
    { name: 'Mon', date: '21', dayIndex: 0 },
    { name: 'Tue', date: '22', dayIndex: 1 },
    { name: 'Wed', date: '23', dayIndex: 2 },
    { name: 'Thu • Today', date: '24', dayIndex: 3, isToday: true },
    { name: 'Fri', date: '25', dayIndex: 4 },
    { name: 'Sat', date: '26', dayIndex: 5 },
    { name: 'Sun', date: '27', dayIndex: 6 },
  ];

  const completedChecklistCount = checklistItems.filter((i) => i.completed).length;

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Academic Progress Banner & Micro Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary shadow-sm text-on-primary">
            <span className="material-symbols-outlined text-2xl">event_available</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-primary font-bold">Fall Term 2024</span>
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
              <span className="text-xs text-on-surface-variant font-semibold">Week 9 of 16</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">
              Weekly Academic Planner
            </h1>
          </div>
        </div>

        {/* Quick Stat Chips & Sync Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container shadow-xs border border-surface-container-high">
            <span className="material-symbols-outlined text-tertiary-container text-base">check_circle</span>
            <span className="text-xs text-on-surface-variant">Due this week:</span>
            <span className="text-xs font-bold text-on-surface">6 Deliverables</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container shadow-xs border border-surface-container-high">
            <span className="material-symbols-outlined text-secondary text-base">local_fire_department</span>
            <span className="text-xs font-bold text-secondary">14-Day Streak</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface text-xs font-semibold shadow-xs"
          >
            <span className="material-symbols-outlined text-primary text-base">sync</span>
            <span>Google &amp; Apple Synced</span>
            <span className="w-2 h-2 rounded-full bg-tertiary-container ml-0.5"></span>
          </button>
        </div>
      </div>

      {/* Primary Calendar Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container mb-6">
        {/* Left: Navigation & Date Range */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-surface-container rounded-xl p-0.5 border border-surface-container-high">
            <button
              type="button"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Previous Week"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Next Week"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-surface-container text-primary text-xs font-bold hover:bg-surface-container-high transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1.5 pl-1">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">calendar_today</span>
            <span className="text-base font-extrabold text-on-surface">October 21 – 27, 2024</span>
          </div>
        </div>

        {/* Center/Right: Course Filter Pills & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Course filter pills */}
          <div className="flex items-center flex-wrap gap-1.5">
            {[
              { name: 'AP Calculus BC', short: 'AP Calc', color: 'bg-primary' },
              { name: 'AP Chemistry', short: 'Chemistry', color: 'bg-secondary' },
              { name: 'Computer Science: Data Structures & TS', short: 'Comp Sci', color: 'bg-tertiary-container' },
              { name: 'World Literature & Composition', short: 'English Lit', color: 'bg-primary-container' },
              { name: 'AP Physics C: Mechanics', short: 'Physics', color: 'bg-error' },
            ].map((c) => {
              const active = selectedCourses.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggleCourseFilter(c.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer select-none transition-all ${
                    active
                      ? 'bg-primary-fixed text-on-primary-fixed shadow-xs font-bold'
                      : 'bg-surface-container text-outline hover:text-on-surface'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.color}`}></span>
                  <span>{c.short}</span>
                </button>
              );
            })}
          </div>

          {/* View Selector */}
          <div className="flex items-center p-1 rounded-xl bg-surface-container border border-surface-container-high">
            {(['day', 'week', 'month', 'agenda'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setActiveView(v)}
                className={`px-3 py-1 rounded-lg text-xs capitalize transition-all ${
                  activeView === v
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Workspace & Right Detail Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* 7-Day Interactive Time Grid (xl:col-span-9) */}
        <div className="xl:col-span-9 rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container overflow-hidden flex flex-col">
          {/* Weekday Column Headers */}
          <div className="grid grid-cols-8 gap-1.5 pb-2 mb-1 border-b border-surface-container">
            <div className="text-right pr-2">
              <span className="text-[10px] text-outline uppercase tracking-wider font-bold">GMT-4</span>
            </div>
            {days.map((day) => (
              <div
                key={day.name}
                className={`text-center p-2 rounded-xl transition-colors ${
                  day.isToday
                    ? 'bg-primary text-on-primary shadow-md relative overflow-hidden'
                    : 'bg-surface-container-low'
                }`}
              >
                {day.isToday && (
                  <div className="absolute -right-2 -bottom-2 w-8 h-8 rounded-full bg-white/10 pointer-events-none"></div>
                )}
                <span
                  className={`block text-[10px] uppercase font-bold tracking-wider ${
                    day.isToday ? 'text-primary-fixed' : 'text-on-surface-variant'
                  }`}
                >
                  {day.name}
                </span>
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-extrabold mt-0.5 ${
                    day.isToday ? 'text-on-primary' : 'text-on-surface'
                  }`}
                >
                  {day.date}
                </span>
              </div>
            ))}
          </div>

          {/* Scrollable Timetable Canvas */}
          <div className="relative overflow-y-auto max-h-[720px] pr-1">
            <div className="relative grid grid-cols-8 gap-1.5" style={{ minHeight: '840px' }}>
              {/* Left Column: Hour Marks */}
              <div className="col-span-1 flex flex-col justify-between py-1 text-right pr-2 select-none">
                {hours.map((h) => (
                  <span key={h} className="h-[60px] text-[11px] text-outline font-semibold">
                    {h}
                  </span>
                ))}
              </div>

              {/* 7 Day Columns */}
              {days.map((day) => {
                const dayEvents = calendarEvents.filter(
                  (e) => e.day_index === day.dayIndex && (selectedCourses.length === 0 || selectedCourses.includes(e.course) || e.event_type === 'deadline' || e.event_type === 'independent_study')
                );

                return (
                  <div
                    key={day.dayIndex}
                    onClick={() => {
                      setQuickDay(day.dayIndex);
                    }}
                    className={`relative rounded-xl border border-surface-container-high/40 transition-colors ${
                      day.isToday ? 'bg-primary-fixed/20' : 'bg-surface-container-low/40'
                    }`}
                  >
                    {/* Today Red Current Time Line marker at 2:45 PM (approx 465px from 7 AM) */}
                    {day.isToday && (
                      <div
                        className="absolute inset-x-0 z-30 flex items-center pointer-events-none"
                        style={{ top: '465px' }}
                      >
                        <span className="w-2.5 h-2.5 -ml-1 rounded-full bg-error shadow"></span>
                        <div className="w-full h-0.5 bg-error shadow-sm"></div>
                        <span className="absolute right-1 -top-2.5 px-1.5 py-0.5 rounded bg-error text-white text-[9px] font-bold">
                          2:45 PM
                        </span>
                      </div>
                    )}

                    {/* Render Events */}
                    {dayEvents.map((ev) => {
                      // Map start_hour relative to 7:00 AM (1 hour = 60px)
                      const topPx = (ev.start_hour - 7) * 60;
                      const durationHours = Math.max(0.6, ev.end_hour - ev.start_hour);
                      const heightPx = durationHours * 60;

                      // Event block styles based on event type
                      let blockClass = 'bg-surface-container text-on-surface border border-surface-container-high';
                      if (ev.event_type === 'deadline') {
                        blockClass = 'bg-error text-on-error shadow-md border border-error-container';
                      } else if (ev.course === 'AP Calculus BC') {
                        blockClass = 'bg-primary-fixed text-on-primary-fixed border border-primary/20';
                      } else if (ev.course.includes('Chemistry')) {
                        blockClass = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20';
                      } else if (ev.event_type === 'independent_study') {
                        blockClass = 'bg-surface-container-high text-on-surface border border-surface-container-highest';
                      } else if (ev.event_type === 'lab') {
                        blockClass = 'bg-surface-container-highest text-on-surface border border-tertiary-container/30';
                      }

                      return (
                        <div
                          key={ev.id}
                          className={`absolute inset-x-1 p-2 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${blockClass}`}
                          style={{
                            top: `${Math.max(0, topPx)}px`,
                            height: `${heightPx}px`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[11px] font-bold truncate leading-tight">
                              {ev.title}
                            </span>
                            {ev.badge && (
                              <span className="text-[9px] font-bold px-1 rounded bg-white/20 whitespace-nowrap">
                                {ev.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] opacity-90 mt-0.5">
                            <span className="truncate">{ev.location || ev.course}</span>
                            <span className="font-semibold whitespace-nowrap">
                              {ev.start_time_display}
                            </span>
                          </div>

                          {/* Hover delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCalendarEvent(ev.id);
                            }}
                            className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-black/20 hover:bg-black/40 text-white transition-opacity"
                            title="Remove event"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Legend Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-surface-container px-3 py-2 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-4 flex-wrap text-on-surface-variant text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span>Lecture / Seminar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span>Laboratory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                <span>Independent Study</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                <span>Deadlines &amp; Exams</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-sm">touch_app</span>
              <span>Click any slot or use right drawer to add academic blocks</span>
            </div>
          </div>
        </div>

        {/* Right Drawer: Day Detail & Quick Event Adder (xl:col-span-3) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          {/* Day Detail Card */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-sm">today</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Day Overview</span>
                </div>
                <h2 className="text-base font-bold text-on-surface mt-0.5">Thursday, Oct 24</h2>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined text-base text-primary">partly_cloudy_day</span>
                <span className="text-xs font-bold">64°F</span>
              </div>
            </div>

            {/* Visual Timeline Snapshot */}
            <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-surface-container text-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-semibold">Scheduled Time</span>
                <span className="text-sm font-extrabold text-on-surface">4.5 hrs</span>
              </div>
              <div className="h-8 w-px bg-surface-container-high"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-semibold">Tasks Pending</span>
                <span className="text-sm font-extrabold text-error">1 Critical</span>
              </div>
              <div className="h-8 w-px bg-surface-container-high"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-semibold">Free Window</span>
                <span className="text-sm font-extrabold text-tertiary-container">10:30 - 2:00</span>
              </div>
            </div>

            {/* Urgent Deadline Callout Banner */}
            <div className="p-3 rounded-xl bg-error-container text-on-error-container flex items-center justify-between shadow-xs border border-error/20">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-error text-on-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                </div>
                <div>
                  <span className="text-xs font-bold block">History Essay #2 DUE</span>
                  <span className="text-[11px] text-on-error-container/80">Turnitin Portal closes 2:00 PM</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert('Turnitin portal upload opened! File verification completed.')}
                className="px-2.5 py-1 rounded-lg bg-error text-on-error text-xs font-bold hover:bg-error/90 transition-colors shadow-xs"
              >
                Upload
              </button>
            </div>

            {/* Interactive Task Checklist for the Day */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-on-surface">Today&apos;s Action Items</span>
                <span className="text-xs text-primary font-bold">
                  {completedChecklistCount} / {checklistItems.length} Complete
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden mb-1">
                <div
                  className="h-full bg-tertiary-container rounded-full transition-all duration-300"
                  style={{ width: `${(completedChecklistCount / checklistItems.length) * 100}%` }}
                ></div>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-1.5">
                {checklistItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2 p-2 rounded-xl transition-colors cursor-pointer group ${
                      item.isUrgent ? 'bg-surface-container/60 hover:bg-surface-container' : 'hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="mt-0.5 w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs block ${
                          item.completed
                            ? 'line-through text-outline font-medium'
                            : item.isUrgent
                            ? 'font-bold text-on-surface'
                            : 'font-medium text-on-surface'
                        }`}
                      >
                        {item.text}
                      </span>
                      <span
                        className={`text-[10px] ${
                          item.isUrgent ? 'text-error font-semibold' : 'text-on-surface-variant'
                        }`}
                      >
                        {item.sub}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Event & Assignment Adder Card */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
                <h2 className="text-base font-bold text-on-surface">Quick Add Event</h2>
              </div>
              <span className="text-[11px] text-on-surface-variant font-semibold">
                Slot: {days[quickDay]?.name || 'Thu 24'}
              </span>
            </div>

            {showEventSuccess && (
              <div className="p-2 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Event added to calendar!</span>
              </div>
            )}

            <form onSubmit={handleQuickAddEvent} className="flex flex-col gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="e.g., Biology Review Session"
                  className="w-full bg-surface-container text-on-surface px-3 py-2 rounded-xl text-xs placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                    Course
                  </label>
                  <select
                    value={quickCourse}
                    onChange={(e) => setQuickCourse(e.target.value)}
                    className="w-full bg-surface-container text-on-surface px-2 py-2 rounded-xl text-xs focus:outline-none focus:bg-surface-container-high cursor-pointer"
                  >
                    <option value="AP Calculus BC">AP Calculus</option>
                    <option value="AP Chemistry">Chemistry</option>
                    <option value="World History">World History</option>
                    <option value="Computer Science: Data Structures & TS">Computer Science</option>
                    <option value="AP Physics C: Mechanics">Physics 101</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                    Type
                  </label>
                  <select
                    value={quickType}
                    onChange={(e) => setQuickType(e.target.value as EventType)}
                    className="w-full bg-surface-container text-on-surface px-2 py-2 rounded-xl text-xs focus:outline-none focus:bg-surface-container-high cursor-pointer"
                  >
                    <option value="independent_study">Study Session</option>
                    <option value="deadline">Assignment DUE</option>
                    <option value="lecture">Class Lecture</option>
                    <option value="lab">Lab / Office Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={quickStartTime}
                    onChange={(e) => setQuickStartTime(e.target.value)}
                    className="w-full bg-surface-container text-on-surface px-2 py-2 rounded-xl text-xs focus:outline-none focus:bg-surface-container-high"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={quickEndTime}
                    onChange={(e) => setQuickEndTime(e.target.value)}
                    className="w-full bg-surface-container text-on-surface px-2 py-2 rounded-xl text-xs focus:outline-none focus:bg-surface-container-high"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                  Location / Link
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    pin_drop
                  </span>
                  <input
                    type="text"
                    value={quickLocation}
                    onChange={(e) => setQuickLocation(e.target.value)}
                    placeholder="Science Library 2nd Fl"
                    className="w-full bg-surface-container text-on-surface pl-8 pr-3 py-2 rounded-xl text-xs placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all hover:shadow-md"
              >
                <span className="material-symbols-outlined text-base">calendar_add_on</span>
                <span>Add to Calendar</span>
              </button>
            </form>
          </div>

          {/* Upcoming Focus Milestone Widget */}
          <div className="p-4 rounded-2xl bg-surface-container-low shadow-sm border border-surface-container flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-xs shrink-0">
              <span className="material-symbols-outlined text-2xl text-tertiary">workspace_premium</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-tertiary-container block">
                Next Exam Countdown
              </span>
              <h3 className="text-sm font-bold text-on-surface truncate">Physics Midterm</h3>
              <p className="text-xs text-on-surface-variant">Friday at 10:00 AM (In 19 hours)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
