export type ProsodyType = 'Fluid' | 'Angry' | 'Robotic';

export interface PipelineConfig {
    prosody: ProsodyType;
    phonotacticFilter: boolean;
}

export interface LexiconEntry {
    id: string;
    word: string;
    ipa: string; // International Phonetic Alphabet approximation
    category: string;
    complexity: 'Primitive' | 'Abstract' | 'Navigational' | 'Complex';
    timestamp: number;
}