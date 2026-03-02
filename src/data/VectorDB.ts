/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  VectorDB — Atomic IndexedDB Persistence Layer                           ║
 * ║                                                                         ║
 * ║  ARCHITECTURE: Atomic Write-Behind Cache                                ║
 * ║  ─────────────────────────────────────────────────────────────────────── ║
 * ║  • Individual organism records (no giant blobs)                          ║
 * ║  • Dirty-flag change tracking for non-blocking I/O                      ║
 * ║  • Scalability for 2500+ entities via multi-store transactions           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { OrganismData } from '../../types';
import { COGNITIVE_CONSTANTS } from '../core/Constants';

export type AssetType = 'ORGANISM' | 'Flora_DEFINITION' | 'SYSTEM_DOC';

export interface VectorAsset {
  id: string;
  type: AssetType;
  data: any;
  timestamp: number;
}

const TOKEN_MAP: Record<string, string> = {
  "organisms": "o", "Flora": "f", "position": "p", "velocity": "v",
  "expressedStats": "es", "genome": "g", "traits": "tr", "memories": "m",
  "id": "i", "timestamp": "t", "energy": "e", "age": "a",
  "generation": "gn", "matingCount": "mc", "matingTimer": "mt",
  "matingTargetId": "mti", "firstName": "fn", "surname": "sn",
  "name": "n", "color": "c", "bending": "b", "parentId": "pi",
  "parentA_Id": "pa", "parentB_Id": "pb",
  "growthState": "gs", "complexity": "cx", "lifetime": "lt",
  "biome": "bm", "type": "tp",
  "config": "cfg", "initialPopulation": "ip", "initialEnergy": "ie",
  "traitRanges": "trr"
};
const REVERSE_TOKEN_MAP = Object.fromEntries(Object.entries(TOKEN_MAP).map(([k, v]) => [v, k]));

const IDB_KEY = {
  STATE: 'ales_sim_state',       // Global simulation parameters (Flora, config, etc.)
  SETTINGS: 'ales_settings',     // User UI preferences
} as const;

class VectorDatabase {
  private organisms: Map<string, OrganismData & { isAlive: boolean }> = new Map();
  private documents: VectorAsset[] = [];
  private settingsCache: Map<string, any> = new Map();
  private eventsCache: any[] = [];
  private dirtyOrganisms: Set<string> = new Set();

  private surnameIndex: Map<string, Set<string>> = new Map();
  private familyCountIndex: Map<string, number> = new Map();

  private SAVE_DEBOUNCE_MS = 1000;
  private saveTimeout: any = null;

  private DB_NAME = 'ales_persistence_v2'; // Bumped version for structural shift
  private DB_STORES = {
    ORGANISMS: 'organisms',
    EVENTS: 'events',
    SYSTEM: 'system' // For state and settings
  };
  private DB_VERSION = 1;
  private dbPromise: Promise<IDBDatabase> | null = null;

  public isReady = false;
  public lastSaveMs = 0;
  public lastLoadMs = 0;
  public lastSaveOrgCount = 0;
  public saveCount = 0;

  constructor() {
    this.initDocs();
    // Don't eagerly open — let init() handle it
  }

  async init(): Promise<void> {
    if (this.isReady) return;
    const t0 = performance.now();
    try {
      console.log("[VDB] Opening Database...");
      const db = await this.openDB();
      console.log("[VDB] Database opened. Fetching stores...");

      // Parallel hydration of caches
      const [systemStore, organismsStore, eventsStore] = await Promise.all([
        this.getAllFromStore(this.DB_STORES.SYSTEM),
        this.getAllFromStore(this.DB_STORES.ORGANISMS),
        this.getAllFromStore(this.DB_STORES.EVENTS)
      ]);
      console.log(`[VDB] Stores fetched: System(${systemStore.length}), Organisms(${organismsStore.length}), Events(${eventsStore.length})`);

      // Hydrate System (Settings & State)
      systemStore.forEach(({ key, value }) => {
        if (key === IDB_KEY.SETTINGS) {
          Object.entries(value).forEach(([k, v]) => this.settingsCache.set(k, v));
        }
      });

      // Hydrate Organisms (Atomic Load)
      console.log("[VDB] Detokenizing organisms...");
      organismsStore.forEach(({ key, value }) => {
        try {
          const org = this.detokenize(value);
          this.organisms.set(org.id, org);
        } catch (e) {
          console.error(`[VDB] Hydration Error: Failed to detokenize organism ${key}`, e);
        }
      });
      console.log("[VDB] Refreshing indices...");
      this.refreshIndices();

      // Hydrate Events
      console.log("[VDB] Detokenizing events...");
      this.eventsCache = this.detokenize(eventsStore.map(e => e.value));
      console.log("[VDB] Hydration complete.");

    } catch (e) {
      console.warn('[VDB] init() failed, check IndexedDB state', e);
    }

    this.isReady = true;
    this.lastLoadMs = performance.now() - t0;
    console.log(`[VDB] Init complete in ${this.lastLoadMs.toFixed(1)}ms (${this.organisms.size} records)`);
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  getSetting(key: string, defaultValue: any): any {
    const val = this.settingsCache.get(key);
    return val !== undefined ? val : defaultValue;
  }

  setSetting(key: string, value: any): void {
    this.settingsCache.set(key, value);
    const obj = Object.fromEntries(this.settingsCache);
    this.idbPut(this.DB_STORES.SYSTEM, IDB_KEY.SETTINGS, obj).catch(() => { });
  }

  // ── Simulation State ──────────────────────────────────────────────────────

  /**
   * Saves the simulation state to IndexedDB.
   * Optimizations:
   * 1. Uses requestIdleCallback (if available) to avoid blocking the main thread.
   * 2. Tokenizes while cloning to avoid redundant JSON.stringify/parse.
   * 3. Prunes non-essential data (expressedStats) during tokenization.
   */
  saveSimState(state: any): void {
    const runSave = () => {
      const t0 = performance.now();

      // Deep clone & tokenize in one pass (Pruning included)
      const tokenized = this.tokenizeAndPrune(state);

      const orgCount = state.organisms?.length || 0;

      this.idbPut(this.DB_STORES.SYSTEM, IDB_KEY.STATE, tokenized).then(() => {
        this.lastSaveMs = performance.now() - t0;
        this.lastSaveOrgCount = orgCount;
        this.saveCount++;

        // Background sync living history (Atomic)
        if (state.organisms) {
          this.syncLiving(state.organisms);
        }
      }).catch(() => { });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => runSave(), { timeout: 2000 });
    } else {
      setTimeout(runSave, 0);
    }
  }

