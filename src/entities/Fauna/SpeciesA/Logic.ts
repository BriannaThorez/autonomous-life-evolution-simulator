import { Fauna } from '../Base';
import { Vector2, OrganismData, FloraData, SimulationState } from '../../../../types';
import { SIM_CONSTANTS } from '../../../core/Constants';
import { LinguisticEngine } from '../LinguisticEngine';
import { Brain } from '../Cognition/Brain';

export class SpeciesALogic extends Fauna {
    private brain: Brain;

    constructor(data: OrganismData) {
        super(data);
        this.brain = new Brain(data);
    }

    public update(time: number, worldSize: Vector2, terrain: any, popStats: any) {
        super.update(time, worldSize, terrain, popStats);
    }

    public think(time: number, worldSize: Vector2, terrain: any, popStats: any, neighbors: { organisms: OrganismData[], flora: FloraData[] }, callbacks: { onEat: (f: FloraData) => void, onMate: (other: OrganismData) => void }) {
        const orgData = this.data;

        // 1. Title & Nobility Updates (Species Specific Flavor)
        if (time % 60 === 0) {
            orgData.title = LinguisticEngine.getTitle(orgData, popStats);
            if (!orgData.isNoble && (orgData.matingCount > 10 || orgData.age > SIM_CONSTANTS.FRAMES_PER_DAY)) {
                orgData.isNoble = true;
                orgData.houseName = `House ${orgData.surname}`;
                orgData.lineageDescription = `Founder of the Noble ${orgData.houseName}.`;
            }
        }

        // 2. Cognition (Brain)
        const steering = this.brain.decide(time, worldSize, neighbors, callbacks);

        // 3. Apply Psysics
        this.applySteering(steering);
        this.calculateBending(steering);
    }
}
