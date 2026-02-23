
import { OrganismData, FloraData, SimulationState, Vector2 } from '../../../../types';
import { VectorMath } from '../../../core/VectorMath';
import { UNIT_UTILS, SIM_CONSTANTS } from '../../../core/Constants';
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
        // (If we see a spot where food was, and no food is there, forget it)
        // This is tricky: Need to iterate `visibleFlora` to confirm presence.
        // Actually, MemorySystem logic handles "forgetting" if vision covers the spot but target is missing.
        // We need to implement that in MemorySystem or call it here.
        // Let's implement pruning logic in MemorySystem and call it.
        // Wait, I implemented validateMemories in MemorySystem already? Let's check.
        // Yes, validateMemories(visibleFlora, visionRange, position).
        this.memorySystem.validateMemories(
            senses.visibleFlora,
            UNIT_UTILS.mToPx(this.me.expressedStats.sight_range),
            this.me.position
        );

        // 3. Process Visible Food -> Create Memories (Rate-limited)
        const currentTick = time;
        const lastPerception = this.me.lastPerceptionTick || 0;
        const perceptionCooldown = 60; // 1s at 60fps

        if (currentTick - lastPerception >= perceptionCooldown) {
            senses.visibleFlora.forEach(f => {
                if (f.energyValue > 100) {
                    this.memorySystem.addMemory(time, 'FoodLocation', f.position, f.name, { energy: f.energyValue, id: f.id });
                }
            });

            senses.visibleFauna.forEach(other => {
                // Check if they are already familiar from a previous meet/greet
                const isFamiliar = this.me.memories.some(m => m.data?.id === other.id && m.isFamiliar);
                this.memorySystem.addMemory(time, 'FaunaLocation', other.position, other.name, { id: other.id, name: other.name, isFamiliar });
            });
            this.me.lastPerceptionTick = currentTick;
        }

        // 4. Social Interaction (Communication)
        const commCooldown = SIM_CONSTANTS.COMM_COOLDOWN_TICKS;
        const lastComm = this.me.lastVocalTick || 0;

        // Rate-limit: Only vocalize every 5s (1/6 of a day)
        if (currentTick - lastComm >= commCooldown && senses.communicatingFauna.length > 0) {
            let vocalizedThisTick = false;

            senses.communicatingFauna.forEach(other => {
                const distPx = VectorMath.dist(this.me.position, other.position);
                const distM = UNIT_UTILS.pxToM(distPx);

                // INDUSTRY STANDARD: Communication Range Check
                // 1. I must be within my Vocalization range (already filtered by senses)
                // 2. OTHER must be within THEIR Hearing range
                const hearingRangeM = other.expressedStats.audible_range;

                if (distM <= hearingRangeM) {
                    // ACTION: Greeting & Check Uniqueness
                    // Only share information that the recipient does NOT already know.

                    // Share a Food Memory (randomly)
                    const foodMem = this.me.memories.find(m => m.type === 'FoodLocation');
                    if (foodMem) {
                        // Greeting Check: Does the other organism already possess this knowledge?
                        const alreadyKnown = other.memories.some(m =>
                            m.type === foodMem.type &&
                            VectorMath.dist(m.position, foodMem.position) < 10
                        );

                        if (!alreadyKnown) {
                            // "Telling" the other organism
                            other.memories.push({
                                ...foodMem,
                                id: Math.random().toString(36).substr(2, 5),
                                timestamp: currentTick,
                                content: foodMem.content, // Cleaned: no extra words
                                count: 1
                            });

                            // Log the meeting in our own memory as "Familiar"
                            this.memorySystem.addMemory(time, 'FaunaLocation', other.position, other.name, { id: other.id, name: other.name, isFamiliar: true });
                            vocalizedThisTick = true;
                        }
                    }
                }
            });

            if (vocalizedThisTick) {
                this.me.lastVocalTick = currentTick;
            }
        }

        // 5. Decision Making: Hunger vs Mating vs Wandering
        let steering: Vector2 = { x: 0, y: 0 };

        // Hunger Logic
        // Calculate "Desirability Score" = Nutrition / Distance
        let bestTarget: Vector2 | null = null;
        let maxScore = -1;
        let targetFlora: FloraData | null = null;
        let bestTargetEntityId: string | null = null;

        // A) Visible Food
        for (const f of senses.visibleFlora) {
            const dist = VectorMath.dist(this.me.position, f.position);
            const score = (f.energyValue * f.growthState) / (dist + 1); // Avoid div by zero
            if (score > maxScore) {
                maxScore = score;
                bestTarget = f.position;
                targetFlora = f;
                bestTargetEntityId = f.id;
            }
        }

        // B) Memory Food (Lower priority if not visible but High Value)
        // Only if no visible target or memory is exceptionally good
        // Iterate memories formatted as 'FoodLocation'
        const foodMemories = this.me.memories.filter(m => m.type === 'FoodLocation');
        for (const m of foodMemories) {
            const dist = VectorMath.dist(this.me.position, m.position);
            // Estimate energy from memory data if available, else baseline
            const energy = m.data?.energy || 500;
            const score = (energy * 0.8) / (dist + 1); // 0.8 Confidence penalty for memory

            if (score > maxScore) {
                maxScore = score;
                bestTarget = m.position;
                targetFlora = null; // It's a memory, not a direct object ref yet
                bestTargetEntityId = m.data?.id || null;
            }
        }

        if (bestTarget) {
            // Resolve Target: If null, try to find matching visible flora at that location
            let eatTarget = targetFlora;
            if (!eatTarget) {
                eatTarget = senses.visibleFlora.find(f => VectorMath.dist(f.position, bestTarget!) < 10) || null;
            }

            const dist = VectorMath.dist(this.me.position, bestTarget);
            const eatRange = UNIT_UTILS.cmToPx(this.me.expressedStats.size) * 0.8;

            // EAT if close enough to resolved target
            if (eatTarget && dist < eatRange) {
                callbacks.onEat(eatTarget);
                // Record Consumption
                this.memorySystem.addMemory(time, 'Flora', eatTarget.position, `Ate ${eatTarget.name}`, { energy: eatTarget.energyValue, id: eatTarget.id });
                // Remove the "Target" memory so we don't stick to empty space
                this.memorySystem.removeMemory(eatTarget.id, 'FoodLocation');
            } else {
                // Seek with Arrival to prevent oscillation
                const slowRadius = UNIT_UTILS.cmToPx(this.me.expressedStats.size) * 2.0;

                // Broken Memory Check: If close to memory target but no food found
                if (dist < 15 && !eatTarget && !targetFlora && bestTargetEntityId) {
                    this.memorySystem.removeMemory(bestTargetEntityId, 'FoodLocation');
                    // Return zero steering to force decision reset next frame
                    return { x: 0, y: 0 };
                }

                let desiredSpeed = UNIT_UTILS.toInternalSpeed(this.me.expressedStats.speed);

                if (dist < slowRadius) {
                    desiredSpeed *= (dist / slowRadius);
                }

                const desired = VectorMath.normalize(VectorMath.sub(bestTarget, this.me.position));
                const targetVel = VectorMath.mul(desired, desiredSpeed);
                steering = VectorMath.sub(targetVel, this.me.velocity); // Steering = Desired - Velocity
            }
        } else {
            // Organic Wander (Perlin-ish Noise)
            // Use time + ID as seed offset for unique path
            const noiseTime = time * 0.005;
            const seed = parseInt(this.me.id) || 0;

            // Pseudo-random coherent noise vector
            const noiseX = Math.sin(noiseTime + seed) + Math.sin(noiseTime * 0.5 + seed);
            const noiseY = Math.cos(noiseTime + seed) + Math.cos(noiseTime * 0.5 + seed);

            const wanderVec = VectorMath.normalize({ x: noiseX, y: noiseY });

            // Wander speed is slower than run speed
            const wanderSpeed = UNIT_UTILS.toInternalSpeed(this.me.expressedStats.speed) * 0.4;

            // Stuck Prevention: If nearly stopped, give it a random impulse
            const currentSpeed = Math.sqrt(this.me.velocity.x ** 2 + this.me.velocity.y ** 2);
            let impulse = { x: 0, y: 0 };
            if (currentSpeed < 0.05) {
                impulse = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 };
            }

            const desired = VectorMath.add(VectorMath.mul(wanderVec, wanderSpeed), impulse);
            steering = VectorMath.sub(desired, this.me.velocity);
        }

        // Mating Logic (Simple override for now, keep existing)
        const matingTarget = senses.visibleFauna.find(f =>
            f.energy > 4000 && this.me.energy > 4000 // Basic threshold check
        );
        if (matingTarget) {
            // Add Mating steering... logic from original file
        }

        return steering;
    }
}
