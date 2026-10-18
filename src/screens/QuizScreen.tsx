import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { SUBJECT_CHAPTER_MAP } from '../data/syllabusData';
import { QuizQuestion, QuizAnswerRecord } from '../types';
import { geminiApi } from '../lib/geminiApi';

export const QuizScreen: React.FC = () => {
  const { user, quizAttempts, saveQuizAttempt } = useAcademic();

  const [subject, setSubject] = useState(user.subjects?.[0] || 'Mathematics');
  const [chapter, setChapter] = useState(SUBJECT_CHAPTER_MAP[subject]?.[0] || 'Quadratic Equations');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionType, setQuestionType] = useState<'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'mixed'>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isQuizRunning, setIsQuizRunning] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<{ score: number; weakTopics: string[] } | null>(null);

  const availableChapters = SUBJECT_CHAPTER_MAP[subject] || [chapter];

  const handleSubjectChange = (newSub: string) => {
    setSubject(newSub);
    const firstChap = SUBJECT_CHAPTER_MAP[newSub]?.[0] || 'General';
    setChapter(firstChap);
  };

  // Timer interval
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isQuizRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isQuizRunning]);

  const handleStartQuiz = async (overrideWeakTopics?: string[]) => {
    setIsGenerating(true);
    setCompletedAttempt(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setTimerSeconds(0);

    try {
      const questions = await geminiApi.generateQuiz({
        grade: user.grade,
        board: user.education_board,
        subject,
        chapter,
        difficulty,
        numQuestions,
        questionType,
        language: user.preferred_language,
        studyContext: overrideWeakTopics?.length
          ? `Adaptive focus request: Student previously missed these concepts: ${overrideWeakTopics.join(', ')}. Generate questions strictly drilling these weak points.`
          : undefined,
      });

      setActiveQuiz(questions);
      setIsQuizRunning(true);
    } catch {
      // Fallback handled in geminiApi
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = activeQuiz ? activeQuiz[currentIndex] : null;

  const handleAnswerSelect = (ans: string) => {
    if (!currentQ) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: ans }));
  };

  const handleNextOrFinish = async () => {
    if (!activeQuiz) return;

    if (currentIndex < activeQuiz.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finish and evaluate
      setIsQuizRunning(false);
      let correct = 0;
      const weakList: string[] = [];
      const records: QuizAnswerRecord[] = [];

      activeQuiz.forEach(q => {
        const studentAns = (selectedAnswers[q.id] || '').trim().toLowerCase();
        const actualAns = q.correctAnswer.trim().toLowerCase();
        const isCorrect = q.type === 'short_answer'
          ? studentAns.length > 5
          : studentAns === actualAns;

        if (isCorrect) correct++;
        else if (q.topic) weakList.push(q.topic);

        records.push({
          questionId: q.id,
          studentAnswer: selectedAnswers[q.id] || 'Not answered',
          isCorrect,
          score: isCorrect ? 1 : 0,
          explanation: q.explanation,
        });
      });

      const scorePct = Math.round((correct / activeQuiz.length) * 100);
      const uniqueWeak = Array.from(new Set(weakList));

      await saveQuizAttempt({
        title: `${chapter} Test (${difficulty})`,
        subject,
        chapter,
        grade: user.grade,
        board: user.education_board,
        difficulty,
        score: scorePct,
        total_questions: activeQuiz.length,
        correct_count: correct,
        time_taken_seconds: timerSeconds,
        weak_topics: uniqueWeak,
        answers: records,
      });

      setCompletedAttempt({ score: scorePct, weakTopics: uniqueWeak });
    }
  };

  // Weak topics aggregated from student history
  const allWeakTopics = Array.from(new Set(quizAttempts.flatMap(q => q.weak_topics)));

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">quiz</span>
            <span>Adaptive Testing &amp; Diagnostic Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            AI Quiz Generator &amp; Adaptive Practice
          </h1>
        </div>

        {allWeakTopics.length > 0 && !activeQuiz && (
          <button
            onClick={() => handleStartQuiz(allWeakTopics)}
            className="bg-secondary hover:bg-secondary-container text-on-secondary px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-lg">bolt</span>
            <span>Adaptive Drill: Weak Topics ({allWeakTopics.length})</span>
          </button>
        )}
      </div>

      {/* Main Layout */}
      {!activeQuiz && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Quiz Configuration Form (7 cols) */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                <h2 className="text-base font-bold text-on-surface">Generate a Custom Syllabus Quiz</h2>
              </div>
              <span className="text-xs font-bold text-primary bg-primary-fixed px-2.5 py-0.5 rounded-full">
                {user.grade} • {user.education_board}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container outline-none font-semibold cursor-pointer"
                >
                  {(user.subjects || ['Mathematics', 'Science']).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Chapter / Topic</label>
                <select
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container outline-none font-semibold cursor-pointer truncate"
                >
                  {availableChapters.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'mixed')}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container outline-none font-semibold cursor-pointer"
                >
                  <option value="easy">Easy (Concept Basics)</option>
                  <option value="medium">Medium (Standard Board)</option>
                  <option value="hard">Hard (Competency / HOTS)</option>
                  <option value="mixed">Mixed Difficulty</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Questions Count</label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container outline-none font-semibold cursor-pointer"
                >
                  <option value={3}>3 Questions (Quick Sprint)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Full Test)</option>
                  <option value={15}>15 Questions (Mastery Drill)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Question Formats</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as 'mixed')}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl border border-surface-container outline-none font-semibold cursor-pointer"
                >
                  <option value="mixed">Mixed Formats</option>
                  <option value="mcq">Multiple Choice Only</option>
                  <option value="true_false">True / False Only</option>
                  <option value="fill_blank">Fill in Blanks</option>
                  <option value="short_answer">Short Answer / Rubrics</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-lg">psychology</span>
                <span>Language: <strong>{user.preferred_language}</strong></span>
              </span>
              <span className="text-[11px] text-outline">Tuned to official syllabus standards</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleStartQuiz()}
                disabled={isGenerating}
                className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-8 py-3 rounded-2xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Synthesizing Test...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">play_arrow</span>
                    <span>Start Test Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Student Performance & Past Quizzes (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Weak Topics Callout */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                  <span className="material-symbols-outlined text-error text-lg">flag</span>
                  <span>Identified Knowledge Gaps</span>
                </div>
                <span className="text-[10px] font-bold bg-error-container text-on-error-container px-2 py-0.5 rounded-full">
                  {allWeakTopics.length} Areas
                </span>
              </div>

              {allWeakTopics.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-2">
                  No weak topics flagged yet! Complete quizzes to discover and reinforce key syllabus areas.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {allWeakTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium bg-error-container/40 text-on-error-container px-2.5 py-1 rounded-lg border border-error/20 flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                      <span>{topic}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quiz Attempt History */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <h3 className="text-sm font-bold text-on-surface">Recent Quiz Attempts</h3>
                <span className="text-xs text-on-surface-variant">{quizAttempts.length} Total</span>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto">
                {quizAttempts.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-4 text-center">
                    No quizzes taken yet. Generate your first quiz above!
                  </p>
                ) : (
                  quizAttempts.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-bold text-on-surface truncate">{att.title}</span>
                        <span className="text-[11px] text-on-surface-variant">
                          {att.subject} • {att.total_questions} Qs • {Math.round(att.time_taken_seconds / 60)}m
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                          att.score >= 80 ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                          att.score >= 50 ? 'bg-primary-fixed text-primary' :
                          'bg-error-container text-on-error-container'
                        }`}>
                          {att.score}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE TEST RUNNER */}
      {activeQuiz && !completedAttempt && currentQ && (
        <div className="max-w-3xl mx-auto w-full bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-md border border-surface-container flex flex-col gap-6 animate-in fade-in duration-150">
          {/* Active Test Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-container">
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                {subject} • {chapter}
              </span>
              <h2 className="text-base md:text-lg font-bold text-on-surface">
                Question {currentIndex + 1} of {activeQuiz.length}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-on-surface">
                <span className="material-symbols-outlined text-sm text-primary">timer</span>
                <span>{formatTimer(timerSeconds)}</span>
              </div>

              <button
                onClick={() => {
                  if (confirm('Exit test? Progress will not be saved.')) {
                    setActiveQuiz(null);
                    setIsQuizRunning(false);
                  }
                }}
                className="text-xs text-error font-bold hover:bg-error-container px-2.5 py-1 rounded-lg transition-colors"
              >
                Quit
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / activeQuiz.length) * 100}%` }}
            ></div>
          </div>

          {/* Question Text */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container">
            <p className="text-base md:text-lg font-bold text-on-surface leading-relaxed">
              {currentQ.question}
            </p>
            {currentQ.topic && (
              <span className="text-[11px] font-semibold text-primary mt-2 inline-block">
                Subtopic: {currentQ.topic}
              </span>
            )}
          </div>

          {/* Question Answers */}
          {currentQ.options && currentQ.options.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswers[currentQ.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswerSelect(opt)}
                    className={`p-4 rounded-2xl text-xs md:text-sm font-semibold text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary-fixed text-primary border-primary shadow-xs ring-2 ring-primary/20'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-lg text-primary">check_circle</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface">Write your answer or explanation:</label>
              <textarea
                rows={4}
                value={selectedAnswers[currentQ.id] || ''}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="Type your response here..."
                className="w-full bg-surface-container-low text-on-surface text-xs md:text-sm p-4 rounded-2xl outline-none border border-surface-container focus:ring-2 focus:ring-primary placeholder:text-outline"
              />
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-container">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
            >
              Previous
            </button>

            <button
              onClick={handleNextOrFinish}
              className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>{currentIndex === activeQuiz.length - 1 ? 'Finish & Evaluate' : 'Next Question'}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED RESULTS SCREEN */}
      {completedAttempt && activeQuiz && (
        <div className="max-w-3xl mx-auto w-full bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-md border border-surface-container flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-fixed to-secondary-fixed/40 text-center flex flex-col items-center gap-2 border border-primary/20">
            <div className="w-20 h-20 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shadow-md text-3xl font-black">
              {completedAttempt.score}%
            </div>
            <h3 className="text-2xl font-black text-on-surface">
              {completedAttempt.score >= 80 ? 'Mastery Achieved! 🏆' : completedAttempt.score >= 50 ? 'Solid Effort! 📈' : 'Targeted Practice Recommended 📖'}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md">
              Completed in {formatTimer(timerSeconds)}. All responses have been analyzed and added to your personalized academic metrics.
            </p>
          </div>

          {completedAttempt.weakTopics.length > 0 && (
            <div className="p-4 rounded-xl bg-error-container/40 border border-error/20 flex flex-col gap-2">
              <span className="text-xs font-bold text-error uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>Concepts requiring revision:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {completedAttempt.weakTopics.map((topic, i) => (
                  <span key={i} className="text-xs font-semibold bg-surface-container-lowest px-3 py-1 rounded-lg text-on-surface shadow-xs border border-surface-container">
                    • {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown per question */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Detailed Breakdown</h4>
            {activeQuiz.map((q, idx) => {
              const studentAns = selectedAnswers[q.id];
              const isMatch = (studentAns || '').trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              return (
                <div key={q.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-on-surface text-sm">Q{idx + 1}: {q.question}</span>
                    <span className={`px-2 py-0.5 rounded ${isMatch ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-error-container text-on-error-container'}`}>
                      {isMatch ? 'Correct' : 'Needs Review'}
                    </span>
                  </div>
                  <div className="text-on-surface-variant">
                    <strong>Your answer:</strong> {studentAns || 'Skipped'}
                  </div>
                  <div className="text-primary font-medium">
                    <strong>Correct answer:</strong> {q.correctAnswer}
                  </div>
                  <div className="text-[11px] text-on-surface-variant bg-surface-container-lowest p-2.5 rounded-lg border border-surface-container">
                    💡 <strong>Explanation:</strong> {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-container">
            <button
              onClick={() => {
                setActiveQuiz(null);
                setCompletedAttempt(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Back to Quiz Center
            </button>

            <button
              onClick={() => handleStartQuiz(completedAttempt.weakTopics)}
              className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">replay</span>
              <span>Retake Adaptive Drill</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
