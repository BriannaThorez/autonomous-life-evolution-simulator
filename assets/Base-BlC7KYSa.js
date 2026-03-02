const r=`\r
import { Vector2, FloraData, FloraGenome } from '../../../types';\r
import { TerrainManager } from '../../core/TerrainManager';\r
import { SIM_CONSTANTS } from '../../core/Constants';\r
import { FernLogic } from './Fern/Logic';\r
\r
export class Flora {\r
    public data: FloraData;\r
\r
    constructor(data: FloraData) {\r
        this.data = data;\r
    }\r
\r
    public static create(\r
        id: string,\r
        position: Vector2,\r
        _energy: number,\r
        _comp: number,\r
        type: 'HERBIVORE' | 'CARNIVORE',\r
        profileName: string,\r
        generateGenome: () => FloraGenome\r
    ): Flora {\r
        const genome = generateGenome();\r
\r
        const complexity = genome.traits.structure.v2;\r
        const energyValue = genome.traits.vitality.v1;\r
        const rawPersistenceDays = genome.traits.vitality.v2;\r
        const lifetime = rawPersistenceDays * SIM_CONSTANTS.FRAMES_PER_DAY;\r
\r
        return new Flora({\r
            id,\r
            name: profileName,\r
            color: \`hsl(\${genome.traits.morphology.v2}, 70%, 50%)\`,\r
            position,\r
            energyValue,\r
            complexity,\r
            type,\r
            lifetime,\r
            genome,\r
            growthState: 0.1, // Start small\r
            nearbyFloraCount: 0\r
        });\r
    }\r
\r
    public update(terrain: TerrainManager) {\r
        FernLogic.update(this.data, terrain); // Temporary hardcode until Logic is virtualized correctly\r
    }\r
\r
    public isExpired(): boolean {\r
        return this.data.lifetime !== undefined && this.data.lifetime <= 0;\r
    }\r
\r
    // Inspector Compatibility\r
    public getExpressedTraits() {\r
        const speedPerDay = (this.data.genome.traits.structure.v1 * 24);\r
        const remainingGrowth = 1.0 - this.data.growthState;\r
        const daysToMature = Math.max(1, Math.ceil(remainingGrowth / speedPerDay));\r
\r
        return {\r
            growthRate: (speedPerDay * 100).toFixed(2) + '% / day',\r
            maturation: daysToMature + ' days',\r
            complexity: Math.floor(this.data.genome.traits.structure.v2),\r
            nutrients: Math.floor(this.data.genome.traits.vitality.v1),\r
            leafSize: this.data.genome.traits.morphology.v1.toFixed(1),\r
            stemThickness: this.data.genome.traits.ecology.v2.toFixed(1),\r
            clumpRadius: this.data.genome.traits.ecology.v1.toFixed(1),\r
            hue: Math.floor(this.data.genome.traits.morphology.v2)\r
        };\r
    }\r
}\r
`;export{r as default};
