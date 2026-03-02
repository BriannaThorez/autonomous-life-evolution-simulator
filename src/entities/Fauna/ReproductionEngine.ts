import { Genetics } from '../../evolution/GeneticsEngine';
import { POPULATION_CONSTANTS, REPRODUCTION_CONSTANTS } from '../../core/Constants';

/**
 * ReproductionEngine: The bridge between DNA (Genetics) and Physics (Simulation).
 * It calculates the literal "Birth Cost" and energy transfer for offspring.
 */
export const ReproductionEngine = {
    /**
     * Orchestrates the full birth process: Inheritance -> Mutation -> Energy Math.
     */
    processBirth: (parentA: any, parentB?: any) => {
        // 1. GENETIC INHERITANCE
        const rawGenome = parentB
            ? Genetics.recombine(parentA.genome, parentB.genome)
            : (() => { throw new Error("Asexual reproduction is disabled."); })();

        const mutatedGenome = Genetics.mutate(rawGenome);
        const childStats = Genetics.express(mutatedGenome);

        // 2. BASE INVESTMENT
        const baseInvestment = POPULATION_CONSTANTS.BIRTH_COST_BASE / 2;

        // 3. TRAIT SURCHARGE (The "Complexity Tax")
        const traitSurcharge =
            (childStats.speed * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_SPEED_WEIGHT) +
            (childStats.size * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_SIZE_WEIGHT) +
            (childStats.sight_range * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT) +
            (childStats.sight_fov * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT) +
            (childStats.lifespan * REPRODUCTION_CONSTANTS.TRAIT_SURCHARGE_LIFESPAN_WEIGHT);

        const totalCostPerParent = baseInvestment + (traitSurcharge / 2);

        // 4. METABOLIC EFFICIENCY (The Wasting Factor)
        const getEfficiency = (metabolism: number) => {
            return Math.min(1.0, 1.0 / metabolism);
        };

        const energyFromA = totalCostPerParent * getEfficiency(parentA.expressedStats.metabolism);
        const energyFromB = parentB
            ? totalCostPerParent * getEfficiency(parentB.expressedStats.metabolism)
            : energyFromA;

        return {
            childGenome: mutatedGenome,
            childStats: childStats,
            costToEachParent: totalCostPerParent,
            initialEnergy: energyFromA + energyFromB,
            energyWasted: (totalCostPerParent * 2) - (energyFromA + energyFromB)
        };
    }
};
