import { StudioProject, TrackRecording } from '../types';

const DB_NAME = 'KeyMuseStudioDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_RECORDINGS = 'recordings';
const STORE_PRESETS = 'presets';

export interface SerializedTrack {
  id: string;
  name: string;
  audioBlob?: Blob;
  durationSeconds: number;
  volume: number;
  muted: boolean;
  solo: boolean;
  pan: number;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
        db.createObjectStore(STORE_RECORDINGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PRESETS)) {
        db.createObjectStore(STORE_PRESETS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const StorageService = {
  // Save project
  async saveProject(project: StudioProject): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        // Exclude in-memory AudioBuffer when storing
        const cleanProject = {
          ...project,
          tracks: project.tracks.map((t) => ({
            id: t.id,
            name: t.name,
            durationSeconds: t.durationSeconds,
            volume: t.volume,
            muted: t.muted,
            solo: t.solo,
            pan: t.pan,
            createdAt: t.createdAt,
            audioBlob: t.blob
          }))
        };
        const req = store.put(cleanProject);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('StorageService.saveProject fallback/error:', err);
    }
  },

  // Get project by ID
  async getProject(id: string): Promise<any | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('StorageService.getProject fallback/error:', err);
      return null;
    }
  },

  // List all projects
  async listProjects(): Promise<any[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('StorageService.listProjects fallback/error:', err);
      return [];
    }
  },

  // Delete project
  async deleteProject(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('StorageService.deleteProject fallback/error:', err);
    }
  },

  // Export project as validated JSON file blob
  exportProjectJSON(project: StudioProject): string {
    const exportData = {
      app: 'KeyMuse',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        bpm: project.bpm,
        selectedInstrument: project.selectedInstrument,
        octave: project.octave,
        transpose: project.transpose,
        scale: project.scale,
        rootNote: project.rootNote,
        scaleLock: project.scaleLock,
        chordType: project.chordType,
        arpSettings: project.arpSettings,
        effects: project.effects,
        drumPattern: project.drumPattern,
        tracks: project.tracks.map((t) => ({
          id: t.id,
          name: t.name,
          durationSeconds: t.durationSeconds,
          volume: t.volume,
          muted: t.muted,
          solo: t.solo,
          pan: t.pan,
          createdAt: t.createdAt
        }))
      }
    };
    return JSON.stringify(exportData, null, 2);
  },

  // Validate and parse imported project JSON
  validateAndParseProjectJSON(jsonString: string): any {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || parsed.app !== 'KeyMuse' || !parsed.project) {
        throw new Error('Invalid KeyMuse project file format');
      }
      return parsed.project;
    } catch (e: any) {
      throw new Error(`Project import validation failed: ${e.message}`);
    }
  },

  // Save preset to IndexedDB
  async savePreset(preset: { id: string; name: string; category?: string; config: any }): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PRESETS, 'readwrite');
        const store = tx.objectStore(STORE_PRESETS);
        const req = store.put({ ...preset, updatedAt: Date.now() });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('StorageService.savePreset fallback/error:', err);
    }
  },

  // List all local presets
  async listPresets(): Promise<any[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PRESETS, 'readonly');
        const store = tx.objectStore(STORE_PRESETS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('StorageService.listPresets fallback/error:', err);
      return [];
    }
  },

  // Delete preset
  async deletePreset(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PRESETS, 'readwrite');
        const store = tx.objectStore(STORE_PRESETS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('StorageService.deletePreset fallback/error:', err);
    }
  },

  // Sync with Python FastAPI backend (with graceful offline fallback)
  async syncWithBackendApi(apiBaseUrl: string = 'http://localhost:8000/api'): Promise<{ success: boolean; count: number; offline: boolean; message: string }> {
    try {
      const res = await fetch(`${apiBaseUrl}/presets`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const serverPresets = await res.json();
      if (Array.isArray(serverPresets)) {
        for (const p of serverPresets) {
          await this.savePreset({
            id: p.id || `srv_${Date.now()}`,
            name: p.name,
            category: p.category || 'all',
            config: p.config || p
          });
        }
        return {
          success: true,
          count: serverPresets.length,
          offline: false,
          message: `Synced ${serverPresets.length} presets from server.`
        };
      }
      return { success: true, count: 0, offline: false, message: 'Server returned no presets.' };
    } catch (err: any) {
      // Offline mode: perfectly normal for client-only operation
      const localPresets = await this.listPresets();
      return {
        success: true,
        count: localPresets.length,
        offline: true,
        message: `Offline mode: using ${localPresets.length} local preset(s).`
      };
    }
  }
};
