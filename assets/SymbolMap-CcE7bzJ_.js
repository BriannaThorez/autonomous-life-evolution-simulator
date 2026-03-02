const n=`/**\r
 * SymbolMap.ts — Centralized Communication & Memory Symbology\r
 * ───────────────────────────────────────────────────────────────────────────\r
 * This map serves as an icon symbolic dictionary for all memories and social\r
 * signaling within the simulation. It maps memory types and specific content\r
 * keywords to ideographic symbols.\r
 * \r
 * Based on: Ideographic Language Specification for Fauna.\r
 */\r
\r
export const SYMBOL_MAP = {\r
    // Syntax Tokens (Ideographic Language Units)\r
    Tokens: {\r
        Perception: '🌀',\r
        Vision: '👁️',\r
        Entity: '👤',\r
        Recognition: '🔆',\r
        Concept: '⚛️',\r
        Familiarity: '🫂',\r
        Group: '👥'\r
    },\r
\r
    // Basic Memory Types mapping to root categories\r
    Types: {\r
        Flora: '🌿',\r
        Food: '🍏',\r
        Fauna: '👤',\r
        MATE: '❤️',\r
        THREAT: '⚠️',\r
        SectorScan: '📡',\r
        Memory: '🧠',\r
        Location: '🗺️',\r
    },\r
\r
    // Content Keywords for specific overrides logic\r
    Keywords: {\r
        'Ate': '🍎',\r
        'Consumed': '🍎',\r
        'Met': '🤝',\r
        'Saw': '👁️',\r
        'Shared': '🗣️',\r
        'Danger': '💀',\r
        'Home': '🏠',\r
        'Water': '💧'\r
    }\r
};\r
\r
/**\r
 * Resolves the appropriate ideographic syntax for a memory.\r
 */\r
export function getSyntax(type: string, content: string, isFamiliar: boolean = false, isGroup: boolean = false): string {\r
    const { Perception, Vision, Entity, Recognition, Concept, Familiarity, Group } = SYMBOL_MAP.Tokens;\r
    const { Flora, Food, MATE, THREAT, Location } = SYMBOL_MAP.Types;\r
\r
    // Grouping logic (Multi-entity)\r
    if (isGroup) {\r
        return \`[\${Perception}\${Vision}\${Familiarity}\${Group}]\`;\r
    }\r
\r
    // Special Types\r
    if (type === 'MATE') return \`[\${Perception}\${Vision}\${Entity}] \${MATE}\`;\r
    if (type === 'THREAT') return \`[\${Perception}\${Vision}\${Entity}] \${THREAT}\`;\r
    if (type === 'Food' || type === 'Flora') return \`[\${Perception}\${Vision}\${Flora}]\${Recognition}{\${Concept}\${Food}\${Location}}\`;\r
\r
    // Meet and Greet / Recognition logic\r
    if (isFamiliar) {\r
        return \`[\${Perception}\${Vision}\${Entity}] \${Recognition} {\${Concept}\${Familiarity}}\`;\r
    }\r
\r
    // Standard perception\r
    return \`[\${Perception}\${Vision}\${Entity}]\`;\r
}\r
\r
/**\r
 * Legacy support for direct icon mapping\r
 */\r
export function getSymbol(type: string, content: string): string {\r
    for (const [key, icon] of Object.entries(SYMBOL_MAP.Keywords)) {\r
        if (content.indexOf(key) !== -1) return icon;\r
    }\r
    return (SYMBOL_MAP.Types as any)[type] || SYMBOL_MAP.Types.Memory;\r
}\r
`;export{n as default};
