import React, { useState } from 'react';
import {
  Search,
  Crosshair,
  MapPin,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
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

export const ExplorePage: React.FC = () => {
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
  const [activePreviewNote, setActivePreviewNote] = useState<WaypostNote | null>(null);

  const handleSelectNoteFromMap = (note: WaypostNote) => {
    setActivePreviewNote(note);
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-semibold shrink-0 transition-colors"
            title="Use my current location"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              GPS
            </span>
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
          notes={notes}
          selectedNote={activePreviewNote}
          onSelectNote={handleSelectNoteFromMap}
          recenterToken={recenterToken}
        />

        {/* Floating Return to My Location Button */}
        <button
          onClick={locateMe}
          className="absolute bottom-20 md:bottom-6 right-4 z-20 w-11 h-11 rounded-2xl bg-[#FAF8F3] hover:bg-white text-forest shadow-card border border-[#DED8C7] flex items-center justify-center transition-transform active:scale-95"
          title="Return to real location"
          aria-label="Locate me"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Side Panel (Notes Explorer) */}
      <aside className="hidden md:flex flex-col w-[420px] bg-[#FAF8F3] border-l border-[#DED8C7] z-10 shadow-elevated">
        <div className="p-4 border-b border-[#E8E3D5] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-forest font-display">Nearby Wayposts</h3>
            <p className="text-xs text-secondaryText">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'} in current view
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
          {notes.length === 0 ? (
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
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                userLocation={coordinates}
                onClick={() => {
                  setActivePreviewNote(note);
                  openNoteDetail(note);
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
              onClick={() => openNoteDetail(activePreviewNote)}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet for Notes List */}
      <div
        className={`md:hidden absolute left-0 right-0 z-30 bg-[#FAF8F3] border-t border-[#DED8C7] rounded-t-3xl shadow-sheet transition-all duration-300 flex flex-col ${
          isMobileSheetExpanded
            ? 'top-20 bottom-14'
            : activePreviewNote
            ? 'hidden'
            : 'bottom-14 h-48'
        }`}
      >
        {/* Drag Handle / Bar */}
        <div
          onClick={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
          className="p-3 pb-2 flex flex-col items-center justify-center cursor-pointer border-b border-[#E8E3D5]/80 shrink-0 select-none"
        >
          <div className="w-10 h-1 rounded-full bg-[#C8D3C5] mb-2" />
          <div className="flex items-center justify-between w-full px-4">
            <span className="font-bold text-xs text-forest font-display">
              Nearby Notes ({notes.length})
            </span>
            <div className="flex items-center gap-1 text-xs text-secondaryText">
              <span>{isMobileSheetExpanded ? 'Collapse' : 'Expand list'}</span>
              {isMobileSheetExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
        </div>

        {/* Scrollable list of cards */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-6 text-xs text-secondaryText">
              No notes found in this area.
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                userLocation={coordinates}
                onClick={() => {
                  setActivePreviewNote(note);
                  openNoteDetail(note);
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
    </div>
  );
};
