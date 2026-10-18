import React, { useState, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { GRADES_LIST, BOARDS_LIST, INDIAN_STATES, LANGUAGES_LIST, SUBJECT_CHAPTER_MAP } from '../../data/syllabusData';
import { EducationBoard } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { user, completeOnboarding, supabaseUser } = useAcademic();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [grade, setGrade] = useState(user.grade || 'Class 10');
  const [board, setBoard] = useState<EducationBoard>(user.education_board || 'CBSE');
  const [stateBoardName, setStateBoardName] = useState(user.state_board_name || 'Telangana');
  const [country, setCountry] = useState(user.country || 'India');
  const [state, setState] = useState(user.state || 'Telangana');
  const [language, setLanguage] = useState(user.preferred_language || 'English');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    user.subjects?.length
      ? user.subjects
      : ['Mathematics', 'Science', 'Social Science', 'English Literature', 'Computer Science']
  );

  // Optional fields
  const [academicGoals, setAcademicGoals] = useState(user.academic_goals || '');
  const [studyTime, setStudyTime] = useState(user.preferred_study_times || STUDY_TIMES[2]);
  const [learningPrefs, setLearningPrefs] = useState<string[]>(
    user.learning_preferences?.length
      ? user.learning_preferences
      : [LEARNING_PREFERENCES[0], LEARNING_PREFERENCES[1]]
  );

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Keep form fields synced if user profile loads
  useEffect(() => {
    if (user.full_name) setFullName(user.full_name);
    if (user.grade) setGrade(user.grade);
    if (user.education_board) setBoard(user.education_board);
    if (user.state_board_name) setStateBoardName(user.state_board_name);
    if (user.country) setCountry(user.country);
    if (user.state) setState(user.state);
    if (user.preferred_language) setLanguage(user.preferred_language);
    if (user.subjects?.length) setSelectedSubjects(user.subjects);
    if (user.academic_goals) setAcademicGoals(user.academic_goals);
    if (user.preferred_study_times) setStudyTime(user.preferred_study_times);
    if (user.learning_preferences?.length) setLearningPrefs(user.learning_preferences);
  }, [user]);

  if (!isOpen) return null;

  const toggleSubject = (sub: string) => {
    setSelectedSubjects(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
    if (validationErrors.subjects) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.subjects;
        return copy;
      });
    }
  };

  const togglePreference = (pref: string) => {
    setLearningPrefs(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Please enter your full or preferred display name';
    if (!grade) errors.grade = 'Please select your class/grade';
    if (!board) errors.board = 'Please choose your education board';
    if (board === 'State Board' && !stateBoardName) {
      errors.stateBoardName = 'Please select which State Board curriculum you follow';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!country.trim()) errors.country = 'Please enter your country';
    if (country.toLowerCase() === 'india' && !state.trim()) {
      errors.state = 'Please specify your state or union territory';
    }
    if (!language) errors.language = 'Please choose your preferred language for explanations';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (selectedSubjects.length === 0) {
      errors.subjects = 'Please select at least 1 subject you are currently studying';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    if (!validateStep3()) {
      setStep(3);
      return;
    }

    setIsSaving(true);
    try {
      await completeOnboarding({
        full_name: fullName.trim(),
        grade,
        education_board: board,
        state_board_name: board === 'State Board' ? stateBoardName : undefined,
        country: country.trim(),
        state: state.trim(),
        preferred_language: language,
        subjects: selectedSubjects,
        academic_goals: academicGoals.trim() || undefined,
        preferred_study_times: studyTime,
        learning_preferences: learningPrefs,
        onboarding_completed: true,
      });
      onClose();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const allAvailableSubjects = Object.keys(SUBJECT_CHAPTER_MAP);

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 md:p-8 flex flex-col gap-5 border border-surface-container animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary-fixed px-2 py-0.5 rounded">
                  Student Profile Setup
                </span>
                <span className="text-xs text-on-surface-variant font-semibold">Step {step} of 3</span>
              </div>
              <h2 className="text-xl font-extrabold text-on-surface mt-0.5">
                {step === 1 && 'Academic Identity & Curriculum'}
                {step === 2 && 'Country, Region & Language'}
                {step === 3 && 'Subjects & Study Preferences'}
              </h2>
            </div>
          </div>

          {user.onboarding_completed && (
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-xl hover:bg-surface-container transition-colors"
              title="Close Profile Setup"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Clear Notice: Profile saving vs Email verification */}
        <div className="p-3 bg-primary-fixed/20 rounded-2xl border border-primary/20 text-xs text-on-surface flex items-start gap-2">
          <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">info</span>
          <div>
            <strong className="font-bold text-primary">Syllabus Personalization:</strong> This setup tailors your daily study plan, official textbook recommendations, and AI tutoring levels.
            {supabaseUser && (
              <span className="text-on-surface-variant block mt-0.5">
                (Account verification is managed via the confirmation email sent to your inbox).
              </span>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-primary' : 'bg-surface-container-high'
              }`}
            ></div>
          ))}
        </div>

        {/* Form Steps */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* STEP 1: Name, Grade & Board */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <span>Full or Preferred Display Name *</span>
                  {validationErrors.fullName && (
                    <span className="text-error text-[11px] font-semibold">{validationErrors.fullName}</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (validationErrors.fullName) {
                      setValidationErrors(prev => {
                        const copy = { ...prev };
                        delete copy.fullName;
                        return copy;
                      });
                    }
                  }}
                  placeholder="e.g. Alex Vance or Priya Sharma"
                  className={`w-full bg-surface-container-low text-on-surface text-sm p-3 rounded-xl outline-none border transition-all ${
                    validationErrors.fullName ? 'border-error focus:ring-2 focus:ring-error' : 'border-surface-container focus:ring-2 focus:ring-primary'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Class / Grade *</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                  >
                    {GRADES_LIST.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Education Board *</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value as EducationBoard)}
                    className="w-full bg-surface-container-low text-on-surface text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                  >
                    {BOARDS_LIST.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Follow-up: State Board */}
              {board === 'State Board' && (
                <div className="flex flex-col gap-1 bg-surface-container-low p-3.5 rounded-2xl border border-surface-container animate-in fade-in duration-150">
                  <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">apartment</span>
                    <span>Which State / Board? *</span>
                  </label>
                  <select
                    value={stateBoardName}
                    onChange={(e) => setStateBoardName(e.target.value)}
                    className="w-full bg-surface-container-lowest text-on-surface text-sm p-2.5 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary cursor-pointer font-medium mt-1"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st} State Board (SCERT / SSC)</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Your official textbook catalog will prioritize {stateBoardName} SCERT curriculum e-books.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Region &amp; Language</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Country, State & Preferred Language */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                    <span>Country *</span>
                    {validationErrors.country && (
                      <span className="text-error text-[11px] font-semibold">{validationErrors.country}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India, United States, UK"
                    className="w-full bg-surface-container-low text-on-surface text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">State or Region *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">
                  Preferred Learning Language for AI Explanations *
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                >
                  {LANGUAGES_LIST.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <span className="text-[11px] text-on-surface-variant">
                  StudyMate AI and the Study Assistant formulate analogies, practice hints, and summaries in this language.
                </span>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant flex items-center gap-2 border border-surface-container">
                <span className="material-symbols-outlined text-tertiary text-lg">privacy_tip</span>
                <span>We never ask for home addresses, phone numbers, or government IDs.</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-on-surface-variant hover:text-on-surface text-sm font-semibold px-4 py-2 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Subjects &amp; Preferences</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Subjects & Optional Study Preferences */}
          {step === 3 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface flex justify-between">
                  <span>Subjects You Study *</span>
                  <span className="text-primary font-bold">{selectedSubjects.length} selected</span>
                </label>
                {validationErrors.subjects && (
                  <span className="text-error text-xs font-semibold">{validationErrors.subjects}</span>
                )}
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

              {/* Optional: Exam Goals */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <span>Target Exam / Academic Goals (Optional)</span>
                  <span className="text-[10px] text-outline">Helps prioritize revision speed</span>
                </label>
                <input
                  type="text"
                  value={academicGoals}
                  onChange={(e) => setAcademicGoals(e.target.value)}
                  placeholder="e.g. CBSE 10th Board Exams March 2025, Olympiad, 95% target"
                  className="w-full bg-surface-container-low text-on-surface text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Optional: Preferred Study Times */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">
                  Preferred Study Window (Optional)
                </label>
                <select
                  value={studyTime}
                  onChange={(e) => setStudyTime(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface text-xs md:text-sm p-2.5 rounded-xl border border-surface-container cursor-pointer font-medium"
                >
                  {STUDY_TIMES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Optional: Learning Preferences */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">
                  Learning Preferences (Optional)
                </label>
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

              <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-on-surface-variant hover:text-on-surface text-sm font-semibold px-4 py-2 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-7 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">check</span>
                      <span>Complete Setup &amp; Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
