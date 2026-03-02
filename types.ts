
export interface Vector2 {
  x: number;
  y: number;
}

export interface AllelePair {
  v1: number;
  v2: number;
  d1: number; // Dominance factor for v1
  d2: number; // Dominance factor for v2
}

export type TraitName = 'speed' | 'size' | 'metabolism' | 'sight_range' | 'sight_fov' | 'lifespan' | 'audible_range' | 'communicating_range';

export interface Genome {
  traits: Record<TraitName, AllelePair>;
}

export interface EntityStats {
  speed: number;
  size: number;
  metabolism: number;
  sight_range: number;
  sight_fov: number;
  lifespan: number;
  audible_range: number;
  communicating_range: number;
}

export interface Memory {
  id: string;
  type: 'Flora' | 'MATE' | 'THREAT' | 'Food' | 'Fauna' | 'SectorScan';
  position: Vector2;
  timestamp: number;
  duration: number; // Ticks until forgotten
  content: string; // Human-readable description
  count?: number;  // For stacking identical memories
  data?: any;      // Optional payload (id, type, etc)
  entityIds?: string[]; // Multiple entity IDs for grouping (👥)
  isFamiliar?: boolean; // If interaction/greeting occurred
}

export interface OrganismData {
  id: string;
  parentId?: string;
  parentA_Id?: string; // Supporting dual parent lineage
  parentB_Id?: string;
  position: Vector2;
  velocity: Vector2;
  energy: number;
  age: number;
  genome: Genome;
  expressedStats: EntityStats;
  color: string;
  generation: number;
  name: string; // Full displayed name
  firstName: string;
  surname: string;
  title?: string;
  isNoble?: boolean;
  lineageDescription?: string; // For tooltips
  matingCount: number;
  houseName?: string;
  memories: Memory[];
  timestamp: number;
  heading: Vector2; // Add heading property
  bending: number; // For larval curvature in SDF shader
  matingTargetId?: string;
  matingTimer?: number;
  // Communication & Perception
  lastVocalTick?: number; // To enforce communication cooldowns (industry standard rate-limiting)
  lastPerceptionTick?: number; // Rate-limit for adding "Saw" memories
  isHearingActive?: boolean; // Ephemeral flag for WebGL audio overlay
  isTransmittingActive?: boolean; // Ephemeral flag for WebGL comms overlay
}


export interface FloraGenome {
  traits: {
    structure: AllelePair;  // v1: growthRatio, v2: complexity
    vitality: AllelePair;   // v1: nutrients, v2: persistence
    morphology: AllelePair; // v1: leafSize, v2: hue
    ecology: AllelePair;    // v1: clumpRadius, v2: stemThickness
  };
}

export interface FloraData {
  id: string;
  name: string;
  color: string;
  position: Vector2;
  energyValue: number;
  complexity: number;
  type: 'HERBIVORE' | 'CARNIVORE';
  lifetime?: number;
  genome: FloraGenome;
  growthState: number; // 0.0 to 1.0 Real-time expansion
  nearbyFloraCount?: number; // For density-based growth
  biome?: string; // Cached biome type for performance
}

// --- Master Biosphere Types ---
export type EntityData = OrganismData | FloraData;

export interface SimConfig {
  initialPopulation: number;
  initialEnergy: [number, number];
  traitRanges: Record<TraitName, [number, number]>;
}

export interface SimulationState {
  organisms: OrganismData[];
  Flora: FloraData[];
  worldSize: Vector2;
  time: number;
  day: number;
  hour: number;
  season: number;
  cycle: number;
  config: SimConfig;
  events: SimEvent[];
  apexCandidates: OrganismData[];
  seed: number;
  // UI-specific sampled data
  selectedEntity?: OrganismData | FloraData | null;
  hoveredEntity?: OrganismData | FloraData | null;
  popCount?: number;
  floraCount?: number;
}

export type EventType = 'BIRTH' | 'DEATH' | 'MILESTONE';

export interface SimEvent {
  id: string;
  type: EventType;
  message: string;
  timestamp: number;
  position: Vector2;
  entityId?: string;
  color?: string;
}
