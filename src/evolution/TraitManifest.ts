import { TraitName } from '../../types';

export interface TraitDefinition {
    id: TraitName;
    min: number;
    max: number;
    description: string;
}

export const TraitManifest: Record<TraitName, TraitDefinition> = {
    speed: { id: 'speed', min: 0.5, max: 5.0, description: 'Movement velocity' },
    size: { id: 'size', min: 5.0, max: 25.0, description: 'Physical scale and mass' },
    metabolism: { id: 'metabolism', min: 0.1, max: 2.0, description: 'Rate of energy consumption' },
    sight_range: { id: 'sight_range', min: 50.0, max: 300.0, description: 'Sensory awareness distance' },
    sight_fov: { id: 'sight_fov', min: 0.5, max: 3.14, description: 'Angular field of view' },
    lifespan: { id: 'lifespan', min: 1000, max: 10000, description: 'Maximum biological age' },
    audible_range: { id: 'audible_range', min: 1.0, max: 10.0, description: 'Hearing awareness distance' },
    communicating_range: { id: 'communicating_range', min: 1.0, max: 5.0, description: 'Information exchange radius' }
};
