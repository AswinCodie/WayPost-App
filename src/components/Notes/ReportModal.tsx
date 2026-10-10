import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { ReportReason } from '../../types';
import { localDB } from '../../lib/database';
import { useAuth } from '../../context/AuthContext';

interface ReportModalProps {
  noteId: string;
  noteTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS: ReportReason[] = [
  'Spam',
  'Harassment',
  'Inappropriate content',
  'Misleading location',
  'Privacy concern',
  'Other',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  noteId,
  noteTitle,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason>('Spam');
  const [comment, setComment] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localDB.submitReport({
      noteId,
      userId: user?.id,
      reason: selectedReason,
      comment: comment.trim() || undefined,
    });
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#FAF8F3] rounded-3xl shadow-elevated border border-[#DED8C7] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 pb-3 flex items-center justify-between border-b border-[#E8E3D5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-forest font-display">Report Waypost</h3>
              <p className="text-xs text-secondaryText truncate max-w-[240px]">
                {noteTitle || 'Selected Note'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-forest/10 text-secondaryText transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-forest text-base font-display">Report Saved Locally</h4>
            <p className="text-xs text-secondaryText max-w-xs leading-relaxed">
              This prototype records reports in local application storage for previewing local moderation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <span>
                <strong>Device-only action:</strong> Waypost is a browser-stored prototype. Reports are saved locally and are inspectable under Dev Settings.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-2">
                Reason for report
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`p-2.5 rounded-xl text-xs text-left font-medium border transition-all ${
                      selectedReason === r
                        ? 'bg-forest text-[#FAF8F3] border-forest shadow-sm'
                        : 'bg-white hover:bg-forest/5 text-primaryText border-[#DED8C7]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Help us understand the issue..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-[#DED8C7] bg-white focus:outline-none focus:ring-2 focus:ring-forest/20 text-primaryText"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E3D5]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-secondaryText hover:text-primaryText"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-forest text-[#FAF8F3] hover:bg-forest-hover shadow-sm transition-colors"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
