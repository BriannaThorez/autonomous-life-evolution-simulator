const r=`import { OrganismData } from '../../types';\r
\r
export interface VisualGenome {\r
    primaryColor: string;\r
    skeletalRigidity: number;\r
}\r
\r
/**\r
 * Slimmed AppearanceMapper: GPU now handles glow, pulse, and health desaturation.\r
 * Only CPU-dependent values (color lookup, skeletal rigidity) remain here.\r
 */\r
export class AppearanceMapper {\r
    public static getVisuals(org: OrganismData): VisualGenome {\r
        const speedFactor = org.expressedStats.speed / 1.5;\r
\r
        return {\r
            primaryColor: org.color,\r
            skeletalRigidity: clamp(1.0 - speedFactor, 0.2, 1.0),\r
        };\r
    }\r
}\r
\r
function clamp(val: number, min: number, max: number): number {\r
    return Math.max(min, Math.min(max, val));\r
}\r
`;export{r as default};
