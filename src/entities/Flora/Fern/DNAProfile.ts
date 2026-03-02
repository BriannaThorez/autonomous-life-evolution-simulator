import { FloraGenome } from '../../../../types';
import { SIM_CONSTANTS } from '../../../core/Constants';

export const FERN_DNA_PROFILE = {
    // --- TEMPORAL CALIBRATION ---
    MATURATION_DAYS_ESTIMATE: 3,

    // --- GENETIC RANGE MAPPINGS ---
    TRAIT_RANGES: {
        growth_speed_ratio: [0.8, 1.2],
        complexity: [2.0, 12.0],
        stem_thickness: [0.5, 3.5],
        leaf_size: [10.0, 50.0],
        persistence: [2.0, 8.0],
        hue: [90, 150],
        clump_radius: [1.0, 3.0]
    },

    // --- ECOLOGY (Growth & Spreading) ---
    ECOLOGY: {
        HOURLY_RANDOM_SPAWN_CHANCE: 0.75,
        BIOME_GRASS_GROWTH: 1.5,
        BIOME_ARID_GROWTH: 0.1,
        PROXIMITY_DENSITY_BONUS: 3.5,
        CLUSTER_SEARCH_RADIUS_METERS: 1.2,
        CLUSTER_MIN_NEIGHBORS: 2,
        CLUSTER_MAX_NEIGHBORS: 5,
        CLUSTER_GROWTH_RATE: 0.55,
        CLUSTER_SPAWN_DISTANCE_MIN: 0.1,
        CLUSTER_SPAWN_DISTANCE_MAX: 0.5,
    },

    // --- THERMODYNAMICS ---
    THERMODYNAMICS: {
        NUTRIENT_BASE_MIN: 150,
        MASS_TO_ENERGY_SCALAR: 350.0,
        GROWTH_MASS_PENALTY: 0.10,
    },

    // --- FACTORY: GENOME BUILDER ---
    generateGenome: (): FloraGenome => {
        const randRange = (min: number, max: number) => min + Math.random() * (max - min);
        const ranges = FERN_DNA_PROFILE.TRAIT_RANGES;

        // 1. Roll raw genetic potential
        const rawGrowthRatio = randRange(ranges.growth_speed_ratio[0], ranges.growth_speed_ratio[1]);
        const rawComplexity = randRange(ranges.complexity[0], ranges.complexity[1]);
        const rawStem = randRange(ranges.stem_thickness[0], ranges.stem_thickness[1]);
        const rawLeaf = randRange(ranges.leaf_size[0], ranges.leaf_size[1]);
        const persistence = randRange(ranges.persistence[0], ranges.persistence[1]);
        const hue = randRange(ranges.hue[0], ranges.hue[1]);
        const clump = randRange(ranges.clump_radius[0], ranges.clump_radius[1]);

        // 2. INTERLINKING (Checks & Balances)
        const mass = (rawStem * rawLeaf * (rawComplexity / 6.0));
        const massPenalty = 1.0 + (mass * FERN_DNA_PROFILE.THERMODYNAMICS.GROWTH_MASS_PENALTY);
        const finalGrowthRatio = rawGrowthRatio / massPenalty;

        const hoursPerSeason = SIM_CONSTANTS.FRAMES_PER_SEASON / SIM_CONSTANTS.FRAMES_PER_HOUR;
        const hoursToMaturity = hoursPerSeason / finalGrowthRatio;
        const hourlySpeed = Math.max(0.00001, 1.0 / hoursToMaturity);

        const nutrients = Math.max(FERN_DNA_PROFILE.THERMODYNAMICS.NUTRIENT_BASE_MIN, mass * FERN_DNA_PROFILE.THERMODYNAMICS.MASS_TO_ENERGY_SCALAR);

        return {
            traits: {
                structure: { v1: hourlySpeed, v2: rawComplexity, d1: Math.random(), d2: Math.random() },
                vitality: { v1: nutrients, v2: persistence, d1: Math.random(), d2: Math.random() },
                morphology: { v1: rawLeaf, v2: hue, d1: Math.random(), d2: Math.random() },
                ecology: { v1: clump, v2: rawStem, d1: Math.random(), d2: Math.random() }
            }
        };
    }
};

export const DIRECTIONS = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
];
