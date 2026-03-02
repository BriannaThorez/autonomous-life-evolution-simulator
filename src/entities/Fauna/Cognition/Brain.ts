import { OrganismData, FloraData, SimulationState, Vector2 } from '../../../../types';
import { VectorMath } from '../../../core/VectorMath';
import { UNIT_UTILS, SIM_CONSTANTS, SENSORY_CONSTANTS, POPULATION_CONSTANTS } from '../../../core/Constants';
import { SensorSystem, SensoryInput } from './SensorSystem';
import { MemorySystem } from './MemorySystem';

export class Brain {
    private me: OrganismData;
    private memorySystem: MemorySystem;

    constructor(me: OrganismData) {
        this.me = me;
        this.memorySystem = new MemorySystem(me);
    }

    public decide(
        time: number,
        worldSize: Vector2,
        neighbors: { organisms: OrganismData[], flora: FloraData[] },
        callbacks: { onEat: (f: FloraData) => void, onMate: (other: OrganismData) => void }
    ): Vector2 {
        // 1. Scan Environment
        const senses: SensoryInput = SensorSystem.scan(this.me, neighbors);

        // 2. Validate/Forget Old Memories based on current vision
        this.memorySystem.validateMemories(
            senses.visibleFlora,
            UNIT_UTILS.mToPx(this.me.expressedStats.sight_range),
            this.me.position
        );

        // 3. Process Visible Food -> Create Memories (Rate-limited)
        const currentTick = time;
        const lastPerception = this.me.lastPerceptionTick || 0;
        const perceptionCooldown = SENSORY_CONSTANTS.PERCEPTION_COOLDOWN_TICKS;

        if (currentTick - lastPerception >= perceptionCooldown) {
            senses.visibleFlora.forEach(f => {
                if (f.energyValue > SENSORY_CONSTANTS.FOOD_MEMORY_ENERGY_THRESHOLD) {
                    this.memorySystem.addMemory(time, 'Food', f.position, f.name, { energy: f.energyValue, id: f.id });
                }
            });

            senses.visibleFauna.forEach(other => {
                const isFamiliar = this.me.memories.some(m => m.data?.id === other.id && m.isFamiliar);
                this.memorySystem.addMemory(time, 'Fauna', other.position, other.name, { id: other.id, name: other.name, isFamiliar });
            });
            this.me.lastPerceptionTick = currentTick;
        }

        // 4. Social Interaction (Communication)
        const commCooldown = SIM_CONSTANTS.COMM_COOLDOWN_TICKS;
        const lastComm = this.me.lastVocalTick || 0;

        if (currentTick - lastComm >= commCooldown && senses.communicatingFauna.length > 0) {
            let vocalizedThisTick = false;

            senses.communicatingFauna.forEach(other => {
                const distPx = VectorMath.dist(this.me.position, other.position);
                const distM = UNIT_UTILS.pxToM(distPx);
                const hearingRangeM = other.expressedStats.audible_range;

                if (distM <= hearingRangeM) {
                    const foodMem = this.me.memories.find(m => m.type === 'Food');
                    if (foodMem) {
                        const alreadyKnown = other.memories.some(m =>
                            m.type === foodMem.type &&
                            VectorMath.dist(m.position, foodMem.position) < 10
                        );

                        if (!alreadyKnown) {
                            other.memories.push({
                                ...foodMem,
                                id: Math.random().toString(36).substr(2, 5),
                                timestamp: currentTick,
                                content: foodMem.content,
                                count: 1
                            });

                            other.isHearingActive = true;

                            this.memorySystem.addMemory(time, 'Fauna', other.position, other.name, { id: other.id, name: other.name, isFamiliar: true });
                            vocalizedThisTick = true;
                        }
                    }
                }
            });

            if (vocalizedThisTick) {
                this.me.lastVocalTick = currentTick;
                this.me.isTransmittingActive = true;
            }
        }

        // 5. Decision Making: Hunger vs Mating vs Wandering
        let steering: Vector2 = { x: 0, y: 0 };

        let bestTarget: Vector2 | null = null;
        let maxScore = -1;
        let targetFlora: FloraData | null = null;
        let bestTargetEntityId: string | null = null;

        // A) Visible Food
        for (const f of senses.visibleFlora) {
            const dist = VectorMath.dist(this.me.position, f.position);
            const score = (f.energyValue * f.growthState) / (dist + SENSORY_CONSTANTS.FOOD_DESIRABILITY_DISTANCE_WEIGHT);
            if (score > maxScore) {
                maxScore = score;
                bestTarget = f.position;
                targetFlora = f;
                bestTargetEntityId = f.id;
            }
        }

        // B) Memory Food
        const foodMemories = this.me.memories.filter(m => m.type === 'Food');
        for (const m of foodMemories) {
            const dist = VectorMath.dist(this.me.position, m.position);
            const energy = m.data?.energy || 500;
            const score = (energy * SENSORY_CONSTANTS.MEMORY_CONFIDENCE_PENALTY) / (dist + SENSORY_CONSTANTS.FOOD_DESIRABILITY_DISTANCE_WEIGHT);

            if (score > maxScore) {
                maxScore = score;
                bestTarget = m.position;
                targetFlora = null;
                bestTargetEntityId = m.data?.id || null;
            }
        }

        if (bestTarget) {
            let eatTarget = targetFlora;
            if (!eatTarget) {
                eatTarget = senses.visibleFlora.find(f => VectorMath.dist(f.position, bestTarget!) < 10) || null;
            }

            const dist = VectorMath.dist(this.me.position, bestTarget);
            const eatRange = UNIT_UTILS.cmToPx(this.me.expressedStats.size) * 0.8;

            if (eatTarget && dist < eatRange) {
                callbacks.onEat(eatTarget);
                this.memorySystem.addMemory(time, 'Flora', eatTarget.position, `Ate ${eatTarget.name}`, { energy: eatTarget.energyValue, id: eatTarget.id });
                this.memorySystem.removeMemory(eatTarget.id, 'Food');
            } else {
                const slowRadius = UNIT_UTILS.cmToPx(this.me.expressedStats.size) * 2.0;

                if (dist < SENSORY_CONSTANTS.MEMORY_PRUNING_RADIUS_METERS && !eatTarget && !targetFlora && bestTargetEntityId) {
                    this.memorySystem.removeMemory(bestTargetEntityId, 'Food');
                    return { x: 0, y: 0 };
                }

                let desiredSpeed = UNIT_UTILS.toInternalSpeed(this.me.expressedStats.speed);

                if (dist < slowRadius) {
                    desiredSpeed *= (dist / slowRadius);
                }

                const desired = VectorMath.normalize(VectorMath.sub(bestTarget, this.me.position));
                const targetVel = VectorMath.mul(desired, desiredSpeed);
                steering = VectorMath.sub(targetVel, this.me.velocity);
            }
        } else {
            const noiseTime = time * 0.005;
            const seed = parseInt(this.me.id) || 0;

            const noiseX = Math.sin(noiseTime + seed) + Math.sin(noiseTime * 0.5 + seed);
            const noiseY = Math.cos(noiseTime + seed) + Math.cos(noiseTime * 0.5 + seed);

            const wanderVec = VectorMath.normalize({ x: noiseX, y: noiseY });
            const wanderSpeed = UNIT_UTILS.toInternalSpeed(this.me.expressedStats.speed) * 0.4;

            const currentSpeed = Math.sqrt(this.me.velocity.x ** 2 + this.me.velocity.y ** 2);
            let impulse = { x: 0, y: 0 };
            if (currentSpeed < 0.05) {
                impulse = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 };
            }

            const desired = VectorMath.add(VectorMath.mul(wanderVec, wanderSpeed), impulse);
            steering = VectorMath.sub(desired, this.me.velocity);
        }

        // 6. Mating Logic
        if (this.me.energy > POPULATION_CONSTANTS.MATING_ENERGY_THRESHOLD && this.me.matingTimer === 0) {
            const potentialMate = senses.visibleFauna.find(f =>
                f.energy > POPULATION_CONSTANTS.MATING_ENERGY_THRESHOLD &&
                f.matingTimer === 0 &&
                f.id !== this.me.id
            );

            if (potentialMate) {
                const dist = VectorMath.dist(this.me.position, potentialMate.position);
                const contactRange = UNIT_UTILS.cmToPx(this.me.expressedStats.size) * 1.5;

                if (dist < contactRange) {
                    callbacks.onMate(potentialMate);
                    return { x: 0, y: 0 };
                } else {
                    const desired = VectorMath.normalize(VectorMath.sub(potentialMate.position, this.me.position));
                    const maxSpeed = UNIT_UTILS.toInternalSpeed(this.me.expressedStats.speed);
                    const targetVel = VectorMath.mul(desired, maxSpeed);
                    steering = VectorMath.add(steering, VectorMath.sub(targetVel, this.me.velocity));
                }
            }
        }

        return steering;
    }
}
