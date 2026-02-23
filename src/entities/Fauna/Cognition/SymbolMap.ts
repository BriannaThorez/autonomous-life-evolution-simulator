/**
 * SymbolMap.ts — Centralized Communication & Memory Symbology
 * ───────────────────────────────────────────────────────────────────────────
 * This map serves as an icon symbolic dictionary for all memories and social
 * signaling within the simulation. It maps memory types and specific content
 * keywords to ideographic symbols.
 * 
 * Based on: Ideographic Language Specification for Fauna.
 */

export const SYMBOL_MAP = {
    // Syntax Tokens (Ideographic Language Units)
    Tokens: {
        Perception: '🌀',
        Vision: '👁️',
        Entity: '👤',
        Recognition: '🔆',
        Concept: '⚛️',
        Familiarity: '🫂',
        Group: '👥'
    },

    // Basic Memory Types mapping to root categories
    Types: {
        Flora: '🌿',
        FoodLocation: '🍏',
        FaunaLocation: '👤',
        MATE: '❤️',
        THREAT: '⚠️',
        SectorScan: '📡',
        Memory: '🧠'
    },

    // Content Keywords for specific overrides logic
    Keywords: {
        'Ate': '🍎',
        'Consumed': '🍎',
        'Met': '🤝',
        'Saw': '👁️',
        'Shared': '🗣️',
        'Danger': '💀',
        'Home': '🏠',
        'Water': '💧'
    }
};

/**
 * Resolves the appropriate ideographic syntax for a memory.
 */
export function getSyntax(type: string, content: string, isFamiliar: boolean = false, isGroup: boolean = false): string {
    const { Perception, Vision, Entity, Recognition, Concept, Familiarity, Group } = SYMBOL_MAP.Tokens;

    // Grouping logic (Multi-entity)
    if (isGroup) {
        return `[${Perception}${Vision}${Familiarity}]`;
    }

    // Meet and Greet / Recognition logic
    if (isFamiliar) {
        return `[${Perception}${Vision}${Entity}] ${Recognition} {${Concept}${Familiarity}}`;
    }

    // Standard perception
    return `[${Perception}${Vision}${Entity}]`;
}

/**
 * Legacy support for direct icon mapping
 */
export function getSymbol(type: string, content: string): string {
    for (const [key, icon] of Object.entries(SYMBOL_MAP.Keywords)) {
        if (content.indexOf(key) !== -1) return icon;
    }
    return (SYMBOL_MAP.Types as any)[type] || SYMBOL_MAP.Types.Memory;
}
