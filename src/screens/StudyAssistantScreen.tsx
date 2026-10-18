import React, { useState, useRef, useEffect } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { SUBJECT_CHAPTER_MAP } from '../data/syllabusData';
import { geminiApi } from '../lib/geminiApi';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const StudyAssistantScreen: React.FC = () => {
  const { user, quizAttempts, openInstantQuiz } = useAcademic();

  const [subject, setSubject] = useState(user.subjects?.[0] || 'Science');
  const [chapter, setChapter] = useState(SUBJECT_CHAPTER_MAP[subject]?.[0] || 'Chemical Reactions and Equations');
  const [mode, setMode] = useState<'short_revision' | 'detailed' | 'exam_prep'>('detailed');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `Hello ${user.full_name.split(' ')[0]}! 👋 I'm your **Gemini AI Academic Tutor**, tailored specifically to your **${user.grade}** curriculum under **${user.education_board}** in **${user.preferred_language}**.\n\nCurrently set to **${subject}** (${chapter}). How can I help you today? You can ask me to explain a tough concept, break down a formula, or quiz your understanding!`,
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Available chapters for the selected subject
  const availableChapters = SUBJECT_CHAPTER_MAP[subject] || [chapter];

  const handleSubjectChange = (newSub: string) => {
    setSubject(newSub);
    const firstChap = SUBJECT_CHAPTER_MAP[newSub]?.[0] || 'General';
    setChapter(firstChap);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setIsTyping(true);

    // Get weak topics from student's quizzes
    const weak = Array.from(new Set(quizAttempts.flatMap(q => q.weak_topics)));

    try {
      const reply = await geminiApi.askStudyAssistant({
        message: textToSend,
        grade: user.grade,
        board: user.education_board,
        subject,
        chapter,
        language: user.preferred_language,
        mode,
        weakTopics: weak,
      });

      const assistantMsg: ChatMessage = {
        id: 'a-' + Date.now(),
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: 'Unable to reach the AI study engine. Please check your connection.',
          timestamp: 'Now',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickChip = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-5rem)] pb-4 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-2xl">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-on-surface">Gemini AI Study Assistant</h1>
              <span className="text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-full">
                {user.grade} • {user.education_board}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Syllabus-aware tutoring in {user.preferred_language} with step-by-step guidance
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="text-xs font-bold bg-surface-container-low text-on-surface p-2 rounded-xl border border-surface-container cursor-pointer"
          >
            {(user.subjects || ['Science', 'Mathematics']).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="text-xs font-semibold bg-surface-container-low text-on-surface p-2 rounded-xl border border-surface-container cursor-pointer max-w-[180px] truncate"
          >
            {availableChapters.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="flex items-center bg-surface-container p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setMode('short_revision')}
              className={`px-2 py-1 rounded-lg transition-all ${
                mode === 'short_revision' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              Short
            </button>
            <button
              onClick={() => setMode('detailed')}
              className={`px-2 py-1 rounded-lg transition-all ${
                mode === 'detailed' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setMode('exam_prep')}
              className={`px-2 py-1 rounded-lg transition-all ${
                mode === 'exam_prep' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              Exam Prep
            </button>
          </div>

          <button
            onClick={() => openInstantQuiz({ subject, chapter })}
            className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
            title="Test My Understanding on this chapter"
          >
            <span className="material-symbols-outlined text-sm">quiz</span>
            <span>Test Me</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto bg-surface-container-lowest rounded-2xl border border-surface-container p-4 md:p-6 flex flex-col gap-4 shadow-inner">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isUser ? 'self-end flex-row-reverse' : 'self-start'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  isUser
                    ? 'bg-primary text-on-primary'
                    : 'bg-primary-fixed text-primary'
                }`}
              >
                {isUser ? user.full_name[0] : 'AI'}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-primary text-on-primary rounded-tr-none'
                    : 'bg-surface-container-low text-on-surface rounded-tl-none border border-surface-container'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[10px] mt-1.5 ${
                    isUser ? 'text-primary-fixed-dim text-right' : 'text-on-surface-variant'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant self-start pl-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span>Gemini Tutor is generating a syllabus-aligned response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Recommended Prompt Quick Chips */}
      <div className="flex items-center gap-1.5 py-2 overflow-x-auto text-xs shrink-0">
        <span className="text-[10px] uppercase font-bold text-outline shrink-0 mr-1">Quick Prompts:</span>
        <button
          onClick={() => handleQuickChip(`Explain the core concept of ${chapter} with an everyday analogy.`)}
          className="bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium px-3 py-1.5 rounded-full border border-surface-container whitespace-nowrap transition-colors"
        >
          💡 Explain with an analogy
        </button>
        <button
          onClick={() => handleQuickChip(`Give me a step-by-step worked example problem for ${chapter}.`)}
          className="bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium px-3 py-1.5 rounded-full border border-surface-container whitespace-nowrap transition-colors"
        >
          📝 Solved problem
        </button>
        <button
          onClick={() => handleQuickChip(`List the top 3 common mistakes students make in ${chapter} during board exams.`)}
          className="bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium px-3 py-1.5 rounded-full border border-surface-container whitespace-nowrap transition-colors"
        >
          ⚠️ Common mistakes
        </button>
        <button
          onClick={() => handleQuickChip(`Ask me 2 test questions to check my understanding of ${chapter}.`)}
          className="bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium px-3 py-1.5 rounded-full border border-surface-container whitespace-nowrap transition-colors"
        >
          ❓ Quiz my understanding
        </button>
      </div>

      {/* Input Message Box */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-2 flex items-center gap-2 shadow-sm shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={`Ask anything about ${subject} - ${chapter}...`}
          className="flex-1 bg-transparent text-on-surface text-xs md:text-sm px-3 py-2 outline-none placeholder:text-outline"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isTyping}
          className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary p-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </div>
    </div>
  );
};
