const n=`import { TraitName } from '../../../../types';\r
import { SIM_CONSTANTS, DEFAULT_TRAIT_RANGES } from '../../../core/Constants';\r
\r
export const SPECIES_A_DNA = {\r
    // --- GROWTH & REPRO ---\r
    REPRODUCTION_THRESHOLD: 4500,\r
    // Birth cost and Initial Birth Energy calculated by ReproductionEngine.ts\r
    // --- TRAIT RANGES ---\r
    TRAIT_RANGES: {\r
        speed: DEFAULT_TRAIT_RANGES.speed,\r
        size: DEFAULT_TRAIT_RANGES.size,\r
        metabolism: DEFAULT_TRAIT_RANGES.metabolism,\r
        sight_range: DEFAULT_TRAIT_RANGES.sight_range,\r
        sight_fov: [(DEFAULT_TRAIT_RANGES.sight_fov[0] * 180) / Math.PI, (DEFAULT_TRAIT_RANGES.sight_fov[1] * 180) / Math.PI],\r
        lifespan: DEFAULT_TRAIT_RANGES.lifespan,\r
        audible_range: DEFAULT_TRAIT_RANGES.audible_range,\r
        communicating_range: DEFAULT_TRAIT_RANGES.communicating_range,\r
    } as Record<TraitName, [number, number]>\r
};\r
`;export{n as default};
