const e=`import { SimulationState, OrganismData, FloraData } from '../../../types';\r
\r
export class SystemObserver {\r
    static getBiosphereSummary(state: SimulationState): string {\r
        const orgCount = state.organisms.length;\r
        const floraCount = state.Flora.length;\r
        const totalFloraEnergy = state.Flora.reduce((acc, f) => acc + (f.energyValue * f.growthState), 0);\r
\r
        // Species diversity (unique surnames)\r
        const surnames = new Set(state.organisms.map(o => o.surname));\r
        const diversity = surnames.size;\r
\r
        // Genetic trends (averages)\r
        const avgSpeed = orgCount > 0\r
            ? state.organisms.reduce((acc, o) => acc + o.expressedStats.speed, 0) / orgCount\r
            : 0;\r
        const avgLifespan = orgCount > 0\r
            ? state.organisms.reduce((acc, o) => acc + o.expressedStats.lifespan, 0) / orgCount\r
            : 0;\r
\r
        // Top Apex candidates\r
        const topApex = state.apexCandidates.slice(0, 3).map(o => o.name).join(', ');\r
\r
        return \`\r
### Biosphere Status (Day \${state.day}, Hour \${state.hour})\r
- **Population**: \${orgCount} organisms (\${diversity} lineages)\r
- **Environment**: \${floraCount} flora units (Total Energy: \${totalFloraEnergy.toFixed(0)})\r
- **Season**: \${state.season} (Cycle \${state.cycle})\r
- **Genetic Averages**: Speed: \${avgSpeed.toFixed(2)}, Lifespan: \${avgLifespan.toFixed(0)} ticks\r
- **Top Apex**: \${topApex || 'None'}\r
    \`.trim();\r
    }\r
\r
    static getModuleMap(): string {\r
        return \`\r
### Codebase Architecture\r
- **Core Engine**: \\\`src/core/SimulationEngine.ts\\\` (Main loop, physics, spawning)\r
- **Entity Logic**:\r
  - Organisms: \\\`src/entities/Fauna/Cognition/Brain.ts\\\`\r
  - Flora: \\\`src/entities/Flora/Fern/Logic.ts\\\`\r
- **Data Layer**: \\\`src/data/VectorDB.ts\\\` (Persistence/Memory)\r
- **UI System**: \\\`src/App.tsx\\\`, \\\`src/components/SimulationCanvas.tsx\\\`\r
    \`.trim();\r
    }\r
}\r
`;export{e as default};
