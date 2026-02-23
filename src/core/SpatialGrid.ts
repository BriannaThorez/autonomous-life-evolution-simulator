import { Vector2 } from '../../types';

export interface SpatialEntity {
    id: string;
    position: Vector2;
}

export class SpatialGrid {
    private cells: Map<number, string[]> = new Map();
    private cellSize: number;
    private width: number;
    private height: number;

    constructor(width: number, height: number, cellSize: number = 50) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
    }

    private getCellKey(pos: Vector2): number {
        const x = Math.floor(pos.x / this.cellSize);
        const y = Math.floor(pos.y / this.cellSize);
        // Bitmask key (X in high 16, Y in low 16) - Supports up to 65535 cells in each dim
        return (x << 16) | y;
    }

    update(entities: SpatialEntity[]) {
        this.cells.clear();
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const key = this.getCellKey(entity.position);
            if (!this.cells.has(key)) {
                this.cells.set(key, []);
            }
            this.cells.get(key)!.push(entity.id);
        }
    }

    getNeighbors(pos: Vector2, radius: number): string[] {
        const neighbors: string[] = [];
        const minX = Math.floor((pos.x - radius) / this.cellSize);
        const maxX = Math.floor((pos.x + radius) / this.cellSize);
        const minY = Math.floor((pos.y - radius) / this.cellSize);
        const maxY = Math.floor((pos.y + radius) / this.cellSize);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const key = (x << 16) | y;
                const cell = this.cells.get(key);
                if (cell) {
                    neighbors.push(...cell);
                }
            }
        }
        return neighbors;
    }
}
