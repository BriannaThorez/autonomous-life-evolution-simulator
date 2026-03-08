import { OrganismData } from '../../../../types';
import { VectorDB } from '../../../data/VectorDB';
import { LINGUISTIC_CONSTANTS, CLF1_SPEC, VOWEL_NUCLEI, CODAS, SOCIAL_CONSTANTS } from './Constants';
import { PipelineConfig, LexiconEntry, ProsodyType } from './Types';

/**
 * AXIOMATIC LINGUISTIC ENGINE (ALE)
 * Handles pure symbolic language generation, phonotactics, and morphological derivation.
 */
export class LinguisticEngine {
    private static lexicon: LexiconEntry[] = [];

    // --- ALE INTERNAL CALCULUS ---

    /**
     * ALE Implementation Step 3: Phonotactic Calculus
     */
    private static generateSyllable(
        biasType: keyof typeof CLF1_SPEC,
        config: PipelineConfig,
        options?: { simplify?: boolean }
    ): string {
        const simplify = options?.simplify ?? false;
        const complexChance = simplify
            ? 0.08
            : config.prosody === 'Fluid'
                ? 0.22
                : config.prosody === 'Angry'
                    ? 0.14
                    : 0.08;

        // a. Select Onset
        let onset = CLF1_SPEC[biasType][Math.floor(Math.random() * CLF1_SPEC[biasType].length)];

        // b. Apply Phonotactic Filter
        if (config.phonotacticFilter && onset.length > 2 && Math.random() > (simplify ? 0.05 : 0.35)) {
            return this.generateSyllable(biasType, config, options); // Recursively reject bulky clusters
        }

        if (simplify && onset.length > 1 && Math.random() < 0.55) {
            onset = onset[0];
        }

        // c. Select Nucleus
        const nucleus = Math.random() < complexChance
            ? VOWEL_NUCLEI[Math.floor(Math.random() * VOWEL_NUCLEI.length)]
            : CLF1_SPEC.vowels[Math.floor(Math.random() * CLF1_SPEC.vowels.length)];

        // d. Select Coda
        const codaChance = simplify ? 0.12 : 0.2;
        const coda = Math.random() < codaChance
            ? CODAS[Math.floor(Math.random() * CODAS.length)]
            : '';

        return onset + nucleus + coda;
    }

