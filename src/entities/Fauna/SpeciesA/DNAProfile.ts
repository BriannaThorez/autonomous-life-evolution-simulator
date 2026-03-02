import { TraitName } from '../../../../types';
import { SIM_CONSTANTS, DEFAULT_TRAIT_RANGES } from '../../../core/Constants';

export const SPECIES_A_DNA = {
    // --- GROWTH & REPRO ---
    REPRODUCTION_THRESHOLD: 4500,
    // Birth cost and Initial Birth Energy calculated by ReproductionEngine.ts
    // --- TRAIT RANGES ---
    TRAIT_RANGES: {
        speed: DEFAULT_TRAIT_RANGES.speed,
        size: DEFAULT_TRAIT_RANGES.size,
        metabolism: DEFAULT_TRAIT_RANGES.metabolism,
        sight_range: DEFAULT_TRAIT_RANGES.sight_range,
        sight_fov: [(DEFAULT_TRAIT_RANGES.sight_fov[0] * 180) / Math.PI, (DEFAULT_TRAIT_RANGES.sight_fov[1] * 180) / Math.PI],
        lifespan: DEFAULT_TRAIT_RANGES.lifespan,
        audible_range: DEFAULT_TRAIT_RANGES.audible_range,
        communicating_range: DEFAULT_TRAIT_RANGES.communicating_range,
    } as Record<TraitName, [number, number]>
};
