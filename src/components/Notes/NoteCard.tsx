import React from 'react';
import { Lock, Unlock, Heart, Bookmark, Clock, MapPin, Footprints } from 'lucide-react';
import { WaypostNote, LocationCoordinates } from '../../types';
import { getCategoryInfo, formatTimeRemaining } from '../../lib/categoryMeta';
import { calculateDistanceMeters, formatDistance, UNLOCK_RADIUS_METERS } from '../../lib/location';
import { IndexedDbImage } from '../Common/IndexedDbImage';
import { useNotes } from '../../context/NotesContext';
import { useLocation } from '../../context/LocationContext';

interface NoteCardProps {
  note: WaypostNote;
  userLocation: LocationCoordinates;
  onClick?: () => void;
  showMoveHereButton?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  userLocation,
  onClick,
  showMoveHereButton = true,
}) => {
  const { toggleLike, toggleBookmark, hasUserLiked, isBookmarked } = useNotes();
  const { setCustomCoordinates, isSimulated } = useLocation();

  const distanceMeters = calculateDistanceMeters(
    userLocation.latitude,
    userLocation.longitude,
    note.latitude,
    note.longitude
  );

  const isUnlocked = distanceMeters <= UNLOCK_RADIUS_METERS;
  const categoryInfo = getCategoryInfo(note.category);
  const timeInfo = formatTimeRemaining(note.expiresAt);
  const liked = hasUserLiked(note.id);
  const bookmarked = isBookmarked(note.id);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(note.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(note.id);
  };

  const handleMoveHere = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Move user simulated position to within 30m of this note
    setCustomCoordinates(
      {
        latitude: note.latitude + 0.0001,
        longitude: note.longitude + 0.0001,
      },
      `Near ${note.title || note.category} (Demo)`
    );
  };

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isUnlocked
          ? 'border-[#DED8C7] hover:border-forest/40 shadow-card hover:shadow-elevated'
          : 'border-[#E0DAD0] bg-[#FAF8F4]/80 hover:border-stone/40'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="p-4 pb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Category Chip */}
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: categoryInfo.bgLight, color: categoryInfo.textColor }}
          >
            <span>{categoryInfo.icon}</span>
            <span>{categoryInfo.name}</span>
          </span>

          {/* Time Remaining */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              timeInfo.isUrgent
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'text-secondaryText bg-[#F4F0E5]'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{timeInfo.text}</span>
          </span>
        </div>

        {/* Distance & Lock State */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isUnlocked
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            {isUnlocked ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-700" />
                <span>{formatDistance(distanceMeters)}</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-stone-600" />
                <span>{formatDistance(distanceMeters)}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="px-4 py-2">
        {note.title && (
          <h4 className="font-semibold text-primaryText text-base mb-1 font-display leading-snug">
            {note.title}
          </h4>
        )}

        {isUnlocked ? (
          /* Unlocked Note Content */
          <>
            <p className="text-sm text-[#2C322B] leading-relaxed line-clamp-3 font-editorial text-base/relaxed">
              “{note.text}”
            </p>

            {/* Thumbnail Preview if photos attached */}
            {note.imageIds && note.imageIds.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl h-36 w-full border border-[#E8E3D5] relative group-hover:opacity-95">
                <IndexedDbImage
                  imageId={note.imageIds[0]}
                  alt={note.title || 'Waypost photo'}
                  className="w-full h-full"
                />
                {note.imageIds.length > 1 && (
                  <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    +{note.imageIds.length - 1} more
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          /* Locked State Preview */
          <div className="p-3.5 my-1 rounded-xl bg-[#F0EBE0] border border-[#DDD6C5] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
              <Lock className="w-3.5 h-3.5 text-stone-700 shrink-0" />
              <span>Locked Note — Proximity Restricted</span>
            </div>
            <p className="text-xs text-secondaryText leading-relaxed">
              This note is sealed until you are within 150m. You are currently{' '}
              <strong>{distanceMeters}m away</strong> ({distanceMeters - UNLOCK_RADIUS_METERS}m to walk).
            </p>
            {isSimulated && showMoveHereButton && (
              <button
                onClick={handleMoveHere}
                className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-forest bg-white/90 hover:bg-white py-1.5 px-3 rounded-xl border border-[#DED8C7] transition-all shadow-xs"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Simulate Walking Here to Unlock</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Details */}
      <div className="p-4 pt-2 flex items-center justify-between text-xs text-secondaryText border-t border-[#F0EBE0]/80 mt-1">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#E5EBE3] flex items-center justify-center text-xs">
            {note.authorAvatar || '🌿'}
          </span>
          <span className="truncate max-w-[120px] font-medium">{note.authorName}</span>
          {note.locationName && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone">
              • <MapPin className="w-3 h-3" /> {note.locationName}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              liked
                ? 'text-rose-600 font-semibold'
                : 'text-secondaryText hover:text-primaryText hover:bg-[#F4F0E5]'
            }`}
            title="Like note"
            aria-label="Like note"
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-600' : ''}`} />
            <span>{note.likeCount}</span>
          </button>

          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded-lg transition-colors ${
              bookmarked
                ? 'text-forest font-semibold bg-forest/10'
                : 'text-secondaryText hover:text-forest hover:bg-[#F4F0E5]'
            }`}
            title={bookmarked ? 'Saved note' : 'Save note'}
            aria-label="Bookmark note"
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-forest' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
