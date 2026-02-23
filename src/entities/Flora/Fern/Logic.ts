import { FloraData } from '../../../../types';
import { TerrainManager } from '../../../core/TerrainManager';
import { FLORA_CONSTANTS } from '../../../core/Constants';

export class FernLogic {
    static update(data: FloraData, terrain: TerrainManager) {
        // Growth Modifiers (Environmental)
        const biome = data.biome;
        let growthMod = 1.0;

        // Faster on GRASS (nutrient rich), slower on ARID
        if (biome === 'GRASS') growthMod = FLORA_CONSTANTS.BIOME_GRASS_GROWTH;
        else if (biome === 'ARID') growthMod = FLORA_CONSTANTS.BIOME_ARID_GROWTH;

        // Proximity (Simulated via pre-calculated count)
        if (data.nearbyFloraCount && data.nearbyFloraCount > 2) {
            growthMod *= FLORA_CONSTANTS.PROXIMITY_DENSITY_BONUS; // "Growth accelerates near similar plants"
        }

        // DNA-Driven Speed 
        // structure.v1 stores the direct growth speed from DNA Profile (0.001 - 0.005)
        const baseSpeed = data.genome.traits.structure.v1;

        // Apply Modifiers
        const finalSpeed = baseSpeed * growthMod;

        // Update Growth State (0.0 to 1.0)
        if (data.growthState < 1.0) {
            data.growthState = Math.min(1.0, data.growthState + finalSpeed);
        }

        // Lifetime decay
        if (data.lifetime !== undefined) {
            data.lifetime--;
        }
    }
}
