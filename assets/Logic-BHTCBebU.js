const r=`import { FloraData } from '../../../../types';\r
import { TerrainManager } from '../../../core/TerrainManager';\r
import { FERN_DNA_PROFILE } from './DNAProfile';\r
\r
export class FernLogic {\r
    static update(data: FloraData, terrain: TerrainManager) {\r
        // Growth Modifiers (Environmental)\r
        const biome = data.biome;\r
        let growthMod = 1.0;\r
\r
        // Soil Quality Logic\r
        if (biome === 'GRASS') growthMod = FERN_DNA_PROFILE.ECOLOGY.BIOME_GRASS_GROWTH;\r
        else if (biome === 'ARID') growthMod = FERN_DNA_PROFILE.ECOLOGY.BIOME_ARID_GROWTH;\r
\r
        // Density Logic\r
        if (data.nearbyFloraCount && data.nearbyFloraCount > FERN_DNA_PROFILE.ECOLOGY.CLUSTER_MIN_NEIGHBORS) {\r
            growthMod *= FERN_DNA_PROFILE.ECOLOGY.PROXIMITY_DENSITY_BONUS;\r
        }\r
\r
        // DNA-Driven Speed \r
        const baseSpeed = data.genome.traits.structure.v1;\r
\r
        // Apply Modifiers\r
        // Note: finalSpeed is added every hour, so we don't need to multiply by frames.\r
        const finalSpeed = baseSpeed * growthMod;\r
\r
        // Update Growth State (0.0 to 1.0)\r
        if (data.growthState < 1.0) {\r
            data.growthState = Math.min(1.0, data.growthState + finalSpeed);\r
        }\r
\r
        // Lifetime decay (Decoupled from growth state)\r
        if (data.lifetime !== undefined) {\r
            data.lifetime--;\r
        }\r
    }\r
}\r
`;export{r as default};
