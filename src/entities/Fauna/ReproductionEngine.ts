import { SPECIES_A_DNA } from './SpeciesA/DNAProfile';
import { Genetics } from '../../evolution/GeneticsEngine';
import { Genome, EntityStats } from '../../../types';
import { POPULATION_CONSTANTS } from '../../core/Constants';
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
        // Uses your existing Genetics engine to mix alleles and apply mutation
        const rawGenome = parentB
            ? Genetics.recombine(parentA.genome, parentB.genome)
            : { ...parentA.genome }; // Clone for Parthenogenesis

        const mutatedGenome = Genetics.mutate(rawGenome);
        const childStats = Genetics.express(mutatedGenome);

        // 2. BASE INVESTMENT
        // Each parent contributes half of the species-defined base cost
        const baseInvestment = POPULATION_CONSTANTS.BIRTH_COST / 2;

        // 3. TRAIT SURCHARGE (The "Complexity Tax")
        // Higher performance traits increase the energy required to "build" the organism.
        // We use the child's newly expressed stats to determine this.
        const traitSurcharge =
            (childStats.speed * 150) +                // Faster muscles/motor-proteins
            (childStats.size * 5) +                   // Physical mass and structure
            (childStats.sight_range * 20) +           // Neural processing for distance
            (childStats.sight_fov * (180 / Math.PI)) + // Peripheral vision complexity
            (childStats.lifespan * 0.0001);           // Cellular repair durability

        const totalCostPerParent = baseInvestment + (traitSurcharge / 2);

        // 4. METABOLIC EFFICIENCY (The Wasting Factor)
        // The parent loses 'totalCostPerParent' from their energy pool.
        // However, the child only receives a fraction of that energy based on metabolic EFFICIENCY.
        // If Metabolism is 2.0 (burns fast/high waste), efficiency is low (e.g., 50%).
        // If Metabolism is 0.5 (burns slow/highly efficient), efficiency is high (e.g., 100%).

        const getEfficiency = (metabolism: number) => {
            // Clamp to ensure we never give more than 100% of what was paid.
            // E.g., Metabolism 2.0 -> 1 / 2.0 = 0.5 (50% efficiency)
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
            // Logging data to see "heat waste" in the console if needed
            energyWasted: (totalCostPerParent * 2) - (energyFromA + energyFromB)
        };
    }
};
