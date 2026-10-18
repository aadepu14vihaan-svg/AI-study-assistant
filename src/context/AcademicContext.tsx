import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  Assignment, 
  Course, 
  CalendarEvent, 
  UserProfile, 
  AssignmentStatus,
  StudyNote,
  QuizAttempt,
  FocusSessionRecord,
  StudyPlanDay
} from '../types';
import { 
  INITIAL_USER, 
  INITIAL_COURSES, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_CALENDAR_EVENTS,
  INITIAL_STUDY_NOTES,
  INITIAL_QUIZ_ATTEMPTS,
  INITIAL_STUDY_PLAN
} from '../data/mockData';
import { 
  getSupabaseClient, 
  isSupabaseConfigured, 
  saveSupabaseConfig, 
  clearSupabaseConfig,
  testSupabaseConnection 
} from '../lib/supabase';
import { geminiApi } from '../lib/geminiApi';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface InstantQuizPayload {
  subject: string;
  chapter: string;
  contextText?: string;
}

interface AcademicContextType {
  user: UserProfile;
  supabaseUser: SupabaseUser | null;
  isSupabaseReady: boolean;
  isSyncing: boolean;
  lastSyncedText: string;
  assignments: Assignment[];
  courses: Course[];
  calendarEvents: CalendarEvent[];
  studyNotes: StudyNote[];
  quizAttempts: QuizAttempt[];
  focusSessions: FocusSessionRecord[];
  studyPlan: StudyPlanDay[];
  savedResourceIds: string[];

  // Profile
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (onboardingData: Partial<UserProfile>) => Promise<void>;

  // Homework Operations
  addAssignment: (newAssign: Omit<Assignment, 'id'>) => Promise<Assignment>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  toggleAssignmentComplete: (id: string) => Promise<void>;
  updateAssignmentStatus: (id: string, status: AssignmentStatus) => Promise<void>;

  // Course Operations
  addCourse: (course: Omit<Course, 'id'>) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Calendar Operations
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  deleteCalendarEvent: (id: string) => Promise<void>;

  // Study Notes Operations
  addStudyNote: (note: Omit<StudyNote, 'id' | 'created_at'>) => Promise<StudyNote>;
  updateStudyNote: (id: string, updates: Partial<StudyNote>) => Promise<void>;
  deleteStudyNote: (id: string) => Promise<void>;
  toggleFavoriteNote: (id: string) => Promise<void>;

  // Quiz Operations
  saveQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'created_at'>) => Promise<QuizAttempt>;

  // Focus Session Operations
  recordFocusSession: (session: Omit<FocusSessionRecord, 'id' | 'created_at'>) => Promise<void>;

  // Study Plan Operations
  togglePlanTaskCompleted: (dayIdx: number, taskId: string) => void;
  regeneratePlan: () => Promise<void>;

  // Resources Bookmarks
  toggleSaveResource: (resourceId: string) => void;

  // Instant Quiz ("Test My Understanding") Modal Hook
  instantQuizPayload: InstantQuizPayload | null;
  openInstantQuiz: (payload: InstantQuizPayload) => void;
  closeInstantQuiz: () => void;

  // Auth Operations
  signIn: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error: string | null; message?: string }>;
  resetPassword: (email: string) => Promise<{ error: string | null; message?: string }>;
  signOut: () => Promise<void>;
  updateSupabaseConfig: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
  disconnectSupabase: () => void;

  // Audio Focus & Timer
  isAudioPlaying: boolean;
  toggleAudio: () => void;
  audioSoundscape: 'lofi' | 'rain' | 'whitenoise';
  setAudioSoundscape: (sound: 'lofi' | 'rain' | 'whitenoise') => void;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

