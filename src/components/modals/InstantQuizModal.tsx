import React, { useState, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { QuizQuestion, QuizAnswerRecord } from '../../types';
import { geminiApi } from '../../lib/geminiApi';

export const InstantQuizModal: React.FC = () => {
  const { 
    user, 
    instantQuizPayload, 
    closeInstantQuiz, 
    saveQuizAttempt 
  } = useAcademic();

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score: number; weakTopics: string[] } | null>(null);

  useEffect(() => {
    if (instantQuizPayload) {
      loadQuiz();
    } else {
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowFeedback(false);
      setCompleted(false);
      setScoreResult(null);
    }
  }, [instantQuizPayload]);

  if (!instantQuizPayload) return null;

  const loadQuiz = async () => {
    setLoading(true);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowFeedback(false);
    setCompleted(false);
    setScoreResult(null);

    try {
      const generated = await geminiApi.generateQuiz({
        grade: user.grade,
        board: user.education_board,
        subject: instantQuizPayload.subject,
        chapter: instantQuizPayload.chapter,
        difficulty: 'medium',
        numQuestions: 5,
        questionType: 'mixed',
        language: user.preferred_language,
        studyContext: instantQuizPayload.contextText,
      });

      setQuestions(generated);
    } catch {
      // Handled by geminiApi fallback
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[currentIndex];

  const handleSelectAnswer = (ans: string) => {
    if (showFeedback || completed) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: ans }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    let correctCount = 0;
    const weakTopicsList: string[] = [];
    const answersRecord: QuizAnswerRecord[] = [];

    questions.forEach(q => {
      const studentAns = (selectedAnswers[q.id] || '').trim().toLowerCase();
      const actualAns = q.correctAnswer.trim().toLowerCase();
      
      const isCorrect = q.type === 'short_answer'
        ? studentAns.length > 5 // student wrote a reasoned answer
        : studentAns === actualAns;

      if (isCorrect) {
        correctCount++;
      } else if (q.topic) {
        weakTopicsList.push(q.topic);
      }

      answersRecord.push({
        questionId: q.id,
        studentAnswer: selectedAnswers[q.id] || 'Not answered',
        isCorrect,
        score: isCorrect ? 1 : 0,
        explanation: q.explanation,
      });
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    const uniqueWeak = Array.from(new Set(weakTopicsList));

    setScoreResult({ score: scorePct, weakTopics: uniqueWeak });
    setCompleted(true);

    await saveQuizAttempt({
      title: `${instantQuizPayload.chapter} Quick Check`,
      subject: instantQuizPayload.subject,
      chapter: instantQuizPayload.chapter,
      grade: user.grade,
      board: user.education_board,
      difficulty: 'medium',
      score: scorePct,
      total_questions: questions.length,
      correct_count: correctCount,
      time_taken_seconds: 120,
      weak_topics: uniqueWeak,
      answers: answersRecord,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 md:p-8 flex flex-col gap-5 border border-surface-container animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">quiz</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase bg-primary-fixed text-primary px-2 py-0.5 rounded">
                  Test My Understanding
                </span>
                <span className="text-xs text-on-surface-variant font-semibold">
                  {user.grade} • {user.education_board}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-on-surface mt-0.5 truncate max-w-md">
                {instantQuizPayload.chapter}
              </h2>
            </div>
          </div>

          <button
            onClick={closeInstantQuiz}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-xl hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-on-surface">Generating Syllabus-Aligned Quiz...</p>
            <p className="text-xs text-on-surface-variant">
              Synthesizing questions based on {instantQuizPayload.chapter}
            </p>
          </div>
        )}

        {/* Completed Results View */}
        {!loading && completed && scoreResult && (
          <div className="flex flex-col gap-5 py-4 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-fixed to-secondary-fixed/40 text-center flex flex-col items-center gap-2 border border-primary/20">
              <div className="w-16 h-16 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shadow-md text-2xl font-black">
                {scoreResult.score}%
              </div>
              <h3 className="text-xl font-black text-on-surface">
                {scoreResult.score >= 80 ? 'Mastery Demonstrated! 🎉' : scoreResult.score >= 50 ? 'Good Effort! Keep Reviewing 👍' : 'Needs Reinforcement 📚'}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-md">
                Your score and weak topics have been saved to your profile and will automatically personalize your upcoming study plans.
              </p>
            </div>

            {/* Weak topics warning */}
            {scoreResult.weakTopics.length > 0 && (
              <div className="p-4 rounded-xl bg-error-container/40 border border-error/20 flex flex-col gap-2">
                <span className="text-xs font-bold text-error uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span>Concepts to Strengthen:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {scoreResult.weakTopics.map((topic, i) => (
                    <span key={i} className="text-xs font-semibold bg-surface-container-lowest px-2.5 py-1 rounded-lg text-on-surface shadow-xs border border-surface-container">
                      • {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Question by question review */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Question Review</h4>
              {questions.map((q, idx) => {
                const ans = selectedAnswers[q.id];
                const isMatch = (ans || '').trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                return (
                  <div key={q.id} className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-on-surface">Q{idx + 1}: {q.question}</span>
                      <span className={isMatch ? 'text-primary' : 'text-error'}>
                        {isMatch ? 'Correct (+1)' : 'Needs Review'}
                      </span>
                    </div>
                    <div className="text-on-surface-variant">
                      <strong>Your answer:</strong> {ans || 'Skipped'}
                    </div>
                    <div className="text-primary font-medium">
                      <strong>Correct answer:</strong> {q.correctAnswer}
                    </div>
                    <div className="text-[11px] text-on-surface-variant bg-surface-container-lowest p-2 rounded-lg mt-1">
                      💡 {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
              <button
                onClick={loadQuiz}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Retake Quiz
              </button>
              <button
                onClick={closeInstantQuiz}
                className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Active Question Runner */}
        {!loading && !completed && currentQ && (
          <div className="flex flex-col gap-5">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span className="capitalize">{currentQ.type.replace('_', ' ')}</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            {/* Question Text */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container">
              <p className="text-sm md:text-base font-bold text-on-surface leading-relaxed">
                {currentQ.question}
              </p>
              {currentQ.topic && (
                <span className="text-[10px] uppercase font-bold text-primary mt-2 inline-block">
                  Topic: {currentQ.topic}
                </span>
              )}
            </div>

            {/* Options for MCQ / True False */}
            {currentQ.options && currentQ.options.length > 0 && (
              <div className="flex flex-col gap-2">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer(opt)}
                      className={`p-3.5 rounded-xl text-xs md:text-sm font-semibold text-left transition-all border flex items-center justify-between ${
                        isSelected
                          ? 'bg-primary-fixed text-primary border-primary shadow-xs'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text input for Fill in the blank / Short answer */}
            {(!currentQ.options || currentQ.options.length === 0) && (
              <div className="flex flex-col gap-2">
                <textarea
                  rows={3}
                  value={selectedAnswers[currentQ.id] || ''}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                  placeholder="Type your answer or explanation here..."
                  className="w-full bg-surface-container-low text-on-surface text-xs md:text-sm p-3.5 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary placeholder:text-outline"
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-surface-container">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={handleNext}
                className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>{currentIndex === questions.length - 1 ? 'Submit & Grade' : 'Next Question'}</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
