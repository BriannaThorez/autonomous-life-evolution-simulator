const r=`\r
import { Vector2 } from '../../types';\r
\r
export const VectorMath = {\r
  dist: (a: Vector2, b: Vector2): number => {\r
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);\r
  },\r
\r
  distSq: (a: Vector2, b: Vector2): number => {\r
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;\r
  },\r
\r
  normalize: (v: Vector2): Vector2 => {\r
    const mag = Math.sqrt(v.x * v.x + v.y * v.y);\r
    if (mag === 0) return { x: 0, y: 0 };\r
    return { x: v.x / mag, y: v.y / mag };\r
  },\r
\r
  dot: (a: Vector2, b: Vector2): number => {\r
    return a.x * b.x + a.y * b.y;\r
  },\r
\r
  angleBetween: (v1: Vector2, v2: Vector2): number => {\r
    const dot = VectorMath.dot(VectorMath.normalize(v1), VectorMath.normalize(v2));\r
    // Clamp dot to [-1, 1] to avoid NaN from precision errors\r
    return Math.acos(Math.max(-1, Math.min(1, dot)));\r
  },\r
\r
  sub: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y }),\r
  add: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y }),\r
  mul: (v: Vector2, s: number): Vector2 => ({ x: v.x * s, y: v.y * s }),\r
\r
  limit: (v: Vector2, max: number): Vector2 => {\r
    const magSq = v.x * v.x + v.y * v.y;\r
    if (magSq > max * max) {\r
      const mag = Math.sqrt(magSq);\r
      return { x: (v.x / mag) * max, y: (v.y / mag) * max };\r
    }\r
    return v;\r
  },\r
\r
  seek: (current: Vector2, target: Vector2, force: number): Vector2 => {\r
    const desired = { x: target.x - current.x, y: target.y - current.y };\r
    // Reuse normalize logic to avoid circular dependency if called from outside or just inline it for speed\r
    const mag = Math.sqrt(desired.x * desired.x + desired.y * desired.y);\r
    if (mag === 0) return { x: 0, y: 0 };\r
    const normalized = { x: desired.x / mag, y: desired.y / mag };\r
    return { x: normalized.x * force, y: normalized.y * force };\r
  }\r
};\r
`;export{r as default};
