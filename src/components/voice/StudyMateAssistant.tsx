import React, { useState, useEffect, useRef } from 'react';
import { useAcademic } from '../../context/AcademicContext';

// TypeScript declaration for official ElevenLabs web widget custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'agent-id'?: string;
          'action-text'?: string;
          'start-call-text'?: string;
          'end-call-text'?: string;
          'listening-text'?: string;
          'speaking-text'?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface Message {
  id: string;
  sender: 'student' | 'studymate';
  text: string;
  timestamp: string;
}

type VoiceState = 'idle' | 'requesting_permission' | 'listening' | 'thinking' | 'speaking' | 'permission_denied';

const ELEVENLABS_SCRIPT_URL = 'https://elevenlabs.io/convai-widget/index.js';

export const StudyMateAssistant: React.FC = () => {
  const { user } = useAcademic();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'text' | 'widget_config'>('voice');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // ElevenLabs Agent ID Configuration
  const [agentId, setAgentId] = useState<string>(
    () => localStorage.getItem('smart_school_elevenlabs_agent_id') || 
          import.meta.env.VITE_ELEVENLABS_AGENT_ID || 
          'YOUR_ELEVENLABS_AGENT_ID'
  );
  const [useOfficialWidgetEmbed, setUseOfficialWidgetEmbed] = useState(false);
  const [widgetScriptLoaded, setWidgetScriptLoaded] = useState(false);

  // Chat messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'studymate',
      text: `Hi ${user.full_name.split(' ')[0]}! 👋 I'm **StudyMate**, your AI voice study buddy for **${user.grade}** (${user.education_board}).\n\nI can explain tough topics in simple terms, help you think through homework questions, or quiz you one question at a time in **${user.preferred_language}**. How can I help?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Audio / Speech references
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamically load ElevenLabs script once when component mounts or official embed is enabled
  useEffect(() => {
    const existing = document.querySelector(`script[src="${ELEVENLABS_SCRIPT_URL}"]`);
    if (existing) {
      setWidgetScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = ELEVENLABS_SCRIPT_URL;
    script.async = true;
    script.type = 'text/javascript';
    script.onload = () => setWidgetScriptLoaded(true);
    script.onerror = () => console.warn('Could not load ElevenLabs ConvAI script. Using built-in voice interface.');
    document.head.appendChild(script);

    return () => {
      // Clean up recognition and media stream on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceState]);

  // Handle Voice Conversation Start
  const handleStartVoice = async () => {
    setPermissionError(null);
    setVoiceState('requesting_permission');

    // 1. Request microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err: unknown) {
      console.warn('Microphone permission error:', err);
      const isDenied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      setPermissionError(
        isDenied
          ? 'Microphone access was denied. Please allow microphone permissions in your browser address bar to talk with StudyMate.'
          : 'Could not access microphone hardware. Please check your audio input device.'
      );
      setVoiceState('permission_denied');
      return;
    }

    // 2. Initialize Speech Recognition
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      // Fallback if browser doesn't support Web Speech API
      setPermissionError('Your browser does not support live voice recognition. You can type using Text Mode below!');
      setVoiceState('permission_denied');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Calibrate recognition language based on student preferred language
      const langMap: Record<string, string> = {
        English: 'en-US',
        Hindi: 'hi-IN',
        Telugu: 'te-IN',
        Tamil: 'ta-IN',
        Marathi: 'mr-IN',
        Kannada: 'kn-IN',
        Malayalam: 'ml-IN',
        Bengali: 'bn-IN',
        Gujarati: 'gu-IN',
        'Hinglish (Bilingual)': 'en-IN',
      };
      recognition.lang = langMap[user.preferred_language] || 'en-US';

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        if (spokenText.trim()) {
          sendVoiceQuery(spokenText);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setPermissionError('Microphone permission blocked. Please enable it in browser settings.');
          setVoiceState('permission_denied');
        } else if (event.error === 'no-speech') {
          setVoiceState('idle');
        } else {
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition initiation failed:', err);
      setVoiceState('idle');
    }
  };

  const handleStopVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
  };

  const sendVoiceQuery = async (queryText: string, customMode: string = 'general') => {
    handleStopVoice();

    const studentMsg: Message = {
      id: 'st-' + Date.now(),
      sender: 'student',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, studentMsg]);
    setVoiceState('thinking');
    setIsTyping(true);

    try {
      const res = await fetch('/api/studymate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          grade: user.grade,
          board: user.education_board,
          language: user.preferred_language,
          mode: customMode,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "I didn't quite catch that. Could you repeat your question?";

      const mateMsg: Message = {
        id: 'sm-' + Date.now(),
        sender: 'studymate',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, mateMsg]);

      // Speak reply aloud
      speakResponse(replyText);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'studymate',
          text: "I couldn't reach the StudyMate server right now. Let's try again in a moment!",
          timestamp: 'Now',
        },
      ]);
      setVoiceState('idle');
    } finally {
      setIsTyping(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setVoiceState('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      // Strip markdown asterisks for natural speech synthesis
      const cleanText = text.replace(/[*_#`]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onstart = () => {
        setVoiceState('speaking');
      };

      utterance.onend = () => {
        setVoiceState('idle');
      };

      utterance.onerror = () => {
        setVoiceState('idle');
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setVoiceState('idle');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    const text = inputText.trim();
    setInputText('');
    sendVoiceQuery(text);
  };

  const handleSaveAgentId = (newId: string) => {
    setAgentId(newId.trim());
    localStorage.setItem('smart_school_elevenlabs_agent_id', newId.trim());
  };

  return (
    <>
      {/* 1. Official ElevenLabs Web Custom Element Embed (when enabled) */}
      {useOfficialWidgetEmbed && widgetScriptLoaded && agentId && agentId !== 'YOUR_ELEVENLABS_AGENT_ID' && (
        <div className="fixed bottom-24 right-6 z-40">
          <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>
        </div>
      )}

      {/* 2. Floating StudyMate AI Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open StudyMate AI Voice Assistant"
            className="group relative flex items-center gap-3 bg-gradient-to-r from-primary to-secondary text-on-primary pl-4 pr-5 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/40"
          >
            {/* Animated Pulse Ring */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-secondary-fixed"></span>
            </span>

            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl group-hover:animate-pulse">record_voice_over</span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-tight flex items-center gap-1">
                <span>StudyMate AI</span>
                <span className="text-[9px] uppercase font-bold bg-white/20 px-1.5 py-0.2 rounded-full">Voice</span>
              </span>
              <span className="text-[10px] text-white/80 font-medium">Personalized Tutor</span>
            </div>
          </button>
        )}
      </div>

      {/* 3. StudyMate Interactive Assistant Window / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[640px] z-50 bg-surface-container-lowest sm:rounded-3xl shadow-2xl border border-surface-container flex flex-col overflow-hidden animate-in fade-in sm:zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-primary via-primary-container to-secondary-container text-on-primary p-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold tracking-tight">StudyMate</h3>
                  <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-full">
                    {user.grade}
                  </span>
                </div>
                <span className="text-[11px] text-white/80 truncate max-w-[210px]">
                  {user.preferred_language} • {user.education_board}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab(activeTab === 'widget_config' ? 'voice' : 'widget_config')}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                title="ElevenLabs Agent Settings"
              >
                <span className="material-symbols-outlined text-lg">tune</span>
              </button>

              <button
                onClick={() => {
                  handleStopVoice();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                aria-label="Close StudyMate"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-around bg-surface-container-low border-b border-surface-container px-3 py-1.5 shrink-0 text-xs font-bold">
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">mic</span>
              <span>Voice</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span>Text Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('widget_config')}
              className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'widget_config'
                  ? 'bg-surface-container-lowest text-secondary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">settings_voice</span>
              <span>Agent</span>
            </button>
          </div>

          {/* CONTENT AREA: 1. VOICE CONVERSATION MODE */}
          {activeTab === 'voice' && (
            <div className="flex-1 flex flex-col justify-between p-5 bg-surface-container-lowest overflow-y-auto">
              {/* Pedagogical Assistant Status & Waves */}
              <div className="flex flex-col items-center justify-center my-auto gap-4 text-center">
                <div className="relative flex items-center justify-center">
                  {/* Outer Animated Soundwave Rings */}
                  {(voiceState === 'listening' || voiceState === 'speaking') && (
                    <>
                      <div className="absolute w-36 h-36 rounded-full bg-primary/15 animate-ping"></div>
                      <div className="absolute w-28 h-28 rounded-full bg-secondary/20 animate-pulse"></div>
                    </>
                  )}

                  {/* Center Microphone Button */}
                  <button
                    onClick={voiceState === 'listening' ? handleStopVoice : handleStartVoice}
                    className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                      voiceState === 'listening'
                        ? 'bg-error text-on-error ring-4 ring-error/30 animate-pulse'
                        : voiceState === 'speaking'
                        ? 'bg-secondary text-on-secondary ring-4 ring-secondary/30'
                        : voiceState === 'thinking'
                        ? 'bg-surface-container-high text-primary ring-4 ring-primary/20'
                        : 'bg-primary text-on-primary ring-4 ring-primary/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-4xl">
                      {voiceState === 'listening'
                        ? 'stop'
                        : voiceState === 'speaking'
                        ? 'volume_up'
                        : voiceState === 'thinking'
                        ? 'sync'
                        : 'mic'}
                    </span>
                    <span className="text-[10px] uppercase font-bold mt-1">
                      {voiceState === 'listening' ? 'Stop' : voiceState === 'speaking' ? 'Speaking' : 'Speak'}
                    </span>
                  </button>
                </div>

                {/* State Label */}
                <div className="flex flex-col items-center gap-1 max-w-xs">
                  <h4 className="text-sm font-extrabold text-on-surface">
                    {voiceState === 'idle' && 'Tap Speak to start voice conversation'}
                    {voiceState === 'requesting_permission' && 'Requesting microphone access...'}
                    {voiceState === 'listening' && 'Listening to your question...'}
                    {voiceState === 'thinking' && 'StudyMate is formulating explanation...'}
                    {voiceState === 'speaking' && 'StudyMate is speaking...'}
                    {voiceState === 'permission_denied' && 'Microphone Access Needed'}
                  </h4>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {voiceState === 'idle' && `Speaks and understands ${user.preferred_language} at ${user.grade} level.`}
                    {voiceState === 'listening' && 'Speak clearly into your microphone.'}
                    {voiceState === 'speaking' && 'Listen to the audio explanation.'}
                  </p>
                </div>

                {/* Microphone Permission Error Card */}
                {permissionError && (
                  <div className="p-3.5 rounded-2xl bg-error-container text-on-error-container text-xs text-left border border-error/20 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="material-symbols-outlined text-base">warning</span>
                      <span>Microphone Notice</span>
                    </div>
                    <p className="leading-relaxed">{permissionError}</p>
                    <button
                      onClick={() => setActiveTab('text')}
                      className="text-xs font-bold underline text-left self-start cursor-pointer"
                    >
                      Switch to Text Mode instead
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-col gap-2 pt-3 border-t border-surface-container shrink-0">
                <span className="text-[10px] uppercase font-bold text-outline text-left">Quick Voice Inquiries:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => sendVoiceQuery('Quiz me on a chapter, one question at a time!', 'quiz')}
                    className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-left transition-colors border border-surface-container flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>❓ Quiz me (1 question)</span>
                  </button>

                  <button
                    onClick={() => sendVoiceQuery('Explain my chapter using simple real life analogies', 'general')}
                    className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-left transition-colors border border-surface-container flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💡 Concept Analogy</span>
                  </button>

                  <button
                    onClick={() => sendVoiceQuery('Give me a step-by-step hint for my homework problem', 'homework_help')}
                    className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-left transition-colors border border-surface-container flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📝 Homework Hint</span>
                  </button>

                  <button
                    onClick={() => sendVoiceQuery(`Summarize key formulas and definitions in ${user.preferred_language}`, 'general')}
                    className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-left transition-colors border border-surface-container flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🌐 {user.preferred_language}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT AREA: 2. TEXT CHAT MODE */}
          {activeTab === 'text' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-surface-container-lowest">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map((msg) => {
                  const isStudent = msg.sender === 'student';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[88%] ${isStudent ? 'self-end flex-row-reverse' : 'self-start'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isStudent ? 'bg-primary text-on-primary' : 'bg-primary-fixed text-primary'
                        }`}
                      >
                        {isStudent ? user.full_name[0] : 'SM'}
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isStudent
                            ? 'bg-primary text-on-primary rounded-tr-none'
                            : 'bg-surface-container-low text-on-surface rounded-tl-none border border-surface-container'
                        }`}
                      >
                        {msg.text}
                        <div
                          className={`text-[9px] mt-1 ${isStudent ? 'text-primary-fixed-dim text-right' : 'text-on-surface-variant'}`}
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
                    <span>StudyMate is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleTextSubmit} className="p-3 bg-surface-container-low border-t border-surface-container flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Ask StudyMate about ${user.grade} subjects...`}
                  className="flex-1 bg-surface-container-lowest text-on-surface text-xs p-2.5 rounded-xl border border-surface-container outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </form>
            </div>
          )}

          {/* CONTENT AREA: 3. AGENT ID & PRIVACY CONFIGURATION */}
          {activeTab === 'widget_config' && (
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-surface-container-lowest text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-surface-container">
                <span className="material-symbols-outlined text-secondary text-xl">smart_toy</span>
                <div>
                  <h4 className="font-bold text-on-surface">ElevenLabs StudyMate Configuration</h4>
                  <p className="text-[11px] text-on-surface-variant">Manage conversational agent integration</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">ElevenLabs Agent ID</label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => handleSaveAgentId(e.target.value)}
                  placeholder="e.g. YOUR_ELEVENLABS_AGENT_ID"
                  className="bg-surface-container-low text-on-surface text-xs p-3 rounded-xl border border-surface-container font-mono outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-on-surface-variant">
                  Configured agent ID for conversational voice sessions.
                </span>
              </div>

              {/* Toggle Direct Embed Widget */}
              <div className="p-3.5 bg-surface-container-low rounded-2xl border border-surface-container flex items-center justify-between">
                <div>
                  <span className="font-bold text-on-surface block">Official Web Component</span>
                  <span className="text-[11px] text-on-surface-variant block mt-0.5">
                    Embed official &lt;elevenlabs-convai&gt; element
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={useOfficialWidgetEmbed}
                  onChange={(e) => setUseOfficialWidgetEmbed(e.target.checked)}
                  className="w-5 h-5 rounded text-primary accent-primary cursor-pointer"
                />
              </div>

              {/* Privacy Safeguard Notice */}
              <div className="p-3.5 rounded-2xl bg-primary-fixed/20 border border-primary/20 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <span className="material-symbols-outlined text-base">privacy_tip</span>
                  <span>Pedagogical Safety &amp; Privacy</span>
                </div>
                <p className="text-[11px] text-on-surface leading-relaxed">
                  StudyMate operates in a sandboxed educational context. It never exposes your personal Supabase credentials or private assignments to external third parties.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('voice')}
                  className="bg-primary hover:bg-primary-container text-on-primary px-5 py-2 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Return to Voice Assistant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
