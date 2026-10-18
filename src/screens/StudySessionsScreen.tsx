import React, { useState, useEffect } from 'react';
import { useAcademic } from '../context/AcademicContext';

export const StudySessionsScreen: React.FC = () => {
  const { 
    courses, 
    assignments, 
    isAudioPlaying, 
    toggleAudio, 
    audioSoundscape, 
    setAudioSoundscape 
  } = useAcademic();

  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.title || 'AP Chemistry');
  const [sessionLogs, setSessionLogs] = useState([
    { id: 1, course: 'AP Chemistry', minutes: 25, completedAt: 'Today, 2:15 PM', tag: 'Deep Focus' },
    { id: 2, course: 'Calculus BC', minutes: 50, completedAt: 'Today, 11:30 AM', tag: 'Problem Set #4' },
    { id: 3, course: 'AP US History', minutes: 25, completedAt: 'Yesterday, 4:45 PM', tag: 'DBQ Drafting' },
  ]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            const finishedMin = Math.round(totalSeconds / 60);
            setSessionLogs((logs) => [
              {
                id: Date.now(),
                course: selectedCourse,
                minutes: finishedMin,
                completedAt: 'Just now',
                tag: 'Completed Focus',
              },
              ...logs,
            ]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, totalSeconds, selectedCourse]);

  const switchMode = (newMode: 'focus' | 'short_break' | 'long_break', mins: number) => {
    setMode(newMode);
    const secs = mins * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const circumference = 377; // radius 60
  const progressOffset = circumference - (remainingSeconds / totalSeconds) * circumference;

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Banner */}
      <div className="flex items-center justify-between py-3 mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">timer</span>
            <span>Focus &amp; Productivity Sanctuary</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Study Sessions &amp; Timer
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-semibold hidden sm:inline">
            Total Focus Today: <strong>14.5 Hours</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Focus Clock Panel */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm border border-surface-container flex flex-col items-center">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-surface-container-low p-1.5 rounded-2xl gap-1 mb-8 border border-surface-container">
            <button
              onClick={() => switchMode('focus', 25)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                mode === 'focus'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => switchMode('focus', 50)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                mode === 'focus' && totalSeconds === 50 * 60
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Deep Work (50m)
            </button>
            <button
              onClick={() => switchMode('short_break', 5)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                mode === 'short_break'
                  ? 'bg-tertiary text-on-tertiary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => switchMode('long_break', 15)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                mode === 'long_break'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Large Circular Gauge */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center my-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle
                className="text-surface-container-high"
                cx="70"
                cy="70"
                fill="none"
                r="60"
                stroke="currentColor"
                strokeWidth="7"
              />
              <circle
                className="text-primary transition-all duration-1000 ease-linear"
                cx="70"
                cy="70"
                fill="none"
                r="60"
                stroke="currentColor"
                strokeDasharray="377"
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                strokeWidth="7"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl md:text-6xl font-extrabold text-on-surface tracking-tight font-mono">
                {timeFormatted}
              </span>
              <span className="text-xs uppercase font-extrabold text-primary tracking-widest mt-2">
                {isRunning ? 'Deep Work In Progress' : mode.replace('_', ' ')}
              </span>
              <span className="text-xs text-on-surface-variant mt-1 max-w-[200px] truncate">
                {selectedCourse}
              </span>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="bg-primary hover:bg-primary-container text-on-primary px-8 py-3.5 rounded-2xl font-extrabold text-base shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-2xl">
                {isRunning ? 'pause' : 'play_arrow'}
              </span>
              <span>{isRunning ? 'Pause Timer' : 'Start Focus Session'}</span>
            </button>
            <button
              onClick={resetTimer}
              className="p-3.5 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
              title="Reset Timer"
            >
              <span className="material-symbols-outlined text-2xl">restart_alt</span>
            </button>
          </div>
        </div>

        {/* Focus Controls & Soundscapes Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Course Association */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs">
            <h3 className="text-sm font-bold text-on-surface mb-2">Associate Focus Session</h3>
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary cursor-pointer font-semibold"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Ambient Synthesizer Box */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-2xl ${isAudioPlaying ? 'text-primary animate-pulse' : 'text-on-surface-variant'}`}>
                  headphones
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Ambient Focus Audio</h3>
                  <p className="text-[11px] text-on-surface-variant">Synthesized calming soundscape</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAudioPlaying}
                  onChange={toggleAudio}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'lofi' as const, label: 'Lofi Chords', icon: 'music_note' },
                { id: 'rain' as const, label: 'Rainfall', icon: 'rainy' },
                { id: 'whitenoise' as const, label: 'White Noise', icon: 'waves' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAudioSoundscape(s.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border ${
                    audioSoundscape === s.id
                      ? 'bg-primary-fixed text-primary border-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant border-surface-container hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Session History Log */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <h3 className="text-sm font-bold text-on-surface">Recent Focus Logs</h3>
              <span className="text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {sessionLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface">{log.course}</span>
                    <span className="text-[10px] text-on-surface-variant">{log.completedAt} • {log.tag}</span>
                  </div>
                  <span className="font-extrabold text-primary font-mono bg-surface-container-lowest px-2 py-1 rounded-lg">
                    +{log.minutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
