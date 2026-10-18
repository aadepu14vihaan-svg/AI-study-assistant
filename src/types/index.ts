export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type AssignmentStatus = 'todo' | 'in_progress' | 'under_review' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Assignment {
  id: string;
  user_id?: string;
  title: string;
  course: string;
  description?: string;
  status: AssignmentStatus;
  priority: Priority;
  due_date: string; // ISO date string or human readable
  due_time_display?: string; // e.g. "Today, 4:00 PM"
  est_hours: number;
  completed: boolean;
  score?: number;
  max_score?: number;
  grade_badge?: string; // e.g. "Grade: A+", "100 / 100"
  subtasks: Subtask[];
  attachments: string[];
  metadata?: {
    word_count?: { current: number; target: number };
    code_repo?: { file: string; branch: string };
    file_upload?: { name: string; size: string; provider: string };
    audio_file?: { name: string; duration: string; bitrate: string };
    teacher?: string;
    rubric_note?: string;
    completed_time_display?: string;
    chapter?: string;
  };
  created_at?: string;
}

export interface Course {
  id: string;
  user_id?: string;
  code: string; // e.g. "MATH-401"
  title: string;
  instructor: string;
  email: string;
  room: string;
  office_hours: string;
  credits: number;
  grade_pct: number;
  grade_letter: string;
  progress_pct: number;
  accent_color: 'primary' | 'secondary' | 'tertiary' | 'error' | 'surface-tint';
  active_deliverables: string[];
  resources: {
    syllabus: boolean;
    slides: boolean;
    notes_count: number;
    sheets_count?: number;
  };
  created_at?: string;
}

export type EventType = 'lecture' | 'lab' | 'independent_study' | 'deadline';

export interface CalendarEvent {
  id: string;
  user_id?: string;
  title: string;
  course: string;
  event_type: EventType;
  day_index: number; // 0 for Mon, 1 for Tue, ... 6 for Sun
  start_hour: number; // e.g. 8.5 for 8:30
  end_hour: number;   // e.g. 9.75 for 9:45
  start_time_display: string;
  end_time_display: string;
  location?: string;
  notes?: string;
  accent_style?: string;
  badge?: string;
}

export type EducationBoard = 'CBSE' | 'ICSE' | 'IB' | 'Cambridge' | 'State Board';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  current_term: string;
  target_gpa: number;
  streak_days: number;
  honor_roll_rank: number;
  enrolled_credits: number;

  // Personalized Academic Platform Attributes
  grade: string; // e.g. 'Class 10', 'Class 12'
  school_name: string;
  country: string;
  state: string;
  education_board: EducationBoard;
  state_board_name?: string; // e.g. 'Telangana', 'Andhra Pradesh', 'Maharashtra'
  preferred_language: string; // e.g. 'English', 'Hindi', 'Telugu', 'Tamil', 'Marathi', 'Hinglish'
  subjects: string[];
  academic_goals: string;
  preferred_study_times?: string;
  learning_preferences?: string[];
  onboarding_completed: boolean;
}

// AI Study Notes
export interface StudyNoteContent {
  chapterOverview: string;
  importantConcepts: { title: string; explanation: string }[];
  definitions: { term: string; definition: string }[];
  keyPoints: string[];
  formulasAndDiagrams: { label: string; description: string }[];
  examples: { title: string; problem: string; solution: string }[];
  commonMistakes: string[];
  revisionQuestions: string[];
  quickSummary: string;
}

export interface StudyNote {
  id: string;
  user_id?: string;
  grade: string;
  board: string;
  subject: string;
  chapter: string;
  title: string;
  note_length: 'quick_revision' | 'standard' | 'detailed';
  content: StudyNoteContent;
  is_favorite?: boolean;
  created_at: string;
}

// AI Quiz
export type QuizQuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'short_answer';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuizQuestionType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  rubric?: string;
  topic?: string;
}

export interface QuizAnswerRecord {
  questionId: string;
  studentAnswer: string;
  isCorrect: boolean;
  score: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  user_id?: string;
  title: string;
  subject: string;
  chapter: string;
  grade: string;
  board: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  score: number;
  total_questions: number;
  correct_count: number;
  time_taken_seconds: number;
  weak_topics: string[];
  answers: QuizAnswerRecord[];
  created_at: string;
}

// Focus Session
export interface FocusSessionRecord {
  id: string;
  user_id?: string;
  subject: string;
  chapter?: string;
  planned_minutes: number;
  actual_minutes: number;
  completed: boolean;
  interrupted: boolean;
  took_quiz: boolean;
  created_at: string;
}

// Syllabus & Official Resources
export interface OfficialResource {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  grade: string;
  board: string;
  resource_type: 'official_textbook' | 'official_syllabus' | 'video_lecture' | 'practice_paper';
  url: string;
  publisher: string;
  is_official: boolean;
  description: string;
  is_saved?: boolean;
}

// Study Plan Item
export interface StudyPlanTask {
  id: string;
  time: string;
  subject: string;
  topic: string;
  taskType: 'homework' | 'revision' | 'quiz_prep' | 'exam_prep';
  priority: Priority;
  reason: string;
  completed: boolean;
}

export interface StudyPlanDay {
  day: string;
  date: string;
  tasks: StudyPlanTask[];
}
