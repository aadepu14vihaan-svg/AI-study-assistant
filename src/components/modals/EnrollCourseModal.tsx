import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';

interface EnrollCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnrollCourseModal: React.FC<EnrollCourseModalProps> = ({ isOpen, onClose }) => {
  const { addCourse } = useAcademic();

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [credits, setCredits] = useState('4.0');
  const [accentColor, setAccentColor] = useState<'primary' | 'secondary' | 'tertiary' | 'error' | 'surface-tint'>('primary');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addCourse({
      code: code.trim().toUpperCase() || 'COURSE-' + Math.floor(Math.random() * 900 + 100),
      title: title.trim(),
      instructor: instructor.trim() || 'Staff Faculty',
      email: `${(instructor || 'faculty').toLowerCase().replace(/\s+/g, '.')}@smartschool.edu`,
      room: room.trim() || 'Tech Hall 101',
      office_hours: 'Mon / Wed 3:00 – 4:00 PM',
      credits: parseFloat(credits) || 4.0,
      grade_pct: 94.0,
      grade_letter: 'A',
      progress_pct: 25,
      accent_color: accentColor,
      active_deliverables: ['Course Syllabus & Orientation'],
      resources: {
        syllabus: true,
        slides: true,
        notes_count: 2,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl p-5 md:p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-on-surface">Enroll in New Course</h3>
              <p className="text-xs text-on-surface-variant">
                Add an active or prerequisite track for Fall 2024
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Course Code</label>
              <input
                type="text"
                placeholder="e.g. STAT-201"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border-0 text-xs md:text-sm ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Subject Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. AP Microeconomics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border-0 text-xs md:text-sm ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Primary Instructor</label>
              <input
                type="text"
                placeholder="e.g. Dr. Vance"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border-0 text-xs md:text-sm ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Classroom / Hall</label>
              <input
                type="text"
                placeholder="e.g. Science Hall 304"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border-0 text-xs md:text-sm ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Academic Credit Weight</label>
              <select
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border-0 text-xs md:text-sm ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
              >
                <option value="4.0">4.0 Units (Full AP / Honors)</option>
                <option value="3.0">3.0 Units (Standard Core)</option>
                <option value="2.0">2.0 Units (Lab Elective)</option>
                <option value="1.0">1.0 Unit (Seminar)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Theme Color Accent</label>
              <select
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value as unknown as 'primary')}
                className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border-0 text-xs md:text-sm ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
              >
                <option value="primary">Indigo / Blue</option>
                <option value="secondary">Purple / Violet</option>
                <option value="tertiary">Emerald Green</option>
                <option value="error">Rose / Coral</option>
                <option value="surface-tint">Sapphire Blue</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs md:text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs md:text-sm font-bold hover:bg-primary-container transition-all shadow-sm"
            >
              Confirm Enrollment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
