import { Noise } from './Noise';
import { Vector2 } from '../../types';
import { WORLD_CONSTANTS } from './Constants';

export type BiomeType = 'GRASS' | 'ARID' | 'CLIFF';

export class TerrainManager {
    private noise: Noise;
    private width: number;
    private height: number;
    private biomeScale = 0.002;
    private cliffScale = 0.005;
    private cliffThreshold = 0.65;
    private collisionGrid: Uint8Array;
    private gridRes = 512;

    constructor(width: number, height: number, seed: number = Math.random()) {
        this.noise = new Noise(seed);
        this.width = width;
        this.height = height;
        this.collisionGrid = new Uint8Array(this.gridRes * this.gridRes);
        this.precomputeCollisionGrid();
    }

    private precomputeCollisionGrid() {
        for (let y = 0; y < this.gridRes; y++) {
            for (let x = 0; x < this.gridRes; x++) {
                const wx = (x / this.gridRes) * this.width;
                const wy = (y / this.gridRes) * this.height;
                const c = this.noise.fbm(wx * this.cliffScale, wy * this.cliffScale, 2);
                this.collisionGrid[y * this.gridRes + x] = (c > this.cliffThreshold) ? 1 : 0;
            }
        }
    }

    getBiomeAt(x: number, y: number): BiomeType {
        // Biome noise (Large scale)
        const b = this.noise.fbm(x * this.biomeScale, y * this.biomeScale, 3);

        // Cliff noise (Medium scale, high contrast)
        const c = this.noise.fbm(x * this.cliffScale, y * this.cliffScale, 2);

        if (c > this.cliffThreshold) return 'CLIFF';
        return b > 0 ? 'GRASS' : 'ARID';
    }

    isImpassable(x: number, y: number): boolean {
        // Boundary check
        if (x < 0 || x > this.width || y < 0 || y > this.height) return true;

        // Grid lookup
        const gx = Math.floor((x / this.width) * (this.gridRes - 1));
        const gy = Math.floor((y / this.height) * (this.gridRes - 1));
        return this.collisionGrid[gy * this.gridRes + gx] === 1;
    }

    // Get a safe spawn position
    getSafeSpawnPos(): Vector2 {
        let x, y;
        let attempts = 0;
        do {
            x = Math.random() * this.width;
            y = Math.random() * this.height;
            attempts++;
        } while (this.isImpassable(x, y) && attempts < 100);
        return { x, y };
    }

    getBiomeColor(biome: BiomeType, x: number, y: number): string {
        // Add micro-variation to colors
        const variation = this.noise.noise(x * 0.1, y * 0.1) * 10;

        switch (biome) {
            case 'GRASS':
                return `hsl(${100 + variation}, 45%, ${25 + variation}%)`;
            case 'ARID':
                return `hsl(${35 + variation}, 35%, ${30 + variation}%)`;
            case 'CLIFF':
                return `hsl(0, 0%, ${15 + variation}%)`;
            default:
                return '#000';
        }
    }
}
