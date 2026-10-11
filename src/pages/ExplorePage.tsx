import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Crosshair,
  PlusCircle,
  MapPin,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  EyeOff,
  Sparkles,
  Layers,
  Info,
} from 'lucide-react';
import { WaypostMap } from '../components/Map/WaypostMap';
import { CategoryBar } from '../components/Common/CategoryBar';
import { NoteCard } from '../components/Notes/NoteCard';
import { NoteDetailModal } from '../components/Notes/NoteDetailModal';
import { useLocation } from '../context/LocationContext';
import { useNotes } from '../context/NotesContext';
import { WaypostNote } from '../types';
import { calculateDistanceMeters, isWithinUnlockRadius } from '../lib/location';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { coordinates, locateMe, recenterToken, permissionStatus, errorMessage } = useLocation();
  const {
    notes,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    selectedNote,
    openNoteDetail,
    closeNoteDetail,
    isDetailOpen,
  } = useNotes();

  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState<boolean>(false);
  const [isMobileSheetHidden, setIsMobileSheetHidden] = useState<boolean>(false);
  const [activePreviewNote, setActivePreviewNote] = useState<WaypostNote | null>(null);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  const snackbarTimerRef = useRef<number | null>(null);
  const sheetTouchStartRef = useRef<number | null>(null);
  const nearbyNotes = useMemo(() => {
    if (!coordinates) return notes;
    return [...notes].sort((a, b) =>
      calculateDistanceMeters(coordinates.latitude, coordinates.longitude, a.latitude, a.longitude) -
      calculateDistanceMeters(coordinates.latitude, coordinates.longitude, b.latitude, b.longitude)
    );
  }, [coordinates, notes]);

  useEffect(() => {
    const showNearbySheet = () => {
      setIsMobileSheetHidden(false);
      setIsMobileSheetExpanded(false);
    };
    window.addEventListener('waypost:show-nearby-sheet', showNearbySheet);
    return () => window.removeEventListener('waypost:show-nearby-sheet', showNearbySheet);
  }, []);

  const openNoteIfNearby = (note: WaypostNote) => {
    const canOpen = coordinates && isWithinUnlockRadius(coordinates, {
      latitude: note.latitude,
      longitude: note.longitude,
    });
    if (canOpen) {
      setActivePreviewNote(note);
      openNoteDetail(note);
      return;
    }
    setUnlockMessage('Visit this place to unlock the Waypost.');
    if (snackbarTimerRef.current !== null) window.clearTimeout(snackbarTimerRef.current);
    snackbarTimerRef.current = window.setTimeout(() => setUnlockMessage(null), 3000);
  };

  const handleSelectNoteFromMap = (note: WaypostNote) => {
    openNoteIfNearby(note);
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] md:h-[calc(100vh-68px)] flex flex-col md:flex-row overflow-hidden">
      {/* Top Floating Control Bar (Search, Category Pills, Demo Switcher) */}
      <div className="absolute top-3 left-3 right-3 md:left-6 md:right-auto md:w-[440px] z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Search & Location Pill */}
        <div className="flex items-center gap-2 bg-[#FAF8F3]/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#DED8C7] shadow-card">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-secondaryText absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notes, wisdom, places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-transparent text-primaryText focus:outline-none placeholder:text-secondaryText font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-secondaryText hover:text-primaryText px-2"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={locateMe}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-forest hover:bg-forest-hover text-[#FAF8F3] text-xs font-bold shadow-sm shrink-0 transition-colors active:scale-95"
            title="Use my current location"
          >
            <Crosshair className="w-4 h-4" />
            <span>Locate</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="bg-[#FAF8F3]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#DED8C7] shadow-card">
          <CategoryBar activeFilter={activeFilter} onSelectFilter={setActiveFilter} />
        </div>
      </div>

      {/* GPS status */}
      <div className="hidden md:flex absolute bottom-4 left-6 z-20 items-center gap-2 bg-[#FAF8F3]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#DED8C7] shadow-card text-xs text-secondaryText">
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        <span>
          {permissionStatus === 'granted' ? <>Real GPS position active</> : <>{errorMessage || 'Enable GPS to see your current position.'}</>}
        </span>
        <button
          onClick={locateMe}
          className="text-forest font-semibold underline ml-1 hover:text-forest-hover"
        >
          {permissionStatus === 'denied' ? 'Try again' : 'Locate me'}
        </button>
      </div>

      {/* Map Area */}
      <div className="w-full h-full relative">
        <WaypostMap
          userLocation={coordinates}
          isSimulated={false}
          notes={nearbyNotes}
          selectedNote={activePreviewNote}
          onSelectNote={handleSelectNoteFromMap}
          recenterToken={recenterToken}
        />

        {/* Floating Return to My Location Button */}
        <button
          onClick={locateMe}
          className="hidden md:flex absolute bottom-3 right-[4.25rem] z-40 w-12 h-12 rounded-2xl bg-forest hover:bg-forest-hover text-[#FAF8F3] shadow-elevated border border-[#0f2b21] items-center justify-center transition-transform active:scale-95"
          title="Return to real location"
          aria-label="Locate me"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/add')}
          className="md:hidden absolute top-[8.5rem] right-3 z-20 w-12 h-12 rounded-2xl bg-forest hover:bg-forest-hover text-[#FAF8F3] shadow-elevated border border-[#0f2b21] flex items-center justify-center transition-transform active:scale-95"
          title="Leave a note"
          aria-label="Leave a note"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => navigate('/add')}
          className="hidden md:flex absolute bottom-3 right-[8.5rem] z-20 items-center gap-2 px-4 py-3 rounded-2xl bg-forest hover:bg-forest-hover text-[#FAF8F3] text-sm font-bold shadow-card transition-transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4 text-sage" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Desktop Side Panel (Notes Explorer) */}
      <aside className="hidden md:flex flex-col w-[420px] bg-[#FAF8F3] border-l border-[#DED8C7] z-10 shadow-elevated">
        <div className="p-4 border-b border-[#E8E3D5] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-forest font-display">Nearby Wayposts</h3>
            <p className="text-xs text-secondaryText">
              {nearbyNotes.length} {nearbyNotes.length === 1 ? 'note' : 'notes'} in current view
            </p>
          </div>
          <button
            onClick={locateMe}
            className="text-xs font-semibold text-forest bg-forest/5 hover:bg-forest/10 px-3 py-1.5 rounded-xl border border-forest/10 transition-colors"
          >
            Locate me
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {nearbyNotes.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-forest" />
              </div>
              <h4 className="font-bold text-forest text-sm font-display">No notes found here</h4>
              <p className="text-xs text-secondaryText max-w-xs mx-auto leading-relaxed">
                {searchQuery
                  ? `No wayposts match "${searchQuery}". Try a different keyword or category.`
                  : 'Be the first traveler to leave a note here.'}
              </p>
            </div>
          ) : (
            nearbyNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                userLocation={coordinates}
                onClick={() => {
                  setActivePreviewNote(note);
                  openNoteIfNearby(note);
                }}
              />
            ))
          )}
        </div>
      </aside>

      {/* Mobile Floating Preview Card if a marker was clicked */}
      {activePreviewNote && !isMobileSheetExpanded && (
        <div className="md:hidden absolute bottom-16 left-3 right-3 z-30 animate-slide-up">
          <div className="relative">
            <button
              onClick={() => setActivePreviewNote(null)}
              className="absolute -top-3 -right-2 z-40 bg-white border border-[#DED8C7] rounded-full p-1 shadow-md text-secondaryText"
              aria-label="Dismiss preview"
            >
              ✕
            </button>
            <NoteCard
              note={activePreviewNote}
              userLocation={coordinates}
              onClick={() => openNoteIfNearby(activePreviewNote)}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet for Notes List */}
      <div
        className={`md:hidden absolute left-0 right-0 z-30 bg-[#FAF8F3] border-t border-[#DED8C7] rounded-t-3xl shadow-sheet transition-all duration-300 flex flex-col overscroll-contain ${
          isMobileSheetExpanded
            ? 'top-20 bottom-[4.5rem]'
            : isMobileSheetHidden
            ? 'hidden'
            : activePreviewNote
            ? 'hidden'
            : 'bottom-[4.5rem] h-48'
        }`}
      >
        {/* Drag Handle / Bar */}
        <div
          onClick={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
          onTouchStart={(event) => { sheetTouchStartRef.current = event.touches[0]?.clientY ?? null; }}
          onTouchEnd={(event) => {
            const start = sheetTouchStartRef.current;
            const end = event.changedTouches[0]?.clientY;
            sheetTouchStartRef.current = null;
            if (start !== null && end !== undefined && Math.abs(end - start) > 24) {
              setIsMobileSheetExpanded(end < start);
            }
          }}
          className="p-3 pb-2 flex flex-col items-center justify-center cursor-pointer border-b border-[#E8E3D5]/80 shrink-0 select-none touch-none"
        >
          <div className="w-10 h-1 rounded-full bg-[#C8D3C5] mb-2" />
          <div className="flex items-center justify-between w-full px-4">
            <span className="font-bold text-xs text-forest font-display">
              Nearby Notes ({nearbyNotes.length})
            </span>
            <div className="flex items-center gap-3 text-xs text-secondaryText">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsMobileSheetHidden(true);
                  setIsMobileSheetExpanded(false);
                }}
                className="flex items-center gap-1 text-secondaryText hover:text-forest"
                aria-label="Hide nearby notes"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide</span>
              </button>
              <div className="flex items-center gap-1">
                <span>{isMobileSheetExpanded ? 'Collapse' : 'Expand list'}</span>
                {isMobileSheetExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable list of cards */}
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar p-3.5 space-y-3">
          {nearbyNotes.length === 0 ? (
            <div className="text-center py-6 text-xs text-secondaryText">
              No notes found in this area.
            </div>
          ) : (
            nearbyNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                userLocation={coordinates}
                onClick={() => {
                  setActivePreviewNote(note);
                  openNoteIfNearby(note);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Note Detail Modal */}
      <NoteDetailModal
        note={selectedNote || activePreviewNote}
        isOpen={isDetailOpen}
        onClose={closeNoteDetail}
        userLocation={coordinates}
      />

      {unlockMessage && (
        <div className="fixed left-1/2 bottom-24 md:bottom-6 z-[70] -translate-x-1/2 rounded-xl bg-[#18392D] px-4 py-3 text-xs font-semibold text-[#FAF8F3] shadow-elevated animate-slide-up">
          {unlockMessage}
        </div>
      )}
    </div>
  );
};
