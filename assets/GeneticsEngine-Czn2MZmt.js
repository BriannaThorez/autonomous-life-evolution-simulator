const r=`import { TraitName, Genome, AllelePair, SimConfig, EntityStats } from '../../types';\r
import { SIM_CONSTANTS, DEFAULT_TRAIT_RANGES, GENETIC_CONSTANTS } from '../core/Constants';\r
\r
export const Genetics = {\r
  createRandomGenome: (config?: SimConfig): Genome => {\r
    const traits: any = {};\r
    const ranges = config?.traitRanges || DEFAULT_TRAIT_RANGES;\r
\r
    (Object.keys(ranges) as TraitName[]).forEach(trait => {\r
      if (!ranges[trait]) return;\r
      const range = ranges[trait];\r
      const v1 = Math.random() * (range[1] - range[0]) + range[0];\r
      const v2 = v1;\r
      traits[trait] = {\r
        v1, v2,\r
        d1: Math.random(),\r
        d2: Math.random(),\r
      };\r
    });\r
    return { traits: traits as Record<TraitName, AllelePair> };\r
  },\r
\r
  express: (genome: Genome): EntityStats => {\r
    const stats: any = {};\r
    (Object.keys(genome.traits) as TraitName[]).forEach(trait => {\r
      const pair = genome.traits[trait];\r
      stats[trait] = pair.d1 >= pair.d2 ? pair.v1 : pair.v2;\r
    });\r
    return stats as EntityStats;\r
  },\r
\r
  mutate: (genome: Genome, config?: SimConfig): Genome => {\r
    const newTraits: any = {};\r
    const ranges = config?.traitRanges || DEFAULT_TRAIT_RANGES;\r
    const MUTATION_STRENGTH = GENETIC_CONSTANTS.MUTATION_STRENGTH;\r
    const PHYSICAL_LIMITS = GENETIC_CONSTANTS.PHYSICAL_LIMITS as Record<TraitName, [number, number]>;\r
\r
    (Object.keys(genome.traits) as TraitName[]).forEach(trait => {\r
      const pair = genome.traits[trait];\r
      const range = ranges[trait];\r
      const limit = PHYSICAL_LIMITS[trait];\r
\r
      const mutateVal = (v: number) => {\r
        const span = range[1] - range[0];\r
        const delta = (Math.random() * 2 - 1) * MUTATION_STRENGTH * span;\r
        return Math.max(limit[0], Math.min(limit[1], v + delta));\r
      };\r
\r
      const mutateDom = (d: number) => {\r
        const delta = (Math.random() * 2 - 1) * MUTATION_STRENGTH * 0.5;\r
        return Math.max(0, Math.min(1, d + delta));\r
      };\r
\r
      newTraits[trait] = {\r
        v1: mutateVal(pair.v1),\r
        v2: mutateVal(pair.v2),\r
        d1: mutateDom(pair.d1),\r
        d2: mutateDom(pair.d2),\r
      };\r
    });\r
    return { traits: newTraits as Record<TraitName, AllelePair> };\r
  },\r
\r
  recombine: (g1: Genome, g2: Genome): Genome => {\r
    const offspring: any = {};\r
    (Object.keys(g1.traits) as TraitName[]).forEach(trait => {\r
      const p1Pair = g1.traits[trait];\r
      const p2Pair = g2.traits[trait];\r
      offspring[trait] = {\r
        v1: Math.random() > 0.5 ? p1Pair.v1 : p2Pair.v1,\r
        v2: Math.random() > 0.5 ? p1Pair.v2 : p2Pair.v2,\r
        d1: Math.random() > 0.5 ? p1Pair.d1 : p2Pair.d1,\r
        d2: Math.random() > 0.5 ? p1Pair.d2 : p2Pair.d2,\r
      };\r
    });\r
    return { traits: offspring as Record<TraitName, AllelePair> };\r
  },\r
\r
  ensureIntegrity: (genome: Genome): void => {\r
    const ranges = DEFAULT_TRAIT_RANGES;\r
    (Object.keys(ranges) as TraitName[]).forEach(trait => {\r
      if (!genome.traits[trait]) {\r
        const range = ranges[trait];\r
        const v1 = Math.random() * (range[1] - range[0]) + range[0];\r
        genome.traits[trait] = {\r
          v1, v2: v1,\r
          d1: Math.random(), d2: Math.random()\r
        };\r
      }\r
    });\r
  }\r
};\r
`;export{r as default};
