import { FLORA_CONSTANTS } from '../../../core/Constants';

export const FERN_DNA_PROFILE = {
    // --- TEMPORAL CALIBRATION ---
    // A ratio of 1.0 (100%) means the plant reaches 100% maturity in exactly ONE SEASON (20 days).
    // This results in a base growth of 5% per game day.
    GROWTH_RATIO_UNIT: 1.0, // Base unit for seasonal mapping

    // --- GENETIC RANGE MANIFEST (Checks & Balances) ---
    // These traits are INTERLINKED during genome expression.
    TRAIT_RANGES: {
        // [Growth & Structure]
        growth_speed_ratio: [1.0, 3.0], // 10% to 100% of seasonal speed
        complexity: [8, 10],            // Max branching segments (Costs Mass)

        // [Physical Mass]
        stem_thickness: [1.0, 3.0],     // Base weight (Costs Speed, Benefits Nutrients)
        leaf_size: [2.0, 8.0],          // Surface area (Costs Speed, Benefits Nutrients)

        // [Ecological]
        clump_radius: [10, 30],         // Propagation density
        persistence: [5000, 15000],     // Frames before biological wilting
        hue: [80, 140]                  // Species-specific aesthetic range
    },

    // --- INTERLINKING MULTIPLIERS (Synced to Central Constants) ---
    MASS_TO_ENERGY_FACTOR: FLORA_CONSTANTS.MASS_TO_ENERGY_SCALAR,
    MASS_PENALTY_FACTOR: FLORA_CONSTANTS.GROWTH_MASS_PENALTY,

    // --- CENTRAL ECOLOGICAL BALANCING (Synced to Central Constants) ---
    BASE_NUTRIENT_MIN: FLORA_CONSTANTS.NUTRIENT_BASE_MULTIPLIER,
};

export const DIRECTIONS = [
    { x: 0, y: -1 },  // N
    { x: 1, y: -1 },  // NE
    { x: 1, y: 0 },   // E
    { x: 1, y: 1 },   // SE
    { x: 0, y: 1 },   // S
    { x: -1, y: 1 },  // SW
    { x: -1, y: 0 },  // W
    { x: -1, y: -1 }  // NW
];
