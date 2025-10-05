import type { GuiContext } from "ps88web";
import * as vec from "./vec";
import * as shape from "./shape";

export const rect = (
  ctx: GuiContext,
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: number,
  stroke?: number,
  strokeWidth?: number,
) => {
  const path: shape.shape = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  ctx.addPolygon(path, { fill, stroke, strokeWidth, strokeClosed: true });
};

export const circle = (
  ctx: GuiContext,
  x: number,
  y: number,
  r: number,
  fill?: number,
  stroke?: number,
  strokeWidth?: number,
) => {
  const div = 24;
  const path: shape.shape = [...Array(div)].map((_, i) => {
    const t = (2 * Math.PI * i) / div;
    return [x + r * Math.cos(t), y + r * Math.sin(t)];
  });
  ctx.addPolygon(path, { fill, stroke, strokeWidth, strokeClosed: true });
};

export const graph = (
  ctx: GuiContext,
  wave: Float32Array,
  gain: number,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke?: number,
  strokeWidth?: number,
) => {
  const path: shape.shape = [];
  for (let x2 = 0; x2 <= w; x2 += 1 / 4) {
    const i = Math.floor(((wave.length - 1) * x2) / w);
    const y2 = (gain * wave[i] * 0.5 + 0.5) * h;
    path.push([x + x2, y + y2]);
  }
  ctx.addPolygon(path, { stroke, strokeWidth });
};

export const drag = (
  left: number,
  top: number,
  right: number,
  bottom: number,
  ix?: number,
  iy?: number,
) => {
  let [x, y] = [ix ?? (left + right) * 0.5, iy ?? (top + bottom) * 0.5];
  let pressed: { x: number; y: number; hit: boolean } | null = null;
  let r = 10;
  return {
    get: () => [x, y],
    draw: (ctx: GuiContext) => {
      const hit = ((x - ctx.mouse.x) ** 2 + (y - ctx.mouse.y) ** 2) ** 0.5 < r;
      pressed = ctx.mouse.pressedL
        ? (pressed ?? { x: x - ctx.mouse.x, y: y - ctx.mouse.y, hit })
        : null;
      let drag = false;
      if (pressed != null && pressed.hit) {
        x = Math.max(left, Math.min(right, ctx.mouse.x + pressed.x));
        y = Math.max(top, Math.min(bottom, ctx.mouse.y + pressed.y));
        drag = true;
      }
      circle(ctx, x, y, r, 0xffffffff);
      const rTarget = drag ? 9 : hit ? 10 : 8;
      r += (rTarget - r) * 0.4;
      return [x, y];
    },
  };
};

export const drag2 = (
  path: shape.shape,
  left: number,
  top: number,
  right: number,
  bottom: number,
  ix: number,
  iy: number,
) => {
  let [x, y] = [ix ?? (left + right) * 0.5, iy ?? (top + bottom) * 0.5];
  let pressed: { x: number; y: number; hit: boolean } | null = null;
  let scale = 1.0;
  return {
    get: () => [x, y],
    draw: (ctx: GuiContext) => {
      const p = path.map((p) => vec.add(vec.mul(p, [scale, scale]), [x, y]));
      const hit = shape.inside(p, [ctx.mouse.x, ctx.mouse.y]);
      pressed = ctx.mouse.pressedL
        ? (pressed ?? { x: x - ctx.mouse.x, y: y - ctx.mouse.y, hit })
        : null;
      let drag = false;
      if (pressed != null && pressed.hit) {
        x = Math.max(left, Math.min(right, ctx.mouse.x + pressed.x));
        y = Math.max(top, Math.min(bottom, ctx.mouse.y + pressed.y));
        drag = true;
      }
      ctx.addPolygon(p, { fill: 0xffffffff, strokeClosed: true });
      const scaleTarget = drag ? 0.9 : hit ? 1.1 : 1;
      scale += (scaleTarget - scale) * 0.4;
      return [x, y];
    },
  };
};

export const button = (x: number, y: number) => {
  let prePressed = false;
  let rec = false;
  let hitanim = 0;
  let recanim = 0;
  return {
    get: () => ({ x, y, rec }),
    draw: (ctx: GuiContext) => {
      const click = ctx.mouse.pressedL && !prePressed;
      prePressed = ctx.mouse.pressedL;
      const w = (64 * (1 - recanim) + 48 * recanim) * (1 + 0.11 * hitanim);
      const r2 = (((2 ** 0.5 - 1) * 4) / 3) * (1 - recanim) + 1 * recanim;
      const path = shape.smooth_rect(x, y, w, w, w * 0.5, r2, 6);
      const hit = shape.inside(path, [ctx.mouse.x, ctx.mouse.y]);
      rec = hit && click ? !rec : rec;
      hitanim += ((hit ? 1 : 0) - hitanim) * 0.4;
      recanim += ((rec ? 1 : 0) - recanim) * 0.25;
      ctx.addPolygon(path, {
        fill: 0xff0000ff,
        stroke: 0xffffffff,
        strokeWidth: 2,
        strokeClosed: true,
      });
      return [x, y];
    },
  };
};
