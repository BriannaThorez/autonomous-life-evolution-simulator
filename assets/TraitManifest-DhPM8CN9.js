const i=`import { TraitName } from '../../types';\r
\r
export interface TraitDefinition {\r
    id: TraitName;\r
    min: number;\r
    max: number;\r
    description: string;\r
}\r
\r
export const TraitManifest: Record<TraitName, TraitDefinition> = {\r
    speed: { id: 'speed', min: 0.5, max: 5.0, description: 'Movement velocity' },\r
    size: { id: 'size', min: 5.0, max: 25.0, description: 'Physical scale and mass' },\r
    metabolism: { id: 'metabolism', min: 0.1, max: 2.0, description: 'Rate of energy consumption' },\r
    sight_range: { id: 'sight_range', min: 50.0, max: 300.0, description: 'Sensory awareness distance' },\r
    sight_fov: { id: 'sight_fov', min: 0.5, max: 3.14, description: 'Angular field of view' },\r
    lifespan: { id: 'lifespan', min: 1000, max: 10000, description: 'Maximum biological age' },\r
    audible_range: { id: 'audible_range', min: 1.0, max: 10.0, description: 'Hearing awareness distance' },\r
    communicating_range: { id: 'communicating_range', min: 1.0, max: 5.0, description: 'Information exchange radius' }\r
};\r
`;export{i as default};
