const r=`import { TraitName } from '../../types';\r
\r
// --- WORLD SPACE ---\r
export const WORLD_CONSTANTS = {\r
    WORLD_SIZE_METERS: 100,      // The world is 100m x 100m\r
    PIXELS_PER_METER: 20,         // Visual Scale 100m * 20px = 2000px wide screen\r
    METERS_PER_CELL: 1,           // 1 Grid Cell = 1 Meter\r
    M_TO_CM: 100,\r
    CM_TO_M: 0.01,\r
    GRID_RES: 100\r
};\r
\r
// --- TIME CALIBRATION (CRITICAL) ---\r
// 30 Seconds = 1 Day\r
// 20 Days = 1 Season (10 Minutes)\r
const FPS = 60;\r
const IRL_SECONDS_PER_DAY = 30;\r
const HOURS_PER_DAY = 24;\r
\r
const SECONDS_PER_HOUR = IRL_SECONDS_PER_DAY / HOURS_PER_DAY; // 30seconds a day divided by 24SIMhrs\r
const DAYS_PER_SEASON = 20;\r
const SEASONS_PER_CYCLE = 4;\r
\r
export const SIM_CONSTANTS = {\r
    FPS,\r
    SECONDS_PER_DAY: IRL_SECONDS_PER_DAY,\r
    SECONDS_PER_HOUR,\r
    HOURS_PER_DAY,\r
    DAYS_PER_SEASON,\r
    SEASONS_PER_CYCLE,\r
\r
    // Calculated Constants\r
    FRAMES_PER_DAY: 1800,           // 60 * 30\r
    FRAMES_PER_HOUR: 75,            // 1800 / 24\r
    FRAMES_PER_SEASON: 36000,       // 1800 * 20\r
    FRAMES_PER_CYCLE: 144000,       // 36000 * 4\r
\r
    // Interaction Constants\r
    COMM_COOLDOWN_TICKS: 300,        // ~5 seconds cooldown between vocalizations\r
};\r
\r
// --- HOURLY EVALUATION LOGIC ---\r
export const CHRONOS_UTILS = {\r
    /**\r
     * Checks if the current frame corresponds to a biological 'hour' transition.\r
     * All major ecological updates (growth, spreading, random spawning) should use this.\r
     */\r
    isHourlyTick: (time: number) => time % SIM_CONSTANTS.FRAMES_PER_HOUR === 0,\r
};\r
\r
// --- COGNITIVE & SENSORY CONSTANTS ---\r
export const COGNITIVE_CONSTANTS = {\r
    // Memory Management\r
    DAYS_TO_REMEMBER: 12,\r
    TEMPORARY_MEMORY_LIMIT: 200,\r
    PERSISTENT_MEMORY_LIMIT: 200,\r
    HISTORICAL_MEMORY_LIMIT: 100,\r
};\r
\r
export const SENSORY_CONSTANTS = {\r
    PERCEPTION_COOLDOWN_TICKS: 60, // 1s at 60fps\r
    FOOD_MEMORY_ENERGY_THRESHOLD: 100,\r
    MEMORY_CONFIDENCE_PENALTY: 0.8,\r
    FOOD_DESIRABILITY_DISTANCE_WEIGHT: 1.0,\r
    MEMORY_PRUNING_RADIUS_METERS: 15,\r
};\r
\r
// --- SOCIAL & NOBILITY CONSTANTS ---\r
export const SOCIAL_CONSTANTS = {\r
    NOBILITY_MATING_THRESHOLD: 10,\r
    NOBILITY_AGE_THRESHOLD_DAYS: 1,\r
    PROLIFIC_MATING_THRESHOLD: 5,\r
    ELDER_AGE_MULTIPLIER: 2,\r
};\r
//Names are syllable count\r
export const LINGUISTIC_CONSTANTS = {\r
    NAME_INHERITANCE_CHANCE: 0.05,\r
    FIRST_NAME_SYLLABLES_MIN: 1,\r
    FIRST_NAME_SYLLABLES_RANGE: 1,\r
    SURNAME_SYLLABLES_MIN: 2,\r
    SURNAME_SYLLABLES_RANGE: 2,\r
};\r
\r
export const GENETIC_CONSTANTS = {\r
    MUTATION_STRENGTH: 0.12,\r
    PHYSICAL_LIMITS: {\r
        speed: [0.1, 5.0],\r
        size: [2, 150],\r
        metabolism: [0.1, 5.0],\r
        sight_range: [2, 100],\r
        sight_fov: [0.1, Math.PI * 2],\r
        lifespan: [100, 1000 * (60 * 60 * 24)],\r
        audible_range: [1.0, 20.0],\r
        communicating_range: [0.5, 10.0]\r
    }\r
};\r
\r
// --- POPULATION & REPRODUCTION CONSTANTS ---\r
export const POPULATION_CONSTANTS = {\r
    INITIAL_ORGANISMS: 20,\r
    INITIAL_FLORA: 120,\r
    BLOOM_COUNT_MIN: 10,\r
    BLOOM_COUNT_MAX: 20,\r
    // BIRTH_COST_BASE operates as the total systemic energy required to construct a new lifeform.\r
    // It is subtracted from the mother upon birth to pay for the initial energy mass of the child.\r
    BIRTH_COST_BASE: 25000,\r
    INITIAL_ENERGY: [7000, 8000] as [number, number],\r
\r
    // MATING_ENERGY_THRESHOLD dictates the baseline energy required just to initiate the courting/mating process.\r
    // It is significantly lower than BIRTH_COST_BASE because organisms do not immediately give birth upon mating.\r
    MATING_ENERGY_THRESHOLD: 20000,\r
    MATING_BOND_DURATION_HOURS: 2.5, // 0.5 Game Hours (computed against FRAMES_PER_HOUR dynamically)\r
};\r
\r
export const REPRODUCTION_CONSTANTS = {\r
    TRAIT_SURCHARGE_SPEED_WEIGHT: 150,\r
    TRAIT_SURCHARGE_SIZE_WEIGHT: 5,\r
    TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT: 20,\r
    TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT: 1, // Per degree\r
    TRAIT_SURCHARGE_LIFESPAN_WEIGHT: 0.0001,\r
};\r
\r
// --- DEFAULT GENETIC RANGES ---\r
export const DEFAULT_TRAIT_RANGES: Record<TraitName, [number, number]> = {\r
    speed: [1.8, 2.1],\r
    size: [85, 95],\r
    metabolism: [0.4, 0.5],\r
    sight_range: [15, 18],\r
    sight_fov: [(85 * Math.PI) / 180, (95 * Math.PI) / 180],\r
    lifespan: [72000, 108000], // 40-60 days\r
    audible_range: [3.5, 4.5],\r
    communicating_range: [2.5, 3.5],\r
};\r
\r
// --- FLORA ECOLOGICAL BALANCE MOVED TO SPECIFIC DNA PROFILES ---\r
\r
export const SEASON_THEMES = [\r
    { name: "Aeon-Vahr", color: "#4ade80", description: "The Rising Pulse", bloomFactor: 1.2 },\r
    { name: "Sol-Kyra", color: "#fbbf24", description: "The Radiant Crown", heatFactor: 1.5 },\r
    { name: "Vun-Droma", color: "#f97316", description: "The Rusting Breath", decayFactor: 1.1 },\r
    { name: "Kryos-Nihr", color: "#22d3ee", description: "The Silent Stasis", coldFactor: 0.8 }\r
];\r
\r
export const UNIT_UTILS = {\r
    mToPx: (m: number) => m * WORLD_CONSTANTS.PIXELS_PER_METER,\r
    pxToM: (px: number) => px / WORLD_CONSTANTS.PIXELS_PER_METER,\r
    cmToPx: (cm: number) => cm * WORLD_CONSTANTS.CM_TO_M * WORLD_CONSTANTS.PIXELS_PER_METER,\r
    toInternalSpeed: (mps: number) => (mps * WORLD_CONSTANTS.PIXELS_PER_METER) / SIM_CONSTANTS.FPS,\r
    toDisplaySpeed: (pxf: number) => (pxf * SIM_CONSTANTS.FPS) / WORLD_CONSTANTS.PIXELS_PER_METER,\r
    toDegrees: (rad: number) => (rad * 180) / Math.PI,\r
    toRadians: (deg: number) => (deg * Math.PI) / 180,\r
    toDays: (frames: number) => frames / 1800 // Hardcoded to avoid circular binding\r
};\r
`;export{r as default};
