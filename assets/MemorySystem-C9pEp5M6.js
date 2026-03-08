const t=`\r
import { OrganismData, FloraData, Memory, Vector2 } from '../../../../types';\r
import { VectorMath } from '../../../core/VectorMath';\r
import { SIM_CONSTANTS, COGNITIVE_CONSTANTS, UNIT_UTILS } from '../../../core/Constants';\r
import { VectorDB } from '../../../data/VectorDB';\r
\r
export class MemorySystem {\r
    private data: OrganismData;\r
\r
    constructor(data: OrganismData) {\r
        this.data = data;\r
    }\r
\r
    public addMemory(currentTime: number, type: Memory['type'], position: Vector2, content: string, data?: any) {\r
        // 1. Constants\r
        const THREE_HOURS = 3 * SIM_CONSTANTS.FRAMES_PER_HOUR;\r
        const visionRangePx = UNIT_UTILS.mToPx(this.data.expressedStats.sight_range);\r
\r
        // 2. Identify Target Entity ID (if any)\r
        const targetId = data?.id;\r
\r
        // 3. Stacking Logic (Same exact entity/location, very recent)\r
        let exactMatch = this.data.memories.find(m =>\r
            m.type === type && (\r
                (targetId && m.data && m.data.id === targetId) || // Match by unique entity ID\r
                (targetId && m.entityIds?.includes(targetId)) || // Match if already in a group\r
                (m.content === content && VectorMath.dist(m.position, position) < 8) // Match by content/position\r
            )\r
        );\r
\r
        if (exactMatch) {\r
            exactMatch.position = { ...position };\r
            const timeSinceUpdate = currentTime - exactMatch.timestamp;\r
\r
            // Rate-limit stacking: Only increment count every ~2 seconds (120 ticks)\r
            // if (timeSinceUpdate > 120 || type !== 'Fauna') {\r
            //    exactMatch.timestamp = currentTime;\r
            //    exactMatch.count = (exactMatch.count || 1) + 1;\r
\r
            // Keep front\r
            //    this.data.memories = [exactMatch, ...this.data.memories.filter(m => m.id !== exactMatch?.id)];\r
            //}\r
            return;\r
        }\r
\r
        // 4. Temporal & Spatial Grouping (👥)\r
        // Check if there's a recent memory of same type within 3 simulation hours\r
        const recentGroupable = this.data.memories.find(m =>\r
            m.type === type &&\r
            (currentTime - m.timestamp) < THREE_HOURS\r
        );\r
\r
        if (recentGroupable && type === 'Fauna') {\r
            const dist = VectorMath.dist(recentGroupable.position, position);\r
            const distNormalized = dist / visionRangePx;\r
\r
            // Spatial Falloff: Higher probability of grouping if closer (within 60% of vision range)\r
            const groupProbability = 1.0 - Math.pow(distNormalized, 0.5); // Concave falloff\r
\r
            if (Math.random() < groupProbability || dist < 50) {\r
                // Group them\r
                if (targetId && !recentGroupable.entityIds?.includes(targetId)) {\r
                    recentGroupable.entityIds = [...(recentGroupable.entityIds || []), targetId];\r
                    recentGroupable.count = recentGroupable.entityIds.length;\r
\r
                    // Update content name for UI tooltip logic\r
                    if (recentGroupable.count > 1) {\r
                        recentGroupable.content = \`\${recentGroupable.count} entities encountered\`;\r
                    }\r
\r
                    recentGroupable.timestamp = currentTime;\r
                    // Move to front\r
                    this.data.memories = [recentGroupable, ...this.data.memories.filter(m => m.id !== recentGroupable?.id)];\r
                    return;\r
                }\r
            }\r
        }\r
\r
        // 5. Create New Memory\r
\r
        const defaultDuration = SIM_CONSTANTS.FRAMES_PER_DAY * COGNITIVE_CONSTANTS.DAYS_TO_REMEMBER;\r
        const minimumFoodDuration = SIM_CONSTANTS.FRAMES_PER_HOUR * 12;\r
        const memoryDuration = type === 'Food'\r
            ? Math.max(minimumFoodDuration, defaultDuration / 4)\r
            : defaultDuration;\r
\r
        this.data.memories.push({\r
            id: Math.random().toString(36).substr(2, 5),\r
            type,\r
            position: { ...position },\r
            timestamp: currentTime,\r
            duration: memoryDuration,\r
            content,\r
            count: 1,\r
            data,\r
            entityIds: data && data.id ? [data.id] : undefined,\r
            isFamiliar: data ? data.isFamiliar : false\r
        });\r
\r
        // Cap memory size (preservingPinned)\r
        if (this.data.memories.length > COGNITIVE_CONSTANTS.TEMPORARY_MEMORY_LIMIT) {\r
            // We prioritize keeping 'Familiar' (Met someone) or high-count memories\r
            const coldIdx = this.data.memories.findIndex(m => (m.count || 0) < 3 && !m.isFamiliar);\r
            const indexToRemove = coldIdx !== -1 ? coldIdx : 0;\r
\r
            const memoryToArchive = this.data.memories[indexToRemove];\r
\r
            // VERIFICATION: Log this to your console to see it happening live\r
            // console.log(\`Offloading memory \${memoryToArchive.type} to LT for \${this.data.id}\`);\r
\r
            VectorDB.pushToHistory(this.data.id, memoryToArchive);\r
\r
            this.data.memories.splice(indexToRemove, 1);\r
        }\r
    }\r
\r
    public validateMemories(visibleFlora: FloraData[], visionRange: number, position: Vector2) {\r
        // Check if any 'FoodLocation' memories are within vision range but NOT in visibleFlora\r
        // If so, the food is gone. Delete the memory.\r
\r
        this.data.memories = this.data.memories.filter(m => {\r
            if (m.type === 'Food' || m.type === 'Flora') {\r
                const dist = VectorMath.dist(position, m.position);\r
\r
                // If we are close enough to see it...\r
                if (dist < visionRange) {\r
                    // ...and it's not in our visible list...\r
                    const stillExists = visibleFlora.some(f => VectorMath.dist(f.position, m.position) < 12);\r
                    if (!stillExists) {\r
                        return false; // FORGET IT!\r
                    }\r
                }\r
            }\r
            return true;\r
        });\r
    }\r
\r
    public removeMemory(entityId: string, type?: Memory['type']) {\r
        this.data.memories = this.data.memories.filter(m => {\r
            const isMatch = (m.data && m.data.id === entityId) || m.entityIds?.includes(entityId);\r
            if (isMatch) {\r
                // If type is specified, only remove if type matches. Otherwise remove all.\r
                if (type && m.type !== type) return true;\r
                return false;\r
            }\r
            return true;\r
        });\r
\r
    }\r
\r
    public getBestFoodLocation(): Memory | null {\r
        return this.data.memories.find(m => m.type === 'Food' || m.type === 'Flora') || null;\r
    }\r
}\r
`;export{t as default};
