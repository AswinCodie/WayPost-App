import React, { useState, useEffect } from 'react';
import { Bookmark, Sparkles, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useNotes } from '../context/NotesContext';
import { NoteCard } from '../components/Notes/NoteCard';
import { NoteDetailModal } from '../components/Notes/NoteDetailModal';
import { WaypostNote } from '../types';

export const SavedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coordinates } = useLocation();
  const { isDetailOpen, selectedNote, openNoteDetail, closeNoteDetail, notes, isBookmarked } = useNotes();

  const [savedNotes, setSavedNotes] = useState<WaypostNote[]>([]);

  const loadSaved = () => {
    setSavedNotes(notes.filter((note) => isBookmarked(note.id)));
  };

  useEffect(() => {
    loadSaved();
  }, [user?.id, isDetailOpen, notes, isBookmarked]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-forest text-sage flex items-center justify-center font-bold">
              <Bookmark className="w-4 h-4 fill-sage text-sage" />
            </span>
            <h1 className="text-2xl font-bold text-forest font-display">Saved Wayposts</h1>
          </div>
          <p className="text-xs text-secondaryText italic font-editorial mt-1">
            Little treasures kept in your travel journal.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-white rounded-full border border-[#DED8C7] text-forest shadow-xs">
          {savedNotes.length} saved
        </span>
      </div>

      {/* Bookmarked Notes List or Empty State */}
      {savedNotes.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-3xl bg-white border border-[#DED8C7] shadow-card space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#F4F0E5] text-forest mx-auto flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-stone" />
          </div>
          <div>
            <h3 className="font-bold text-base text-forest font-display">No saved wayposts yet</h3>
            <p className="text-xs text-secondaryText max-w-sm mx-auto mt-1 leading-relaxed">
              When exploring trails and parks, tap the bookmark icon on any note to save it here for later reflection.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-forest hover:bg-forest-hover text-[#FAF8F3] text-xs font-bold transition-all shadow-sm"
          >
            <Compass className="w-4 h-4 text-sage" />
            <span>Explore the Map</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {savedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              userLocation={coordinates}
              onClick={() => openNoteDetail(note)}
            />
          ))}
        </div>
      )}

      {/* Note Detail Modal */}
      <NoteDetailModal
        note={selectedNote}
        isOpen={isDetailOpen}
        onClose={() => {
          closeNoteDetail();
          loadSaved();
        }}
        userLocation={coordinates}
      />
    </div>
  );
};
