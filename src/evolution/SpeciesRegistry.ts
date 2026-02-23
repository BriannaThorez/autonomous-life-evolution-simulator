import { OrganismData } from '../../types';

export interface SpeciesProfile {
    id: string;
    name: string;
    description: string;
    baseColor: string;
}

export class SpeciesRegistry {
    private static species = new Map<string, SpeciesProfile>();

    public static register(profile: SpeciesProfile) {
        this.species.set(profile.id, profile);
    }

    public static getProfile(id: string): SpeciesProfile | undefined {
        return this.species.get(id);
    }

    public static identify(org: OrganismData): string {
        // Basic identification logic based on DNA/Stats
        return "SpeciesA";
    }
}

// Register default species
SpeciesRegistry.register({
    id: "SpeciesA",
    name: "Larva Primus",
    description: "The primary inhabitant of this world.",
    baseColor: "hsl(180, 70%, 50%)"
});
