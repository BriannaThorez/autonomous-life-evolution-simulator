const e=`# TASK_003: Manifest Synchronization Protocol

This protocol keeps \`app_manifest/app_manifest.YAML\` aligned with the implemented simulator, its documentation, and its roadmap state.

## Axiomatic Intent

For every code or documentation change that affects project state, update the YAML manifest so it remains the single canonical ledger of implemented, staged, and pending features.

## Axiological Intent

The manifest protects continuity. Without it, the simulator's architecture, promises, and real feature state diverge into memory and guesswork. Sync work preserves trust across code, docs, and future sessions.

## Active Contract

\`\`\`yaml
protocol_id: "[SYS_AXIOM_UNIFIED]"
task_id: "TASK_003_MANIFEST_SYNC"
source_of_truth: "app_manifest/app_manifest.YAML"
output: "updated YAML manifest"
\`\`\`

## Procedural Logic

1. Inspect the codebase and in-app docs for state changes.
2. Identify which manifest fields are now inaccurate, missing, or overstated.
3. Update only the affected manifest regions.
4. Preserve semantic parity between manifest language and implemented behavior.
5. Re-check that documentation and manifest describe the same system.

## Verification Rule

Manifest sync is complete only when implemented features, disabled features, and future roadmap items are clearly separated and no entry claims functionality that is not present in the build.\r
`;export{e as default};
