const r=`// Basic 2D Perlin-like noise utility\r
export class Noise {\r
    private p: number[] = new Array(512);\r
    private permutation = [\r
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10,\r
        23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87,\r
        174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,\r
        133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,\r
        89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,\r
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119,\r
        248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,\r
        178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249,\r
        14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205,\r
        93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180\r
    ];\r
\r
    constructor(seed: number = Math.random()) {\r
        for (let i = 0; i < 256; i++) {\r
            this.p[i] = this.permutation[i];\r
            this.p[256 + i] = this.permutation[i];\r
        }\r
    }\r
\r
    private fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }\r
    private lerp(t: number, a: number, b: number): number { return a + t * (b - a); }\r
    private grad(hash: number, x: number, y: number, z: number): number {\r
        const h = hash & 15;\r
        const u = h < 8 ? x : y;\r
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;\r
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);\r
    }\r
\r
    noise(x: number, y: number, z: number = 0): number {\r
        const X = Math.floor(x) & 255;\r
        const Y = Math.floor(y) & 255;\r
        const Z = Math.floor(z) & 255;\r
\r
        x -= Math.floor(x);\r
        y -= Math.floor(y);\r
        z -= Math.floor(z);\r
\r
        const u = this.fade(x);\r
        const v = this.fade(y);\r
        const w = this.fade(z);\r
\r
        const A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z;\r
        const B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;\r
\r
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z),\r
            this.grad(this.p[BA], x - 1, y, z)),\r
            this.lerp(u, this.grad(this.p[AB], x, y - 1, z),\r
                this.grad(this.p[BB], x - 1, y - 1, z))),\r
            this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1),\r
                this.grad(this.p[BA + 1], x - 1, y, z - 1)),\r
                this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1),\r
                    this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));\r
    }\r
\r
    // Fractal Brownian Motion for more complex noise\r
    fbm(x: number, y: number, octaves: number = 4): number {\r
        let total = 0;\r
        let frequency = 1;\r
        let amplitude = 1;\r
        let maxValue = 0;\r
        for (let i = 0; i < octaves; i++) {\r
            total += this.noise(x * frequency, y * frequency) * amplitude;\r
            maxValue += amplitude;\r
            amplitude *= 0.5;\r
            frequency *= 2;\r
        }\r
        return total / maxValue;\r
    }\r
}\r
`;export{r as default};
