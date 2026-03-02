import { OrganismData } from '../../../types';
import { VectorDB } from '../../data/VectorDB';
import { LINGUISTIC_CONSTANTS, SOCIAL_CONSTANTS } from '../../core/Constants';

const SYLLABLES = [
    'ber', 'thun', 'dra', 'vor', 'xan', 'morth', 'kael', 'lyn', 'val', 'nor',
    'fin', 'gar', 'zek', 'vorn', 'pryl', 'glim', 'strak', 'vance', 'thorn', 'mar',
    'is', 'bel', 'cor', 'dyn', 'eth', 'far', 'gor', 'hal', 'ion', 'jek',
    'kry', 'lor', 'men', 'nox', 'oth', 'pax', 'qui', 'rax', 'syn', 'tor',
    'und', 'vex', 'wyn', 'xir', 'yor', 'zal'
];

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

            // Name Inheritance
            if (Math.random() < LINGUISTIC_CONSTANTS.NAME_INHERITANCE_CHANCE) {
                firstName = parentA.firstName;
                surname = parentA.surname;

                const familyCount = VectorDB.getFamilyCount(firstName, surname);
                const suffix = familyCount + 1;
                const isNobleEntity = isNoble || (parentA && parentA.isNoble);

                const displaySuffix = suffix > 1 ? ` ${this.romanize(suffix)}` : "";
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
        if (org.isNoble) return "The Noble";

        if (org.age > populationStats.meanAge * 2) {
            return "The Elder";
        }

        if (org.expressedStats.speed > populationStats.speed95th) {
            return "The Swift";
        }

        if (org.matingCount > SOCIAL_CONSTANTS.PROLIFIC_MATING_THRESHOLD) {
            return "The Prolific";
        }

        return undefined;
    }
}

