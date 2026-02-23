/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  VectorDB — IndexedDB-Only Persistence Layer                           ║
 * ║                                                                         ║
 * ║  ARCHITECTURE: Write-Behind Cache                                       ║
 * ║  ─────────────────────────────────────────────────────────────────────── ║
 * ║  • All READS are instant, served from in-memory Maps (O(1) latency)    ║
 * ║  • All WRITES go to IndexedDB asynchronously (non-blocking)            ║
 * ║  • On startup, `await VectorDB.init()` hydrates all caches from IDB   ║
 * ║                                                                         ║
 * ║  ⚠️  DO NOT ADD localStorage CALLS TO THIS FILE.                       ║
 * ║  localStorage has a ~5-10MB hard limit and causes data loss when the   ║
 * ║  simulation state exceeds it (organisms get mass-deleted by the        ║
 * ║  browser's QuotaExceededError handler). IndexedDB has ~250MB+ capacity ║
 * ║  and is the industry standard for structured client-side persistence.  ║
 * ║                                                                         ║
 * ║  If you need synchronous reads, read from the in-memory caches.       ║
 * ║  Never add synchronous localStorage.getItem/setItem calls.            ║
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

/**
 * Tokenization map — reduces key names in serialized objects to minimize IndexedDB payload.
 * This is NOT for localStorage size limits (we don't use localStorage) but for reducing
 * IndexedDB I/O overhead and structured clone time on large state objects.
 */
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

// ── IndexedDB Key Constants ────────────────────────────────────────────────
// These are the keys used inside the single IndexedDB object store.
// Each key maps to a distinct data category.
const IDB_KEY = {
  STATE: 'ales_sim_state',       // Full simulation state (organisms, flora, config)
  HISTORY: 'ales_history',       // Organism lineage/history registry
  EVENTS: 'ales_events',         // Simulation event log
  SETTINGS: 'ales_settings',     // User UI preferences (debug toggles, etc.)
} as const;

class VectorDatabase {
  // ── In-Memory Caches (Write-Behind) ──────────────────────────────────────
  // All reads come from these caches. Writes update the cache first, then
  // persist to IndexedDB asynchronously. This gives O(1) read performance
  // with zero latency, while still guaranteeing persistence.
  private organisms: Map<string, OrganismData & { isAlive: boolean }> = new Map();
  private documents: VectorAsset[] = [];
  private settingsCache: Map<string, any> = new Map();
  private eventsCache: any[] = [];

  // ── Indices ──────────────────────────────────────────────────────────────
  private surnameIndex: Map<string, Set<string>> = new Map();
  private familyCountIndex: Map<string, number> = new Map();

  // ── Configuration ────────────────────────────────────────────────────────
  private MAX_HISTORY_SIZE = 1000;
  private SAVE_DEBOUNCE_MS = 2000;
  private saveTimeout: number | null = null;

  // ── IndexedDB Handle ─────────────────────────────────────────────────────
  // Single object store "state" in database "ales_persistence".
  // Using a single store with string keys is the simplest and most performant
  // pattern for key-value persistence in IndexedDB.
  private DB_NAME = 'ales_persistence';
  private DB_STORE = 'state';
  private DB_VERSION = 1;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Whether the async init() has completed and all caches are hydrated.
   * Before this is true, getSetting() returns defaults and saves are queued.
   */
  public isReady = false;

  // ── Diagnostic Metrics (exposed for GUI status panel) ────────────────────
  public lastSaveMs = 0;
  public lastLoadMs = 0;
  public lastSaveOrgCount = 0;
  public saveCount = 0;

  constructor() {
    this.initDocs();
    // Pre-open IndexedDB connection (non-blocking)
    this.openDB();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Async initialization — MUST be awaited before the app renders.
   * Hydrates all in-memory caches from IndexedDB in a single batch.
   * After this resolves, all sync reads (getSetting, getHistory, etc.) work.
   *
   * ⚠️  Call this exactly once at app startup, before creating SimulationEngine.
   */
  async init(): Promise<void> {
    const t0 = performance.now();
    try {
      // Parallel hydration of all caches from IndexedDB
      const [settings, history, events] = await Promise.all([
        this.idbGet(IDB_KEY.SETTINGS),
        this.idbGet(IDB_KEY.HISTORY),
        this.idbGet(IDB_KEY.EVENTS),
      ]);

      // Hydrate settings cache
      if (settings && typeof settings === 'object') {
        for (const [k, v] of Object.entries(settings)) {
          this.settingsCache.set(k, v);
        }
      }

      // Hydrate organism history
      if (Array.isArray(history)) {
        const detokenized = this.detokenize(history);
        this.organisms = new Map(detokenized);
        this.refreshIndices();
      }

      // Hydrate events cache
      if (Array.isArray(events)) {
        this.eventsCache = this.detokenize(events);
      }

      // Migrate any existing localStorage data to IndexedDB (one-time)
      await this.migrateFromLocalStorage();

    } catch (e) {
      console.warn('[VDB] init() failed, starting with empty caches', e);
    }

    this.isReady = true;
    this.lastLoadMs = performance.now() - t0;
    console.log(`[VDB] Init complete in ${this.lastLoadMs.toFixed(1)}ms — ` +
      `${this.organisms.size} history records, ${this.settingsCache.size} settings`);
  }

  // ── Settings (Write-Behind Cache) ─────────────────────────────────────────
  // Settings are stored as a flat Map in memory. Reads are instant (sync).
  // Writes update the Map then persist the entire settings object to IDB.

  /**
   * Synchronous setting read — returns from in-memory cache.
   * Safe to call from React useState initializers.
   */
  getSetting(key: string, defaultValue: any): any {
    const val = this.settingsCache.get(key);
    return val !== undefined ? val : defaultValue;
  }

  /**
   * Setting write — updates in-memory cache instantly, then persists async.
   */
  setSetting(key: string, value: any): void {
    this.settingsCache.set(key, value);
    // Write-behind: persist full settings map to IDB
    const obj = Object.fromEntries(this.settingsCache);
    this.idbPut(IDB_KEY.SETTINGS, obj).catch(e =>
      console.warn('[VDB] Failed to persist settings', e)
    );
  }

  // ── Simulation State ──────────────────────────────────────────────────────

  /**
   * Save full simulation state to IndexedDB.
   * Strips non-essential data (expressedStats, excess memories) to minimize
   * structured-clone overhead, but NEVER deletes organisms or flora.
   */
  saveSimState(state: any): void {
    const t0 = performance.now();
    const persistentState = JSON.parse(JSON.stringify(state));

    // Strip derived/transient data to reduce payload size
    if (persistentState.organisms) {
      persistentState.organisms.forEach((o: any) => {
        // expressedStats are re-derived from genome on load — no need to persist
        delete o.expressedStats;
        // Amount of memories to persist. Keep only the most recent memories
        if (o.memories && o.memories.length > COGNITIVE_CONSTANTS.PERSISTENT_MEMORY_LIMIT) o.memories = o.memories.slice(-COGNITIVE_CONSTANTS.PERSISTENT_MEMORY_LIMIT);
      });
    }

    // Separate events to their own key for granular access
    if (persistentState.events) {
      this.eventsCache = persistentState.events.slice(0, 20);
      this.idbPut(IDB_KEY.EVENTS, this.tokenize(this.eventsCache)).catch(() => { });
      delete persistentState.events;
    }

    const tokenized = this.tokenize(persistentState);
    const orgCount = persistentState.organisms?.length || 0;

    this.idbPut(IDB_KEY.STATE, tokenized).then(() => {
      this.lastSaveMs = performance.now() - t0;
      this.lastSaveOrgCount = orgCount;
      this.saveCount++;
      console.log(`[VDB] State saved (${orgCount} orgs, ${this.lastSaveMs.toFixed(1)}ms)`);
    }).catch(e => {
      console.error('[VDB] CRITICAL: State save failed!', e);
    });
  }

  /**
   * Load simulation state from IndexedDB.
   * Returns null if no saved state exists.
   */
  async loadSimState(): Promise<any | null> {
    const t0 = performance.now();
    try {
      const saved = await this.idbGet(IDB_KEY.STATE);
      if (saved) {
        const state = this.detokenize(saved);
        state.events = this.eventsCache; // Attach cached events
        this.lastLoadMs = performance.now() - t0;
        console.log(`[VDB] State loaded (${state.organisms?.length || 0} orgs, ${this.lastLoadMs.toFixed(1)}ms)`);
        return state;
      }
    } catch (e) {
      console.warn('[VDB] State load failed', e);
    }
    return null;
  }

  // ── Organism History (Lineage Registry) ───────────────────────────────────

  logOrganism(org: OrganismData): void {
    this.organisms.set(org.id, { ...org, isAlive: true });
    this.updateIndicesFor(org);
    this.debounceSaveHistory();

    if (this.organisms.size > this.MAX_HISTORY_SIZE * 1.2) {
      this.pruneHistory(this.MAX_HISTORY_SIZE);
    }
  }

  addHistory(org: OrganismData): void {
    this.logOrganism(org);
  }

  markDeceased(id: string): void {
    const org = this.organisms.get(id);
    if (org) {
      org.isAlive = false;
      this.debounceSaveHistory();
    }
  }

  getHistory(): OrganismData[] {
    return Array.from(this.organisms.values()).sort((a, b) => b.generation - a.generation);
  }

  getLineage(id: string): OrganismData[] {
    const lineage: OrganismData[] = [];
    let currentId: string | undefined = id;
    while (currentId && this.organisms.has(currentId)) {
      const ancestor = this.organisms.get(currentId)!;
      lineage.push(ancestor);
      currentId = ancestor.parentId;
      if (lineage.length > 20) break;
    }
    return lineage;
  }

  getFamilyCount(firstName: string, surname: string): number {
    return this.familyCountIndex.get(`${firstName}_${surname}`) || 0;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  getEvents(): any[] {
    return this.eventsCache;
  }

  // ── System Assets ─────────────────────────────────────────────────────────

  getAssets(): VectorAsset[] {
    return this.documents;
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  /**
   * Nuclear reset — clears ALL persisted data from IndexedDB and memory.
   * Also clears any legacy localStorage keys for completeness.
   */
  hardReset(): void {
    // Clear IndexedDB (primary store)
    this.openDB().then(db => {
      const tx = db.transaction(this.DB_STORE, 'readwrite');
      tx.objectStore(this.DB_STORE).clear();
      console.log('[VDB] IndexedDB cleared');
    }).catch(() => { });

    // Clear legacy localStorage keys (one-time cleanup, safe to call)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('ales_sim_state');
        localStorage.removeItem('ales_events_persistence');
        localStorage.removeItem('ales_organisms_persistence');
        localStorage.removeItem('ales_settings');
      }
    } catch { /* ignore in workers */ }

    // Clear in-memory caches
    this.organisms.clear();
    this.surnameIndex.clear();
    this.familyCountIndex.clear();
    this.settingsCache.clear();
    this.eventsCache = [];
    this.lastSaveMs = 0;
    this.lastSaveOrgCount = 0;
    this.saveCount = 0;
  }

  // ── Diagnostics (for GUI status panel) ────────────────────────────────────

  /**
   * Returns metrics for the VectorDB status GUI element.
   */
  getMetrics(): {
    historySize: number;
    settingsCount: number;
    lastSaveMs: number;
    lastLoadMs: number;
    lastSaveOrgCount: number;
    saveCount: number;
    isReady: boolean;
  } {
    return {
      historySize: this.organisms.size,
      settingsCount: this.settingsCache.size,
      lastSaveMs: this.lastSaveMs,
      lastLoadMs: this.lastLoadMs,
      lastSaveOrgCount: this.lastSaveOrgCount,
      saveCount: this.saveCount,
      isReady: this.isReady,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE INTERNALS
  // ════════════════════════════════════════════════════════════════════════════

  // ── IndexedDB Operations ──────────────────────────────────────────────────

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.DB_STORE)) {
          db.createObjectStore(this.DB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.dbPromise;
  }

  private async idbPut(key: string, value: any): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.DB_STORE, 'readwrite');
      const store = tx.objectStore(this.DB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async idbGet(key: string): Promise<any | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.DB_STORE, 'readonly');
        const store = tx.objectStore(this.DB_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[VDB] idbGet failed for key:', key, e);
      return null;
    }
  }

  private async idbDelete(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.DB_STORE, 'readwrite');
        tx.objectStore(this.DB_STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch { /* best-effort */ }
  }

  // ── Tokenization ──────────────────────────────────────────────────────────
  // Reduces key length in serialized objects to minimize IndexedDB I/O.
  // IndexedDB uses structured clone which handles objects natively, but
  // shorter keys still reduce memory footprint and clone time.

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

  // ── History Persistence ───────────────────────────────────────────────────

  private debounceSaveHistory(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = (typeof window !== 'undefined' ? window : self as any).setTimeout(() => {
      this.saveHistory();
      this.saveTimeout = null;
    }, this.SAVE_DEBOUNCE_MS);
  }

  private saveHistory(): void {
    if (this.organisms.size > this.MAX_HISTORY_SIZE) {
      this.pruneHistory(this.MAX_HISTORY_SIZE);
    }

    // Prune memories to reduce payload
    this.organisms.forEach(org => {
      if (org.memories && org.memories.length > COGNITIVE_CONSTANTS.PERSISTENT_MEMORY_LIMIT) org.memories = org.memories.slice(-COGNITIVE_CONSTANTS.HISTORICAL_MEMORY_LIMIT);
    });

    const data = this.tokenize(Array.from(this.organisms.entries()));
    this.idbPut(IDB_KEY.HISTORY, data).catch(e =>
      console.warn('[VDB] History save failed', e)
    );
  }

  private pruneHistory(limit: number): void {
    if (this.organisms.size <= limit) return;
    const sorted = Array.from(this.organisms.entries())
      .sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
    this.organisms = new Map(sorted.slice(0, limit));
    this.refreshIndices();
  }

  // ── Index Management ──────────────────────────────────────────────────────

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

  // ── System Documents ──────────────────────────────────────────────────────

  private initDocs(): void {
    this.documents.push({
      id: 'doc_genetics', type: 'SYSTEM_DOC', timestamp: Date.now(),
      data: { title: 'Genetic Expression: Standardized Units', content: 'Trait values are expressed in metric units where applicable.' }
    });
    this.documents.push({
      id: 'doc_chronos', type: 'SYSTEM_DOC', timestamp: Date.now(),
      data: { title: 'Chronos Layer: Time Standardization', content: 'Simulation time is mapped to a 30-second Day-Night cycle.' }
    });
  }

  // ── Legacy Migration ──────────────────────────────────────────────────────
  /**
   * One-time migration from localStorage to IndexedDB.
   * Reads any existing localStorage data, writes it to IndexedDB, then
   * removes the localStorage keys. This ensures users upgrading from the
   * old localStorage-based system don't lose their data.
   *
   * ⚠️  This method should remain here indefinitely for backward compatibility.
   *     It is safe to call repeatedly — it only acts if localStorage data exists.
   */
  private async migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;

    let migrated = false;

    try {
      // Migrate sim state
      const stateStr = localStorage.getItem('ales_sim_state');
      if (stateStr) {
        const existing = await this.idbGet(IDB_KEY.STATE);
        if (!existing) {
          // Only migrate if IndexedDB doesn't already have data
          const state = JSON.parse(stateStr);
          await this.idbPut(IDB_KEY.STATE, state); // Already tokenized in localStorage
          migrated = true;
        }
        localStorage.removeItem('ales_sim_state');
      }

      // Migrate events
      const eventsStr = localStorage.getItem('ales_events_persistence');
      if (eventsStr) {
        const events = JSON.parse(eventsStr);
        this.eventsCache = this.detokenize(events);
        await this.idbPut(IDB_KEY.EVENTS, events);
        localStorage.removeItem('ales_events_persistence');
        migrated = true;
      }

      // Migrate history
      const historyStr = localStorage.getItem('ales_organisms_persistence');
      if (historyStr) {
        const existing = await this.idbGet(IDB_KEY.HISTORY);
        if (!existing) {
          const history = JSON.parse(historyStr);
          const detokenized = this.detokenize(history);
          this.organisms = new Map(detokenized);
          this.refreshIndices();
          await this.idbPut(IDB_KEY.HISTORY, history);
          migrated = true;
        }
        localStorage.removeItem('ales_organisms_persistence');
      }

      // Migrate settings
      const settingsStr = localStorage.getItem('ales_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        for (const [k, v] of Object.entries(settings)) {
          this.settingsCache.set(k, v);
        }
        await this.idbPut(IDB_KEY.SETTINGS, settings);
        localStorage.removeItem('ales_settings');
        migrated = true;
      }

      if (migrated) {
        console.log('[VDB] ✅ Migrated legacy localStorage data to IndexedDB');
      }
    } catch (e) {
      console.warn('[VDB] localStorage migration encountered errors (non-fatal)', e);
    }
  }
}

/**
 * Singleton instance.
 * ⚠️  You MUST call `await VectorDB.init()` before using any read methods.
 *     The constructor only opens the DB connection; init() hydrates caches.
 */
export const VectorDB = new VectorDatabase();
