# Memory Persistence Architecture (VectorDB v2)

The ALES memory system has been reconstructed to support high-performance scaling for 2500+ organisms using a multi-store atomic persistence model based on industry-standard IndexedDB practices.

## 🚀 The Persistence Lifecycle

### 1. Initialization Sequence
The `init()` method in `index.tsx` is strictly awaited before the React application mounts. This guarantees that the in-memory cache is fully hydrated from disk, preventing "empty bridge" scenarios where a fresh simulation state overwrites existing data before it can be loaded.

### 2. Write-Behind Atomic Synchronization
Instead of serializing the entire history as a single JSON blob, organisms are stored as **individual records** in an atomic `organisms` object store.
- **Change Tracking**: A `dirtyOrganisms` Set tracks only modified entities.
- **Batched Flushes**: A debounced `flushDirty()` method commits changes in batches rather than on every tick, reducing I/O contention.
- **Non-blocking**: Writes happen asynchronously in the background.

### 3. Hydration & Resilience
- **Hydration Error Boundaries**: Each organism record is detokenized within a granular try-catch block. A corrupt record in one entity will NOT cause data loss for the rest of the biosphere.
- **Persistence Validation**: Every record includes a `lastSaved` timestamp and a validation check during detokenization.

## 🧠 Memory Systems

### Short-to-Long Term Relay
Short-term memories generated during the simulation are immediately relayed from the `SimWorker` to the main thread's `VectorDB`. The `pushToHistory` method then handles long-term storage assignment.

### Event Consolidation
To prevent database bloat from high-frequency, low-value events (e.g., harvesting energy), a consolidation layer groups repetitive entries:
- **Consolidation**: Instead of multiple "Harvested Energy" entries, they are collapsed into a single "Harvested Nx Energy" record.

## 🛠️ Scaling & Storage

### No automatic pruning
Automatic history pruning based on size has been **disabled**. Lineage and memory records are preserved indefinitely until a manual **Hard Reset** is performed via the GUI.

### Multi-Store Layout
- `system`: Stores global simulation state and user preferences.
- `organisms`: Atomic key-value store for total biosphere history.
- `events`: Sequential store for the centralized event log.

## ⚠️ Standards & Compliance
- **Zero LocalStorage**: The application uses 0% localStorage for simulation data, relying entirely on the IndexedDB `ales_persistence_v2` database.
- **Tokenization**: Compact keys are used to minimize structured clone overhead and disk footprint.
