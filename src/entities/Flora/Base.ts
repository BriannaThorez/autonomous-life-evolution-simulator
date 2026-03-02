
import { Vector2, FloraData, FloraGenome } from '../../../types';
import { TerrainManager } from '../../core/TerrainManager';
import { SIM_CONSTANTS } from '../../core/Constants';
import { FernLogic } from './Fern/Logic';

export class Flora {
    public data: FloraData;

    constructor(data: FloraData) {
        this.data = data;
    }

    public static create(
        id: string,
        position: Vector2,
        _energy: number,
        _comp: number,
        type: 'HERBIVORE' | 'CARNIVORE',
        profileName: string,
        generateGenome: () => FloraGenome
    ): Flora {
        const genome = generateGenome();

        const complexity = genome.traits.structure.v2;
        const energyValue = genome.traits.vitality.v1;
        const rawPersistenceDays = genome.traits.vitality.v2;
        const lifetime = rawPersistenceDays * SIM_CONSTANTS.FRAMES_PER_DAY;

        return new Flora({
            id,
            name: profileName,
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

    public update(terrain: TerrainManager) {
        FernLogic.update(this.data, terrain); // Temporary hardcode until Logic is virtualized correctly
    }

    public isExpired(): boolean {
        return this.data.lifetime !== undefined && this.data.lifetime <= 0;
    }

    // Inspector Compatibility
    public getExpressedTraits() {
        const speedPerDay = (this.data.genome.traits.structure.v1 * 24);
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
