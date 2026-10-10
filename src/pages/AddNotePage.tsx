import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  X,
  MapPin,
  Clock,
  Compass,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { Category, ExpiryDuration, LocationCoordinates } from '../types';
import { ALL_CATEGORIES, getCategoryInfo } from '../lib/categoryMeta';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { imageStorage } from '../lib/imageStorage';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { supabaseData } from '../lib/supabaseData';
import { WaypostMap } from '../components/Map/WaypostMap';

const EXPIRY_OPTIONS: { value: ExpiryDuration; label: string; desc: string }[] = [
  { value: '24h', label: '24 Hours', desc: 'Fleeting whisper for today' },
  { value: '3d', label: '3 Days', desc: 'Weekend trail note' },
  { value: '7d', label: '7 Days', desc: 'A week on the path' },
];

export const AddNotePage: React.FC = () => {
  const navigate = useNavigate();
  const { coordinates: userCurrentCoords, isSimulated } = useLocation();
  const { user } = useAuth();
  const { createNote, openNoteDetail } = useNotes();

  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [category, setCategory] = useState<Category>('Stories');
  const [expiryDuration, setExpiryDuration] = useState<ExpiryDuration>('3d');
  const [locationName, setLocationName] = useState<string>('');

  // Location picking mode
  const [isPickingOnMap, setIsPickingOnMap] = useState<boolean>(false);
  const [selectedCoords, setSelectedCoords] = useState<LocationCoordinates>(userCurrentCoords);

  // Images state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate size (max 5MB each)
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`"${file.name}" exceeds 5MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Create preview URLs
    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setImagePreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    // Revoke object URL
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedText = text.trim();
    if (!trimmedText) {
      setErrorMsg('Please write a note before leaving it on the trail.');
      return;
    }

    if (trimmedText.length > 220) {
      setErrorMsg('Notes must be within 220 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Sync photos with Supabase Storage when the backend is configured.
      // The browser-only image store remains the offline/demo fallback.
      const imageIds = isSupabaseConfigured
        ? await supabaseData.uploadImages(selectedFiles, user?.id || '')
        : await Promise.all(selectedFiles.map((file) => imageStorage.saveImage(file, file.name)));

      // 2. Create Note Record
      const newNote = await createNote({
        title: title.trim() || undefined,
        text: trimmedText,
        category,
        latitude: selectedCoords.latitude,
        longitude: selectedCoords.longitude,
        locationName: locationName.trim() || undefined,
        expiryDuration,
        imageIds,
        authorId: user?.id || 'guest_wanderer',
        authorName: user?.displayName || 'Wanderer',
        authorAvatar: user?.avatarPreset || '🌿',
      });

      // Cleanup previews
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));

      setSuccessMsg('Your Waypost has been placed on the path!');
      setTimeout(() => {
        openNoteDetail(newNote);
        navigate('/');
      }, 1000);
    } catch (err: unknown) {
      console.error('Note creation error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save note.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-forest text-sage flex items-center justify-center font-bold">
            ✍️
          </span>
          <h1 className="text-2xl font-bold text-forest font-display">Leave a Waypost</h1>
        </div>
        <p className="text-xs text-secondaryText italic font-editorial mt-1">
          Drop a tiny thought, story, or secret for another traveler passing by.
        </p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Note Text Box (Max 220 chars) */}
        <div className="p-4 rounded-3xl bg-white border border-[#DED8C7] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-secondaryText">
              The Note <span className="text-rose-600">*</span>
            </label>
            <span
              className={`text-xs font-mono ${
                text.length > 200 ? 'text-amber-800 font-bold' : 'text-secondaryText'
              }`}
            >
              {text.length}/220
            </span>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={220}
            rows={4}
            placeholder="A thought carved into the memory of this spot..."
            className="w-full p-3 rounded-2xl bg-[#FAF8F3] border border-[#E8E3D5] text-base text-primaryText focus:outline-none focus:ring-2 focus:ring-forest/20 font-editorial leading-relaxed resize-none"
            required
          />

          {/* Optional Title */}
          <div>
            <label className="text-xs font-semibold text-secondaryText block mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Under the Old Stone Bridge"
              maxLength={60}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#E8E3D5] text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-forest/20 font-display"
            />
          </div>
        </div>

        {/* Category Selector */}
        <div className="p-4 rounded-3xl bg-white border border-[#DED8C7] shadow-sm space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-secondaryText block">
            Select Category <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const info = getCategoryInfo(cat);
              const isSelected = category === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-forest text-[#FAF8F3] border-forest shadow-sm scale-102 font-semibold'
                      : 'bg-[#FAF8F3] hover:bg-forest/5 text-primaryText border-[#E8E3D5]'
                  }`}
                >
                  <span className="text-lg">{info.icon}</span>
                  <div className="truncate">
                    <span className="text-xs block font-display truncate">{cat}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos Upload (IndexedDB) */}
        <div className="p-4 rounded-3xl bg-white border border-[#DED8C7] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondaryText block">
                Attach Photos
              </label>
              <p className="text-[11px] text-secondaryText">
                {isSupabaseConfigured ? 'Synced securely with your Waypost account.' : 'Stored in this browser only.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-semibold transition-colors border border-forest/15"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Add Photos</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {imagePreviewUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {imagePreviewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-24 rounded-2xl overflow-hidden border border-[#E8E3D5] group"
                >
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#DED8C7] rounded-2xl p-4 text-center cursor-pointer hover:border-forest/40 transition-colors bg-[#FAF8F3]/60 flex flex-col items-center justify-center gap-1 text-secondaryText"
            >
              <ImageIcon className="w-6 h-6 text-stone" />
              <span className="text-xs font-medium">Click to select photos from device</span>
              <span className="text-[10px] text-stone">PNG, JPG, WebP up to 5MB</span>
            </div>
          )}
        </div>

        {/* Location Selection & Map Pinning */}
        <div className="p-4 rounded-3xl bg-white border border-[#DED8C7] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondaryText block">
                Coordinates & Pin Location
              </label>
              <p className="text-[11px] text-secondaryText">
                {isSimulated ? 'Using Simulated Coordinates' : 'Using Real Device GPS Coordinates'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPickingOnMap(!isPickingOnMap)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF8F3] hover:bg-forest/5 text-forest border border-[#DED8C7] transition-colors"
            >
              {isPickingOnMap ? 'Hide Map Picker' : 'Tap on Map to Pin'}
            </button>
          </div>

          {/* Location Name Label */}
          <div>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Location name (e.g. Winding Trail Alcove)"
              maxLength={50}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#E8E3D5] text-xs text-primaryText focus:outline-none"
            />
          </div>

          {/* Interactive Mini-map for Pin Dropping */}
          {isPickingOnMap && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] text-forest font-semibold">
                📍 Click anywhere on the map to set note coordinates:
              </p>
              <div className="h-56 rounded-2xl overflow-hidden border border-[#DED8C7]">
                <WaypostMap
                  userLocation={userCurrentCoords}
                  isSimulated={isSimulated}
                  notes={[]}
                  selectedNote={null}
                  onSelectNote={() => {}}
                  isPickingLocation={true}
                  pickedLocation={selectedCoords}
                  onPickLocation={(coords) => setSelectedCoords(coords)}
                />
              </div>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E8E3D5] text-[11px] font-mono text-secondaryText flex items-center justify-between">
            <span>Coordinates:</span>
            <span className="font-semibold text-primaryText">
              {selectedCoords.latitude.toFixed(5)}, {selectedCoords.longitude.toFixed(5)}
            </span>
          </div>
        </div>

        {/* Expiry Duration */}
        <div className="p-4 rounded-3xl bg-white border border-[#DED8C7] shadow-sm space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-secondaryText block">
            Lifespan on the Trail
          </label>
          <div className="grid grid-cols-3 gap-2">
            {EXPIRY_OPTIONS.map((opt) => {
              const isSelected = expiryDuration === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpiryDuration(opt.value)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'bg-forest text-[#FAF8F3] border-forest shadow-sm font-semibold'
                      : 'bg-[#FAF8F3] hover:bg-forest/5 text-primaryText border-[#E8E3D5]'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#C8D3C5]' : 'text-secondaryText'}`}>
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-forest hover:bg-forest-hover text-[#FAF8F3] font-bold text-sm shadow-elevated transition-all disabled:opacity-50"
          >
            <Compass className="w-5 h-5 text-sage" />
            <span>{isSubmitting ? 'Placing Note on Path...' : 'Leave Waypost Note'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
