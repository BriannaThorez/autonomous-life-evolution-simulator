import { OrganismData } from '../../types';

export interface VisualGenome {
    primaryColor: string;
    glowIntensity: number;
    scaleModifier: number;
    skeletalRigidity: number;
    appearanceType: number; // 0: Standard, 1: Noble/Special
}

export class AppearanceMapper {
    /**
     * Maps an organism's internal data to visual parameters for the WebGL renderer.
     */
    public static getVisuals(org: OrganismData): VisualGenome {
        // Basic mapping: use DNA to drive aesthetic traits
        const speedFactor = org.expressedStats.speed / 1.5; // Normalized speed

        return {
            primaryColor: org.color,
            glowIntensity: org.isNoble ? 1.2 : 0.65, // Enhanced base luminescence
            scaleModifier: 1.0,
            skeletalRigidity: clamp(1.0 - speedFactor, 0.2, 1.0),
            appearanceType: org.isNoble ? 1 : 0
        };
    }
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}
