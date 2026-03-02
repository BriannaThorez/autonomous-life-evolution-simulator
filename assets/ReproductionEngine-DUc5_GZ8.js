const e=`import { Genetics } from '../../evolution/GeneticsEngine';\r
import { POPULATION_CONSTANTS, REPRODUCTION_CONSTANTS } from '../../core/Constants';\r
\r
/**\r
 * ReproductionEngine: The bridge between DNA (Genetics) and Physics (Simulation).\r
 * It calculates the literal "Birth Cost" and energy transfer for offspring.\r
 */\r
export const ReproductionEngine = {\r
    /**\r
     * Orchestrates the full birth process: Inheritance -> Mutation -> Energy Math.\r
     */\r
    processBirth: (parentA: any, parentB?: any) => {\r
        // 1. GENETIC INHERITANCE\r
        const rawGenome = parentB\r
            ? Genetics.recombine(parentA.genome, parentB.genome)\r
            : (() => { throw new Error("Asexual reproduction is disabled."); })();\r
\r
        const mutatedGenome = Genetics.mutate(rawGenome);\r
        const childStats = Genetics.express(mutatedGenome);\r
\r
        // 2. BASE INVESTMENT\r
        const baseInvestment = POPULATION_CONSTANTS.BIRTH_COST_BASE / 2;\r
\r
        // 3. TRAIT SURCHARGE (The "Complexity Tax")\r
        const traitSurcharge =\r
            (childStats.speed * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_SPEED_WEIGHT) +\r
            (childStats.size * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_SIZE_WEIGHT) +\r
            (childStats.sight_range * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT) +\r
            (childStats.sight_fov * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT) +\r
            (childStats.lifespan * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_LIFESPAN_WEIGHT);\r
\r
        const totalCostPerParent = baseInvestment + (traitSurcharge / 2);\r
\r
        // 4. METABOLIC EFFICIENCY (The Wasting Factor)\r
        const getEfficiency = (metabolism: number) => {\r
            return Math.min(1.0, 1.0 / metabolism);\r
        };\r
\r
        const energyFromA = totalCostPerParent * getEfficiency(parentA.expressedStats.metabolism);\r
        const energyFromB = parentB\r
            ? totalCostPerParent * getEfficiency(parentB.expressedStats.metabolism)\r
            : energyFromA;\r
\r
        return {\r
            childGenome: mutatedGenome,\r
            childStats: childStats,\r
            costToEachParent: totalCostPerParent,\r
            initialEnergy: energyFromA + energyFromB,\r
            energyWasted: (totalCostPerParent * 2) - (energyFromA + energyFromB)\r
        };\r
    }\r
};\r
`;export{e as default};