// Web Audio Ambient Synthesizer for genuine ambient focus audio
class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private nodes: (AudioNode | number)[] = [];
  public isPlaying = false;

  start(soundscape: 'lofi' | 'rain' | 'whitenoise') {
    this.stop();
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);
      this.nodes.push(masterGain);

      if (soundscape === 'whitenoise' || soundscape === 'rain') {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11;
          b6 = white * 0.115926;
        }

        const whiteNoiseSource = this.ctx.createBufferSource();
        whiteNoiseSource.buffer = noiseBuffer;
        whiteNoiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = soundscape === 'rain' ? 'bandpass' : 'lowpass';
        filter.frequency.setValueAtTime(soundscape === 'rain' ? 800 : 400, this.ctx.currentTime);
        filter.Q.setValueAtTime(soundscape === 'rain' ? 1.5 : 0.8, this.ctx.currentTime);

        whiteNoiseSource.connect(filter);
        filter.connect(masterGain);
        whiteNoiseSource.start();
        this.nodes.push(whiteNoiseSource, filter);
      } else {
        const freqs = [155.56, 233.08, 311.13, 466.16];
        freqs.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq + (Math.random() * 0.4 - 0.2), this.ctx.currentTime);

          const lfo = this.ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.15 + idx * 0.05, this.ctx.currentTime);
          const lfoGain = this.ctx.createGain();
          lfoGain.gain.setValueAtTime(1.2, this.ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start();

          gain.gain.setValueAtTime(0.04 / (idx + 1), this.ctx.currentTime);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start();
          this.nodes.push(osc, gain, lfo, lfoGain);
        });
      }

      this.isPlaying = true;
    } catch (e) {
      console.warn('Audio playback failed or blocked by autoplay policy:', e);
      this.isPlaying = false;
    }
  }

  stop() {
    try {
      this.nodes.forEach(node => {
        if (typeof node === 'object' && node !== null) {
          if ('stop' in node && typeof node.stop === 'function') {
            node.stop();
          }
          if ('disconnect' in node && typeof node.disconnect === 'function') {
            node.disconnect();
          }
        }
      });
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close();
      }
    } catch {
      // ignore
    }
    this.nodes = [];
    this.ctx = null;
    this.isPlaying = false;
  }
}

const audioEngine = new AmbientAudioEngine();

