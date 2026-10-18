import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { SUBJECT_CHAPTER_MAP } from '../data/syllabusData';
import { StudyNote, StudyNoteContent } from '../types';
import { geminiApi } from '../lib/geminiApi';

export const NotesScreen: React.FC = () => {
  const { 
    user, 
    studyNotes, 
    addStudyNote, 
    deleteStudyNote, 
    toggleFavoriteNote, 
    openInstantQuiz 
  } = useAcademic();

  const [subject, setSubject] = useState(user.subjects?.[0] || 'Science');
  const [chapter, setChapter] = useState(SUBJECT_CHAPTER_MAP[subject]?.[0] || 'Chemical Reactions and Equations');
  const [noteLength, setNoteLength] = useState<'quick_revision' | 'standard' | 'detailed'>('standard');
  const [customExcerpt, setCustomExcerpt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(studyNotes[0] || null);
  const [filterQuery, setFilterQuery] = useState('');
  const [showGeneratorPanel, setShowGeneratorPanel] = useState(false);

  const availableChapters = SUBJECT_CHAPTER_MAP[subject] || [chapter];

  const handleSubjectChange = (newSub: string) => {
    setSubject(newSub);
    const firstChap = SUBJECT_CHAPTER_MAP[newSub]?.[0] || 'General';
    setChapter(firstChap);
  };

  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const generatedContent: StudyNoteContent = await geminiApi.generateNotes({
        grade: user.grade,
        board: user.education_board,
        subject,
        chapter,
        noteLength,
        customContext: customExcerpt.trim() || undefined,
        language: user.preferred_language,
      });

      const newNote = await addStudyNote({
        grade: user.grade,
        board: user.education_board,
        subject,
        chapter,
        title: `${chapter} (${noteLength.replace('_', ' ').toUpperCase()})`,
        note_length: noteLength,
        content: generatedContent,
        is_favorite: false,
      });

      setSelectedNote(newNote);
      setShowGeneratorPanel(false);
      setCustomExcerpt('');
    } catch (err) {
      alert('Notes generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredNotes = studyNotes.filter(n => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.subject.toLowerCase().includes(q) ||
      n.chapter.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">auto_stories</span>
            <span>Syllabus-Aligned Notes Library</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            AI Notes Generator &amp; Revision Guides
          </h1>
        </div>

        <button
          onClick={() => setShowGeneratorPanel(!showGeneratorPanel)}
          className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-lg">
            {showGeneratorPanel ? 'close' : 'add'}
          </span>
          <span>{showGeneratorPanel ? 'Close Generator' : 'Generate New Notes'}</span>
        </button>
      </div>

      {/* Generator Drawer/Panel */}
      {showGeneratorPanel && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-md border border-surface-container mb-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">magic_button</span>
              <h2 className="text-base font-bold text-on-surface">Generate Custom Chapter Notes</h2>
            </div>
            <span className="text-xs text-on-surface-variant font-semibold">
              Tuned for {user.grade} • {user.education_board}
            </span>
          </div>

          <form onSubmit={handleGenerateNotes} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl outline-none border border-surface-container cursor-pointer font-semibold"
                >
                  {(user.subjects || ['Science', 'Mathematics']).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Chapter / Topic</label>
                <select
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl outline-none border border-surface-container cursor-pointer font-semibold"
                >
                  {availableChapters.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Target Note Depth</label>
                <select
                  value={noteLength}
                  onChange={(e) => setNoteLength(e.target.value as 'quick_revision')}
                  className="bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl outline-none border border-surface-container cursor-pointer font-semibold"
                >
                  <option value="quick_revision">Quick Revision (Crisp bullets &amp; formulas)</option>
                  <option value="standard">Standard Notes (Full syllabus concepts)</option>
                  <option value="detailed">Detailed Notes (Worked examples &amp; derivations)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface flex justify-between">
                <span>Optional: Paste Textbook Excerpt or Teacher Guidelines</span>
                <span className="text-[11px] text-outline">Prioritizes this content</span>
              </label>
              <textarea
                rows={3}
                value={customExcerpt}
                onChange={(e) => setCustomExcerpt(e.target.value)}
                placeholder="Paste key textbook definitions, problem statements, or specific exam topics you want included in the notes..."
                className="w-full bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-xl outline-none border border-surface-container focus:ring-2 focus:ring-primary placeholder:text-outline"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setShowGeneratorPanel(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Synthesizing Notes...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>Generate Structured Notes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2-Column Notes Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Notes Navigation List (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container flex flex-col gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search saved notes..."
              className="w-full bg-surface-container-low text-on-surface text-xs pl-8 pr-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant text-xs">
                No notes found matching your search.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border text-left flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-primary-fixed/40 border-primary shadow-xs'
                        : 'bg-surface-container-low hover:bg-surface-container border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase bg-surface-container px-2 py-0.5 rounded text-primary">
                        {note.subject}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteNote(note.id);
                          }}
                          className={`p-1 rounded hover:bg-surface-container-high ${
                            note.is_favorite ? 'text-secondary' : 'text-outline'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {note.is_favorite ? 'star' : 'star_border'}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteStudyNote(note.id);
                            if (selectedNote?.id === note.id) setSelectedNote(null);
                          }}
                          className="p-1 rounded hover:bg-error-container hover:text-error text-outline transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-on-surface line-clamp-2">
                      {note.title}
                    </h3>

                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-surface-container">
                      <span>{note.chapter}</span>
                      <span className="capitalize">{note.note_length.replace('_', ' ')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Note Detail View (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container flex flex-col gap-5">
          {selectedNote ? (
            <div className="flex flex-col gap-5">
              {/* Note Header & Action Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] uppercase font-bold bg-primary text-on-primary px-2.5 py-0.5 rounded-full">
                      {selectedNote.subject}
                    </span>
                    <span className="text-[10px] font-bold bg-surface-container text-on-surface px-2.5 py-0.5 rounded-full">
                      {selectedNote.grade} • {selectedNote.board}
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-extrabold text-on-surface">
                    {selectedNote.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      openInstantQuiz({
                        subject: selectedNote.subject,
                        chapter: selectedNote.chapter,
                        contextText: selectedNote.content.quickSummary,
                      })
                    }
                    className="bg-primary hover:bg-primary-container text-on-primary px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    title="Generate test directly from these notes"
                  >
                    <span className="material-symbols-outlined text-base">quiz</span>
                    <span>Test My Understanding</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
                    title="Print or Save PDF"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                  </button>
                </div>
              </div>

              {/* Chapter Overview */}
              <div className="bg-primary-fixed/20 p-4 rounded-2xl border border-primary/20">
                <span className="text-xs uppercase font-extrabold text-primary tracking-wider block mb-1">
                  Chapter Overview
                </span>
                <p className="text-xs md:text-sm text-on-surface leading-relaxed">
                  {selectedNote.content.chapterOverview}
                </p>
              </div>

              {/* Important Concepts */}
              {selectedNote.content.importantConcepts?.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
                    <span>Important Core Concepts</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedNote.content.importantConcepts.map((c, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
                        <span className="text-xs font-bold text-primary block mb-1">{c.title}</span>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{c.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Definitions */}
              {selectedNote.content.definitions?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-lg">book</span>
                    <span>Standard Textbook Definitions</span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {selectedNote.content.definitions.map((d, i) => (
                      <div key={i} className="p-3 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-baseline gap-1.5 border border-surface-container">
                        <span className="text-xs font-bold text-on-surface sm:w-1/3 shrink-0">{d.term}:</span>
                        <span className="text-xs text-on-surface-variant leading-relaxed sm:flex-1">{d.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulas & Diagrams */}
              {selectedNote.content.formulasAndDiagrams?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary text-lg">functions</span>
                    <span>Formulas &amp; Diagram Descriptions</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedNote.content.formulasAndDiagrams.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-start gap-2">
                        <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">schema</span>
                        <div>
                          <span className="text-xs font-bold text-on-surface block">{f.label}</span>
                          <span className="text-xs text-on-surface-variant font-mono">{f.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {selectedNote.content.examples?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-lg">task_alt</span>
                    <span>Solved Examples &amp; Proofs</span>
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {selectedNote.content.examples.map((ex, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-primary">{ex.title}</span>
                        <div className="text-xs text-on-surface font-semibold bg-surface-container-lowest p-2.5 rounded-lg border border-surface-container">
                          <strong>Problem:</strong> {ex.problem}
                        </div>
                        <div className="text-xs text-on-surface-variant whitespace-pre-line pl-1">
                          <strong>Solution:</strong> {ex.solution}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {selectedNote.content.commonMistakes?.length > 0 && (
                <div className="bg-error-container/40 p-4 rounded-2xl border border-error/20">
                  <span className="text-xs font-bold text-error uppercase tracking-wider flex items-center gap-1 mb-2">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>Common Exam Pitfalls &amp; Mistakes to Avoid</span>
                  </span>
                  <ul className="list-disc list-inside text-xs text-on-error-container flex flex-col gap-1 leading-relaxed">
                    {selectedNote.content.commonMistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Revision Summary */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container">
                <span className="text-xs font-bold text-tertiary uppercase tracking-wider block mb-1">
                  Rapid Revision Summary
                </span>
                <p className="text-xs text-on-surface leading-relaxed">
                  {selectedNote.content.quickSummary}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl text-outline">description</span>
              <p className="text-sm font-bold text-on-surface">No note selected</p>
              <p className="text-xs">Choose a note from the library or click &quot;Generate New Notes&quot; above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
