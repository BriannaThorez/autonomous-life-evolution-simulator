const r=`/**\r
 * ╔══════════════════════════════════════════════════════════════════════════╗\r
 * ║  VectorDB — Atomic IndexedDB Persistence Layer                           ║\r
 * ║                                                                         ║\r
 * ║  ARCHITECTURE: Atomic Write-Behind Cache                                ║\r
 * ║  ─────────────────────────────────────────────────────────────────────── ║\r
 * ║  • Individual organism records (no giant blobs)                          ║\r
 * ║  • Dirty-flag change tracking for non-blocking I/O                      ║\r
 * ║  • Scalability for 2500+ entities via multi-store transactions           ║\r
 * ╚══════════════════════════════════════════════════════════════════════════╝\r
 */\r
\r
import { OrganismData } from '../../types';\r
import { COGNITIVE_CONSTANTS } from '../core/Constants';\r
\r
export type AssetType = 'ORGANISM' | 'Flora_DEFINITION' | 'SYSTEM_DOC';\r
\r
export interface VectorAsset {\r
  id: string;\r
  type: AssetType;\r
  data: any;\r
  timestamp: number;\r
}\r
\r
const TOKEN_MAP: Record<string, string> = {\r
  "organisms": "o", "Flora": "f", "position": "p", "velocity": "v",\r
  "expressedStats": "es", "genome": "g", "traits": "tr", "memories": "m",\r
  "id": "i", "timestamp": "t", "energy": "e", "age": "a",\r
  "generation": "gn", "matingCount": "mc", "matingTimer": "mt",\r
  "matingTargetId": "mti", "firstName": "fn", "surname": "sn",\r
  "name": "n", "color": "c", "bending": "b", "parentId": "pi",\r
  "parentA_Id": "pa", "parentB_Id": "pb",\r
  "growthState": "gs", "complexity": "cx", "lifetime": "lt",\r
  "biome": "bm", "type": "tp",\r
  "config": "cfg", "initialPopulation": "ip", "initialEnergy": "ie",\r
  "traitRanges": "trr"\r
};\r
const REVERSE_TOKEN_MAP = Object.fromEntries(Object.entries(TOKEN_MAP).map(([k, v]) => [v, k]));\r
\r
const IDB_KEY = {\r
  STATE: 'ales_sim_state',       // Global simulation parameters (Flora, config, etc.)\r
  SETTINGS: 'ales_settings',     // User UI preferences\r
} as const;\r
\r
class VectorDatabase {\r
  private organisms: Map<string, OrganismData & { isAlive: boolean }> = new Map();\r
  private documents: VectorAsset[] = [];\r
  private settingsCache: Map<string, any> = new Map();\r
  private eventsCache: any[] = [];\r
  private dirtyOrganisms: Set<string> = new Set();\r
\r
  private surnameIndex: Map<string, Set<string>> = new Map();\r
  private familyCountIndex: Map<string, number> = new Map();\r
\r
  private SAVE_DEBOUNCE_MS = 1000;\r
  private saveTimeout: any = null;\r
\r
  private DB_NAME = 'ales_persistence_v2'; // Bumped version for structural shift\r
  private DB_STORES = {\r
    ORGANISMS: 'organisms',\r
    EVENTS: 'events',\r
    SYSTEM: 'system' // For state and settings\r
  };\r
  private DB_VERSION = 1;\r
  private dbPromise: Promise<IDBDatabase> | null = null;\r
\r
  public isReady = false;\r
  public lastSaveMs = 0;\r
  public lastLoadMs = 0;\r
  public lastSaveOrgCount = 0;\r
  public saveCount = 0;\r
\r
  constructor() {\r
    this.initDocs();\r
    // Don't eagerly open — let init() handle it\r
  }\r
\r
  async init(): Promise<void> {\r
    if (this.isReady) return;\r
    const t0 = performance.now();\r
    try {\r
      console.log("[VDB] Opening Database...");\r
      const db = await this.openDB();\r
      console.log("[VDB] Database opened. Fetching stores...");\r
\r
      // Parallel hydration of caches\r
      const [systemStore, organismsStore, eventsStore] = await Promise.all([\r
        this.getAllFromStore(this.DB_STORES.SYSTEM),\r
        this.getAllFromStore(this.DB_STORES.ORGANISMS),\r
        this.getAllFromStore(this.DB_STORES.EVENTS)\r
      ]);\r
      console.log(\`[VDB] Stores fetched: System(\${systemStore.length}), Organisms(\${organismsStore.length}), Events(\${eventsStore.length})\`);\r
\r
      // Hydrate System (Settings & State)\r
      systemStore.forEach(({ key, value }) => {\r
        if (key === IDB_KEY.SETTINGS) {\r
          Object.entries(value).forEach(([k, v]) => this.settingsCache.set(k, v));\r
        }\r
      });\r
\r
      // Hydrate Organisms (Atomic Load)\r
      console.log("[VDB] Detokenizing organisms...");\r
      organismsStore.forEach(({ key, value }) => {\r
        try {\r
          const org = this.detokenize(value);\r
          this.organisms.set(org.id, org);\r
        } catch (e) {\r
          console.error(\`[VDB] Hydration Error: Failed to detokenize organism \${key}\`, e);\r
        }\r
      });\r
      console.log("[VDB] Refreshing indices...");\r
      this.refreshIndices();\r
\r
      // Hydrate Events\r
      console.log("[VDB] Detokenizing events...");\r
      this.eventsCache = this.detokenize(eventsStore.map(e => e.value));\r
      console.log("[VDB] Hydration complete.");\r
\r
    } catch (e) {\r
      console.warn('[VDB] init() failed, check IndexedDB state', e);\r
    }\r
\r
    this.isReady = true;\r
    this.lastLoadMs = performance.now() - t0;\r
    console.log(\`[VDB] Init complete in \${this.lastLoadMs.toFixed(1)}ms (\${this.organisms.size} records)\`);\r
  }\r
\r
  // ── Settings ──────────────────────────────────────────────────────────────\r
\r
  getSetting(key: string, defaultValue: any): any {\r
    const val = this.settingsCache.get(key);\r
    return val !== undefined ? val : defaultValue;\r
  }\r
\r
  setSetting(key: string, value: any): void {\r
    this.settingsCache.set(key, value);\r
    const obj = Object.fromEntries(this.settingsCache);\r
    this.idbPut(this.DB_STORES.SYSTEM, IDB_KEY.SETTINGS, obj).catch(() => { });\r
  }\r
\r
  // ── Simulation State ──────────────────────────────────────────────────────\r
\r
  /**\r
   * Saves the simulation state to IndexedDB.\r
   * Optimizations:\r
   * 1. Uses requestIdleCallback (if available) to avoid blocking the main thread.\r
   * 2. Tokenizes while cloning to avoid redundant JSON.stringify/parse.\r
   * 3. Prunes non-essential data (expressedStats) during tokenization.\r
   */\r
  saveSimState(state: any): void {\r
    const runSave = () => {\r
      const t0 = performance.now();\r
\r
      // Deep clone & tokenize in one pass (Pruning included)\r
      const tokenized = this.tokenizeAndPrune(state);\r
\r
      const orgCount = state.organisms?.length || 0;\r
\r
      this.idbPut(this.DB_STORES.SYSTEM, IDB_KEY.STATE, tokenized).then(() => {\r
        this.lastSaveMs = performance.now() - t0;\r
        this.lastSaveOrgCount = orgCount;\r
        this.saveCount++;\r
\r
        // Background sync living history (Atomic)\r
        if (state.organisms) {\r
          this.syncLiving(state.organisms);\r
        }\r
      }).catch(() => { });\r
    };\r
\r
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {\r
      (window as any).requestIdleCallback(() => runSave(), { timeout: 2000 });\r
    } else {\r
      setTimeout(runSave, 0);\r
    }\r
  }\r
\r
  /**\r
   * Combined Tokenizer, Cloner, and Pruner.\r
   * Removes expressedStats and truncates memories to keep DB size manageable.\r
   */\r
  private tokenizeAndPrune(obj: any): any {\r
    if (obj === null || typeof obj !== 'object') return obj;\r
\r
    // Handle Arrays\r
    if (Array.isArray(obj)) {\r
      return obj.map(v => this.tokenizeAndPrune(v));\r
    }\r
\r
    // Handle Objects\r
    const tokenized: any = {};\r
    for (const key in obj) {\r
      // --- PRUNING RULES ---\r
      if (key === 'expressedStats') continue;\r
      if (key === 'events') continue; // Events handled separately\r
\r
      const token = TOKEN_MAP[key] || key;\r
      let value = obj[key];\r
\r
      // Memory Truncation for persistence\r
      if (key === 'memories' && Array.isArray(value)) {\r
        if (value.length > COGNITIVE_CONSTANTS.PERSISTENT_MEMORY_LIMIT) {\r
          value = value.slice(-COGNITIVE_CONSTANTS.PERSISTENT_MEMORY_LIMIT);\r
        }\r
      }\r
\r
      tokenized[token] = this.tokenizeAndPrune(value);\r
    }\r
    return tokenized;\r
  }\r
\r
  async loadSimState(): Promise<any | null> {\r
    try {\r
      const saved = await this.idbGet(this.DB_STORES.SYSTEM, IDB_KEY.STATE);\r
      if (saved) {\r
        const state = this.detokenize(saved);\r
        state.events = this.eventsCache;\r
        return state;\r
      }\r
    } catch { return null; }\r
    return null;\r
  }\r
\r
  // ── Organism History ──────────────────────────────────────────────────────\r
\r
  syncLiving(organisms: (OrganismData & { isAlive?: boolean })[]): void {\r
    organisms.forEach(org => {\r
      const existing = this.organisms.get(org.id);\r
      if (existing) {\r
        this.organisms.set(org.id, {\r
          ...existing,\r
          age: org.age,\r
          energy: org.energy,\r
          matingCount: org.matingCount,\r
          isAlive: true\r
        });\r
      } else {\r
        this.organisms.set(org.id, { ...org, isAlive: true, memories: [] });\r
        this.updateIndicesFor(org);\r
      }\r
      this.dirtyOrganisms.add(org.id);\r
    });\r
    this.debounceSave();\r
  }\r
\r
  public pushToHistory(entityId: string, memory: any): void {\r
    const org = this.organisms.get(entityId);\r
    if (!org) return;\r
\r
    if (!org.memories) org.memories = [];\r
\r
    // --- CONSOLIDATION LOGIC ---\r
    // If the last memory was similar (e.g., eating), consolidate it\r
    const lastMem = org.memories[org.memories.length - 1];\r
    if (lastMem && memory.content.includes('Energy') && lastMem.content.includes('Energy')) {\r
      const match = lastMem.content.match(/Harvested (\\d+)x Energy/);\r
      const currentAmount = match ? parseInt(match[1]) : 1;\r
      lastMem.content = \`Harvested \${currentAmount + 1}x Energy\`;\r
      lastMem.timestamp = Date.now();\r
    } else {\r
      if (!org.memories.some(m => m.id === memory.id)) {\r
        org.memories.push(memory);\r
      }\r
    }\r
\r
    const limit = 200; // High limit for atomic records\r
    if (org.memories.length > limit) org.memories.shift();\r
\r
    this.dirtyOrganisms.add(entityId);\r
    this.debounceSave();\r
  }\r
\r
  markDeceased(id: string, finalData?: OrganismData): void {\r
    const org = this.organisms.get(id);\r
    if (org) {\r
      if (finalData) {\r
        this.organisms.set(id, { ...finalData, isAlive: false });\r
      } else {\r
        org.isAlive = false;\r
      }\r
      this.dirtyOrganisms.add(id);\r
      this.debounceSave();\r
    }\r
  }\r
\r
  addHistory(org: OrganismData): void {\r
    this.organisms.set(org.id, { ...org, isAlive: true });\r
    this.updateIndicesFor(org);\r
    this.dirtyOrganisms.add(org.id);\r
    this.debounceSave();\r
  }\r
\r
  getHistory(): OrganismData[] {\r
    return Array.from(this.organisms.values()).sort((a, b) => b.generation - a.generation);\r
  }\r
\r
  getFamilyCount(firstName: string, surname: string): number {\r
    return this.familyCountIndex.get(\`\${firstName}_\${surname}\`) || 0;\r
  }\r
\r
  getEvents(): any[] { return this.eventsCache; }\r
  getAssets(): VectorAsset[] { return this.documents; }\r
\r
  // ── Persistence Internals ─────────────────────────────────────────────────\r
\r
  private debounceSave(): void {\r
    if (this.saveTimeout) clearTimeout(this.saveTimeout);\r
    this.saveTimeout = setTimeout(() => this.flushDirty(), this.SAVE_DEBOUNCE_MS);\r
  }\r
\r
  private async flushDirty(): Promise<void> {\r
    if (this.dirtyOrganisms.size === 0) return;\r
\r
    const db = await this.openDB();\r
    const tx = db.transaction(this.DB_STORES.ORGANISMS, 'readwrite');\r
    const store = tx.objectStore(this.DB_STORES.ORGANISMS);\r
\r
    const snapshot = Array.from(this.dirtyOrganisms);\r
    this.dirtyOrganisms.clear();\r
\r
    snapshot.forEach(id => {\r
      const org = this.organisms.get(id);\r
      if (org) {\r
        const tokenized = this.tokenize({ ...org, lastSaved: Date.now() });\r
        store.put(tokenized, id);\r
      }\r
    });\r
\r
    tx.oncomplete = () => {\r
      console.log(\`[VDB] Atomic flush complete: \${snapshot.length} records persisted.\`);\r
    };\r
  }\r
\r
  private async saveEventsBatch(events: any[]): Promise<void> {\r
    const db = await this.openDB();\r
    return new Promise((resolve, reject) => {\r
      const tx = db.transaction(this.DB_STORES.EVENTS, 'readwrite');\r
      const store = tx.objectStore(this.DB_STORES.EVENTS);\r
      store.clear();\r
      events.forEach((ev, idx) => store.put(this.tokenize(ev), idx));\r
      tx.oncomplete = () => resolve();\r
      tx.onerror = () => reject(tx.error);\r
    });\r
  }\r
\r
  // ── IndexedDB Plumbing ────────────────────────────────────────────────────\r
\r
  private openDB(): Promise<IDBDatabase> {\r
    if (this.dbPromise) return this.dbPromise;\r
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {\r
      if (typeof indexedDB === 'undefined') return reject('No IndexedDB');\r
\r
      // Timeout: if IDB is blocked/stuck for >3s, reject so app can launch\r
      const timeout = setTimeout(() => {\r
        console.error('[VDB] openDB timeout — IndexedDB may be blocked by another tab.');\r
        reject(new Error('IndexedDB open timeout'));\r
      }, 3000);\r
\r
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);\r
      req.onupgradeneeded = () => {\r
        const db = req.result;\r
        Object.values(this.DB_STORES).forEach(s => {\r
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);\r
        });\r
      };\r
      req.onsuccess = () => { clearTimeout(timeout); resolve(req.result); };\r
      req.onerror = () => { clearTimeout(timeout); reject(req.error); };\r
      req.onblocked = () => {\r
        console.warn('[VDB] IndexedDB blocked — close other tabs using this app.');\r
        clearTimeout(timeout);\r
        reject(new Error('IndexedDB blocked'));\r
      };\r
    }).catch(e => {\r
      // Reset promise so future calls can retry\r
      this.dbPromise = null;\r
      throw e;\r
    });\r
    return this.dbPromise;\r
  }\r
\r
  private async idbPut(storeName: string, key: string, value: any): Promise<void> {\r
    const db = await this.openDB();\r
    return new Promise((resolve, reject) => {\r
      const tx = db.transaction(storeName, 'readwrite');\r
      tx.objectStore(storeName).put(value, key);\r
      tx.oncomplete = () => resolve();\r
      tx.onerror = () => reject(tx.error);\r
    });\r
  }\r
\r
  private async idbGet(storeName: string, key: string): Promise<any | null> {\r
    const db = await this.openDB();\r
    return new Promise((resolve, reject) => {\r
      const tx = db.transaction(storeName, 'readonly');\r
      const req = tx.objectStore(storeName).get(key);\r
      req.onsuccess = () => resolve(req.result ?? null);\r
      req.onerror = () => reject(req.error);\r
    });\r
  }\r
\r
  private async getAllFromStore(storeName: string): Promise<{ key: string, value: any }[]> {\r
    const db = await this.openDB();\r
    return new Promise((resolve, reject) => {\r
      const tx = db.transaction(storeName, 'readonly');\r
      const store = tx.objectStore(storeName);\r
      const req = store.getAll();\r
      const keyReq = store.getAllKeys();\r
      tx.oncomplete = () => {\r
        const values = req.result;\r
        const keys = keyReq.result as string[];\r
        resolve(values.map((v, i) => ({ key: keys[i], value: v })));\r
      };\r
      tx.onerror = () => reject(tx.error);\r
    });\r
  }\r
\r
  hardReset(): void {\r
    this.openDB().then(db => {\r
      const tx = db.transaction(Object.values(this.DB_STORES), 'readwrite');\r
      Object.values(this.DB_STORES).forEach(s => tx.objectStore(s).clear());\r
    });\r
    this.organisms.clear();\r
    this.settingsCache.clear();\r
    this.eventsCache = [];\r
    this.refreshIndices();\r
  }\r
\r
  // ── Utils ─────────────────────────────────────────────────────────────────\r
\r
  private tokenize(obj: any): any {\r
    if (Array.isArray(obj)) return obj.map(v => this.tokenize(v));\r
    if (obj !== null && typeof obj === 'object') {\r
      const tokenized: any = {};\r
      for (const key in obj) {\r
        const token = TOKEN_MAP[key] || key;\r
        tokenized[token] = this.tokenize(obj[key]);\r
      }\r
      return tokenized;\r
    }\r
    return obj;\r
  }\r
\r
  private detokenize(obj: any): any {\r
    if (Array.isArray(obj)) return obj.map(v => this.detokenize(v));\r
    if (obj !== null && typeof obj === 'object') {\r
      const detokenized: any = {};\r
      for (const key in obj) {\r
        const originalKey = REVERSE_TOKEN_MAP[key] || key;\r
        detokenized[originalKey] = this.detokenize(obj[key]);\r
      }\r
      return detokenized;\r
    }\r
    return obj;\r
  }\r
\r
  private updateIndicesFor(org: OrganismData): void {\r
    const existing = this.surnameIndex.get(org.surname) || new Set();\r
    existing.add(org.id);\r
    this.surnameIndex.set(org.surname, existing);\r
    const familyKey = \`\${org.firstName}_\${org.surname}\`;\r
    this.familyCountIndex.set(familyKey, (this.familyCountIndex.get(familyKey) || 0) + 1);\r
  }\r
\r
  private refreshIndices(): void {\r
    this.surnameIndex.clear();\r
    this.familyCountIndex.clear();\r
    this.organisms.forEach(org => this.updateIndicesFor(org));\r
  }\r
\r
  private initDocs(): void {\r
    this.documents.push({\r
      id: 'doc_genetics', type: 'SYSTEM_DOC', timestamp: Date.now(),\r
      data: { title: 'Genetic Expression: Standardized Units', content: 'Trait values are expressed in metric units where applicable.' }\r
    });\r
  }\r
}\r
\r
export const VectorDB = new VectorDatabase();\r
`;export{r as default};
