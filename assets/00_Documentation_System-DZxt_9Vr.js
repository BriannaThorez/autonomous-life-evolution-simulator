const e=`# Documentation System

## Purpose

The built-in documentation system keeps executable state, operator-facing explanation, and manifest state close enough that drift is visible and fixable.

## Axiomatic Intent

- Provide an in-app index of Markdown documents stored in \`src/documentation/\`.
- Preserve a low-drift path from code to manifest to readable documentation.
- Make architecture, protocol, and feature state available without leaving the simulator UI.

Operationally, the system works like this:

1. \`DocumentationViewer.tsx\` indexes \`src/documentation/**/*.md\`.
2. Documents are grouped by their top-level folder.
3. Markdown content is lazy-loaded and rendered in-app.
4. \`app_manifest/app_manifest.YAML\` remains the canonical feature ledger.

## Axiological Intent

The value of this system is continuity. ALES already has enough rendering, worker, persistence, and UI complexity that undocumented behavior turns into folklore quickly. The documentation surface exists to preserve shared memory for future implementation, debugging, and rollback.

## Source of Truth Rules

- \`app_manifest/app_manifest.YAML\` is the canonical record of implemented, staged, and pending features.
- \`src/documentation/\` is the human-readable projection of that state.
- Protocol task documents define how roadmap, sync, implementation, and verification work.
- The in-app documentation viewer is the runtime surface for reading those documents.

## Session Updates

- The documentation viewer is now reachable from the app command cluster.
- The architecture overview has been replaced with a current-state document.
- Manifest-sync protocol docs now reference the YAML manifest path instead of the obsolete \`app_manifest.py\`.
- Oracle documentation now reflects the actual build state: staged UI shell present, live model integration deferred.\r
`;export{e as default};
