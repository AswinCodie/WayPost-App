import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CategoryFilter, WaypostNote } from '../types';
import { CreateNoteInput, NotesService } from '../services/notesService';
import { BookmarksService } from '../services/bookmarksService';
import { ReactionsService } from '../services/reactionsService';
import { localDB } from '../lib/database';
import { useAuth } from './AuthContext';
interface NotesContextType { notes: WaypostNote[]; allNotesCount: number; activeFilter: CategoryFilter; searchQuery: string; selectedNote: WaypostNote | null; isDetailOpen: boolean; isLoading: boolean; setActiveFilter: (f: CategoryFilter) => void; setSearchQuery: (q: string) => void; openNoteDetail: (n: WaypostNote) => void; closeNoteDetail: () => void; createNote: (i: CreateNoteInput) => Promise<WaypostNote>; deleteNote: (id: string) => Promise<boolean>; updateNote: (id: string, u: Partial<WaypostNote>) => Promise<WaypostNote | null>; toggleLike: (id: string) => Promise<{isLiked:boolean;count:number}>; toggleBookmark: (id:string) => Promise<boolean>; hasUserLiked:(id:string)=>boolean; isBookmarked:(id:string)=>boolean; refreshNotes:()=>Promise<void>; resetDemoData:()=>Promise<void>; }
const NotesContext = createContext<NotesContextType | undefined>(undefined);
export const NotesProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
 const {user}=useAuth(); const [activeFilter,setActiveFilter]=useState<CategoryFilter>('All'); const [searchQuery,setSearchQuery]=useState(''); const [selectedNote,setSelectedNote]=useState<WaypostNote|null>(null); const [isDetailOpen,setIsDetailOpen]=useState(false); const [isLoading,setIsLoading]=useState(true); const [notes,setNotes]=useState<WaypostNote[]>([]); const [allNotesCount,setAllNotesCount]=useState(0);
 const loadNotes=useCallback(async()=>{await localDB.initialize(); const list=NotesService.getActiveNotes({category:activeFilter,searchQuery,includeExpiredForAuthorId:user?.id}); setNotes(list); setAllNotesCount(localDB.getAllStoredNotes().filter(n=>!n.isDemo).length);},[activeFilter,searchQuery,user?.id]);
 useEffect(()=>{loadNotes().finally(()=>setIsLoading(false));},[loadNotes]);
 const userId=user?.id || '';
 const createNote=useCallback(async(i:CreateNoteInput)=>{const note=NotesService.createNote(i);await loadNotes();return note;},[loadNotes]);
 const deleteNote=useCallback(async(id:string)=>{const ok=await NotesService.deleteNote(id);if(ok){if(selectedNote?.id===id)setIsDetailOpen(false);await loadNotes();}return ok;},[loadNotes,selectedNote?.id]);
 const updateNote=useCallback(async(id:string,u:Partial<WaypostNote>)=>{const note=NotesService.updateNote(id,u);if(note&&selectedNote?.id===id)setSelectedNote(note);await loadNotes();return note;},[loadNotes,selectedNote?.id]);
 const toggleLike=useCallback(async(id:string)=>{const r=ReactionsService.toggleLike(id,userId);await loadNotes();return r;},[loadNotes,userId]);
 const toggleBookmark=useCallback(async(id:string)=>{const r=BookmarksService.toggleBookmark(id,userId);await loadNotes();return r;},[loadNotes,userId]);
 return <NotesContext.Provider value={{notes,allNotesCount,activeFilter,searchQuery,selectedNote,isDetailOpen,isLoading,setActiveFilter,setSearchQuery,openNoteDetail:(n)=>{setSelectedNote(n);setIsDetailOpen(true);},closeNoteDetail:()=>setIsDetailOpen(false),createNote,deleteNote,updateNote,toggleLike,toggleBookmark,hasUserLiked:(id)=>ReactionsService.hasUserLiked(id,userId),isBookmarked:(id)=>BookmarksService.isBookmarked(id,userId),refreshNotes:loadNotes,resetDemoData:async()=>{}}}>{children}</NotesContext.Provider>;
};
export const useNotes=()=>{const c=useContext(NotesContext);if(!c)throw new Error('useNotes must be used within NotesProvider');return c;};