  /**
   * Combined Tokenizer, Cloner, and Pruner.
   * Removes expressedStats and truncates memories to keep DB size manageable.
   */
  private tokenizeAndPrune(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;

    // Handle Arrays
    if (Array.isArray(obj)) {
      return obj.map(v => this.tokenizeAndPrune(v));
    }

    // Handle Objects
    const tokenized: any = {};
    for (const key in obj) {
      // --- PRUNING RULES ---
      if (key === 'expressedStats') continue;
      if (key === 'events') continue; // Events handled separately

      const token = TOKEN_MAP[key] || key;
      let value = obj[key];

      // Memory Truncation for persistence
      if (key === 'memories' && Array.isArray(value)) {
        if (value.length > COGNITIVE_CONSTANTS.PERSISTENT_MEMORY_LIMIT) {
          value = value.slice(-COGNITIVE_CONSTANTS.PERSISTENT_MEMORY_LIMIT);
        }
      }

      tokenized[token] = this.tokenizeAndPrune(value);
    }
    return tokenized;
  }

  async loadSimState(): Promise<any | null> {
    try {
      const saved = await this.idbGet(this.DB_STORES.SYSTEM, IDB_KEY.STATE);
      if (saved) {
        const state = this.detokenize(saved);
        state.events = this.eventsCache;
        return state;
      }
    } catch { return null; }
    return null;
  }

  // ── Organism History ──────────────────────────────────────────────────────

  syncLiving(organisms: (OrganismData & { isAlive?: boolean })[]): void {
    organisms.forEach(org => {
      const existing = this.organisms.get(org.id);
      if (existing) {
        this.organisms.set(org.id, {
          ...existing,
          age: org.age,
          energy: org.energy,
          matingCount: org.matingCount,
          isAlive: true
        });
      } else {
        this.organisms.set(org.id, { ...org, isAlive: true, memories: [] });
        this.updateIndicesFor(org);
      }
      this.dirtyOrganisms.add(org.id);
    });
    this.debounceSave();
  }

  public pushToHistory(entityId: string, memory: any): void {
    const org = this.organisms.get(entityId);
    if (!org) return;

    if (!org.memories) org.memories = [];

    // --- CONSOLIDATION LOGIC ---
    // If the last memory was similar (e.g., eating), consolidate it
    const lastMem = org.memories[org.memories.length - 1];
    if (lastMem && memory.content.includes('Energy') && lastMem.content.includes('Energy')) {
      const match = lastMem.content.match(/Harvested (\d+)x Energy/);
      const currentAmount = match ? parseInt(match[1]) : 1;
      lastMem.content = `Harvested ${currentAmount + 1}x Energy`;
      lastMem.timestamp = Date.now();
    } else {
      if (!org.memories.some(m => m.id === memory.id)) {
        org.memories.push(memory);
      }
    }

    const limit = 200; // High limit for atomic records
    if (org.memories.length > limit) org.memories.shift();

    this.dirtyOrganisms.add(entityId);
    this.debounceSave();
  }

  markDeceased(id: string, finalData?: OrganismData): void {
    const org = this.organisms.get(id);
    if (org) {
      if (finalData) {
        this.organisms.set(id, { ...finalData, isAlive: false });
      } else {
        org.isAlive = false;
      }
      this.dirtyOrganisms.add(id);
      this.debounceSave();
    }
  }

  addHistory(org: OrganismData): void {
    this.organisms.set(org.id, { ...org, isAlive: true });
    this.updateIndicesFor(org);
    this.dirtyOrganisms.add(org.id);
    this.debounceSave();
  }

