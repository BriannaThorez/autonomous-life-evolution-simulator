
import { OrganismData, FloraData, Memory, Vector2 } from '../../../../types';
import { VectorMath } from '../../../core/VectorMath';
import { SIM_CONSTANTS, COGNITIVE_CONSTANTS, UNIT_UTILS } from '../../../core/Constants';
import { VectorDB } from '../../../data/VectorDB';

export class MemorySystem {
    private data: OrganismData;

    constructor(data: OrganismData) {
        this.data = data;
    }

    public addMemory(currentTime: number, type: Memory['type'], position: Vector2, content: string, data?: any) {
        // 1. Constants
        const THREE_HOURS = 3 * SIM_CONSTANTS.FRAMES_PER_HOUR;
        const visionRangePx = UNIT_UTILS.mToPx(this.data.expressedStats.sight_range);

        // 2. Identify Target Entity ID (if any)
        const targetId = data?.id;

        // 3. Stacking Logic (Same exact entity/location, very recent)
        let exactMatch = this.data.memories.find(m =>
            m.type === type && (
                (targetId && m.data && m.data.id === targetId) || // Match by unique entity ID
                (targetId && m.entityIds?.includes(targetId)) || // Match if already in a group
                (m.content === content && VectorMath.dist(m.position, position) < 8) // Match by content/position
            )
        );

        if (exactMatch) {
            exactMatch.position = { ...position };
            const timeSinceUpdate = currentTime - exactMatch.timestamp;

            // Rate-limit stacking: Only increment count every ~2 seconds (120 ticks)
            // if (timeSinceUpdate > 120 || type !== 'Fauna') {
            //    exactMatch.timestamp = currentTime;
            //    exactMatch.count = (exactMatch.count || 1) + 1;

            // Keep front
            //    this.data.memories = [exactMatch, ...this.data.memories.filter(m => m.id !== exactMatch?.id)];
            //}
            return;
        }

        // 4. Temporal & Spatial Grouping (👥)
        // Check if there's a recent memory of same type within 3 simulation hours
        const recentGroupable = this.data.memories.find(m =>
            m.type === type &&
            (currentTime - m.timestamp) < THREE_HOURS
        );

        if (recentGroupable && type === 'Fauna') {
            const dist = VectorMath.dist(recentGroupable.position, position);
            const distNormalized = dist / visionRangePx;

            // Spatial Falloff: Higher probability of grouping if closer (within 60% of vision range)
            const groupProbability = 1.0 - Math.pow(distNormalized, 0.5); // Concave falloff

            if (Math.random() < groupProbability || dist < 50) {
                // Group them
                if (targetId && !recentGroupable.entityIds?.includes(targetId)) {
                    recentGroupable.entityIds = [...(recentGroupable.entityIds || []), targetId];
                    recentGroupable.count = recentGroupable.entityIds.length;

                    // Update content name for UI tooltip logic
                    if (recentGroupable.count > 1) {
                        recentGroupable.content = `${recentGroupable.count} entities encountered`;
                    }

                    recentGroupable.timestamp = currentTime;
                    // Move to front
                    this.data.memories = [recentGroupable, ...this.data.memories.filter(m => m.id !== recentGroupable?.id)];
                    return;
                }
            }
        }

        // 5. Create New Memory

        const defaultDuration = SIM_CONSTANTS.FRAMES_PER_DAY * COGNITIVE_CONSTANTS.DAYS_TO_REMEMBER;
        const minimumFoodDuration = SIM_CONSTANTS.FRAMES_PER_HOUR * 12;
        const memoryDuration = type === 'Food'
            ? Math.max(minimumFoodDuration, defaultDuration / 4)
            : defaultDuration;

        this.data.memories.push({
            id: Math.random().toString(36).substr(2, 5),
            type,
            position: { ...position },
            timestamp: currentTime,
            duration: memoryDuration,
            content,
            count: 1,
            data,
            entityIds: data && data.id ? [data.id] : undefined,
            isFamiliar: data ? data.isFamiliar : false
        });

        // Cap memory size (preservingPinned)
        if (this.data.memories.length > COGNITIVE_CONSTANTS.TEMPORARY_MEMORY_LIMIT) {
            // We prioritize keeping 'Familiar' (Met someone) or high-count memories
            const coldIdx = this.data.memories.findIndex(m => (m.count || 0) < 3 && !m.isFamiliar);
            const indexToRemove = coldIdx !== -1 ? coldIdx : 0;

            const memoryToArchive = this.data.memories[indexToRemove];

            // VERIFICATION: Log this to your console to see it happening live
            // console.log(`Offloading memory ${memoryToArchive.type} to LT for ${this.data.id}`);

            VectorDB.pushToHistory(this.data.id, memoryToArchive);

            this.data.memories.splice(indexToRemove, 1);
        }
    }

    public validateMemories(visibleFlora: FloraData[], visionRange: number, position: Vector2) {
        // Check if any 'FoodLocation' memories are within vision range but NOT in visibleFlora
        // If so, the food is gone. Delete the memory.

        this.data.memories = this.data.memories.filter(m => {
            if (m.type === 'Food' || m.type === 'Flora') {
                const dist = VectorMath.dist(position, m.position);

                // If we are close enough to see it...
                if (dist < visionRange) {
                    // ...and it's not in our visible list...
                    const stillExists = visibleFlora.some(f => VectorMath.dist(f.position, m.position) < 12);
                    if (!stillExists) {
                        return false; // FORGET IT!
                    }
                }
            }
            return true;
        });
    }

    public removeMemory(entityId: string, type?: Memory['type']) {
        this.data.memories = this.data.memories.filter(m => {
            const isMatch = (m.data && m.data.id === entityId) || m.entityIds?.includes(entityId);
            if (isMatch) {
                // If type is specified, only remove if type matches. Otherwise remove all.
                if (type && m.type !== type) return true;
                return false;
            }
            return true;
        });

    }

    public getBestFoodLocation(): Memory | null {
        return this.data.memories.find(m => m.type === 'Food' || m.type === 'Flora') || null;
    }
}
