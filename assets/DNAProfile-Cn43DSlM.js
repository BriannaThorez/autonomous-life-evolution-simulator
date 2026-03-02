const r=`import { FloraGenome } from '../../../../types';\r
import { SIM_CONSTANTS } from '../../../core/Constants';\r
\r
export const FERN_DNA_PROFILE = {\r
    // --- TEMPORAL CALIBRATION ---\r
    MATURATION_DAYS_ESTIMATE: 3,\r
\r
    // --- GENETIC RANGE MAPPINGS ---\r
    TRAIT_RANGES: {\r
        growth_speed_ratio: [0.8, 1.2],\r
        complexity: [2.0, 12.0],\r
        stem_thickness: [0.5, 3.5],\r
        leaf_size: [10.0, 50.0],\r
        persistence: [2.0, 8.0],\r
        hue: [90, 150],\r
        clump_radius: [1.0, 3.0]\r
    },\r
\r
    // --- ECOLOGY (Growth & Spreading) ---\r
    ECOLOGY: {\r
        HOURLY_RANDOM_SPAWN_CHANCE: 0.75,\r
        BIOME_GRASS_GROWTH: 1.5,\r
        BIOME_ARID_GROWTH: 0.1,\r
        PROXIMITY_DENSITY_BONUS: 3.5,\r
        CLUSTER_SEARCH_RADIUS_METERS: 1.2,\r
        CLUSTER_MIN_NEIGHBORS: 2,\r
        CLUSTER_MAX_NEIGHBORS: 5,\r
        CLUSTER_GROWTH_RATE: 0.55,\r
        CLUSTER_SPAWN_DISTANCE_MIN: 0.1,\r
        CLUSTER_SPAWN_DISTANCE_MAX: 0.5,\r
    },\r
\r
    // --- THERMODYNAMICS ---\r
    THERMODYNAMICS: {\r
        NUTRIENT_BASE_MIN: 150,\r
        MASS_TO_ENERGY_SCALAR: 350.0,\r
        GROWTH_MASS_PENALTY: 0.10,\r
    },\r
\r
    // --- FACTORY: GENOME BUILDER ---\r
    generateGenome: (): FloraGenome => {\r
        const randRange = (min: number, max: number) => min + Math.random() * (max - min);\r
        const ranges = FERN_DNA_PROFILE.TRAIT_RANGES;\r
\r
        // 1. Roll raw genetic potential\r
        const rawGrowthRatio = randRange(ranges.growth_speed_ratio[0], ranges.growth_speed_ratio[1]);\r
        const rawComplexity = randRange(ranges.complexity[0], ranges.complexity[1]);\r
        const rawStem = randRange(ranges.stem_thickness[0], ranges.stem_thickness[1]);\r
        const rawLeaf = randRange(ranges.leaf_size[0], ranges.leaf_size[1]);\r
        const persistence = randRange(ranges.persistence[0], ranges.persistence[1]);\r
        const hue = randRange(ranges.hue[0], ranges.hue[1]);\r
        const clump = randRange(ranges.clump_radius[0], ranges.clump_radius[1]);\r
\r
        // 2. INTERLINKING (Checks & Balances)\r
        const mass = (rawStem * rawLeaf * (rawComplexity / 6.0));\r
        const massPenalty = 1.0 + (mass * FERN_DNA_PROFILE.THERMODYNAMICS.GROWTH_MASS_PENALTY);\r
        const finalGrowthRatio = rawGrowthRatio / massPenalty;\r
\r
        const hoursPerSeason = SIM_CONSTANTS.FRAMES_PER_SEASON / SIM_CONSTANTS.FRAMES_PER_HOUR;\r
        const hoursToMaturity = hoursPerSeason / finalGrowthRatio;\r
        const hourlySpeed = Math.max(0.00001, 1.0 / hoursToMaturity);\r
\r
        const nutrients = Math.max(FERN_DNA_PROFILE.THERMODYNAMICS.NUTRIENT_BASE_MIN, mass * FERN_DNA_PROFILE.THERMODYNAMICS.MASS_TO_ENERGY_SCALAR);\r
\r
        return {\r
            traits: {\r
                structure: { v1: hourlySpeed, v2: rawComplexity, d1: Math.random(), d2: Math.random() },\r
                vitality: { v1: nutrients, v2: persistence, d1: Math.random(), d2: Math.random() },\r
                morphology: { v1: rawLeaf, v2: hue, d1: Math.random(), d2: Math.random() },\r
                ecology: { v1: clump, v2: rawStem, d1: Math.random(), d2: Math.random() }\r
            }\r
        };\r
    }\r
};\r
\r
export const DIRECTIONS = [\r
    { x: 0, y: -1 },\r
    { x: 1, y: 0 },\r
    { x: 0, y: 1 },\r
    { x: -1, y: 0 }\r
];\r
`;export{r as default};