  getHistory(): OrganismData[] {
    return Array.from(this.organisms.values()).sort((a, b) => b.generation - a.generation);
  }

  getFamilyCount(firstName: string, surname: string): number {
    return this.familyCountIndex.get(`${firstName}_${surname}`) || 0;
  }

  getEvents(): any[] { return this.eventsCache; }
  getAssets(): VectorAsset[] { return this.documents; }

  // ── Persistence Internals ─────────────────────────────────────────────────

  private debounceSave(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.flushDirty(), this.SAVE_DEBOUNCE_MS);
  }

  private async flushDirty(): Promise<void> {
    if (this.dirtyOrganisms.size === 0) return;

    const db = await this.openDB();
    const tx = db.transaction(this.DB_STORES.ORGANISMS, 'readwrite');
    const store = tx.objectStore(this.DB_STORES.ORGANISMS);

    const snapshot = Array.from(this.dirtyOrganisms);
    this.dirtyOrganisms.clear();

    snapshot.forEach(id => {
      const org = this.organisms.get(id);
      if (org) {
        const tokenized = this.tokenize({ ...org, lastSaved: Date.now() });
        store.put(tokenized, id);
      }
    });

    tx.oncomplete = () => {
      console.log(`[VDB] Atomic flush complete: ${snapshot.length} records persisted.`);
    };
  }

  private async saveEventsBatch(events: any[]): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.DB_STORES.EVENTS, 'readwrite');
      const store = tx.objectStore(this.DB_STORES.EVENTS);
      store.clear();
      events.forEach((ev, idx) => store.put(this.tokenize(ev), idx));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── IndexedDB Plumbing ────────────────────────────────────────────────────

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject('No IndexedDB');

      // Timeout: if IDB is blocked/stuck for >3s, reject so app can launch
      const timeout = setTimeout(() => {
        console.error('[VDB] openDB timeout — IndexedDB may be blocked by another tab.');
        reject(new Error('IndexedDB open timeout'));
      }, 3000);

      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        Object.values(this.DB_STORES).forEach(s => {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
        });
      };
      req.onsuccess = () => { clearTimeout(timeout); resolve(req.result); };
      req.onerror = () => { clearTimeout(timeout); reject(req.error); };
      req.onblocked = () => {
        console.warn('[VDB] IndexedDB blocked — close other tabs using this app.');
        clearTimeout(timeout);
        reject(new Error('IndexedDB blocked'));
      };
    }).catch(e => {
      // Reset promise so future calls can retry
      this.dbPromise = null;
      throw e;
    });
    return this.dbPromise;
  }

  private async idbPut(storeName: string, key: string, value: any): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async idbGet(storeName: string, key: string): Promise<any | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  private async getAllFromStore(storeName: string): Promise<{ key: string, value: any }[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      const keyReq = store.getAllKeys();
      tx.oncomplete = () => {
        const values = req.result;
        const keys = keyReq.result as string[];
        resolve(values.map((v, i) => ({ key: keys[i], value: v })));
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  hardReset(): void {
    this.openDB().then(db => {
      const tx = db.transaction(Object.values(this.DB_STORES), 'readwrite');
      Object.values(this.DB_STORES).forEach(s => tx.objectStore(s).clear());
    });
    this.organisms.clear();
    this.settingsCache.clear();
    this.eventsCache = [];
    this.refreshIndices();
  }

  // ── Utils ─────────────────────────────────────────────────────────────────

  private tokenize(obj: any): any {
    if (Array.isArray(obj)) return obj.map(v => this.tokenize(v));
    if (obj !== null && typeof obj === 'object') {
      const tokenized: any = {};
      for (const key in obj) {
        const token = TOKEN_MAP[key] || key;
        tokenized[token] = this.tokenize(obj[key]);
      }
      return tokenized;
    }
    return obj;
  }

  private detokenize(obj: any): any {
    if (Array.isArray(obj)) return obj.map(v => this.detokenize(v));
    if (obj !== null && typeof obj === 'object') {
      const detokenized: any = {};
      for (const key in obj) {
        const originalKey = REVERSE_TOKEN_MAP[key] || key;
        detokenized[originalKey] = this.detokenize(obj[key]);
      }
      return detokenized;
    }
    return obj;
  }

  private updateIndicesFor(org: OrganismData): void {
    const existing = this.surnameIndex.get(org.surname) || new Set();
    existing.add(org.id);
    this.surnameIndex.set(org.surname, existing);
    const familyKey = `${org.firstName}_${org.surname}`;
    this.familyCountIndex.set(familyKey, (this.familyCountIndex.get(familyKey) || 0) + 1);
  }

  private refreshIndices(): void {
    this.surnameIndex.clear();
    this.familyCountIndex.clear();
    this.organisms.forEach(org => this.updateIndicesFor(org));
  }

  private initDocs(): void {
    this.documents.push({
      id: 'doc_genetics', type: 'SYSTEM_DOC', timestamp: Date.now(),
      data: { title: 'Genetic Expression: Standardized Units', content: 'Trait values are expressed in metric units where applicable.' }
    });
  }
}

export const VectorDB = new VectorDatabase();
