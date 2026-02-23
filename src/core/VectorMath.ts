
import { Vector2 } from '../../types';

export const VectorMath = {
  dist: (a: Vector2, b: Vector2): number => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  },

  distSq: (a: Vector2, b: Vector2): number => {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  },

  normalize: (v: Vector2): Vector2 => {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: v.x / mag, y: v.y / mag };
  },

  dot: (a: Vector2, b: Vector2): number => {
    return a.x * b.x + a.y * b.y;
  },

  angleBetween: (v1: Vector2, v2: Vector2): number => {
    const dot = VectorMath.dot(VectorMath.normalize(v1), VectorMath.normalize(v2));
    // Clamp dot to [-1, 1] to avoid NaN from precision errors
    return Math.acos(Math.max(-1, Math.min(1, dot)));
  },

  sub: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y }),
  add: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y }),
  mul: (v: Vector2, s: number): Vector2 => ({ x: v.x * s, y: v.y * s }),

  limit: (v: Vector2, max: number): Vector2 => {
    const magSq = v.x * v.x + v.y * v.y;
    if (magSq > max * max) {
      const mag = Math.sqrt(magSq);
      return { x: (v.x / mag) * max, y: (v.y / mag) * max };
    }
    return v;
  },

  seek: (current: Vector2, target: Vector2, force: number): Vector2 => {
    const desired = { x: target.x - current.x, y: target.y - current.y };
    // Reuse normalize logic to avoid circular dependency if called from outside or just inline it for speed
    const mag = Math.sqrt(desired.x * desired.x + desired.y * desired.y);
    if (mag === 0) return { x: 0, y: 0 };
    const normalized = { x: desired.x / mag, y: desired.y / mag };
    return { x: normalized.x * force, y: normalized.y * force };
  }
};
