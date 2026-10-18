import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { GRADES_LIST, BOARDS_LIST, INDIAN_STATES, LANGUAGES_LIST, SUBJECT_CHAPTER_MAP } from '../data/syllabusData';
import { EducationBoard } from '../types';

interface SettingsScreenProps {
  onOpenAuth: () => void;
  onOpenOnboarding?: () => void;
}

const STUDY_TIMES = [
  'Morning (6:00 AM – 9:00 AM)',
  'Afternoon (1:00 PM – 4:00 PM)',
  'Evening (5:00 PM – 8:00 PM)',
  'Night (8:30 PM – 11:30 PM)',
];

const LEARNING_PREFERENCES = [
  'Visual diagrams & concept maps',
  'Step-by-step worked problem walkthroughs',
  'Audio & conversational voice explanations',
  'Active recall quizzes (one question at a time)',
  'Concise formula sheets & bullet summaries',
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenAuth, onOpenOnboarding }) => {
  const { 
    user, 
    updateProfile,
    supabaseUser, 
    isSupabaseReady, 
    updateSupabaseConfig, 
    disconnectSupabase 
  } = useAcademic();

  // Profile Edit State
  const [fullName, setFullName] = useState(user.full_name || '');
  const [grade, setGrade] = useState(user.grade || 'Class 10');
  const [board, setBoard] = useState<EducationBoard>(user.education_board || 'CBSE');
  const [stateBoardName, setStateBoardName] = useState(user.state_board_name || 'Telangana');
  const [country, setCountry] = useState(user.country || 'India');
  const [state, setState] = useState(user.state || 'Telangana');
  const [language, setLanguage] = useState(user.preferred_language || 'English');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    user.subjects?.length ? user.subjects : ['Mathematics', 'Science', 'Social Science', 'English Literature', 'Computer Science']
  );
  const [academicGoals, setAcademicGoals] = useState(user.academic_goals || '');
  const [studyTime, setStudyTime] = useState(user.preferred_study_times || STUDY_TIMES[2]);
  const [learningPrefs, setLearningPrefs] = useState<string[]>(
    user.learning_preferences?.length ? user.learning_preferences : [LEARNING_PREFERENCES[0], LEARNING_PREFERENCES[1]]
  );
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // ElevenLabs Agent ID
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState(
    () => localStorage.getItem('smart_school_elevenlabs_agent_id') || import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'YOUR_ELEVENLABS_AGENT_ID'
  );
  const [agentSavedMsg, setAgentSavedMsg] = useState(false);

  // Supabase Config state
  const [supabaseUrl, setSupabaseUrl] = useState(
    () => localStorage.getItem('smart_school_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    () => localStorage.getItem('smart_school_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [testing, setTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const toggleSubject = (sub: string) => {
    setSelectedSubjects(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const togglePreference = (pref: string) => {
    setLearningPrefs(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      full_name: fullName.trim() || user.full_name,
      grade,
      education_board: board,
      state_board_name: board === 'State Board' ? stateBoardName : undefined,
      country: country.trim(),
      state: state.trim(),
      preferred_language: language,
      subjects: selectedSubjects.length > 0 ? selectedSubjects : user.subjects,
      academic_goals: academicGoals.trim(),
      preferred_study_times: studyTime,
      learning_preferences: learningPrefs,
      onboarding_completed: true,
    });
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 3000);
  };

  const handleSaveAgentId = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('smart_school_elevenlabs_agent_id', elevenLabsAgentId.trim());
    setAgentSavedMsg(true);
    setTimeout(() => setAgentSavedMsg(false), 2500);
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setStatusMessage(null);

    const res = await updateSupabaseConfig(supabaseUrl, supabaseKey);
    setTesting(false);

    if (res.success) {
      setStatusMessage({ text: res.message, isError: false });
    } else {
      setStatusMessage({ text: `Failed: ${res.message}`, isError: true });
    }
  };

  const handleCopySchema = () => {
    const sql = `-- Smart School Homework Planner RLS Schema
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  grade text default 'Class 10',
  country text default 'India',
  state text default 'Telangana',
  education_board text default 'CBSE',
  state_board_name text,
  preferred_language text default 'English',
  subjects jsonb default '["Mathematics", "Science", "Social Science", "English", "Computer Science"]'::jsonb,
  academic_goals text,
  preferred_study_times text,
  learning_preferences jsonb,
  onboarding_completed boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleResetData = () => {
    if (confirm('Reset local application data to initial demo seed?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const allAvailableSubjects = Object.keys(SUBJECT_CHAPTER_MAP);

  return (
    <div className="flex flex-col w-full pb-8 max-w-4xl">
      {/* Header */}
      <div className="py-3 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">settings</span>
          <span>Personalization, StudyMate Voice &amp; Cloud Database</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
          Settings &amp; Student Profile
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* STUDENT ACADEMIC PROFILE */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">person_edit</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Academic Profile &amp; Syllabus</h2>
                <p className="text-xs text-on-surface-variant">
                  Personalizes AI tutor explanations, chapter notes, quiz levels, and StudyMate
                </p>
              </div>
            </div>

            {onOpenOnboarding && (
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">reorder</span>
                <span>Run Setup Wizard</span>
              </button>
            )}
          </div>

          {profileSavedMsg && (
            <div className="p-3 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Profile updated! Your AI tutor, study planner, and StudyMate will reflect these settings.</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Display Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Class / Grade *</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container font-semibold cursor-pointer"
                >
                  {GRADES_LIST.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Education Board *</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value as EducationBoard)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container font-semibold cursor-pointer"
                >
                  {BOARDS_LIST.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Preferred Learning Language *</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container font-semibold cursor-pointer"
                >
                  {LANGUAGES_LIST.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {board === 'State Board' && (
              <div className="flex flex-col gap-1 bg-surface-container-low p-3.5 rounded-2xl border border-surface-container">
                <label className="text-xs font-bold text-primary">State Board Jurisdiction *</label>
                <select
                  value={stateBoardName}
                  onChange={(e) => setStateBoardName(e.target.value)}
                  className="bg-surface-container-lowest text-on-surface text-xs md:text-sm p-2.5 rounded-xl border border-surface-container font-semibold cursor-pointer mt-1"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st} State Board</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Country *</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">State or Region *</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container font-semibold cursor-pointer"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subjects Selection */}
            <div className="flex flex-col gap-2 pt-1">
              <label className="text-xs font-bold text-on-surface flex justify-between">
                <span>Subjects Studied *</span>
                <span className="text-primary font-bold">{selectedSubjects.length} selected</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allAvailableSubjects.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-primary-fixed text-primary border-primary shadow-xs'
                          : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
                      }`}
                    >
                      <span className="truncate">{sub}</span>
                      {isSelected && <span className="material-symbols-outlined text-sm text-primary">check</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Fields: Exam Goals & Study Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Target Academic Goals / Exams</label>
                <input
                  type="text"
                  value={academicGoals}
                  onChange={(e) => setAcademicGoals(e.target.value)}
                  placeholder="e.g. CBSE Class 10 Board Exams March 2025"
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Preferred Study Times</label>
                <select
                  value={studyTime}
                  onChange={(e) => setStudyTime(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container font-semibold cursor-pointer"
                >
                  {STUDY_TIMES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional: Learning Preferences */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-xs font-bold text-on-surface">Learning Preferences</label>
              <div className="flex flex-wrap gap-1.5">
                {LEARNING_PREFERENCES.map((pref) => {
                  const isSelected = learningPrefs.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => togglePreference(pref)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-secondary-fixed text-secondary border-secondary font-bold'
                          : 'bg-surface-container-low text-on-surface-variant border-surface-container hover:bg-surface-container'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{pref}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-surface-container">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* ELEVENLABS STUDYMATE VOICE ASSISTANT SETTINGS */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">record_voice_over</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">ElevenLabs StudyMate Voice Assistant</h2>
                <p className="text-xs text-on-surface-variant">
                  Configure your ElevenLabs Conversational AI Agent for voice tutoring
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary-fixed text-secondary flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>StudyMate Active</span>
            </span>
          </div>

          {agentSavedMsg && (
            <div className="p-3 bg-secondary-fixed text-on-secondary-fixed rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>ElevenLabs Agent ID saved!</span>
            </div>
          )}

          <form onSubmit={handleSaveAgentId} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">ElevenLabs Agent ID</label>
              <input
                type="text"
                value={elevenLabsAgentId}
                onChange={(e) => setElevenLabsAgentId(e.target.value)}
                placeholder="YOUR_ELEVENLABS_AGENT_ID"
                className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-secondary font-mono"
              />
              <span className="text-[11px] text-on-surface-variant">
                Your conversational agent ID from your ElevenLabs dashboard. StudyMate operates as a floating assistant on your dashboard.
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-secondary hover:bg-secondary-container text-on-secondary px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Update Agent ID
              </button>
            </div>
          </form>
        </div>

        {/* SUPABASE CONNECTION CARD */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">database</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Supabase Backend &amp; RLS Configuration</h2>
                <p className="text-xs text-on-surface-variant">
                  Enforce strict student privacy via Row Level Security
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                isSupabaseReady
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseReady ? 'bg-tertiary' : 'bg-outline'}`}></span>
              <span>{isSupabaseReady ? (supabaseUser ? 'Cloud Connected' : 'Ready for Auth') : 'Local Demo Mode'}</span>
            </span>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                statusMessage.isError
                  ? 'bg-error-container text-on-error-container border border-error/30'
                  : 'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30'
              }`}
            >
              <span className="material-symbols-outlined text-base shrink-0">
                {statusMessage.isError ? 'error' : 'check_circle'}
              </span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleTestAndSave} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Supabase Anon Public API Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopySchema}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">content_copy</span>
                <span>{copiedSql ? 'SQL Copied!' : 'Copy Supabase SQL Schema'}</span>
              </button>

              <div className="flex items-center gap-2">
                {isSupabaseReady && (
                  <button
                    type="button"
                    onClick={disconnectSupabase}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-error hover:bg-error-container cursor-pointer"
                  >
                    Disconnect
                  </button>
                )}

                <button
                  type="submit"
                  disabled={testing}
                  className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {testing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Testing...</span>
                    </>
                  ) : (
                    <span>Test &amp; Save Connection</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Reset Local Seed Data */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Reset Application State</h3>
            <p className="text-xs text-on-surface-variant">
              Revert all local storage items back to initial student demo seed
            </p>
          </div>

          <button
            onClick={handleResetData}
            className="px-4 py-2 rounded-xl text-xs font-bold text-error hover:bg-error-container transition-colors cursor-pointer"
          >
            Reset Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};
