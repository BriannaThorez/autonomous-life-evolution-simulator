const n=`import { OrganismData } from '../../../../types';\r
import { VectorDB } from '../../../data/VectorDB';\r
import { LINGUISTIC_CONSTANTS, CLF1_SPEC, VOWEL_NUCLEI, CODAS, SOCIAL_CONSTANTS } from './Constants';\r
import { PipelineConfig, LexiconEntry, ProsodyType } from './Types';\r
\r
/**\r
 * AXIOMATIC LINGUISTIC ENGINE (ALE)\r
 * Handles pure symbolic language generation, phonotactics, and morphological derivation.\r
 */\r
export class LinguisticEngine {\r
    private static lexicon: LexiconEntry[] = [];\r
\r
    // --- ALE INTERNAL CALCULUS ---\r
\r
    /**\r
     * ALE Implementation Step 3: Phonotactic Calculus\r
     */\r
    private static generateSyllable(\r
        biasType: keyof typeof CLF1_SPEC,\r
        config: PipelineConfig,\r
        options?: { simplify?: boolean }\r
    ): string {\r
        const simplify = options?.simplify ?? false;\r
        const complexChance = simplify\r
            ? 0.08\r
            : config.prosody === 'Fluid'\r
                ? 0.22\r
                : config.prosody === 'Angry'\r
                    ? 0.14\r
                    : 0.08;\r
\r
        // a. Select Onset\r
        let onset = CLF1_SPEC[biasType][Math.floor(Math.random() * CLF1_SPEC[biasType].length)];\r
\r
        // b. Apply Phonotactic Filter\r
        if (config.phonotacticFilter && onset.length > 2 && Math.random() > (simplify ? 0.05 : 0.35)) {\r
            return this.generateSyllable(biasType, config, options); // Recursively reject bulky clusters\r
        }\r
\r
        if (simplify && onset.length > 1 && Math.random() < 0.55) {\r
            onset = onset[0];\r
        }\r
\r
        // c. Select Nucleus\r
        const nucleus = Math.random() < complexChance\r
            ? VOWEL_NUCLEI[Math.floor(Math.random() * VOWEL_NUCLEI.length)]\r
            : CLF1_SPEC.vowels[Math.floor(Math.random() * CLF1_SPEC.vowels.length)];\r
\r
        // d. Select Coda\r
        const codaChance = simplify ? 0.12 : 0.2;\r
        const coda = Math.random() < codaChance\r
            ? CODAS[Math.floor(Math.random() * CODAS.length)]\r
            : '';\r
\r
        return onset + nucleus + coda;\r
    }\r
\r
    /**\r
     * ALE Implementation Step 4: Morphological Assembly\r
     */\r
    private static constructWord(syllableCount: number, primaryBias: keyof typeof CLF1_SPEC, config: PipelineConfig): string {\r
        let word = '';\r
        for (let i = 0; i < syllableCount; i++) {\r
            const bias = i === 0 ? primaryBias : 'vowels';\r
            word += this.generateSyllable(bias as keyof typeof CLF1_SPEC, config, { simplify: i > 0 });\r
        }\r
        return word.charAt(0).toUpperCase() + word.slice(1);\r
    }\r
\r
    // --- PRESERVED ORIGINAL API METHODS ---\r
\r
    /**\r
     * Overrides the old random syllable picker with the new ALE Phonotactic Calculus.\r
     */\r
    static generatePhoneticName(syllableCount: number): string {\r
        const defaultConfig: PipelineConfig = { prosody: 'Fluid', phonotacticFilter: true };\r
        return this.constructWord(syllableCount, 'plosives', defaultConfig);\r
    }\r
\r
    static generateFirstName(): string {\r
        const syllables = Math.floor(Math.random() * LINGUISTIC_CONSTANTS.FIRST_NAME_SYLLABLES_RANGE) + LINGUISTIC_CONSTANTS.FIRST_NAME_SYLLABLES_MIN;\r
        return this.generatePhoneticName(syllables);\r
    }\r
\r
    static generateSurname(): string {\r
        const syllables = Math.floor(Math.random() * LINGUISTIC_CONSTANTS.SURNAME_SYLLABLES_RANGE) + LINGUISTIC_CONSTANTS.SURNAME_SYLLABLES_MIN;\r
        return this.generatePhoneticName(syllables);\r
    }\r
\r
    static romanize(num: number): string {\r
        const lookup: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };\r
        let roman = '';\r
        let n = num;\r
        for (let i in lookup) {\r
            while (n >= lookup[i]) {\r
                roman += i;\r
                n -= lookup[i];\r
            }\r
        }\r
        return roman;\r
    }\r
\r
    /**\r
     * Optional advanced lineage profile builder.\r
     * Currently retained for future lineage expansion, but intentionally not used by the active\r
     * SimulationEngine spawn path so birth-time naming semantics remain unchanged.\r
     */\r
    static constructFullLinguisticProfile(parentA?: OrganismData, parentB?: OrganismData): {\r
        firstName: string;\r
        surname: string;\r
        name: string;\r
        lineageDescription: string;\r
        isNoble?: boolean;\r
        houseName?: string;\r
    } {\r
        let firstName = this.generateFirstName();\r
        let surname = this.generateSurname();\r
        let lineageDescription = "First of their lineage, born of the primal void.";\r
        let houseName: string | undefined = undefined;\r
        let isNoble = false;\r
\r
        if (parentA) {\r
            if (parentB) {\r
                surname = Math.random() > 0.5 ? parentA.surname : parentB.surname;\r
                lineageDescription = \`Inherited the \${surname} name from the union of \${parentA.firstName} and \${parentB.firstName}.\`;\r
                if (parentA.houseName || parentB.houseName) {\r
                    houseName = parentA.houseName || parentB.houseName;\r
                    isNoble = true;\r
                }\r
            } else {\r
                surname = parentA.surname;\r
                lineageDescription = \`A direct sprout from the \${surname} legacy of \${parentA.firstName}.\`;\r
                houseName = parentA.houseName;\r
                isNoble = parentA.isNoble || false;\r
            }\r
\r
            if (Math.random() < LINGUISTIC_CONSTANTS.NAME_INHERITANCE_CHANCE) {\r
                firstName = parentA.firstName;\r
                surname = parentA.surname;\r
                const familyCount = VectorDB.getFamilyCount(firstName, surname);\r
                const suffix = familyCount + 1;\r
                const displaySuffix = suffix > 1 ? \` \${this.romanize(suffix)}\` : "";\r
                \r
                return {\r
                    firstName,\r
                    surname,\r
                    name: \`\${firstName} \${surname}\${displaySuffix}\`,\r
                    lineageDescription: displaySuffix\r
                        ? \`Named after their progenitor, \${parentA.firstName} \${parentA.surname}, carrying the weight of \${this.romanize(suffix)} generations.\`\r
                        : \`A fresh branch from the \${surname} vine.\`,\r
                    isNoble: isNoble || parentA.isNoble,\r
                    houseName\r
                };\r
            }\r
        }\r
\r
        return {\r
            firstName,\r
            surname,\r
            name: \`\${firstName} \${surname}\`,\r
            lineageDescription,\r
            isNoble,\r
            houseName\r
        };\r
    }\r
\r
    static getTitle(org: OrganismData, populationStats: { meanAge: number, speed95th: number }): string | undefined {\r
        if (org.isNoble) return "The Noble";\r
        if (org.age > populationStats.meanAge * 2) return "The Elder";\r
        if (org.expressedStats.speed > populationStats.speed95th) return "The Swift";\r
        if (org.matingCount > SOCIAL_CONSTANTS.PROLIFIC_MATING_THRESHOLD) return "The Prolific";\r
        return undefined;\r
    }\r
\r
    // --- ALE NEW ONTOLOGICAL FEATURES (PLACEHOLDERS) ---\r
\r
    /**\r
     * ALE Implementation Step 5: Ontological Binding\r
     */\r
    static generateLexiconEntry(category: string, config: PipelineConfig): LexiconEntry {\r
        let syllables = 1;\r
        let bias: keyof typeof CLF1_SPEC = 'plosives';\r
        let complexity: LexiconEntry['complexity'] = 'Primitive';\r
\r
        switch(category) {\r
            case 'Items': syllables = 1; bias = 'plosives'; complexity = 'Primitive'; break;\r
            case 'Grammar': syllables = 1; bias = 'vowels'; complexity = 'Primitive'; break;\r
            case 'Species': syllables = 2; bias = 'nasals'; complexity = 'Abstract'; break;\r
            case 'Entities': syllables = 2; bias = 'plosives'; complexity = 'Abstract'; break;\r
            case 'Locations': syllables = 3; bias = 'fricatives'; complexity = 'Navigational'; break;\r
            case 'Places': syllables = 4; bias = 'fricatives'; complexity = 'Complex'; break;\r
        }\r
\r
        const word = this.constructWord(syllables, bias, config);\r
        const entry: LexiconEntry = {\r
            id: crypto.randomUUID(),\r
            word,\r
            ipa: \`/\${word.toLowerCase()}/\`, // Simplified IPA placeholder\r
            category,\r
            complexity,\r
            timestamp: Date.now()\r
        };\r
\r
        this.lexicon.push(entry);\r
        return entry;\r
    }\r
\r
    /** TODO: Implement Semantic Drift - allow words to mutate over generations */\r
    static applySemanticDrift() { /* Code Annotation: Placeholder for evolutionary linguistics */ }\r
\r
    /** TODO: Implement Syntax Parser - combine LexiconEntries into phrases */\r
    static constructPhrase(entries: LexiconEntry[]) { /* Code Annotation: Placeholder for grammatical assembly */ }\r
}`;export{n as default};
