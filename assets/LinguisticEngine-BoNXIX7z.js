const n=`import { OrganismData } from '../../../types';\r
import { VectorDB } from '../../data/VectorDB';\r
import { LINGUISTIC_CONSTANTS, SOCIAL_CONSTANTS } from '../../core/Constants';\r
\r
const SYLLABLES = [\r
    'ber', 'thun', 'dra', 'vor', 'xan', 'morth', 'kael', 'lyn', 'val', 'nor',\r
    'fin', 'gar', 'zek', 'vorn', 'pryl', 'glim', 'strak', 'vance', 'thorn', 'mar',\r
    'is', 'bel', 'cor', 'dyn', 'eth', 'far', 'gor', 'hal', 'ion', 'jek',\r
    'kry', 'lor', 'men', 'nox', 'oth', 'pax', 'qui', 'rax', 'syn', 'tor',\r
    'und', 'vex', 'wyn', 'xir', 'yor', 'zal'\r
];\r
\r
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y'];\r
const SYLLABLE_WEIGHTS: Record<string, string[]> = {\r
    'ber': ['thun', 'dra', 'vance', 'lyn', 'is'],\r
    'thun': ['dra', 'vor', 'eth', 'ar', 'ion'],\r
    'dra': ['xan', 'morth', 'kael', 'val', 'eth'],\r
    'vor': ['xan', 'morth', 'nox', 'tor', 'zal'],\r
    'xan': ['dra', 'lyn', 'val', 'eth', 'syn'],\r
    'morth': ['kael', 'vorn', 'eth', 'hal', 'ion'],\r
};\r
\r
export class LinguisticEngine {\r
    static generatePhoneticName(syllableCount: number): string {\r
        let name = '';\r
        let lastSyl = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)];\r
        name += lastSyl.charAt(0).toUpperCase() + lastSyl.slice(1);\r
\r
        for (let i = 1; i < syllableCount; i++) {\r
            const potentialNext = SYLLABLE_WEIGHTS[lastSyl] || SYLLABLES;\r
            const nextSyl = potentialNext[Math.floor(Math.random() * potentialNext.length)];\r
            name += nextSyl;\r
            lastSyl = nextSyl;\r
        }\r
        return name;\r
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
        // Inheritance Rules\r
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
            // Name Inheritance\r
            if (Math.random() < LINGUISTIC_CONSTANTS.NAME_INHERITANCE_CHANCE) {\r
                firstName = parentA.firstName;\r
                surname = parentA.surname;\r
\r
                const familyCount = VectorDB.getFamilyCount(firstName, surname);\r
                const suffix = familyCount + 1;\r
                const isNobleEntity = isNoble || (parentA && parentA.isNoble);\r
\r
                const displaySuffix = suffix > 1 ? \` \${this.romanize(suffix)}\` : "";\r
                const fullName = \`\${firstName} \${surname}\${displaySuffix}\`;\r
\r
                return {\r
                    firstName,\r
                    surname,\r
                    name: fullName,\r
                    lineageDescription: displaySuffix\r
                        ? \`Named after their progenitor, \${parentA.firstName} \${parentA.surname}, carrying the weight of \${this.romanize(suffix)} generations.\`\r
                        : \`A fresh branch from the \${surname} vine.\`,\r
                    isNoble: isNobleEntity,\r
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
\r
        if (org.age > populationStats.meanAge * 2) {\r
            return "The Elder";\r
        }\r
\r
        if (org.expressedStats.speed > populationStats.speed95th) {\r
            return "The Swift";\r
        }\r
\r
        if (org.matingCount > SOCIAL_CONSTANTS.PROLIFIC_MATING_THRESHOLD) {\r
            return "The Prolific";\r
        }\r
\r
        return undefined;\r
    }\r
}\r
\r
`;export{n as default};
