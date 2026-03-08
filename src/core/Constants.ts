import { LINGUISTIC_CONSTANTS as LANGUAGE_LINGUISTIC_CONSTANTS, SOCIAL_CONSTANTS as LANGUAGE_SOCIAL_CONSTANTS } from '../entities/Fauna/Language/Constants';

import { TraitName } from '../../types';

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

// --- HOURLY EVALUATION LOGIC ---
export const CHRONOS_UTILS = {
    /**
     * Checks if the current frame corresponds to a biological 'hour' transition.
     * All major ecological updates (growth, spreading, random spawning) should use this.
     */
    isHourlyTick: (time: number) => time % SIM_CONSTANTS.FRAMES_PER_HOUR === 0,
};

// --- COGNITIVE & SENSORY CONSTANTS ---
export const COGNITIVE_CONSTANTS = {
    // Memory Management
    DAYS_TO_REMEMBER: 12,
    TEMPORARY_MEMORY_LIMIT: 200,
    PERSISTENT_MEMORY_LIMIT: 200,
    HISTORICAL_MEMORY_LIMIT: 100,
};

export const SENSORY_CONSTANTS = {
    PERCEPTION_COOLDOWN_TICKS: 60, // 1s at 60fps
    FOOD_MEMORY_ENERGY_THRESHOLD: 100,
    MEMORY_CONFIDENCE_PENALTY: 0.8,
    FOOD_DESIRABILITY_DISTANCE_WEIGHT: 1.0,
    MEMORY_PRUNING_RADIUS_METERS: 15,
};

// --- SOCIAL & NOBILITY CONSTANTS ---
// Compatibility re-exports: the canonical linguistic/social constants now live in
// src/entities/Fauna/Language/Constants.ts.
export const SOCIAL_CONSTANTS = LANGUAGE_SOCIAL_CONSTANTS;

export const LINGUISTIC_CONSTANTS = LANGUAGE_LINGUISTIC_CONSTANTS;

export const GENETIC_CONSTANTS = {
    MUTATION_STRENGTH: 0.12,
    PHYSICAL_LIMITS: {
        speed: [0.1, 5.0],
        size: [2, 150],
        metabolism: [0.1, 5.0],
        sight_range: [2, 100],
        sight_fov: [0.1, Math.PI * 2],
        lifespan: [100, 1000 * (60 * 60 * 24)],
        audible_range: [1.0, 20.0],
        communicating_range: [0.5, 10.0]
    }
};

// --- POPULATION & REPRODUCTION CONSTANTS ---
export const POPULATION_CONSTANTS = {
    INITIAL_ORGANISMS: 20,
    INITIAL_FLORA: 90,
    BLOOM_COUNT_MIN: 10,
    BLOOM_COUNT_MAX: 20,
    // BIRTH_COST_BASE operates as the total systemic energy required to construct a new lifeform.
    // It is subtracted from the mother upon birth to pay for the initial energy mass of the child.
    BIRTH_COST_BASE: 25000,
    INITIAL_ENERGY: [7000, 8000] as [number, number],

    // MATING_ENERGY_THRESHOLD dictates the baseline energy required just to initiate the courting/mating process.
    // It is significantly lower than BIRTH_COST_BASE because organisms do not immediately give birth upon mating.
    MATING_ENERGY_THRESHOLD: 20000,
    MATING_BOND_DURATION_HOURS: 2.5, // 0.5 Game Hours (computed against FRAMES_PER_HOUR dynamically)
};

export const REPRODUCTION_CONSTANTS = {
    TRAIT_SURCHARGE_SPEED_WEIGHT: 150,
    TRAIT_SURCHARGE_SIZE_WEIGHT: 5,
    TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT: 20,
    TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT: 1, // Per degree
    TRAIT_SURCHARGE_LIFESPAN_WEIGHT: 0.0001,
};

// --- DEFAULT GENETIC RANGES ---
export const DEFAULT_TRAIT_RANGES: Record<TraitName, [number, number]> = {
    speed: [1.2, 1.5],
    size: [75, 85],
    metabolism: [0.4, 0.5],
    sight_range: [15, 18],
    sight_fov: [(85 * Math.PI) / 180, (95 * Math.PI) / 180],
    lifespan: [72000, 108000], // 40-60 days
    audible_range: [3.5, 4.5],
    communicating_range: [2.5, 3.5],
};

// --- FLORA ECOLOGICAL BALANCE MOVED TO SPECIFIC DNA PROFILES ---

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
