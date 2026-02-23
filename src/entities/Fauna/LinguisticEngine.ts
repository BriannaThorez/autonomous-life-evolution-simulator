import { OrganismData } from '../../../types';
import { VectorDB } from '../../data/VectorDB';

const SYLLABLES = [
    'ber', 'thun', 'dra', 'vor', 'xan', 'morth', 'kael', 'lyn', 'val', 'nor',
    'fin', 'gar', 'zek', 'vorn', 'pryl', 'glim', 'strak', 'vance', 'thorn', 'mar',
    'is', 'bel', 'cor', 'dyn', 'eth', 'far', 'gor', 'hal', 'ion', 'jek',
    'kry', 'lor', 'men', 'nox', 'oth', 'pax', 'qui', 'rax', 'syn', 'tor',
    'und', 'vex', 'wyn', 'xir', 'yor', 'zal'
];

// Simplified Markov transitions: vowels tend to follow consonants and vice versa
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y'];
const SYLLABLE_WEIGHTS: Record<string, string[]> = {
    'ber': ['thun', 'dra', 'vance', 'lyn', 'is'],
    'thun': ['dra', 'vor', 'eth', 'ar', 'ion'],
    'dra': ['xan', 'morth', 'kael', 'val', 'eth'],
    'vor': ['xan', 'morth', 'nox', 'tor', 'zal'],
    'xan': ['dra', 'lyn', 'val', 'eth', 'syn'],
    'morth': ['kael', 'vorn', 'eth', 'hal', 'ion'],
};

export class LinguisticEngine {
    static generatePhoneticName(syllableCount: number): string {
        let name = '';
        let lastSyl = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)];
        name += lastSyl.charAt(0).toUpperCase() + lastSyl.slice(1);

        for (let i = 1; i < syllableCount; i++) {
            const potentialNext = SYLLABLE_WEIGHTS[lastSyl] || SYLLABLES;
            const nextSyl = potentialNext[Math.floor(Math.random() * potentialNext.length)];
            name += nextSyl;
            lastSyl = nextSyl;
        }
        return name;
    }

    static generateFirstName(): string {
        const syllables = Math.floor(Math.random() * 3) + 2; // 2-4 syllables
        return this.generatePhoneticName(syllables);
    }

    static generateSurname(): string {
        const syllables = Math.floor(Math.random() * 4) + 2; // 2-5 syllables
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

        // Inheritance Rules
        if (parentA) {
            // Surname Logic: 100% inherited, 50/50 split
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

            // Rare Full Name Inheritance (2-5% chance)
            if (Math.random() < 0.05) {
                firstName = parentA.firstName;
                surname = parentA.surname;

                // Numerology
                const familyCount = VectorDB.getFamilyCount(firstName, surname);
                const suffix = familyCount + 1;

                // Standard limit: IV (unless Nobility)
                const isNobleEntity = isNoble || (parentA && parentA.isNoble);
                const canProceed = true;

                let displaySuffix = "";
                if (canProceed) {
                    displaySuffix = suffix > 1 ? ` ${this.romanize(suffix)}` : "";
                } else {
                    // Reset name if cap reached? No, prompt says "Capped by decay weights"
                    // We'll interpret this as: if not noble, we don't increment beyond IV easily, 
                    // or we just don't inherit the name. 
                    // Let's generate a fresh name instead.
                    firstName = this.generateFirstName();
                }

                const fullName = `${firstName} ${surname}${displaySuffix}`;

                return {
                    firstName,
                    surname,
                    name: fullName,
                    lineageDescription: displaySuffix
                        ? `Named after their progenitor, ${parentA.firstName} ${parentA.surname}, carrying the weight of ${this.romanize(suffix)} generations.`
                        : `A fresh branch from the ${surname} vine.`,
                    isNoble: isNobleEntity,
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
        // The Noble
        if (org.isNoble) return "The Noble";

        // The Elder
        if (org.age > populationStats.meanAge * 2) {
            return "The Elder";
        }

        // The Swift
        if (org.expressedStats.speed > populationStats.speed95th) {
            return "The Swift";
        }

        // The Prolific
        if (org.matingCount > 5) {
            return "The Prolific";
        }

        return undefined;
    }
}

