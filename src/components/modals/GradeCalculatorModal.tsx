import React, { useState, useEffect } from 'react';
import { Course } from '../../types';

interface GradeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}

export const GradeCalculatorModal: React.FC<GradeCalculatorModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(95);

  useEffect(() => {
    setSliderValue(95);
  }, [course, isOpen]);

  if (!isOpen || !course) return null;

  const baseline = course.grade_pct;
  const projected = baseline * 0.65 + sliderValue * 0.35;

  let letter = 'A';
  let badgeClass = 'text-tertiary';
  if (projected >= 93) {
    letter = 'Solid A';
    badgeClass = 'text-tertiary';
  } else if (projected >= 90) {
    letter = 'A-';
    badgeClass = 'text-primary';
  } else if (projected >= 87) {
    letter = 'B+';
    badgeClass = 'text-secondary';
  } else if (projected >= 83) {
    letter = 'B';
    badgeClass = 'text-secondary';
  } else {
    letter = 'Passing';
    badgeClass = 'text-on-surface-variant';
  }

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl p-5 md:p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">calculate</span>
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-on-surface">
                {course.title} Simulation
              </h3>
              <p className="text-xs text-on-surface-variant">
                Model impact of upcoming finals & test scores on overall GPA
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

        {/* Current Standing Card */}
        <div className="flex flex-col gap-2 bg-surface-container-low p-4 rounded-xl border border-surface-container">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-on-surface-variant">Baseline Standing:</span>
            <span className="text-lg font-extrabold text-primary">
              {baseline.toFixed(1)}% ({course.grade_letter})
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-outline">
            <span>Remaining Semester Weight:</span>
            <span>35% of Final Mark</span>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-on-surface flex justify-between">
            <span>Simulated Final Exam Score:</span>
            <span className="text-primary font-bold text-sm">{sliderValue}%</span>
          </label>
          <input
            type="range"
            min="50"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-2 bg-surface-container-high rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[11px] text-outline font-mono">
            <span>50% (Passing)</span>
            <span>75% (Average)</span>
            <span>100% (Perfect)</span>
          </div>
        </div>

        {/* Result Callout */}
        <div className="p-4 bg-surface-container rounded-xl flex items-center justify-between border border-surface-container-high">
          <div>
            <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
              Projected Course Finish
            </span>
            <div className={`text-xl font-extrabold mt-0.5 ${badgeClass}`}>
              {projected.toFixed(1)}% ({letter})
            </div>
          </div>
          <span className="material-symbols-outlined text-3xl text-tertiary">verified</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs md:text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs md:text-sm font-bold hover:bg-primary-container transition-all shadow-sm"
          >
            Save Scenario Target
          </button>
        </div>
      </div>
    </div>
  );
};
