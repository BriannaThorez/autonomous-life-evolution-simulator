import { SimulationState, OrganismData, FloraData } from '../../../types';

export class SystemObserver {
    static getBiosphereSummary(state: SimulationState): string {
        const orgCount = state.organisms.length;
        const floraCount = state.Flora.length;
        const totalFloraEnergy = state.Flora.reduce((acc, f) => acc + (f.energyValue * f.growthState), 0);

        // Species diversity (unique surnames)
        const surnames = new Set(state.organisms.map(o => o.surname));
        const diversity = surnames.size;

        // Genetic trends (averages)
        const avgSpeed = orgCount > 0
            ? state.organisms.reduce((acc, o) => acc + o.expressedStats.speed, 0) / orgCount
            : 0;
        const avgLifespan = orgCount > 0
            ? state.organisms.reduce((acc, o) => acc + o.expressedStats.lifespan, 0) / orgCount
            : 0;

        // Top Apex candidates
        const topApex = state.apexCandidates.slice(0, 3).map(o => o.name).join(', ');

        return `
### Biosphere Status (Day ${state.day}, Hour ${state.hour})
- **Population**: ${orgCount} organisms (${diversity} lineages)
- **Environment**: ${floraCount} flora units (Total Energy: ${totalFloraEnergy.toFixed(0)})
- **Season**: ${state.season} (Cycle ${state.cycle})
- **Genetic Averages**: Speed: ${avgSpeed.toFixed(2)}, Lifespan: ${avgLifespan.toFixed(0)} ticks
- **Top Apex**: ${topApex || 'None'}
    `.trim();
    }

    static getModuleMap(): string {
        return `
### Codebase Architecture
- **Core Engine**: \`src/core/SimulationEngine.ts\` (Main loop, physics, spawning)
- **Entity Logic**:
  - Organisms: \`src/entities/Fauna/Cognition/Brain.ts\`
  - Flora: \`src/entities/Flora/Fern/Logic.ts\`
- **Data Layer**: \`src/data/VectorDB.ts\` (Persistence/Memory)
- **UI System**: \`src/App.tsx\`, \`src/components/SimulationCanvas.tsx\`
    `.trim();
    }
}