export const AcademicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('smart_school_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isSupabaseReady, setIsSupabaseReady] = useState<boolean>(() => isSupabaseConfigured());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedText, setLastSyncedText] = useState<string>('Synced 2m ago');

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('smart_school_assignments');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('smart_school_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('smart_school_calendar_events');
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
  });

  const [studyNotes, setStudyNotes] = useState<StudyNote[]>(() => {
    const saved = localStorage.getItem('smart_school_study_notes');
    return saved ? JSON.parse(saved) : INITIAL_STUDY_NOTES;
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    const saved = localStorage.getItem('smart_school_quiz_attempts');
    return saved ? JSON.parse(saved) : INITIAL_QUIZ_ATTEMPTS;
  });

  const [focusSessions, setFocusSessions] = useState<FocusSessionRecord[]>(() => {
    const saved = localStorage.getItem('smart_school_focus_sessions');
    return saved ? JSON.parse(saved) : [
      {
        id: 'f-1',
        subject: 'Science',
        chapter: 'Chemical Reactions',
        planned_minutes: 25,
        actual_minutes: 25,
        completed: true,
        interrupted: false,
        took_quiz: true,
        created_at: '2024-10-23T14:00:00Z'
      }
    ];
  });

  const [studyPlan, setStudyPlan] = useState<StudyPlanDay[]>(() => {
    const saved = localStorage.getItem('smart_school_study_plan');
    return saved ? JSON.parse(saved) : INITIAL_STUDY_PLAN;
  });

  const [savedResourceIds, setSavedResourceIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('smart_school_saved_resource_ids');
    return saved ? JSON.parse(saved) : ['res-ncert-math-10', 'res-ncert-sci-10'];
  });

  // Instant Quiz Payload state
  const [instantQuizPayload, setInstantQuizPayload] = useState<InstantQuizPayload | null>(null);

  // Audio state
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioSoundscape, setAudioSoundscape] = useState<'lofi' | 'rain' | 'whitenoise'>('lofi');

  // Persistence to local storage
  useEffect(() => {
    localStorage.setItem('smart_school_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('smart_school_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('smart_school_calendar_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('smart_school_study_notes', JSON.stringify(studyNotes));
  }, [studyNotes]);

  useEffect(() => {
    localStorage.setItem('smart_school_quiz_attempts', JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  useEffect(() => {
    localStorage.setItem('smart_school_focus_sessions', JSON.stringify(focusSessions));
  }, [focusSessions]);

  useEffect(() => {
    localStorage.setItem('smart_school_study_plan', JSON.stringify(studyPlan));
  }, [studyPlan]);

  useEffect(() => {
    localStorage.setItem('smart_school_saved_resource_ids', JSON.stringify(savedResourceIds));
  }, [savedResourceIds]);

  useEffect(() => {
    localStorage.setItem('smart_school_user', JSON.stringify(user));
  }, [user]);

  // Check Supabase Auth state on mount
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setIsSupabaseReady(false);
      return;
    }

    setIsSupabaseReady(true);
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setUser(prev => ({
          ...prev,
          id: session.user.id,
          email: session.user.email || prev.email,
          full_name: session.user.user_metadata?.full_name || prev.full_name,
        }));
        fetchRemoteData(session.user.id);
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        setUser(prev => ({
          ...prev,
          id: session.user.id,
          email: session.user.email || prev.email,
          full_name: session.user.user_metadata?.full_name || prev.full_name,
        }));
        fetchRemoteData(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRemoteData = async (userId: string) => {
    const client = getSupabaseClient();
    if (!client) return;

    setIsSyncing(true);
    try {
      const [profileRes, assignRes, courseRes, noteRes, quizRes] = await Promise.all([
        client.from('profiles').select('*').eq('id', userId).maybeSingle(),
        client.from('assignments').select('*').eq('user_id', userId),
        client.from('courses').select('*').eq('user_id', userId),
        client.from('study_notes').select('*').eq('user_id', userId),
        client.from('quiz_attempts').select('*').eq('user_id', userId),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        setUser(prev => {
          const updated: UserProfile = {
            ...prev,
            id: userId,
            email: p.email || prev.email,
            full_name: p.full_name || prev.full_name,
            grade: p.grade || prev.grade || 'Class 10',
            country: p.country || prev.country || 'India',
            state: p.state || prev.state || 'Telangana',
            education_board: p.education_board || prev.education_board || 'CBSE',
            state_board_name: p.state_board_name || prev.state_board_name,
            school_name: p.school_name || prev.school_name || '',
            preferred_language: p.preferred_language || prev.preferred_language || 'English',
            subjects: Array.isArray(p.subjects) && p.subjects.length > 0 ? p.subjects : (prev.subjects || ['Mathematics', 'Science']),
            academic_goals: p.academic_goals || prev.academic_goals || '',
            preferred_study_times: p.preferred_study_times || prev.preferred_study_times,
            learning_preferences: Array.isArray(p.learning_preferences) ? p.learning_preferences : (prev.learning_preferences || []),
            onboarding_completed: p.onboarding_completed !== undefined ? Boolean(p.onboarding_completed) : true,
          };
          localStorage.setItem('smart_school_user', JSON.stringify(updated));
          return updated;
        });
      } else {
        // User is authenticated but hasn't created a profile in the cloud yet
        setUser(prev => {
          const updated: UserProfile = {
            ...prev,
            id: userId,
            onboarding_completed: false, // Prompt onboarding
          };
          localStorage.setItem('smart_school_user', JSON.stringify(updated));
          return updated;
        });
      }

      if (assignRes.data && assignRes.data.length > 0) {
        setAssignments(assignRes.data as Assignment[]);
      }
      if (courseRes.data && courseRes.data.length > 0) {
        setCourses(courseRes.data as Course[]);
      }
      if (noteRes.data && noteRes.data.length > 0) {
        setStudyNotes(noteRes.data as StudyNote[]);
      }
      if (quizRes.data && quizRes.data.length > 0) {
        setQuizAttempts(quizRes.data as QuizAttempt[]);
      }
      setLastSyncedText('Synced just now');
    } catch (err) {
      console.warn('Failed to fetch from remote Supabase tables, keeping local data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Audio Toggle
  const toggleAudio = useCallback(() => {
    if (isAudioPlaying) {
      audioEngine.stop();
      setIsAudioPlaying(false);
    } else {
      audioEngine.start(audioSoundscape);
      setIsAudioPlaying(true);
    }
  }, [isAudioPlaying, audioSoundscape]);

  const handleSetSoundscape = useCallback((sound: 'lofi' | 'rain' | 'whitenoise') => {
    setAudioSoundscape(sound);
    if (isAudioPlaying) {
      audioEngine.start(sound);
    }
  }, [isAudioPlaying]);

  // Profile operations
  const updateProfile = async (updates: Partial<UserProfile>) => {
    let nextUser: UserProfile = user;
    setUser(prev => {
      nextUser = { ...prev, ...updates };
      localStorage.setItem('smart_school_user', JSON.stringify(nextUser));
      return nextUser;
    });

    const client = getSupabaseClient();
    if (client && (supabaseUser || updates.id || user.id)) {
      const targetId = supabaseUser?.id || updates.id || user.id;
      try {
        const payload = {
          id: targetId,
          email: updates.email || supabaseUser?.email || nextUser.email,
          full_name: updates.full_name ?? nextUser.full_name,
          grade: updates.grade ?? nextUser.grade,
          school_name: updates.school_name ?? nextUser.school_name,
          country: updates.country ?? nextUser.country,
          state: updates.state ?? nextUser.state,
          education_board: updates.education_board ?? nextUser.education_board,
          state_board_name: updates.state_board_name ?? nextUser.state_board_name,
          preferred_language: updates.preferred_language ?? nextUser.preferred_language,
          subjects: updates.subjects ?? nextUser.subjects,
          academic_goals: updates.academic_goals ?? nextUser.academic_goals,
          preferred_study_times: updates.preferred_study_times ?? nextUser.preferred_study_times,
          learning_preferences: updates.learning_preferences ?? nextUser.learning_preferences,
          onboarding_completed: updates.onboarding_completed !== undefined ? updates.onboarding_completed : true,
        };
        await client.from('profiles').upsert(payload, { onConflict: 'id' });
      } catch (e) {
        console.error('Error updating profile in Supabase:', e);
      }
    }
  };

  const completeOnboarding = async (onboardingData: Partial<UserProfile>) => {
    await updateProfile({
      ...onboardingData,
      onboarding_completed: true,
    });
  };

  // Homework Operations
  const addAssignment = async (newAssign: Omit<Assignment, 'id'>): Promise<Assignment> => {
    const id = 'assign-' + Date.now();
    const created: Assignment = {
      ...newAssign,
      id,
      user_id: supabaseUser?.id || user.id,
      created_at: new Date().toISOString(),
    };

    setAssignments(prev => [created, ...prev]);

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      setIsSyncing(true);
      try {
        await client.from('assignments').insert({
          id: created.id,
          user_id: supabaseUser.id,
          course_name: created.course,
          title: created.title,
          description: created.description || '',
          status: created.status,
          priority: created.priority,
          due_date: created.due_date,
          est_hours: created.est_hours,
          completed: created.completed,
          subtasks: created.subtasks,
          attachments: created.attachments,
          metadata: created.metadata || {},
        });
        setLastSyncedText('Synced just now');
      } catch (e) {
        console.error('Error adding assignment to Supabase:', e);
      } finally {
        setIsSyncing(false);
      }
    }

    return created;
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev =>
      prev.map(a => (a.id === id ? { ...a, ...updates } : a))
    );

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      setIsSyncing(true);
      try {
        await client.from('assignments').update(updates).eq('id', id).eq('user_id', supabaseUser.id);
        setLastSyncedText('Synced just now');
      } catch (e) {
        console.error('Error updating assignment in Supabase:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const deleteAssignment = async (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      setIsSyncing(true);
      try {
        await client.from('assignments').delete().eq('id', id).eq('user_id', supabaseUser.id);
        setLastSyncedText('Synced just now');
      } catch (e) {
        console.error('Error deleting assignment from Supabase:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const toggleAssignmentComplete = async (id: string) => {
    const current = assignments.find(a => a.id === id);
    if (!current) return;
    const nextCompleted = !current.completed;
    const nextStatus: AssignmentStatus = nextCompleted ? 'completed' : 'todo';

    updateAssignment(id, {
      completed: nextCompleted,
      status: nextStatus,
    });
  };

  const updateAssignmentStatus = async (id: string, status: AssignmentStatus) => {
    updateAssignment(id, {
      status,
      completed: status === 'completed',
    });
  };

  // Course Operations
  const addCourse = async (courseData: Omit<Course, 'id'>): Promise<Course> => {
    const id = 'course-' + Date.now();
    const newCourse: Course = {
      ...courseData,
      id,
      user_id: supabaseUser?.id || user.id,
      created_at: new Date().toISOString(),
    };

    setCourses(prev => [...prev, newCourse]);

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('courses').insert({
          id: newCourse.id,
          user_id: supabaseUser.id,
          code: newCourse.code,
          title: newCourse.title,
          instructor: newCourse.instructor,
          email: newCourse.email,
          room: newCourse.room,
          office_hours: newCourse.office_hours,
          credits: newCourse.credits,
          grade_pct: newCourse.grade_pct,
          grade_letter: newCourse.grade_letter,
          progress_pct: newCourse.progress_pct,
          accent_color: newCourse.accent_color,
        });
      } catch (e) {
        console.error('Error saving course to Supabase:', e);
      }
    }

    return newCourse;
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('courses').update(updates).eq('id', id).eq('user_id', supabaseUser.id);
      } catch (e) {
        console.error('Error updating course in Supabase:', e);
      }
    }
  };

  const deleteCourse = async (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('courses').delete().eq('id', id).eq('user_id', supabaseUser.id);
      } catch (e) {
        console.error('Error deleting course from Supabase:', e);
      }
    }
  };

  // Calendar Operations
  const addCalendarEvent = async (eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    const id = 'cal-' + Date.now();
    const newEvent: CalendarEvent = {
      ...eventData,
      id,
      user_id: supabaseUser?.id || user.id,
    };

    setCalendarEvents(prev => [...prev, newEvent]);

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('calendar_events').insert({
          id: newEvent.id,
          user_id: supabaseUser.id,
          title: newEvent.title,
          course: newEvent.course,
          event_type: newEvent.event_type,
          day_of_week: newEvent.day_index,
          start_time: newEvent.start_time_display,
          end_time: newEvent.end_time_display,
          location: newEvent.location || '',
          notes: newEvent.notes || '',
        });
      } catch (e) {
        console.error('Error adding calendar event to Supabase:', e);
      }
    }

    return newEvent;
  };

  const deleteCalendarEvent = async (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('calendar_events').delete().eq('id', id).eq('user_id', supabaseUser.id);
      } catch (e) {
        console.error('Error deleting calendar event from Supabase:', e);
      }
    }
  };

  // Study Notes Operations
  const addStudyNote = async (noteData: Omit<StudyNote, 'id' | 'created_at'>): Promise<StudyNote> => {
    const id = 'note-' + Date.now();
    const newNote: StudyNote = {
      ...noteData,
      id,
      user_id: supabaseUser?.id || user.id,
      created_at: new Date().toISOString(),
    };

    setStudyNotes(prev => [newNote, ...prev]);

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('study_notes').insert({
          id: newNote.id,
          user_id: supabaseUser.id,
          grade: newNote.grade,
          board: newNote.board,
          subject: newNote.subject,
          chapter: newNote.chapter,
          title: newNote.title,
          note_length: newNote.note_length,
          content: newNote.content,
          is_favorite: Boolean(newNote.is_favorite),
        });
      } catch (e) {
        console.error('Error saving study note to Supabase:', e);
      }
    }

    return newNote;
  };

  const updateStudyNote = async (id: string, updates: Partial<StudyNote>) => {
    setStudyNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates } : n)));
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('study_notes').update(updates).eq('id', id).eq('user_id', supabaseUser.id);
      } catch (e) {
        console.error('Error updating note in Supabase:', e);
      }
    }
  };

  const deleteStudyNote = async (id: string) => {
    setStudyNotes(prev => prev.filter(n => n.id !== id));
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('study_notes').delete().eq('id', id).eq('user_id', supabaseUser.id);
      } catch (e) {
        console.error('Error deleting note from Supabase:', e);
      }
    }
  };

  const toggleFavoriteNote = async (id: string) => {
    const note = studyNotes.find(n => n.id === id);
    if (!note) return;
    await updateStudyNote(id, { is_favorite: !note.is_favorite });
  };

  // Quiz Attempt Operations
  const saveQuizAttempt = async (attemptData: Omit<QuizAttempt, 'id' | 'created_at'>): Promise<QuizAttempt> => {
    const id = 'quiz-att-' + Date.now();
    const created: QuizAttempt = {
      ...attemptData,
      id,
      user_id: supabaseUser?.id || user.id,
      created_at: new Date().toISOString(),
    };

    setQuizAttempts(prev => [created, ...prev]);

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('quiz_attempts').insert({
          id: created.id,
          user_id: supabaseUser.id,
          subject: created.subject,
          chapter: created.chapter,
          grade: created.grade,
          board: created.board,
          difficulty: created.difficulty,
          score: created.score,
          total_questions: created.total_questions,
          correct_count: created.correct_count,
          time_taken_seconds: created.time_taken_seconds,
          weak_topics: created.weak_topics,
          questions_data: created.answers,
        });
      } catch (e) {
        console.error('Error saving quiz attempt to Supabase:', e);
      }
    }

    return created;
  };

  // Focus Session Operations
  const recordFocusSession = async (sessionData: Omit<FocusSessionRecord, 'id' | 'created_at'>) => {
    const id = 'f-' + Date.now();
    const record: FocusSessionRecord = {
      ...sessionData,
      id,
      user_id: supabaseUser?.id || user.id,
      created_at: new Date().toISOString(),
    };

    setFocusSessions(prev => [record, ...prev]);

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      try {
        await client.from('study_sessions').insert({
          id: record.id,
          user_id: supabaseUser.id,
          subject: record.subject,
          chapter: record.chapter || null,
          planned_minutes: record.planned_minutes,
          actual_minutes: record.actual_minutes,
          completed: record.completed,
          interrupted: record.interrupted,
          took_quiz: record.took_quiz,
        });
      } catch (e) {
        console.error('Error recording focus session to Supabase:', e);
      }
    }
  };

  // Study Plan Operations
  const togglePlanTaskCompleted = (dayIdx: number, taskId: string) => {
    setStudyPlan(prev => {
      const copy = [...prev];
      if (copy[dayIdx]) {
        copy[dayIdx] = {
          ...copy[dayIdx],
          tasks: copy[dayIdx].tasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      }
      return copy;
    });
  };

  const regeneratePlan = async () => {
    setIsSyncing(true);
    const weak = Array.from(new Set(quizAttempts.flatMap(q => q.weak_topics)));
    const pendingAssigns = assignments.filter(a => !a.completed).map(a => ({
      title: a.title,
      course: a.course,
      due_date: a.due_date,
      priority: a.priority,
    }));

    const result = await geminiApi.generateStudyPlan({
      grade: user.grade,
      board: user.education_board,
      subjects: user.subjects,
      assignments: pendingAssigns,
      weakTopics: weak,
      upcomingExams: user.academic_goals,
    });

    if (result?.plan && result.plan.length > 0) {
      setStudyPlan(result.plan);
    }
    setIsSyncing(false);
  };

  // Saved Resources
  const toggleSaveResource = (resId: string) => {
    setSavedResourceIds(prev =>
      prev.includes(resId) ? prev.filter(id => id !== resId) : [...prev, resId]
    );
  };

  // Instant Quiz Helpers
  const openInstantQuiz = (payload: InstantQuizPayload) => {
    setInstantQuizPayload(payload);
  };

  const closeInstantQuiz = () => {
    setInstantQuizPayload(null);
  };

  // Supabase Auth Methods
  const signIn = async (email: string, pass: string): Promise<{ error: string | null }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: 'Supabase is not configured yet. You can configure it in Settings, or use Demo Mode!' };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      setSupabaseUser(data.user);
      setUser(prev => ({
        ...prev,
        id: data.user.id,
        email: data.user.email || prev.email,
        full_name: data.user.user_metadata?.full_name || prev.full_name,
      }));
      fetchRemoteData(data.user.id);
    }

    return { error: null };
  };

  const signUp = async (email: string, pass: string, name: string): Promise<{ error: string | null; message?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: 'Supabase is not configured yet. Configure your project credentials in Settings.' };
    }

    const emailRedirectTo = window.location.origin;
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        emailRedirectTo,
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Create initial uncompleted profile so onboarding is triggered
      try {
        await client.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: name.trim(),
          onboarding_completed: false,
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('Initial profile registration notice:', e);
      }

      if (!data.session) {
        return { 
          error: null, 
          message: 'Account created! Please check your email to verify your address, then sign in to complete your personalized onboarding.' 
        };
      }
    }

    return { error: null, message: 'Account created and signed in! Next, complete your student profile.' };
  };

  const resetPassword = async (email: string): Promise<{ error: string | null; message?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: 'Supabase is not configured. Please configure your project in Settings.' };
    }

    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null, message: 'Password recovery email sent! Check your inbox for the reset link.' };
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setSupabaseUser(null);
    setUser(INITIAL_USER);
  };

  const updateSupabaseConfig = async (url: string, key: string) => {
    const result = await testSupabaseConnection(url, key);
    if (result.success) {
      saveSupabaseConfig(url, key);
      setIsSupabaseReady(true);
    }
    return result;
  };

  const disconnectSupabase = () => {
    clearSupabaseConfig();
    setIsSupabaseReady(false);
    setSupabaseUser(null);
  };

  return (
    <AcademicContext.Provider
      value={{
        user,
        supabaseUser,
        isSupabaseReady,
        isSyncing,
        lastSyncedText,
        assignments,
        courses,
        calendarEvents,
        studyNotes,
        quizAttempts,
        focusSessions,
        studyPlan,
        savedResourceIds,
        updateProfile,
        completeOnboarding,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        toggleAssignmentComplete,
        updateAssignmentStatus,
        addCourse,
        updateCourse,
        deleteCourse,
        addCalendarEvent,
        deleteCalendarEvent,
        addStudyNote,
        updateStudyNote,
        deleteStudyNote,
        toggleFavoriteNote,
        saveQuizAttempt,
        recordFocusSession,
        togglePlanTaskCompleted,
        regeneratePlan,
        toggleSaveResource,
        instantQuizPayload,
        openInstantQuiz,
        closeInstantQuiz,
        signIn,
        signUp,
        resetPassword,
        signOut,
        updateSupabaseConfig,
        disconnectSupabase,
        isAudioPlaying,
        toggleAudio,
        audioSoundscape,
        setAudioSoundscape: handleSetSoundscape,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
