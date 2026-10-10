import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  HardDrive,
  Users,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Map,
  Key,
} from 'lucide-react';
import { localDB } from '../../lib/database';
import { imageStorage } from '../../lib/imageStorage';
import { useAuth } from '../../context/AuthContext';
import { useNotes } from '../../context/NotesContext';
import { ReportRecord } from '../../types';
import { MapConfigService, MapConfig, MapProviderType } from '../../lib/mapConfig';

interface DevSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevSettingsModal: React.FC<DevSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, isGuest, accounts, switchAccount } = useAuth();
  const { refreshNotes, resetDemoData } = useNotes();

  const [notesCount, setNotesCount] = useState<number>(0);
  const [imagesCount, setImagesCount] = useState<number>(0);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState<boolean>(false);

  const [mapConfig, setMapConfig] = useState<MapConfig>(() => MapConfigService.getConfig());
  const [inputKey, setInputKey] = useState<string>(mapConfig.apiKey || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStats = async () => {
    setNotesCount(localDB.getAllStoredNotes().length);
    const imgCount = await imageStorage.getImageCount();
    setImagesCount(imgCount);
    setReports(localDB.getReports());
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const data = localDB.exportData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waypost-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ text: 'Data exported successfully as JSON!', type: 'success' });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const res = localDB.importData(parsed);
        if (res.success) {
          setStatusMessage({ text: res.message, type: 'success' });
          refreshNotes();
          loadStats();
        } else {
          setStatusMessage({ text: res.message, type: 'error' });
        }
      } catch (err: unknown) {
        setStatusMessage({
          text: 'Failed to read file: invalid JSON format.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = async () => {
    await resetDemoData();
    setIsResetConfirmOpen(false);
    setStatusMessage({ text: 'Demo notes refreshed! User created notes were preserved.', type: 'success' });
    loadStats();
  };

  const handleClearAll = async () => {
    await localDB.clearAllLocalData();
    setIsWipeConfirmOpen(false);
    refreshNotes();
    loadStats();
    setStatusMessage({ text: 'All browser storage cleared. Reload to initialize clean slate.', type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#FAF8F3] rounded-3xl shadow-elevated border border-[#DED8C7] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-[#E8E3D5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-forest font-display">Local Data & Storage MVP</h3>
              <p className="text-xs text-secondaryText">Browser-only persistent storage management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-forest/10 text-secondaryText transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {statusMessage && (
          <div
            className={`p-3 text-xs font-medium text-center ${
              statusMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border-b border-emerald-200'
                : 'bg-rose-100 text-rose-900 border-b border-rose-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Storage Mode Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#DED8C7] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondaryText uppercase">Current Storage</span>
              <span className="text-[11px] font-bold bg-forest/10 text-forest px-2.5 py-0.5 rounded-full border border-forest/20">
                LocalStorage + IndexedDB
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0EBE0] text-center">
              <div className="p-2 rounded-xl bg-[#FAF8F3]">
                <div className="text-lg font-bold text-forest">{notesCount}</div>
                <div className="text-[10px] text-secondaryText uppercase font-semibold">Total Notes</div>
              </div>
              <div className="p-2 rounded-xl bg-[#FAF8F3]">
                <div className="text-lg font-bold text-forest">{imagesCount}</div>
                <div className="text-[10px] text-secondaryText uppercase font-semibold">Images in IDB</div>
              </div>
              <div className="p-2 rounded-xl bg-[#FAF8F3]">
                <div className="text-lg font-bold text-forest">{reports.length}</div>
                <div className="text-[10px] text-secondaryText uppercase font-semibold">Local Reports</div>
              </div>
            </div>
          </div>

          {/* Map API Key & Tile Provider */}
          <div className="p-4 rounded-2xl bg-white border border-[#DED8C7] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondaryText">
                <Map className="w-3.5 h-3.5 text-forest" />
                <span>Map Provider & API Key</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                mapConfig.apiKey || mapConfig.provider === 'carto_voyager' || mapConfig.provider === 'osm'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {mapConfig.apiKey ? 'API Key Active' : 'No Key Required (Open Tiles)'}
              </span>
            </div>

            <p className="text-[11px] text-secondaryText leading-relaxed">
              By default, Waypost uses <strong>CartoDB Voyager + OSM</strong> (free, open, no API key needed). You can also link your <strong>Google Maps</strong>, <strong>Mapbox</strong>, or <strong>MapTiler</strong> API key.
            </p>

            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold text-secondaryText">
                Select Provider:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { id: 'google_maps', label: '🗺️ Google Maps' },
                  { id: 'osm', label: 'OpenStreetMap (Free)' },
                  { id: 'mapbox', label: 'Mapbox' },
                  { id: 'maptiler', label: 'MapTiler' },
                  { id: 'stadia', label: 'Stadia Maps' },
                ].map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => {
                      const updated = { ...mapConfig, provider: prov.id as MapProviderType };
                      setMapConfig(updated);
                    }}
                    className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      mapConfig.provider === prov.id
                        ? 'bg-forest text-[#FAF8F3] border-forest font-semibold'
                        : 'bg-[#FAF8F3] hover:bg-forest/5 text-primaryText border-[#E8E3D5]'
                    }`}
                  >
                    {prov.label}
                  </button>
                ))}
              </div>

              {(mapConfig.provider === 'google_maps' || mapConfig.provider === 'mapbox' || mapConfig.provider === 'maptiler' || mapConfig.provider === 'stadia') && (
                <div className="space-y-1.5 pt-1.5">
                  <label className="block text-[11px] font-semibold text-secondaryText flex items-center gap-1">
                    <Key className="w-3 h-3 text-forest" />
                    <span>
                      {mapConfig.provider === 'google_maps'
                        ? 'Google Maps API Key (AIzaSy...):'
                        : mapConfig.provider === 'mapbox'
                        ? 'Mapbox Access Token (pk....):'
                        : 'API Key:'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder={
                      mapConfig.provider === 'google_maps'
                        ? 'AIzaSy...'
                        : mapConfig.provider === 'mapbox'
                        ? 'pk.eyJ1...'
                        : 'Enter your API key...'
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-[#DED8C7] bg-[#FAF8F3] font-mono"
                  />
                  {mapConfig.provider === 'google_maps' && (
                    <p className="text-[10px] text-secondaryText">
                      Enables official Google Maps tiles and layers directly in Waypost.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...mapConfig, apiKey: inputKey.trim() || undefined };
                    MapConfigService.saveConfig(updated);
                    setMapConfig(updated);
                    setStatusMessage({ text: 'Map API settings saved! Reloading to apply...', type: 'success' });
                    setTimeout(() => window.location.reload(), 800);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-forest text-[#FAF8F3] hover:bg-forest-hover shadow-xs"
                >
                  Save & Apply Map Settings
                </button>
              </div>
            </div>
          </div>

          {/* Account Quick Switcher */}
          <div className="p-4 rounded-2xl bg-white border border-[#DED8C7] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondaryText">
                <Users className="w-3.5 h-3.5" />
                <span>Local Simulated Accounts ({accounts.length})</span>
              </div>
              <span className="text-xs text-forest font-medium">
                Active: {isGuest ? 'Guest Wanderer' : user?.displayName}
              </span>
            </div>

            {accounts.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {accounts.map((acc) => {
                  const isActive = user?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => switchAccount(acc)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-forest text-[#FAF8F3] font-semibold'
                          : 'bg-[#FAF8F3] hover:bg-forest/5 text-primaryText border border-[#E8E3D5]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{acc.avatarPreset || '🌿'}</span>
                        <span>{acc.displayName}</span>
                        <span className="text-[10px] opacity-70">({acc.email})</span>
                      </div>
                      {isActive && <span className="text-[10px]">Active</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-secondaryText italic">
                No accounts created yet. You are currently roaming in Guest mode.
              </p>
            )}
          </div>

          {/* Export & Import Backup */}
          <div className="p-4 rounded-2xl bg-white border border-[#DED8C7] space-y-3 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-secondaryText">
              Data Backup & Migration
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FAF8F3] hover:bg-forest/5 border border-[#DED8C7] text-xs font-semibold text-forest transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FAF8F3] hover:bg-forest/5 border border-[#DED8C7] text-xs font-semibold text-forest transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
            <p className="text-[11px] text-secondaryText">
              Export notes, bookmarks, and local reactions as a validated JSON file to back up or transfer between browsers.
            </p>
          </div>

          {/* Local Moderation Log */}
          {reports.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-[#DED8C7] space-y-2 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondaryText">
                <FileText className="w-3.5 h-3.5" />
                <span>Local Moderation Reports ({reports.length})</span>
              </div>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-2 rounded-xl bg-[#FAF8F3] border border-[#E8E3D5] text-[11px] text-secondaryText flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-rose-800">[{rep.reason}]</span>{' '}
                      <span>Note ID: {rep.noteId.slice(0, 12)}...</span>
                      {rep.comment && <p className="italic text-stone-600">"{rep.comment}"</p>}
                    </div>
                    <span className="text-[10px] text-stone">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone: Reset & Clear */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
              Environment Reset
            </h4>

            {isResetConfirmOpen ? (
              <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs space-y-2">
                <p className="font-semibold text-primaryText">Reset demo notes?</p>
                <p className="text-secondaryText">
                  This will re-seed original sample notes. Your own user-created notes will NOT be lost.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="px-3 py-1 rounded-lg text-secondaryText hover:bg-black/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetDemo}
                    className="px-3 py-1 rounded-lg bg-forest text-[#FAF8F3] font-semibold"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-forest/5 border border-[#DED8C7] text-xs font-semibold text-forest transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Environment (Preserve User Notes)</span>
              </button>
            )}

            {isWipeConfirmOpen ? (
              <div className="p-3 bg-white rounded-xl border border-rose-300 text-xs space-y-2">
                <p className="font-semibold text-rose-900">Wipe all local application data?</p>
                <p className="text-secondaryText">
                  Warning: All user accounts, notes, IndexedDB images, and bookmarks stored in this browser will be permanently deleted.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsWipeConfirmOpen(false)}
                    className="px-3 py-1 rounded-lg text-secondaryText hover:bg-black/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-1 rounded-lg bg-rose-700 text-white font-semibold"
                  >
                    Yes, Wipe Everything
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsWipeConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Wipe All Local Storage & IndexedDB Media</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F4F0E5] border-t border-[#E8E3D5] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-forest text-[#FAF8F3] font-medium text-xs shadow-sm hover:bg-forest-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
