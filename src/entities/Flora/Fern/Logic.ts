import { FloraData } from '../../../../types';
import { TerrainManager } from '../../../core/TerrainManager';
import { FERN_DNA_PROFILE } from './DNAProfile';

export class FernLogic {
    static update(data: FloraData, terrain: TerrainManager) {
        // Growth Modifiers (Environmental)
        const biome = data.biome;
        let growthMod = 1.0;

        // Soil Quality Logic
        if (biome === 'GRASS') growthMod = FERN_DNA_PROFILE.ECOLOGY.BIOME_GRASS_GROWTH;
        else if (biome === 'ARID') growthMod = FERN_DNA_PROFILE.ECOLOGY.BIOME_ARID_GROWTH;

        // Density Logic
        if (data.nearbyFloraCount && data.nearbyFloraCount > FERN_DNA_PROFILE.ECOLOGY.CLUSTER_MIN_NEIGHBORS) {
            growthMod *= FERN_DNA_PROFILE.ECOLOGY.PROXIMITY_DENSITY_BONUS;
        }

        // DNA-Driven Speed 
        const baseSpeed = data.genome.traits.structure.v1;

        // Apply Modifiers
        // Note: finalSpeed is added every hour, so we don't need to multiply by frames.
        const finalSpeed = baseSpeed * growthMod;

        // Update Growth State (0.0 to 1.0)
        if (data.growthState < 1.0) {
            data.growthState = Math.min(1.0, data.growthState + finalSpeed);
        }

        // Lifetime decay (Decoupled from growth state)
        if (data.lifetime !== undefined) {
            data.lifetime--;
        }
    }
}
