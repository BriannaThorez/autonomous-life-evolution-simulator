const r=`import { OrganismData } from '../../types';\r
\r
export interface SpeciesProfile {\r
    id: string;\r
    name: string;\r
    description: string;\r
    baseColor: string;\r
}\r
\r
export class SpeciesRegistry {\r
    private static species = new Map<string, SpeciesProfile>();\r
\r
    public static register(profile: SpeciesProfile) {\r
        this.species.set(profile.id, profile);\r
    }\r
\r
    public static getProfile(id: string): SpeciesProfile | undefined {\r
        return this.species.get(id);\r
    }\r
\r
    public static identify(org: OrganismData): string {\r
        // Basic identification logic based on DNA/Stats\r
        return "SpeciesA";\r
    }\r
}\r
\r
// Register default species\r
SpeciesRegistry.register({\r
    id: "SpeciesA",\r
    name: "Larva Primus",\r
    description: "The primary inhabitant of this world.",\r
    baseColor: "hsl(180, 70%, 50%)"\r
});\r
`;export{r as default};
