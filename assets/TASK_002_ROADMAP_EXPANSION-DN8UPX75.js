const e=`# TASK_002: Roadmap Expansion Protocol

This document defines how feature vectors from the live manifest are expanded into roadmap-grade implementation plans.

## Axiomatic Intent

Read from \`app_manifest/app_manifest.YAML\`, isolate a feature or gap, and convert it into a phased roadmap artifact with minimal semantic drift from the codebase and manifest.

## Axiological Intent

Roadmap entries are not generic tasks. They are intent-preserving bridges between the current simulator and the next stable state, so future work stays connected to the app's biological, architectural, and UX priorities.

## Active Contract

\`\`\`yaml
protocol_id: "[SYS_AXIOM_UNIFIED]"
task_id: "TASK_002_ROADMAP_EXPANSION"
source_of_truth: "app_manifest/app_manifest.YAML"
output: "roadmap-grade YAML artifact"
\`\`\`

## Procedural Logic

1. Read the target feature vector from \`app_manifest/app_manifest.YAML\`.
2. Compare it to implemented code and existing documentation.
3. Split the work into phased slices that can be validated independently.
4. Preserve the feature's stated axiomatic intent in every phase.
5. Emit a roadmap artifact that can be consumed by \`TASK_004_DYNAMIC_IMPLEMENTATION\`.

## Verification Rule

The roadmap is valid only if its meaning still matches the manifest entry it came from and it does not invent unimplemented capabilities.\r
`;export{e as default};
