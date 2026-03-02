const e=`import { OrganismData, FloraData, SimulationState, Vector2 } from '../../../../types';\r
import { VectorMath } from '../../../core/VectorMath';\r
import { UNIT_UTILS, SIM_CONSTANTS, SENSORY_CONSTANTS, POPULATION_CONSTANTS } from '../../../core/Constants';\r
import { SensorSystem, SensoryInput } from './SensorSystem';\r
import { MemorySystem } from './MemorySystem';\r
\r
export class Brain {\r
    private me: OrganismData;\r
    private memorySystem: MemorySystem;\r
\r
    constructor(me: OrganismData) {\r
        this.me = me;\r
        this.memorySystem = new MemorySystem(me);\r
    }\r
\r
    public decide(\r
        time: number,\r
        worldSize: Vector2,\r
        neighbors: { organisms: OrganismData[], flora: FloraData[] },\r
        callbacks: { onEat: (f: FloraData) => void, onMate: (other: OrganismData) => void }\r
    ): Vector2 {\r
        // 1. Scan Environment\r
        const senses: SensoryInput = SensorSystem.scan(this.me, neighbors);\r
\r
        // 2. Validate/Forget Old Memories based on current vision\r
        this.memorySystem.validateMemories(\r
            senses.visibleFlora,\r
            UNIT_UTILS.mToPx(this.me.expressedStats.sight_range),\r
            this.me.position\r
        );\r
\r
        // 3. Process Visible Food -> Create Memories (Rate-limited)\r
        const currentTick = time;\r
        const lastPerception = this.me.lastPerceptionTick || 0;\r
        const perceptionCooldown = SENSORY_CONSTANTS.PERCEPTION_COOLDOWN_TICKS;\r
\r
        if (currentTick - lastPerception >= perceptionCooldown) {\r
            senses.visibleFlora.forEach(f => {\r
                if (f.energyValue > SENSORY_CONSTANTS.FOOD_MEMORY_ENERGY_THRESHOLD) {\r
                    this.memorySystem.addMemory(time, 'Food', f.position, f.name, { energy: f.energyValue, id: f.id });\r
                }\r
            });\r
\r
            senses.visibleFauna.forEach(other => {\r
                const isFamiliar = this.me.memories.some(m => m.data?.id === other.id && m.isFamiliar);\r
                this.memorySystem.addMemory(time, 'Fauna', other.position, other.name, { id: other.id, name: other.name, isFamiliar });\r
            });\r
            this.me.lastPerceptionTick = currentTick;\r
        }\r
\r
        // 4. Social Interaction (Communication)\r
        const commCooldown = SIM_CONSTANTS.COMM_COOLDOWN_TICKS;\r
        const lastComm = this.me.lastVocalTick || 0;\r
\r
        if (currentTick - lastComm >= commCooldown && senses.communicatingFauna.length > 0) {\r
            let vocalizedThisTick = false;\r
\r
            senses.communicatingFauna.forEach(other => {\r
                const distPx = VectorMath.dist(this.me.position, other.position);\r
                const distM = UNIT_UTILS.pxToM(distPx);\r
                const hearingRangeM = other.expressedStats.audible_range;\r
\r
                if (distM <= hearingRangeM) {\r
                    const foodMem = this.me.memories.find(m => m.type === 'Food');\r
                    if (foodMem) {\r
                        const alreadyKnown = other.memories.some(m =>\r
                            m.type === foodMem.type &&\r
                            VectorMath.dist(m.position, foodMem.position) < 10\r
                        );\r
\r
                        if (!alreadyKnown) {\r
                            other.memories.push({\r
                                ...foodMem,\r
                                id: Math.random().toString(36).substr(2, 5),\r
                                timestamp: currentTick,\r
                                content: foodMem.content,\r
                                count: 1\r
                            });\r
\r
                            other.isHearingActive = true;\r
\r
                            this.memorySystem.addMemory(time, 'Fauna', other.position, other.name, { id: other.id, name: other.name, isFamiliar: true });\r
                            vocalizedThisTick = true;\r
                        }\r
                    }\r
                }\r
            });\r
\r
            if (vocalizedThisTick) {\r
                this.me.lastVocalTick = currentTick;\r
                this.me.isTransmittingActive = true;\r
            }\r
        }\r
\r
        // 5. Decision Making: Hunger vs Mating vs Wandering\r
        let steering: Vector2 = { x: 0, y: 0 };\r
\r
        let bestTarget: Vector2 | null = null;\r
        let maxScore = -1;\r
        let targetFlora: FloraData | null = null;\r
        let bestTargetEntityId: string | null = null;\r
\r
        // A) Visible Food\r
        for (const f of senses.visibleFlora) {\r
            const dist = VectorMath.dist(this.me.position, f.position);\r
            const score = (f.energyValue * f.growthState) / (dist + SENSORY_CONSTANTS.FOOD_DESIRABILITY_DISTANCE_WEIGHT);\r
            if (score > maxScore) {\r
                maxScore = score;\r
                bestTarget = f.position;\r
                targetFlora = f;\r
                bestTargetEntityId = f.id;\r
            }\r
        }\r
\r
        // B) Memory Food\r
        const foodMemories = this.me.memories.filter(m => m.type === 'Food');\r
        for (const m of foodMemories) {\r
            const dist = VectorMath.dist(this.me.position, m.position);\r
            const energy = m.data?.energy || 500;\r
            const score = (energy * SENSORY_CONSTANTS.MEMORY_CONFIDENCE_PENALTY) / (dist + SENSORY_CONSTANTS.FOOD_DESIRABILITY_DISTANCE_WEIGHT);\r
\r
            if (score > maxScore) {\r
                maxScore = score;\r
                bestTarget = m.position;\r
                targetFlora = null;\r
                bestTargetEntityId = m.data?.id || null;\r
            }\r
        }\r
\r
        if (bestTarget) {\r
            let eatTarget = targetFlora;\r
            if (!eatTarget) {\r
                eatTarget = senses.visibleFlora.find(f => VectorMath.dist(f.position, bestTarget!) < 10) || null;\r
            }\r
\r
            const dist = VectorMath.dist(this.me.position, bestTarget);\r
            const eatRange = UNIT_UTILS.cmToPx(this.me.expressedStats.size) * 0.8;\r
\r
            if (eatTarget && dist < eatRange) {\r
                callbacks.onEat(eatTarget);\r
                this.memorySystem.addMemory(time, 'Flora', eatTarget.position, \`Ate \${eatTarget.name}\`, { energy: eatTarget.energyValue, id: eatTarget.id });\r
                this.memorySystem.removeMemory(eatTarget.id, 'Food');\r
            } else {\r
                const slowRadius = UNIT_UTILS.cmToPx(this.me.expressedStats.size) * 2.0;\r
\r
                if (dist < SENSORY_CONSTANTS.MEMORY_PRUNING_RADIUS_METERS && !eatTarget && !targetFlora && bestTargetEntityId) {\r
                    this.memorySystem.removeMemory(bestTargetEntityId, 'Food');\r
                    return { x: 0, y: 0 };\r
                }\r
\r
                let desiredSpeed = UNIT_UTILS.toInternalSpeed(this.me.expressedStats.speed);\r
\r
                if (dist < slowRadius) {\r
                    desiredSpeed *= (dist / slowRadius);\r
                }\r
\r
                const desired = VectorMath.normalize(VectorMath.sub(bestTarget, this.me.position));\r
                const targetVel = VectorMath.mul(desired, desiredSpeed);\r
                steering = VectorMath.sub(targetVel, this.me.velocity);\r
            }\r
        } else {\r
            const noiseTime = time * 0.005;\r
            const seed = parseInt(this.me.id) || 0;\r
\r
            const noiseX = Math.sin(noiseTime + seed) + Math.sin(noiseTime * 0.5 + seed);\r
            const noiseY = Math.cos(noiseTime + seed) + Math.cos(noiseTime * 0.5 + seed);\r
\r
            const wanderVec = VectorMath.normalize({ x: noiseX, y: noiseY });\r
            const wanderSpeed = UNIT_UTILS.toInternalSpeed(this.me.expressedStats.speed) * 0.4;\r
\r
            const currentSpeed = Math.sqrt(this.me.velocity.x ** 2 + this.me.velocity.y ** 2);\r
            let impulse = { x: 0, y: 0 };\r
            if (currentSpeed < 0.05) {\r
                impulse = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 };\r
            }\r
\r
            const desired = VectorMath.add(VectorMath.mul(wanderVec, wanderSpeed), impulse);\r
            steering = VectorMath.sub(desired, this.me.velocity);\r
        }\r
\r
        // 6. Mating Logic\r
        if (this.me.energy > POPULATION_CONSTANTS.MATING_ENERGY_THRESHOLD && this.me.matingTimer === 0) {\r
            const potentialMate = senses.visibleFauna.find(f =>\r
                f.energy > POPULATION_CONSTANTS.MATING_ENERGY_THRESHOLD &&\r
                f.matingTimer === 0 &&\r
                f.id !== this.me.id\r
            );\r
\r
            if (potentialMate) {\r
                const dist = VectorMath.dist(this.me.position, potentialMate.position);\r
                const contactRange = UNIT_UTILS.cmToPx(this.me.expressedStats.size) * 1.5;\r
\r
                if (dist < contactRange) {\r
                    callbacks.onMate(potentialMate);\r
                    return { x: 0, y: 0 };\r
                } else {\r
                    const desired = VectorMath.normalize(VectorMath.sub(potentialMate.position, this.me.position));\r
                    const maxSpeed = UNIT_UTILS.toInternalSpeed(this.me.expressedStats.speed);\r
                    const targetVel = VectorMath.mul(desired, maxSpeed);\r
                    steering = VectorMath.add(steering, VectorMath.sub(targetVel, this.me.velocity));\r
                }\r
            }\r
        }\r
\r
        return steering;\r
    }\r
}\r
`;export{e as default};
