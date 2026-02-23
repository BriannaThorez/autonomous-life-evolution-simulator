
import { TraitName } from '../../../../types';
import { SIM_CONSTANTS } from '../../../core/Constants';
import { ReproductionEngine } from '../ReproductionEngine';

export const SPECIES_A_DNA = {
    // --- GROWTH & REPRO ---
    REPRODUCTION_THRESHOLD: 4500,
    // Birth cost is and Initial Birth Energy calculated by ReproductionEngine.ts
    // --- TRAIT RANGES (In Real-World Units) ---
    // These are converted to internal units in GeneticsEngine
    TRAIT_RANGES: {
        speed: [2.8, 3.2],          // m/s
        size: [75, 85],             // cm
        metabolism: [0.8, 1.0],     // Efficiency multiplier (80% - 100%)
        sight_range: [9, 15],        // meters
        sight_fov: [65, 85],         // degrees
        lifespan: [20 * SIM_CONSTANTS.FRAMES_PER_DAY, 30 * SIM_CONSTANTS.FRAMES_PER_DAY], // Internal frames
        audible_range: [2.5, 3.5],    // meters (Default 3 +/- 0.5)
        communicating_range: [1.5, 2.5], // meters (Default 1-1.5)
    } as Record<TraitName, [number, number]>
};
