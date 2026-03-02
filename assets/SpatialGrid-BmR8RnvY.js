const r=`import { Vector2 } from '../../types';\r
\r
export interface SpatialEntity {\r
    id: string;\r
    position: Vector2;\r
}\r
\r
export class SpatialGrid {\r
    private cells: Map<number, string[]> = new Map();\r
    private cellSize: number;\r
    private width: number;\r
    private height: number;\r
\r
    constructor(width: number, height: number, cellSize: number = 50) {\r
        this.width = width;\r
        this.height = height;\r
        this.cellSize = cellSize;\r
    }\r
\r
    private getCellKey(pos: Vector2): number {\r
        const x = Math.floor(pos.x / this.cellSize);\r
        const y = Math.floor(pos.y / this.cellSize);\r
        // Bitmask key (X in high 16, Y in low 16) - Supports up to 65535 cells in each dim\r
        return (x << 16) | y;\r
    }\r
\r
    update(entities: SpatialEntity[]) {\r
        this.cells.clear();\r
        for (let i = 0; i < entities.length; i++) {\r
            const entity = entities[i];\r
            const key = this.getCellKey(entity.position);\r
            if (!this.cells.has(key)) {\r
                this.cells.set(key, []);\r
            }\r
            this.cells.get(key)!.push(entity.id);\r
        }\r
    }\r
\r
    getNeighbors(pos: Vector2, radius: number): string[] {\r
        const neighbors: string[] = [];\r
        const minX = Math.floor((pos.x - radius) / this.cellSize);\r
        const maxX = Math.floor((pos.x + radius) / this.cellSize);\r
        const minY = Math.floor((pos.y - radius) / this.cellSize);\r
        const maxY = Math.floor((pos.y + radius) / this.cellSize);\r
\r
        for (let x = minX; x <= maxX; x++) {\r
            for (let y = minY; y <= maxY; y++) {\r
                const key = (x << 16) | y;\r
                const cell = this.cells.get(key);\r
                if (cell) {\r
                    neighbors.push(...cell);\r
                }\r
            }\r
        }\r
        return neighbors;\r
    }\r
}\r
`;export{r as default};
