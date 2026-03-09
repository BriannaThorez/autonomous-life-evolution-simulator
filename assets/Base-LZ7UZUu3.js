const t=`import { Vector2, OrganismData, EntityStats, Genome, Memory } from '../../../types';\r
import { VectorMath } from '../../core/VectorMath';\r
import { Metabolism } from './Metabolism';\r
import { Genetics } from '../../evolution/GeneticsEngine';\r
import { UNIT_UTILS } from '../../core/Constants';\r
\r
export class Fauna {\r
    public data: OrganismData;\r
\r
    constructor(data: OrganismData) {\r
        this.data = data;\r
    }\r
\r
    public update(time: number, worldSize: Vector2, terrain: any, popStats: any) {\r
        // 1. Metabolism\r
        const currentSpeedMps = UNIT_UTILS.toDisplaySpeed(Math.sqrt(this.data.velocity.x ** 2 + this.data.velocity.y ** 2));\r
        const loss = Metabolism.calculateEnergyLoss(this.data.expressedStats, currentSpeedMps);\r
        this.data.energy -= loss;\r
        this.data.age++;\r
\r
        // 2. Physics & Boundaries\r
        const nextPos = VectorMath.add(this.data.position, this.data.velocity);\r
        if (terrain.isImpassable(nextPos.x, nextPos.y)) {\r
            if (nextPos.x < 0 || nextPos.x > worldSize.x) this.data.velocity.x *= -1;\r
            if (nextPos.y < 0 || nextPos.y > worldSize.y) this.data.velocity.y *= -1;\r
            if (terrain.getBiomeAt(nextPos.x, nextPos.y) === 'CLIFF') {\r
                this.data.velocity.x *= -1;\r
                this.data.velocity.y *= -1;\r
            }\r
        }\r
\r
        // 3. Mating Timer & State Handling\r
        if (this.data.matingTimer && this.data.matingTimer > 0) {\r
            this.data.matingTimer--;\r
        }\r
\r
        // 4. Memory Decay\r
        this.data.memories = this.data.memories.filter(m => {\r
            const age = time - m.timestamp;\r
            return age < m.duration;\r
        });\r
\r
        // Update heading based on velocity if moving\r
        const velSq = this.data.velocity.x ** 2 + this.data.velocity.y ** 2;\r
        if (velSq > 0.01) { // Equivalent to len > 0.1, but faster\r
            this.data.heading = VectorMath.normalize(this.data.velocity);\r
        }\r
\r
        // 5. Apply Movement (Final Position Update)\r
        const internalMaxSpeed = UNIT_UTILS.toInternalSpeed(this.data.expressedStats.speed);\r
        this.data.velocity = VectorMath.limit(this.data.velocity, internalMaxSpeed);\r
        this.data.position = VectorMath.add(this.data.position, this.data.velocity);\r
\r
        // Clamp\r
        this.data.position.x = Math.max(0, Math.min(worldSize.x, this.data.position.x));\r
        this.data.position.y = Math.max(0, Math.min(worldSize.y, this.data.position.y));\r
    }\r
\r
    public applySteering(steering: Vector2) {\r
        // Limit Max Force for organic movement (smooth turns)\r
        const internalMaxSpeed = UNIT_UTILS.toInternalSpeed(this.data.expressedStats.speed);\r
        const maxForce = internalMaxSpeed * 0.1; // Limit turn rate/acceleration\r
\r
        const force = VectorMath.limit(steering, maxForce);\r
        this.data.velocity = VectorMath.add(this.data.velocity, force);\r
    }\r
\r
    public calculateBending(steering: Vector2) {\r
        const currentAngle = Math.atan2(this.data.velocity.y, this.data.velocity.x);\r
        const targetVel = VectorMath.add(this.data.velocity, steering);\r
        const targetAngle = Math.atan2(targetVel.y, targetVel.x);\r
\r
        let angleDiff = targetAngle - currentAngle;\r
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;\r
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;\r
\r
        // Cinematic smoothing with strict clamping to avoid "noodle" stretching\r
        const decay = 0.85;\r
        const sensitivity = 3.5;\r
        const rawBending = (this.data.bending || 0) * decay + angleDiff * sensitivity;\r
        this.data.bending = Math.max(-1.5, Math.min(1.5, rawBending));\r
    }\r
}\r
`;export{t as default};
