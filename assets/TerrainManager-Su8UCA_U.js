const r=`import { Noise } from './Noise';\r
import { Vector2 } from '../../types';\r
import { WORLD_CONSTANTS } from './Constants';\r
\r
export type BiomeType = 'GRASS' | 'ARID' | 'CLIFF';\r
\r
export class TerrainManager {\r
    private noise: Noise;\r
    private width: number;\r
    private height: number;\r
    private biomeScale = 0.002;\r
    private cliffScale = 0.005;\r
    private cliffThreshold = 0.65;\r
    private collisionGrid: Uint8Array;\r
    private gridRes = 512;\r
\r
    constructor(width: number, height: number, seed: number = Math.random()) {\r
        this.noise = new Noise(seed);\r
        this.width = width;\r
        this.height = height;\r
        this.collisionGrid = new Uint8Array(this.gridRes * this.gridRes);\r
        this.precomputeCollisionGrid();\r
    }\r
\r
    private precomputeCollisionGrid() {\r
        for (let y = 0; y < this.gridRes; y++) {\r
            for (let x = 0; x < this.gridRes; x++) {\r
                const wx = (x / this.gridRes) * this.width;\r
                const wy = (y / this.gridRes) * this.height;\r
                const c = this.noise.fbm(wx * this.cliffScale, wy * this.cliffScale, 2);\r
                this.collisionGrid[y * this.gridRes + x] = (c > this.cliffThreshold) ? 1 : 0;\r
            }\r
        }\r
    }\r
\r
    getBiomeAt(x: number, y: number): BiomeType {\r
        // Biome noise (Large scale)\r
        const b = this.noise.fbm(x * this.biomeScale, y * this.biomeScale, 3);\r
\r
        // Cliff noise (Medium scale, high contrast)\r
        const c = this.noise.fbm(x * this.cliffScale, y * this.cliffScale, 2);\r
\r
        if (c > this.cliffThreshold) return 'CLIFF';\r
        return b > 0 ? 'GRASS' : 'ARID';\r
    }\r
\r
    isImpassable(x: number, y: number): boolean {\r
        // Boundary check\r
        if (x < 0 || x > this.width || y < 0 || y > this.height) return true;\r
\r
        // Grid lookup\r
        const gx = Math.floor((x / this.width) * (this.gridRes - 1));\r
        const gy = Math.floor((y / this.height) * (this.gridRes - 1));\r
        return this.collisionGrid[gy * this.gridRes + gx] === 1;\r
    }\r
\r
    // Get a safe spawn position\r
    getSafeSpawnPos(): Vector2 {\r
        let x, y;\r
        let attempts = 0;\r
        do {\r
            x = Math.random() * this.width;\r
            y = Math.random() * this.height;\r
            attempts++;\r
        } while (this.isImpassable(x, y) && attempts < 100);\r
        return { x, y };\r
    }\r
\r
    getBiomeColor(biome: BiomeType, x: number, y: number): string {\r
        // Add micro-variation to colors\r
        const variation = this.noise.noise(x * 0.1, y * 0.1) * 10;\r
\r
        switch (biome) {\r
            case 'GRASS':\r
                return \`hsl(\${100 + variation}, 45%, \${25 + variation}%)\`;\r
            case 'ARID':\r
                return \`hsl(\${35 + variation}, 35%, \${30 + variation}%)\`;\r
            case 'CLIFF':\r
                return \`hsl(0, 0%, \${15 + variation}%)\`;\r
            default:\r
                return '#000';\r
        }\r
    }\r
}\r
`;export{r as default};
