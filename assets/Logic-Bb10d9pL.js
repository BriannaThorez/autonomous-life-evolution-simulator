const r=`import { Fauna } from '../Base';\r
import { Vector2, OrganismData, FloraData, SimulationState } from '../../../../types';\r
import { SIM_CONSTANTS } from '../../../core/Constants';\r
import { SOCIAL_CONSTANTS } from '../Language/Constants';\r
import { LinguisticEngine } from '../Language/LinguisticEngine';\r
import { Brain } from '../Cognition/Brain';\r
\r
export class SpeciesALogic extends Fauna {\r
    private brain: Brain;\r
\r
    constructor(data: OrganismData) {\r
        super(data);\r
        this.brain = new Brain(data);\r
    }\r
\r
    public update(time: number, worldSize: Vector2, terrain: any, popStats: any) {\r
        super.update(time, worldSize, terrain, popStats);\r
    }\r
\r
    public think(time: number, worldSize: Vector2, terrain: any, popStats: any, neighbors: { organisms: OrganismData[], flora: FloraData[] }, callbacks: { onEat: (f: FloraData) => void, onMate: (other: OrganismData) => void }) {\r
        const orgData = this.data;\r
        orgData.isHearingActive = false;\r
        orgData.isTransmittingActive = false;\r
\r
        // 1. Title & Nobility Updates\r
        // Update check still per-minute (60 frames) for performance, but logic uses constants.\r
        if (time % 60 === 0) {\r
            orgData.title = LinguisticEngine.getTitle(orgData, popStats);\r
            if (!orgData.isNoble && (orgData.matingCount > SOCIAL_CONSTANTS.NOBILITY_MATING_THRESHOLD || orgData.age > (SOCIAL_CONSTANTS.NOBILITY_AGE_THRESHOLD_DAYS * SIM_CONSTANTS.FRAMES_PER_DAY))) {\r
                orgData.isNoble = true;\r
                orgData.houseName = \`House \${orgData.surname}\`;\r
                orgData.lineageDescription = \`Founder of the Noble \${orgData.houseName}.\`;\r
            }\r
        }\r
\r
        // 2. Cognition (Brain)\r
        const steering = this.brain.decide(time, worldSize, neighbors, callbacks);\r
\r
        // 3. Apply Physics\r
        this.applySteering(steering);\r
        this.calculateBending(steering);\r
    }\r
}\r
`;export{r as default};
