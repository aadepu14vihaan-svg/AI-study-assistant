import React, { useState, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { Assignment, Priority, AssignmentStatus } from '../../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Assignment | null;
  defaultStatus?: AssignmentStatus;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  initialTask,
  defaultStatus = 'todo',
}) => {
  const { courses, addAssignment, updateAssignment } = useAcademic();

  const [title, setTitle] = useState('');
  const [course, setCourse] = useState(courses[0]?.title || 'AP Chemistry');
  const [priority, setPriority] = useState<Priority>('high');
  const [status, setStatus] = useState<AssignmentStatus>(defaultStatus);
  const [dueDateTime, setDueDateTime] = useState('');
  const [estHours, setEstHours] = useState('1.5');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setCourse(initialTask.course);
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setDueDateTime(initialTask.due_date ? initialTask.due_date.slice(0, 16) : '');
      setEstHours(String(initialTask.est_hours || 1.5));
      setDescription(initialTask.description || '');
      setSubtasks(initialTask.subtasks || []);
      setAttachments(initialTask.attachments || []);
    } else {
      setTitle('');
      setCourse(courses[0]?.title || 'AP Chemistry');
      setPriority('high');
      setStatus(defaultStatus);
      // Default to tomorrow 4:00 PM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(16, 0, 0, 0);
      setDueDateTime(tomorrow.toISOString().slice(0, 16));
      setEstHours('1.5');
      setDescription('');
      setSubtasks([
        { id: 'st-1', title: 'Review rubric requirements', completed: false },
        { id: 'st-2', title: 'Complete first draft', completed: false },
      ]);
      setAttachments([]);
    }
  }, [initialTask, isOpen, courses, defaultStatus]);

  if (!isOpen) return null;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: 'st-' + Date.now(), title: newSubtaskText.trim(), completed: false },
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleAddAttachment = () => {
    const filename = prompt('Enter attachment file name (e.g. lab_notes.pdf, draft_essay.docx):', 'homework_file.pdf');
    if (filename && filename.trim()) {
      setAttachments([...attachments, filename.trim()]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedDueDate = dueDateTime ? new Date(dueDateTime).toISOString() : new Date().toISOString();

    if (initialTask) {
      await updateAssignment(initialTask.id, {
        title: title.trim(),
        course,
        priority,
        status,
        due_date: formattedDueDate,
        due_time_display: new Date(formattedDueDate).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        est_hours: parseFloat(estHours) || 1.5,
        description: description.trim(),
        subtasks,
        attachments,
      });
    } else {
      await addAssignment({
        title: title.trim(),
        course,
        priority,
        status,
        due_date: formattedDueDate,
        due_time_display: new Date(formattedDueDate).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        est_hours: parseFloat(estHours) || 1.5,
        completed: status === 'completed',
        subtasks,
        attachments,
        description: description.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 md:p-6 flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">
                {initialTask ? 'edit_note' : 'note_add'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                {initialTask ? 'Edit Homework Assignment' : 'Add Homework Assignment'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Set due dates, subtasks, priorities and curriculum notes.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Assignment Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">Assignment Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 6 Problem Set: Thermodynamics"
              className="w-full bg-surface-container-low text-on-surface text-sm px-3.5 py-2.5 rounded-lg outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary"
            />
          </div>

          {/* Course & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Course / Subject *</label>
              <div className="relative">
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full appearance-none bg-surface-container-low text-on-surface text-xs md:text-sm px-3.5 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all border border-transparent"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                  <option value="World History">World History</option>
                  <option value="General Study">General Study / Exam Prep</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Priority Urgency</label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full appearance-none bg-surface-container-low text-on-surface text-xs md:text-sm px-3.5 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all border border-transparent"
                >
                  <option value="urgent">Urgent (Within 24 Hours / Critical)</option>
                  <option value="high">High Priority (Exam Prep / Heavy)</option>
                  <option value="medium">Medium (Standard Due Date)</option>
                  <option value="low">Low (Practice / Optional)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Due Date & Estimated Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Due Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={dueDateTime}
                onChange={(e) => setDueDateTime(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface text-xs md:text-sm px-3.5 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Estimated Work Time (hrs)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="40"
                  value={estHours}
                  onChange={(e) => setEstHours(e.target.value)}
                  placeholder="e.g. 2.0"
                  className="w-full bg-surface-container-low text-on-surface text-xs md:text-sm px-3.5 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-semibold">
                  Hours
                </span>
              </div>
            </div>
          </div>

          {/* Workflow Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">Workflow Stage</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['todo', 'in_progress', 'under_review', 'completed'] as AssignmentStatus[]).map((s) => {
                const isCurrent = status === s;
                const labels: Record<AssignmentStatus, string> = {
                  todo: 'To Do',
                  in_progress: 'In Progress',
                  under_review: 'Under Review',
                  completed: 'Completed',
                };
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                      isCurrent
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-surface-container hover:bg-surface-container'
                    }`}
                  >
                    {labels[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks Builder */}
          <div className="flex flex-col gap-1.5 bg-surface-container-low/60 p-3 rounded-xl border border-surface-container">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">checklist</span>
                <span>Checklist & Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})</span>
              </label>
            </div>

            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center justify-between bg-surface-container-lowest p-2 rounded-lg gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st.id)}
                      className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                    />
                    <span className={`truncate ${st.completed ? 'line-through text-outline' : 'text-on-surface font-medium'}`}>
                      {st.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-on-surface-variant hover:text-error p-0.5 rounded"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="Add subtask step (e.g. Write abstract)..."
                className="flex-1 bg-surface-container-lowest text-on-surface text-xs px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-primary border border-surface-container"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface">Attachments & Reference Files</label>
              <button
                type="button"
                onClick={handleAddAttachment}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">attach_file</span>
                <span>+ Attach File</span>
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {attachments.map((att, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-surface-container text-on-surface text-xs px-2.5 py-1 rounded-lg border border-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-xs text-primary">description</span>
                    <span>{att}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                      className="text-on-surface-variant hover:text-error ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div
              onClick={handleAddAttachment}
              className="w-full border-2 border-dashed border-outline-variant/50 hover:border-primary/60 bg-surface-container-low/60 hover:bg-surface-container-low rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center"
            >
              <span className="material-symbols-outlined text-2xl text-primary">upload_file</span>
              <span className="text-xs font-semibold text-on-surface">
                Click to attach PDF, docx, code file, or syllabus rubric
              </span>
              <span className="text-[10px] text-on-surface-variant">
                Stored in Supabase Storage Bucket / Local Database
              </span>
            </div>
          </div>

          {/* Description & Teacher Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">Guidelines & Teacher Instructions</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add specific requirements, grading criteria, rubric hints, or team assignment guidelines..."
              className="w-full bg-surface-container-low text-on-surface text-xs md:text-sm p-3 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs md:text-sm px-4 py-2 rounded-lg font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-container text-on-primary text-xs md:text-sm px-5 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>{initialTask ? 'Save Changes' : 'Create Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
