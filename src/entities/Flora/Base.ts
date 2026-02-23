
import { Vector2, FloraData, FloraGenome, AllelePair } from '../../../types';
import { TerrainManager } from '../../core/TerrainManager';
import { SIM_CONSTANTS } from '../../core/Constants';
import { FERN_DNA_PROFILE } from './Fern/DNAProfile';
import { FernLogic } from './Fern/Logic';

export class Flora {
    public data: FloraData;

    constructor(data: FloraData) {
        this.data = data;
    }

    public static create(id: string, position: Vector2, _energy: number, _comp: number, type: 'HERBIVORE' | 'CARNIVORE', _life?: number): Flora {
        const genome = Flora.generateRandomGenome();

        // DNA-Driven Initialization
        // We ignore passed _comp and _energy arguments to fully rely on DNA
        const complexity = genome.traits.structure.v2;
        const energyValue = genome.traits.vitality.v1;
        const lifetime = genome.traits.vitality.v2;

        return new Flora({
            id,
            name: 'Fern',
            color: `hsl(${genome.traits.morphology.v2}, 70%, 50%)`,
            position,
            energyValue,
            complexity,
            type,
            lifetime,
            genome,
            growthState: 0.1, // Start small
            nearbyFloraCount: 0
        });
    }

    private static generateRandomGenome(): FloraGenome {
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
        // Mass = Stem * Leaf * (Complexity / 6.0)
        // High Mass = High Nutrients but Slower Growth
        const mass = (rawStem * rawLeaf * (rawComplexity / 6.0));

        // Growth Speed: Genetic Ratio penalized by structural mass
        const massPenalty = 1.0 + (mass * FERN_DNA_PROFILE.MASS_PENALTY_FACTOR);
        const finalGrowthRatio = rawGrowthRatio / massPenalty;

        // Explicit seasonal frame mapping (36,000 frames)
        const framesToMaturity = SIM_CONSTANTS.FRAMES_PER_SEASON / finalGrowthRatio;
        const frameSpeed = Math.max(0.00001, 1.0 / framesToMaturity);

        // Nutrients: Mass-based with a viability floor
        const nutrients = Math.max(FERN_DNA_PROFILE.BASE_NUTRIENT_MIN, mass * FERN_DNA_PROFILE.MASS_TO_ENERGY_FACTOR);

        return {
            traits: {
                structure: {
                    v1: frameSpeed,
                    v2: rawComplexity,
                    d1: Math.random(), d2: Math.random()
                },
                vitality: {
                    v1: nutrients,
                    v2: persistence,
                    d1: Math.random(), d2: Math.random()
                },
                morphology: {
                    v1: rawLeaf,
                    v2: hue,
                    d1: Math.random(), d2: Math.random()
                },
                ecology: {
                    v1: clump,
                    v2: rawStem,
                    d1: Math.random(), d2: Math.random()
                }
            }
        };
    }

    public update(terrain: TerrainManager) {
        FernLogic.update(this.data, terrain);
    }

    public isExpired(): boolean {
        return this.data.lifetime !== undefined && this.data.lifetime <= 0;
    }

    // Inspector Compatibility
    public getExpressedTraits() {
        const speedPerDay = (this.data.genome.traits.structure.v1 * SIM_CONSTANTS.FRAMES_PER_DAY);
        const remainingGrowth = 1.0 - this.data.growthState;
        const daysToMature = Math.max(1, Math.ceil(remainingGrowth / speedPerDay));

        return {
            growthRate: (speedPerDay * 100).toFixed(2) + '% / day',
            maturation: daysToMature + ' days',
            complexity: Math.floor(this.data.genome.traits.structure.v2),
            nutrients: Math.floor(this.data.genome.traits.vitality.v1),
            leafSize: this.data.genome.traits.morphology.v1.toFixed(1),
            stemThickness: this.data.genome.traits.ecology.v2.toFixed(1),
            clumpRadius: this.data.genome.traits.ecology.v1.toFixed(1),
            hue: Math.floor(this.data.genome.traits.morphology.v2)
        };
    }
}
