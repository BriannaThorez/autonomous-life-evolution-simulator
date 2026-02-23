
import { OrganismData, FloraData, Memory, Vector2 } from '../../../../types';
import { VectorMath } from '../../../core/VectorMath';
import { SIM_CONSTANTS, COGNITIVE_CONSTANTS } from '../../../core/Constants';

export class MemorySystem {
    private data: OrganismData;

    constructor(data: OrganismData) {
        this.data = data;
    }

    public addMemory(currentTime: number, type: Memory['type'], position: Vector2, content: string, data?: any) {
        // 1. Rate-limiting for perception (Saw...)
        // Only increment count or update if a significant time has passed since last perception
        const isPerception = content.indexOf('Saw') !== -1;

        // 2. Try to find existing memory for stacking/grouping
        let existing = this.data.memories.find(m =>
            m.type === type && (
                (data && m.data && m.data.id === data.id) || // Match by unique entity ID
                (m.type === 'FaunaLocation' && data && m.entityIds?.includes(data.id)) || // Match if already in a group
                (m.content === content && VectorMath.dist(m.position, position) < 5) // Match by content/position
            )
        );

        if (existing) {
            // Update position and timestamp
            existing.position = { ...position };
            const lastUpdate = existing.timestamp;
            const timeSinceUpdate = currentTime - lastUpdate;

            // Rate-limit stacking: Only increment count every ~2 seconds (120 ticks)
            // This prevents x144 for simply looking at someone.
            if (timeSinceUpdate > 120 || !isPerception) {
                existing.timestamp = currentTime;
                existing.count = (existing.count || 1) + 1;

                // If it was a group memory, ensure it stays front
                if (existing.count > 1) {
                    const idx = this.data.memories.indexOf(existing);
                    if (idx > 0) {
                        this.data.memories.splice(idx, 1);
                        this.data.memories.unshift(existing);
                    }
                }
            }
            return;
        }

        // Grouping logic for "Familiar" entities (👥)
        // If we see multiple familiar entities, merge into a group memory
        if (type === 'FaunaLocation' && data && data.isFamiliar) {
            const groupMemory = this.data.memories.find(m => m.type === 'FaunaLocation' && m.entityIds && m.entityIds.length > 0);
            if (groupMemory) {
                if (!groupMemory.entityIds?.includes(data.id)) {
                    groupMemory.entityIds = [...(groupMemory.entityIds || []), data.id];
                    groupMemory.content = `${groupMemory.entityIds.length} familiar entities`; // Updated by EntityInspector
                    groupMemory.count = groupMemory.entityIds.length;
                    groupMemory.position = { ...position };
                    groupMemory.timestamp = currentTime;
                    return;
                }
            }
        }

        this.data.memories.push({
            id: Math.random().toString(36).substr(2, 5),
            type,
            position: { ...position },
            timestamp: currentTime,
            duration: SIM_CONSTANTS.SECONDS_PER_DAY * COGNITIVE_CONSTANTS.DAYS_TO_REMEMBER, // Remember for 1 days
            content,
            count: 1,
            data,
            entityIds: data && data.id ? [data.id] : undefined,
            isFamiliar: data ? data.isFamiliar : false
        });

        // Cap memory size (preservingPinned)
        if (this.data.memories.length > COGNITIVE_CONSTANTS.TEMPORARY_MEMORY_LIMIT) {
            const coldIdx = this.data.memories.findIndex(m => (m.count || 0) < 3 && !m.isFamiliar);
            if (coldIdx !== -1) {
                this.data.memories.splice(coldIdx, 1);
            } else {
                this.data.memories.shift();
            }
        }
    }

    public validateMemories(visibleFlora: FloraData[], visionRange: number, position: Vector2) {
        // Check if any 'FoodLocation' memories are within vision range but NOT in visibleFlora
        // If so, the food is gone. Delete the memory.

        this.data.memories = this.data.memories.filter(m => {
            if (m.type === 'FoodLocation' || m.type === 'Flora') {
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
            const isMatch = m.data && m.data.id === entityId;
            if (isMatch) {
                // If type is specified, only remove if type matches. Otherwise remove all.
                if (type && m.type !== type) return true;
                return false;
            }
            return true;
        });
    }

    public getBestFoodLocation(): Memory | null {
        return this.data.memories.find(m => m.type === 'FoodLocation' || m.type === 'Flora') || null;
    }
}
