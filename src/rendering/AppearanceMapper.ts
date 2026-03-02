import { OrganismData } from '../../types';

export interface VisualGenome {
    primaryColor: string;
    skeletalRigidity: number;
}

/**
 * Slimmed AppearanceMapper: GPU now handles glow, pulse, and health desaturation.
 * Only CPU-dependent values (color lookup, skeletal rigidity) remain here.
 */
export class AppearanceMapper {
    public static getVisuals(org: OrganismData): VisualGenome {
        const speedFactor = org.expressedStats.speed / 1.5;

        return {
            primaryColor: org.color,
            skeletalRigidity: clamp(1.0 - speedFactor, 0.2, 1.0),
        };
    }
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}
