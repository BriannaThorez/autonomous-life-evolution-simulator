import { Vector2, OrganismData, EntityStats, Genome, Memory } from '../../../types';
import { VectorMath } from '../../core/VectorMath';
import { Metabolism } from './Metabolism';
import { Genetics } from '../../evolution/GeneticsEngine';
import { LinguisticEngine } from './LinguisticEngine';
import { UNIT_UTILS } from '../../core/Constants';

export class Fauna {
    public data: OrganismData;

    constructor(data: OrganismData) {
        this.data = data;
    }

    public update(time: number, worldSize: Vector2, terrain: any, popStats: any) {
        // 1. Metabolism
        const loss = Metabolism.calculateEnergyLoss(this.data.expressedStats);
        this.data.energy -= loss;
        this.data.age++;

        // 2. Physics & Boundaries
        const nextPos = VectorMath.add(this.data.position, this.data.velocity);
        if (terrain.isImpassable(nextPos.x, nextPos.y)) {
            if (nextPos.x < 0 || nextPos.x > worldSize.x) this.data.velocity.x *= -1;
            if (nextPos.y < 0 || nextPos.y > worldSize.y) this.data.velocity.y *= -1;
            if (terrain.getBiomeAt(nextPos.x, nextPos.y) === 'CLIFF') {
                this.data.velocity.x *= -1;
                this.data.velocity.y *= -1;
            }
        }

        // 3. Mating Timer & State Handling
        if (this.data.matingTimer && this.data.matingTimer > 0) {
            this.data.matingTimer--;
        }

        // 4. Memory Decay
        this.data.memories = this.data.memories.filter(m => {
            const age = time - m.timestamp;
            return age < m.duration;
        });

        // Update heading based on velocity if moving
        const velSq = this.data.velocity.x ** 2 + this.data.velocity.y ** 2;
        if (velSq > 0.01) { // Equivalent to len > 0.1, but faster
            this.data.heading = VectorMath.normalize(this.data.velocity);
        }

        // 5. Apply Movement (Final Position Update)
        const internalMaxSpeed = UNIT_UTILS.toInternalSpeed(this.data.expressedStats.speed);
        this.data.velocity = VectorMath.limit(this.data.velocity, internalMaxSpeed);
        this.data.position = VectorMath.add(this.data.position, this.data.velocity);

        // Clamp
        this.data.position.x = Math.max(0, Math.min(worldSize.x, this.data.position.x));
        this.data.position.y = Math.max(0, Math.min(worldSize.y, this.data.position.y));
    }

    public applySteering(steering: Vector2) {
        // Limit Max Force for organic movement (smooth turns)
        const internalMaxSpeed = UNIT_UTILS.toInternalSpeed(this.data.expressedStats.speed);
        const maxForce = internalMaxSpeed * 0.1; // Limit turn rate/acceleration

        const force = VectorMath.limit(steering, maxForce);
        this.data.velocity = VectorMath.add(this.data.velocity, force);
    }

    public calculateBending(steering: Vector2) {
        const currentAngle = Math.atan2(this.data.velocity.y, this.data.velocity.x);
        const targetVel = VectorMath.add(this.data.velocity, steering);
        const targetAngle = Math.atan2(targetVel.y, targetVel.x);

        let angleDiff = targetAngle - currentAngle;
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Cinematic smoothing with strict clamping to avoid "noodle" stretching
        const decay = 0.85;
        const sensitivity = 3.5;
        const rawBending = (this.data.bending || 0) * decay + angleDiff * sensitivity;
        this.data.bending = Math.max(-1.5, Math.min(1.5, rawBending));
    }
}
