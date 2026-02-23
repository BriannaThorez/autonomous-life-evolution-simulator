
// --- WORLD SPACE ---
export const WORLD_CONSTANTS = {
    WORLD_SIZE_METERS: 100,      // The world is 100m x 100m
    PIXELS_PER_METER: 20,         // Visual Scale 100m * 20px = 2000px wide screen
    METERS_PER_CELL: 1,           // 1 Grid Cell = 1 Meter
    M_TO_CM: 100,
    CM_TO_M: 0.01,
    GRID_RES: 100
};

// --- TIME CALIBRATION (CRITICAL) ---
// 30 Seconds = 1 Day
// 20 Days = 1 Season (10 Minutes)
const FPS = 60;
const IRL_SECONDS_PER_DAY = 30;
const HOURS_PER_DAY = 24;

const SECONDS_PER_HOUR = IRL_SECONDS_PER_DAY / HOURS_PER_DAY; // 30seconds a day divided by 24SIMhrs
const DAYS_PER_SEASON = 20;
const SEASONS_PER_CYCLE = 4;

export const SIM_CONSTANTS = {
    FPS,
    SECONDS_PER_DAY: IRL_SECONDS_PER_DAY,
    SECONDS_PER_HOUR,
    HOURS_PER_DAY,
    DAYS_PER_SEASON,
    SEASONS_PER_CYCLE,

    // Calculated Constants
    FRAMES_PER_DAY: 1800,           // 60 * 30
    FRAMES_PER_HOUR: 75,            // 1800 / 24
    FRAMES_PER_SEASON: 36000,       // 1800 * 20
    FRAMES_PER_CYCLE: 144000,       // 36000 * 4


    // Interaction Constants
    COMM_COOLDOWN_TICKS: 300,        // ~5 seconds cooldown between vocalizations
};
// --- COGNITIVE CONSTANTS ---
export const COGNITIVE_CONSTANTS = {
    // Memory Management
    DAYS_TO_REMEMBER: 1,
    // Short-term memory (Disappears on refresh)
    TEMPORARY_MEMORY_LIMIT: 100, //Priority-Based Garbage Collection in MemorySystem.ts
    // Long-term memory (Saved to VectorDB)
    PERSISTENT_MEMORY_LIMIT: 100, //Time-Based Truncation in VectorDB.ts
    // Family Tree / Graveyard memories
    HISTORICAL_MEMORY_LIMIT: 50,
};


// --- POPULATION CONSTANTS ---
export const POPULATION_CONSTANTS = {
    INITIAL_ORGANISMS: 20,
    INITIAL_FLORA: 90,
    FLORA_SPAWN_RATE: 0.10,
    BLOOM_COUNT_MIN: 10,
    BLOOM_COUNT_MAX: 20,
    BIRTH_COST: 10000, // 5000 from each parent
    INITIAL_ENERGY: [2500, 3000] as [number, number],
    MAX_ENERGY: 30000,
};

// --- ECOLOGICAL BALANCE (FLORA) ---
export const FLORA_CONSTANTS = {
    // Foundational Multipliers (Central Balancing Knobs)
    NUTRIENT_BASE_MULTIPLIER: 2500,      // Primary energy 'floor' for all flora
    MASS_TO_ENERGY_SCALAR: 40.0,          // How much physical mass converts to energy
    GROWTH_MASS_PENALTY: 0.15,           // How much structural mass slows growth

    // Environmental Modifiers
    BIOME_GRASS_GROWTH: 1.0,             // Nutrient rich soil
    BIOME_ARID_GROWTH: 0.1,              // Harsh conditions
    PROXIMITY_DENSITY_BONUS: 2.5,        // Growth acceleration in clusters

    // Spreading & Density Logic
    CLUSTER_SEARCH_RADIUS_METERS: 1.2,
    CLUSTER_MIN_NEIGHBORS: 2,
    CLUSTER_MAX_NEIGHBORS: 5,
    CLUSTER_GROWTH_RATE: 2.1,            // Chance per hour to spread
    CLUSTER_SPAWN_DISTANCE_MIN: 0.2,
    CLUSTER_SPAWN_DISTANCE_MAX: 0.5,
};

export const SEASON_THEMES = [
    { name: "Aeon-Vahr", color: "#4ade80", description: "The Rising Pulse", bloomFactor: 1.2 },
    { name: "Sol-Kyra", color: "#fbbf24", description: "The Radiant Crown", heatFactor: 1.5 },
    { name: "Vun-Droma", color: "#f97316", description: "The Rusting Breath", decayFactor: 1.1 },
    { name: "Kryos-Nihr", color: "#22d3ee", description: "The Silent Stasis", coldFactor: 0.8 }
];

export const UNIT_UTILS = {
    mToPx: (m: number) => m * WORLD_CONSTANTS.PIXELS_PER_METER,
    pxToM: (px: number) => px / WORLD_CONSTANTS.PIXELS_PER_METER,
    cmToPx: (cm: number) => cm * WORLD_CONSTANTS.CM_TO_M * WORLD_CONSTANTS.PIXELS_PER_METER,
    toInternalSpeed: (mps: number) => (mps * WORLD_CONSTANTS.PIXELS_PER_METER) / SIM_CONSTANTS.FPS,
    toDisplaySpeed: (pxf: number) => (pxf * SIM_CONSTANTS.FPS) / WORLD_CONSTANTS.PIXELS_PER_METER,
    toDegrees: (rad: number) => (rad * 180) / Math.PI,
    toRadians: (deg: number) => (deg * Math.PI) / 180,
    toDays: (frames: number) => frames / 1800 // Hardcoded to avoid circular binding
};
