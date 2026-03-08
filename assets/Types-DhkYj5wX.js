const r=`export type ProsodyType = 'Fluid' | 'Angry' | 'Robotic';\r
\r
export interface PipelineConfig {\r
    prosody: ProsodyType;\r
    phonotacticFilter: boolean;\r
}\r
\r
export interface LexiconEntry {\r
    id: string;\r
    word: string;\r
    ipa: string; // International Phonetic Alphabet approximation\r
    category: string;\r
    complexity: 'Primitive' | 'Abstract' | 'Navigational' | 'Complex';\r
    timestamp: number;\r
}`;export{r as default};
