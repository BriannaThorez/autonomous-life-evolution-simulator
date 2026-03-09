const e=`# ALES Overview

## Current State

Autonomous Life Evolution Simulator (ALES) is currently a worker-driven, WebGL2-rendered ecosystem sandbox with persistent lineage and memory history. The app already contains a stable simulation loop, a persistent historical registry, layered observation tooling, and a staged Oracle surface for future server-backed assistance.

## Core Runtime

- \`SimulationCanvas.tsx\` transfers the canvas to \`worker/sim.worker.ts\` through \`OffscreenCanvas\`.
- Camera pan, zoom, follow-mode, and hit testing are bridged between the UI thread and the worker.
- \`SimulationEngine.ts\` remains the deterministic state core for organism updates, events, and saves.
- Rendering is handled by the custom WebGL2 stack in \`rendering/WebGLRenderer.ts\`, not by Three.js.

## Persistence and Memory

- \`VectorDB.ts\` is the IndexedDB persistence layer for simulation state, settings, event history, and organism records.
- Persistence uses tokenized payloads plus atomic record writes instead of a single giant snapshot blob.
- Short-term memory lives on active organisms; long-term memory and lineage history are persisted through the registry path.
- The entity inspector now compresses repeat memory noise into readable stacks and keeps familiar-bond memories pinned so salient social context stays visible.

## Operator Surfaces

- \`ChronosHUD\`, \`ApexRegistry\`, \`NotificationPanel\`, \`SettingsModal\`, and \`SensoryDropdown\` form the primary observation deck.
- \`VectorDBVisualizer\` acts as the Neural Registry for browsing organism history, traits, memories, and system configuration.
- The built-in documentation viewer loads Markdown from \`src/documentation/\`.

## Oracle Status

The Oracle exists as a staged interface, not an active model integration. The draggable button, panel shell, and status messaging are implemented, but \`useChat.ts\` intentionally returns an offline state and points toward a future secure login-backed path. Documentation and manifest entries should describe it that way until the backend is real.

## Current Direction

The next major roadmap vector remains a richer external cognitive engine based on vector-state persona modeling. That work should build on the current worker, registry, and documentation surfaces instead of replacing them.\r
`;export{e as default};
