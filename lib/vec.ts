export type vec2 = [number, number];

export const add = (a: vec2, b: vec2): vec2 => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: vec2, b: vec2): vec2 => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: vec2, b: vec2): vec2 => [a[0] * b[0], a[1] * b[1]];
export const div = (a: vec2, b: number): vec2 => [a[0] / b, a[1] / b];
export const len = (a: vec2): number => Math.hypot(a[0], a[1]);
export const norm = (a: vec2): vec2 => {
  const l = len(a);
  return l > 1e-6 ? div(a, l) : [1, 0];
};
export const rot = (a: vec2, r: number): vec2 => {
  const [cos, sin] = [Math.cos(r), Math.sin(r)];
  return [a[0] * cos - a[1] * sin, a[0] * sin + a[1] * cos];
};
export const rot90 = (a: vec2, r: 0 | 1 | 2 | 3): vec2 => {
  const pattern: [vec2, vec2, vec2, vec2] = [
    [a[0], a[1]],
    [-a[1], a[0]],
    [-a[0], -a[1]],
    [a[1], -a[0]],
  ];
  return pattern[r];
};
export const getRot = (a: vec2): number => Math.atan2(a[1], a[0]);
export const intersection = (
  ap: vec2,
  av: vec2,
  bp: vec2,
  bv: vec2,
): number => {
  //            ap + s*av = bp + t*bv
  // <=>      s*av - t*bv = bp - ap
  // <=> [av bv] [s -t]^T = bp - ap
  // <=>         [s -t]^T = [av bv]^-1 (bp - ap)
  const bpap = sub(bp, ap);
  const det = av[0] * bv[1] - av[1] * bv[0];
  const s = (bv[1] * bpap[0] - bv[0] * bpap[1]) / det;
  return s;
};
