import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { CURATED_OFFICIAL_RESOURCES, SUBJECT_CHAPTER_MAP } from '../data/syllabusData';
import { OfficialResource } from '../types';

export const OfficialResourcesScreen: React.FC = () => {
  const { user, savedResourceIds, toggleSaveResource } = useAcademic();

  const [subject, setSubject] = useState(user.subjects?.[0] || 'Science');
  const [chapter, setChapter] = useState(SUBJECT_CHAPTER_MAP[subject]?.[0] || 'Chemical Reactions and Equations');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportedResource, setReportedResource] = useState<OfficialResource | null>(null);
  const [reportReason, setReportReason] = useState('Broken link');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const availableChapters = SUBJECT_CHAPTER_MAP[subject] || [chapter];

  const handleSubjectChange = (newSub: string) => {
    setSubject(newSub);
    const first = SUBJECT_CHAPTER_MAP[newSub]?.[0] || 'General';
    setChapter(first);
  };

  // Filter curated resources
  const filteredResources = CURATED_OFFICIAL_RESOURCES.filter((res) => {
    // Match type
    if (selectedType === 'saved') {
      return savedResourceIds.includes(res.id);
    }
    if (selectedType === 'official' && !res.is_official) {
      return false;
    }
    if (selectedType !== 'all' && selectedType !== 'official' && res.resource_type !== selectedType) {
      return false;
    }

    // Match search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (res.title + res.description + res.subject + res.chapter + res.publisher).toLowerCase();
      return matchText.includes(q);
    }

    return true;
  });

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportedResource(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>Government &amp; Board Prescribed Repositories</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Official Study Resources &amp; Syllabi
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Verified textbooks, chapter e-books, and portals for {user.grade} • {user.education_board}
            {user.education_board === 'State Board' && user.state_board_name ? ` (${user.state_board_name})` : ''}
          </p>
        </div>

        {/* Official Board Quick Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://ncert.nic.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold border border-surface-container transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>NCERT Portal</span>
            <span className="material-symbols-outlined text-xs text-outline">open_in_new</span>
          </a>
          <a
            href="https://www.cbse.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold border border-surface-container transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span>CBSE Official</span>
            <span className="material-symbols-outlined text-xs text-outline">open_in_new</span>
          </a>
          {user.education_board === 'State Board' && (
            <a
              href="https://scert.telangana.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary-fixed/40 hover:bg-secondary-fixed text-on-secondary-fixed text-xs font-bold border border-secondary/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>SCERT State E-Books</span>
              <span className="material-symbols-outlined text-xs text-outline">open_in_new</span>
            </a>
          )}
        </div>
      </div>

      {/* Discovery Filters Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <select
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="text-xs font-bold bg-surface-container-low text-on-surface p-2.5 rounded-xl border border-surface-container cursor-pointer"
          >
            {(user.subjects || ['Science', 'Mathematics']).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="text-xs font-semibold bg-surface-container-low text-on-surface p-2.5 rounded-xl border border-surface-container cursor-pointer max-w-[200px] truncate"
          >
            {availableChapters.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="flex items-center bg-surface-container p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                selectedType === 'all' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('official')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                selectedType === 'official' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              Official Only
            </button>
            <button
              onClick={() => setSelectedType('official_textbook')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                selectedType === 'official_textbook' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              Textbooks
            </button>
            <button
              onClick={() => setSelectedType('saved')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                selectedType === 'saved' ? 'bg-surface-container-lowest text-secondary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-sm">bookmark</span>
              <span>Saved ({savedResourceIds.length})</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search textbooks & chapters..."
            className="w-full bg-surface-container-low text-on-surface text-xs pl-8 pr-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.length === 0 ? (
          <div className="col-span-full bg-surface-container-lowest p-12 rounded-3xl border border-surface-container text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-outline">menu_book</span>
            <h3 className="text-sm font-bold text-on-surface">No resources match your filter</h3>
            <p className="text-xs text-on-surface-variant">
              Try switching your search keywords or selecting &quot;All&quot; from the filter ribbon above.
            </p>
          </div>
        ) : (
          filteredResources.map((res) => {
            const isSaved = savedResourceIds.includes(res.id);
            return (
              <div
                key={res.id}
                className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-surface-container flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  {/* Tag Ribbon */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        res.is_official
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-secondary-fixed text-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">
                        {res.is_official ? 'verified' : 'ondemand_video'}
                      </span>
                      <span>{res.is_official ? 'Official Textbook' : 'Verified Partner'}</span>
                    </span>

                    <button
                      onClick={() => toggleSaveResource(res.id)}
                      className={`p-1 rounded-lg hover:bg-surface-container ${
                        isSaved ? 'text-secondary' : 'text-outline'
                      }`}
                      title={isSaved ? 'Remove Bookmark' : 'Save Resource'}
                    >
                      <span className="material-symbols-outlined text-base">
                        {isSaved ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-on-surface leading-snug line-clamp-2">
                    {res.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant flex-wrap">
                    <span className="font-semibold text-primary">{res.subject}</span>
                    <span>•</span>
                    <span>{res.grade}</span>
                    <span>•</span>
                    <span className="font-medium bg-surface-container px-1.5 py-0.2 rounded">
                      {res.board}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                    {res.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-outline uppercase font-semibold">Publisher</span>
                    <span className="text-[11px] font-bold text-on-surface truncate max-w-[140px]">
                      {res.publisher}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setReportedResource(res)}
                      className="text-on-surface-variant hover:text-error p-1.5 rounded-lg hover:bg-surface-container transition-colors text-xs"
                      title="Report broken or incorrect resource"
                    >
                      <span className="material-symbols-outlined text-sm">flag</span>
                    </button>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary hover:bg-primary-container text-on-primary px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                    >
                      <span>Open</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Report Broken Link Modal */}
      {reportedResource && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-2xl max-w-md w-full border border-surface-container flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl">flag</span>
                <h3 className="text-sm font-bold text-on-surface">Report Resource</h3>
              </div>
              <button
                onClick={() => setReportedResource(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {reportSubmitted ? (
              <div className="p-4 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>Thank you! Your feedback will help update verified links.</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="flex flex-col gap-3">
                <p className="text-xs text-on-surface-variant">
                  Reporting: <strong>{reportedResource.title}</strong>
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="bg-surface-container-low text-on-surface text-xs p-2.5 rounded-xl border border-surface-container font-semibold"
                  >
                    <option value="Broken link">Page does not load / 404 broken link</option>
                    <option value="Wrong chapter">Incorrect chapter or syllabus content</option>
                    <option value="Outdated edition">Outdated syllabus or older textbook edition</option>
                    <option value="Copyright/Paywall">Requires paid subscription</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportedResource(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-error hover:bg-error/90 text-on-error px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
