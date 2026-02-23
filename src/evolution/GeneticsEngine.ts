import { TraitName, Genome, AllelePair, SimConfig, EntityStats } from '../../types';
import { SIM_CONSTANTS } from '../core/Constants';
import { SPECIES_A_DNA } from '../entities/Fauna/SpeciesA/DNAProfile';

export const DEFAULT_TRAIT_RANGES: Record<TraitName, [number, number]> = {
  speed: SPECIES_A_DNA.TRAIT_RANGES.speed,
  size: SPECIES_A_DNA.TRAIT_RANGES.size,
  metabolism: SPECIES_A_DNA.TRAIT_RANGES.metabolism,
  sight_range: SPECIES_A_DNA.TRAIT_RANGES.sight_range, // Store in METERS
  sight_fov: [
    (SPECIES_A_DNA.TRAIT_RANGES.sight_fov[0] * Math.PI) / 180,
    (SPECIES_A_DNA.TRAIT_RANGES.sight_fov[1] * Math.PI) / 180
  ],
  lifespan: SPECIES_A_DNA.TRAIT_RANGES.lifespan,
  audible_range: SPECIES_A_DNA.TRAIT_RANGES.audible_range,
  communicating_range: SPECIES_A_DNA.TRAIT_RANGES.communicating_range,
};

const MUTATION_STRENGTH = 0.12;

export const Genetics = {
  createRandomGenome: (config?: SimConfig): Genome => {
    const traits: any = {};
    const ranges = config?.traitRanges || DEFAULT_TRAIT_RANGES;

    (Object.keys(ranges) as TraitName[]).forEach(trait => {
      // Safety check for new traits if config is old
      if (!ranges[trait]) return;

      const range = ranges[trait];
      // For general generation, pick random value in range
      const v1 = Math.random() * (range[1] - range[0]) + range[0];
      const v2 = v1; // Homogenous init for stability

      traits[trait] = {
        v1, v2,
        d1: Math.random(),
        d2: Math.random(),
      };
    });
    return { traits: traits as Record<TraitName, AllelePair> };
  },

  express: (genome: Genome): EntityStats => {
    const stats: any = {};
    (Object.keys(genome.traits) as TraitName[]).forEach(trait => {
      const pair = genome.traits[trait];
      stats[trait] = pair.d1 >= pair.d2 ? pair.v1 : pair.v2;
    });
    return stats as EntityStats;
  },

  mutate: (genome: Genome, config?: SimConfig): Genome => {
    const newTraits: any = {};
    const ranges = config?.traitRanges || DEFAULT_TRAIT_RANGES;

    // Physical limits to prevent mathematical breakdowns (not evolutionary limits)
    const PHYSICAL_LIMITS: Record<TraitName, [number, number]> = {
      speed: [0.1, 5.0],        // m/s
      size: [2, 150],           // cm
      metabolism: [0.1, 5.0],   // efficiency multiplier
      sight_range: [2, 100],    // meters
      sight_fov: [0.1, Math.PI * 2], // radians (360 vision)
      lifespan: [100, 1000 * SIM_CONSTANTS.FRAMES_PER_DAY], // Frames
      audible_range: [1.0, 20.0],
      communicating_range: [0.5, 10.0]
    };

    (Object.keys(genome.traits) as TraitName[]).forEach(trait => {
      const pair = genome.traits[trait];
      const range = ranges[trait]; // Use initialization range for scaling mutation step size
      const limit = PHYSICAL_LIMITS[trait];

      const mutateVal = (v: number) => {
        // Mutation step size relative to the initialization range spread
        const span = range[1] - range[0];
        const delta = (Math.random() * 2 - 1) * MUTATION_STRENGTH * span;

        // Clamp only to physical limits, not initialization ranges
        return Math.max(limit[0], Math.min(limit[1], v + delta));
      };

      const mutateDom = (d: number) => {
        const delta = (Math.random() * 2 - 1) * MUTATION_STRENGTH * 0.5;
        return Math.max(0, Math.min(1, d + delta));
      };

      newTraits[trait] = {
        v1: mutateVal(pair.v1),
        v2: mutateVal(pair.v2),
        d1: mutateDom(pair.d1),
        d2: mutateDom(pair.d2),
      };
    });
    return { traits: newTraits as Record<TraitName, AllelePair> };
  },

  recombine: (g1: Genome, g2: Genome): Genome => {
    const offspring: any = {};
    (Object.keys(g1.traits) as TraitName[]).forEach(trait => {
      const p1Pair = g1.traits[trait];
      const p2Pair = g2.traits[trait];
      offspring[trait] = {
        v1: Math.random() > 0.5 ? p1Pair.v1 : p2Pair.v1,
        v2: Math.random() > 0.5 ? p1Pair.v2 : p2Pair.v2,
        d1: Math.random() > 0.5 ? p1Pair.d1 : p2Pair.d1,
        d2: Math.random() > 0.5 ? p1Pair.d2 : p2Pair.d2,
      };
    });
    return { traits: offspring as Record<TraitName, AllelePair> };
  },

  ensureIntegrity: (genome: Genome): void => {
    const ranges = DEFAULT_TRAIT_RANGES;
    (Object.keys(ranges) as TraitName[]).forEach(trait => {
      if (!genome.traits[trait]) {
        const range = ranges[trait];
        const v1 = Math.random() * (range[1] - range[0]) + range[0];
        genome.traits[trait] = {
          v1, v2: v1,
          d1: Math.random(), d2: Math.random()
        };
      }
    });
  }
};