    /**
     * ALE Implementation Step 4: Morphological Assembly
     */
    private static constructWord(syllableCount: number, primaryBias: keyof typeof CLF1_SPEC, config: PipelineConfig): string {
        let word = '';
        for (let i = 0; i < syllableCount; i++) {
            const bias = i === 0 ? primaryBias : 'vowels';
            word += this.generateSyllable(bias as keyof typeof CLF1_SPEC, config, { simplify: i > 0 });
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    // --- PRESERVED ORIGINAL API METHODS ---

    /**
     * Overrides the old random syllable picker with the new ALE Phonotactic Calculus.
     */
    static generatePhoneticName(syllableCount: number): string {
        const defaultConfig: PipelineConfig = { prosody: 'Fluid', phonotacticFilter: true };
        return this.constructWord(syllableCount, 'plosives', defaultConfig);
    }

    static generateFirstName(): string {
        const syllables = Math.floor(Math.random() * LINGUISTIC_CONSTANTS.FIRST_NAME_SYLLABLES_RANGE) + LINGUISTIC_CONSTANTS.FIRST_NAME_SYLLABLES_MIN;
        return this.generatePhoneticName(syllables);
    }

    static generateSurname(): string {
        const syllables = Math.floor(Math.random() * LINGUISTIC_CONSTANTS.SURNAME_SYLLABLES_RANGE) + LINGUISTIC_CONSTANTS.SURNAME_SYLLABLES_MIN;
        return this.generatePhoneticName(syllables);
    }

    static romanize(num: number): string {
        const lookup: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
        let roman = '';
        let n = num;
        for (let i in lookup) {
            while (n >= lookup[i]) {
                roman += i;
                n -= lookup[i];
            }
        }
        return roman;
    }

    /**
     * Optional advanced lineage profile builder.
     * Currently retained for future lineage expansion, but intentionally not used by the active
     * SimulationEngine spawn path so birth-time naming semantics remain unchanged.
     */
    static constructFullLinguisticProfile(parentA?: OrganismData, parentB?: OrganismData): {
        firstName: string;
        surname: string;
        name: string;
        lineageDescription: string;
        isNoble?: boolean;
        houseName?: string;
    } {
        let firstName = this.generateFirstName();
        let surname = this.generateSurname();
        let lineageDescription = "First of their lineage, born of the primal void.";
        let houseName: string | undefined = undefined;
        let isNoble = false;

        if (parentA) {
            if (parentB) {
                surname = Math.random() > 0.5 ? parentA.surname : parentB.surname;
                lineageDescription = `Inherited the ${surname} name from the union of ${parentA.firstName} and ${parentB.firstName}.`;
                if (parentA.houseName || parentB.houseName) {
                    houseName = parentA.houseName || parentB.houseName;
                    isNoble = true;
                }
            } else {
                surname = parentA.surname;
                lineageDescription = `A direct sprout from the ${surname} legacy of ${parentA.firstName}.`;
                houseName = parentA.houseName;
                isNoble = parentA.isNoble || false;
            }

            if (Math.random() < LINGUISTIC_CONSTANTS.NAME_INHERITANCE_CHANCE) {
                firstName = parentA.firstName;
                surname = parentA.surname;
                const familyCount = VectorDB.getFamilyCount(firstName, surname);
                const suffix = familyCount + 1;
                const displaySuffix = suffix > 1 ? ` ${this.romanize(suffix)}` : "";
                
                return {
                    firstName,
                    surname,
                    name: `${firstName} ${surname}${displaySuffix}`,
                    lineageDescription: displaySuffix
                        ? `Named after their progenitor, ${parentA.firstName} ${parentA.surname}, carrying the weight of ${this.romanize(suffix)} generations.`
                        : `A fresh branch from the ${surname} vine.`,
                    isNoble: isNoble || parentA.isNoble,
                    houseName
                };
            }
        }

        return {
            firstName,
            surname,
            name: `${firstName} ${surname}`,
            lineageDescription,
            isNoble,
            houseName
        };
    }

    static getTitle(org: OrganismData, populationStats: { meanAge: number, speed95th: number }): string | undefined {
        if (org.isNoble) return "The Noble";
        if (org.age > populationStats.meanAge * 2) return "The Elder";
        if (org.expressedStats.speed > populationStats.speed95th) return "The Swift";
        if (org.matingCount > SOCIAL_CONSTANTS.PROLIFIC_MATING_THRESHOLD) return "The Prolific";
        return undefined;
    }

    // --- ALE NEW ONTOLOGICAL FEATURES (PLACEHOLDERS) ---

    /**
     * ALE Implementation Step 5: Ontological Binding
     */
    static generateLexiconEntry(category: string, config: PipelineConfig): LexiconEntry {
        let syllables = 1;
        let bias: keyof typeof CLF1_SPEC = 'plosives';
        let complexity: LexiconEntry['complexity'] = 'Primitive';

        switch(category) {
            case 'Items': syllables = 1; bias = 'plosives'; complexity = 'Primitive'; break;
            case 'Grammar': syllables = 1; bias = 'vowels'; complexity = 'Primitive'; break;
            case 'Species': syllables = 2; bias = 'nasals'; complexity = 'Abstract'; break;
            case 'Entities': syllables = 2; bias = 'plosives'; complexity = 'Abstract'; break;
            case 'Locations': syllables = 3; bias = 'fricatives'; complexity = 'Navigational'; break;
            case 'Places': syllables = 4; bias = 'fricatives'; complexity = 'Complex'; break;
        }

        const word = this.constructWord(syllables, bias, config);
        const entry: LexiconEntry = {
            id: crypto.randomUUID(),
            word,
            ipa: `/${word.toLowerCase()}/`, // Simplified IPA placeholder
            category,
            complexity,
            timestamp: Date.now()
        };

        this.lexicon.push(entry);
        return entry;
    }

    /** TODO: Implement Semantic Drift - allow words to mutate over generations */
    static applySemanticDrift() { /* Code Annotation: Placeholder for evolutionary linguistics */ }

    /** TODO: Implement Syntax Parser - combine LexiconEntries into phrases */
    static constructPhrase(entries: LexiconEntry[]) { /* Code Annotation: Placeholder for grammatical assembly */ }
}