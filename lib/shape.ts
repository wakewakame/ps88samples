import * as vec from "./vec";

export type shape = vec.vec2[];

export const smooth_rect = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  r1: number,
  r2 = ((2 ** 0.5 - 1) * 4) / 3,
  div = 6,
): shape => {
  console.assert(div >= 0, "div must be non-negative");
  const w_half = w / 2;
  const h_half = h / 2;
  const r = r1 * (1 - r2);
  const corner = bezier([0, r1], [0, r], [r, 0], [r1, 0], div);
  return [
    ...corner.map((p) => vec.add(vec.rot90(p, 0), [cx - w_half, cy - h_half])),
    ...corner.map((p) => vec.add(vec.rot90(p, 1), [cx + w_half, cy - h_half])),
    ...corner.map((p) => vec.add(vec.rot90(p, 2), [cx + w_half, cy + h_half])),
    ...corner.map((p) => vec.add(vec.rot90(p, 3), [cx - w_half, cy + h_half])),
  ];
};

export const circle = (r: number, div = 24): shape => {
  console.assert(div >= 0, "div must be non-negative");
  return [...Array(div)].map((_, i) => {
    const t = (2 * Math.PI * i) / div;
    return [r * Math.cos(t), r * Math.sin(t)];
  });
};

export const bezier = (
  p1: vec.vec2,
  p2: vec.vec2,
  p3: vec.vec2,
  p4: vec.vec2,
  div: number,
): shape => {
  console.assert(div >= 0, "div must be non-negative");
  return [...Array(div + 2)].map((_, i): vec.vec2 => {
    const t = i / (div + 1);
    const u = 1 - t;
    const uu = u * u;
    const uuu = uu * u;
    const tt = t * t;
    const ttt = tt * t;
    return [
      uuu * p1[0] + 3 * uu * t * p2[0] + 3 * u * tt * p3[0] + ttt * p4[0],
      uuu * p1[1] + 3 * uu * t * p2[1] + 3 * u * tt * p3[1] + ttt * p4[1],
    ];
  });
};

export const inside = (shape: shape, p: vec.vec2): boolean => {
  let count = 0;
  for (let i = 0; i < shape.length; i++) {
    const [p1, p2] = [shape[i], shape[(i + 1) % shape.length]];
    const t = (p[1] - p1[1]) / (p2[1] - p1[1]);
    if (0 <= t && t < 1) {
      const x = p1[0] * (1 - t) + p2[0] * t;
      if (p[0] < x) {
        count++;
      }
    }
  }
  return count % 2 === 1;
};
