import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Heart,
  Bookmark,
  Clock,
  MapPin,
  Calendar,
  Flag,
  Trash2,
  Edit2,
  Footprints,
  Share2,
} from 'lucide-react';
import { WaypostNote, LocationCoordinates } from '../../types';
import { getCategoryInfo, formatTimeRemaining } from '../../lib/categoryMeta';
import { calculateDistanceMeters, formatDistance, UNLOCK_RADIUS_METERS } from '../../lib/location';
import { IndexedDbImage } from '../Common/IndexedDbImage';
import { useNotes } from '../../context/NotesContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { ReportModal } from './ReportModal';

interface NoteDetailModalProps {
  note: WaypostNote | null;
  isOpen: boolean;
  onClose: () => void;
  userLocation: LocationCoordinates | null;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  isOpen,
  onClose,
  userLocation,
}) => {
  const { toggleLike, toggleBookmark, hasUserLiked, isBookmarked, deleteNote, updateNote } = useNotes();
  const { user } = useAuth();
  const { setCustomCoordinates, isSimulated } = useLocation();

  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editText, setEditText] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  if (!isOpen || !note) return null;

  const distanceMeters = userLocation ? calculateDistanceMeters(
    userLocation.latitude,
    userLocation.longitude,
    note.latitude,
    note.longitude
  ) : Number.POSITIVE_INFINITY;

  const isUnlocked = distanceMeters <= UNLOCK_RADIUS_METERS;
  const distanceLabel = userLocation ? formatDistance(distanceMeters) : 'GPS needed';
  const categoryInfo = getCategoryInfo(note.category);
  const timeInfo = formatTimeRemaining(note.expiresAt);
  const liked = hasUserLiked(note.id);
  const bookmarked = isBookmarked(note.id);
  const isAuthor = user && user.id === note.authorId;

  const handleStartEdit = () => {
    setEditTitle(note.title || '');
    setEditText(note.text);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    updateNote(note.id, {
      title: editTitle.trim() || undefined,
      text: editText.trim(),
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteNote(note.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleSimulateWalk = () => {
    setCustomCoordinates(
      {
        latitude: note.latitude + 0.0001,
        longitude: note.longitude + 0.0001,
      },
      `At ${note.locationName || 'Waypost Marker'} (Demo)`
    );
  };

  const handleShare = () => {
    const textToCopy = `Waypost note: "${note.title || note.category}" - ${note.locationName || ''}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div
          className="w-full md:max-w-xl bg-[#FAF8F3] rounded-t-3xl md:rounded-3xl shadow-elevated border border-[#DED8C7] overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar with Dismiss */}
          <div className="p-4 md:p-5 pb-3 flex items-center justify-between border-b border-[#E8E3D5] shrink-0">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: categoryInfo.bgLight, color: categoryInfo.textColor }}
              >
                <span>{categoryInfo.icon}</span>
                <span>{categoryInfo.name}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  isUnlocked
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Unlocked ({distanceLabel})</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-stone-600" />
                    <span>Locked ({distanceLabel})</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-forest/10 text-secondaryText transition-colors"
                title="Share preview"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-forest/10 text-secondaryText transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toast */}
          {copiedToast && (
            <div className="bg-forest text-[#FAF8F3] text-xs text-center py-1.5 font-medium">
              Note summary copied to clipboard!
            </div>
          )}

          {/* Modal Scrollable Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            {isUnlocked ? (
              /* UNLOCKED VIEW */
              <>
                {/* Image Gallery */}
                {note.imageIds && note.imageIds.length > 0 && (
                  <div className="space-y-2">
                    <div className="w-full h-64 rounded-2xl overflow-hidden border border-[#E8E3D5] relative bg-black/5">
                      <IndexedDbImage
                        imageId={note.imageIds[activeImageIndex] || note.imageIds[0]}
                        alt="Waypost photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {note.imageIds.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {note.imageIds.map((imgId, idx) => (
                          <button
                            key={imgId}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                              activeImageIndex === idx ? 'border-forest scale-105' : 'border-transparent opacity-70'
                            }`}
                          >
                            <IndexedDbImage imageId={imgId} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Title and Text */}
                {isEditing ? (
                  <div className="space-y-3 p-3 bg-white rounded-2xl border border-[#DED8C7]">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1">
                        Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full text-sm p-2 rounded-xl border border-[#DED8C7] bg-[#FAF8F3]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1">
                        Note Text (Max 220 characters)
                      </label>
                      <textarea
                        value={editText}
                        maxLength={220}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full text-sm p-2 rounded-xl border border-[#DED8C7] bg-[#FAF8F3]"
                      />
                      <span className="text-[11px] text-secondaryText">{editText.length}/220</span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-xl text-xs text-secondaryText hover:bg-forest/5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-forest text-[#FAF8F3]"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {note.title && (
                      <h2 className="text-xl font-bold text-forest mb-2 font-display">
                        {note.title}
                      </h2>
                    )}
                    <div className="p-4 rounded-2xl bg-white border border-[#DED8C7] shadow-sm">
                      <p className="text-base text-primaryText font-editorial leading-relaxed whitespace-pre-wrap">
                        “{note.text}”
                      </p>
                    </div>
                  </div>
                )}

                {/* Author & Journey Info */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F4F0E5] border border-[#E8E3D5] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-forest/10 flex items-center justify-center text-sm">
                      {note.authorAvatar || '🌿'}
                    </span>
                    <div>
                      <span className="text-[10px] uppercase text-secondaryText block">Author</span>
                      <span className="font-semibold text-primaryText">{note.authorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-forest shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] uppercase text-secondaryText block">Location</span>
                      <span className="font-semibold text-primaryText truncate block">
                        {note.locationName || `${note.latitude.toFixed(4)}, ${note.longitude.toFixed(4)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-forest shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase text-secondaryText block">Placed</span>
                      <span className="text-primaryText">
                        {new Date(note.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-forest shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase text-secondaryText block">Vanishes in</span>
                      <span className={`font-semibold ${timeInfo.isUrgent ? 'text-amber-800' : 'text-primaryText'}`}>
                        {timeInfo.text}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* LOCKED VIEW */
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-[#EFECE1] border border-[#DED8C7] text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-stone-200 text-stone-700 mx-auto flex items-center justify-center shadow-inner">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primaryText font-display">
                      Waypost Locked by Distance
                    </h3>
                    <p className="text-xs text-secondaryText max-w-sm mx-auto mt-1 leading-relaxed">
                      This note was tucked away for travelers nearby. You need to be within <strong>150m</strong> to read its full contents and view photos.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#DED8C7] text-xs font-semibold text-forest shadow-xs">
                    <span>You are {distanceMeters}m away</span>
                    <span className="text-secondaryText">•</span>
                    <span>{distanceMeters - UNLOCK_RADIUS_METERS}m closer needed</span>
                  </div>

                  {/* Teaser info */}
                  {note.title && (
                    <div className="p-3 bg-white/70 rounded-xl border border-[#DED8C7]/60 text-xs text-secondaryText italic">
                      Title teaser: "{note.title}"
                    </div>
                  )}

                  {isSimulated && (
                    <div className="pt-2">
                      <button
                        onClick={handleSimulateWalk}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-forest text-[#FAF8F3] font-semibold text-xs shadow-sm hover:bg-forest-hover transition-all"
                      >
                        <Footprints className="w-4 h-4" />
                        <span>Simulate Walking Within 150m to Unlock</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white rounded-2xl border border-[#DED8C7] text-xs text-secondaryText flex items-center justify-between">
                  <span>Category: <strong>{note.category}</strong></span>
                  <span>Expires in: <strong>{timeInfo.text}</strong></span>
                </div>
              </div>
            )}

            {/* Author Actions: Edit / Delete */}
            {isAuthor && isUnlocked && !isEditing && (
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#DED8C7]">
                <span className="text-xs font-semibold text-forest">You created this Waypost</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#F4F0E5] hover:bg-forest/10 text-forest"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}

            {/* Delete Confirmation Box */}
            {showDeleteConfirm && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                <p className="font-semibold text-rose-900">Permanently delete this note?</p>
                <p className="text-rose-700">
                  This action will remove the note from local storage and erase attached photos from IndexedDB.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-white text-secondaryText hover:text-primaryText"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-xl bg-rose-700 text-white font-semibold"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Modal Footer Actions */}
          <div className="p-4 bg-[#F4F0E5] border-t border-[#E8E3D5] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleLike(note.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  liked
                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
                    : 'bg-white text-primaryText hover:bg-white/80 border-[#DED8C7]'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-rose-600' : ''}`} />
                <span>{note.likeCount} Likes</span>
              </button>

              <button
                onClick={() => toggleBookmark(note.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  bookmarked
                    ? 'bg-forest text-[#FAF8F3] border-forest shadow-sm'
                    : 'bg-white text-primaryText hover:bg-white/80 border-[#DED8C7]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-forest' : ''}`} />
                <span>{bookmarked ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-secondaryText hover:text-rose-700 hover:bg-rose-50 transition-colors"
              title="Report this note"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <ReportModal
        noteId={note.id}
        noteTitle={note.title || note.category}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
};
