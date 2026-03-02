import { TraitName, Genome, AllelePair, SimConfig, EntityStats } from '../../types';
import { SIM_CONSTANTS, DEFAULT_TRAIT_RANGES, GENETIC_CONSTANTS } from '../core/Constants';

export const Genetics = {
  createRandomGenome: (config?: SimConfig): Genome => {
    const traits: any = {};
    const ranges = config?.traitRanges || DEFAULT_TRAIT_RANGES;

    (Object.keys(ranges) as TraitName[]).forEach(trait => {
      if (!ranges[trait]) return;
      const range = ranges[trait];
      const v1 = Math.random() * (range[1] - range[0]) + range[0];
      const v2 = v1;
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
    const MUTATION_STRENGTH = GENETIC_CONSTANTS.MUTATION_STRENGTH;
    const PHYSICAL_LIMITS = GENETIC_CONSTANTS.PHYSICAL_LIMITS as Record<TraitName, [number, number]>;

    (Object.keys(genome.traits) as TraitName[]).forEach(trait => {
      const pair = genome.traits[trait];
      const range = ranges[trait];
      const limit = PHYSICAL_LIMITS[trait];

      const mutateVal = (v: number) => {
        const span = range[1] - range[0];
        const delta = (Math.random() * 2 - 1) * MUTATION_STRENGTH * span;
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
