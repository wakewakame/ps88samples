import { describe, expect, test, vi } from "vitest";
import { recorder } from "./recorded";

describe("recorder", () => {
  test("input < buffer", () => {
    const r = recorder(7);
    const f: Array<Float32Array> = [];
    r.onFilled((arg: Float32Array) => {
      f.push(arg.slice());
    });

    r.add(new Float32Array([1, 2, 3]));
    expect(f.length).toBe(0);
    expect(r.get()).toEqual(new Float32Array([0, 0, 0, 0, 1, 2, 3]));

    r.add(new Float32Array([4, 5, 6]));
    expect(f.length).toBe(0);
    expect(r.get()).toEqual(new Float32Array([0, 1, 2, 3, 4, 5, 6]));

    r.add(new Float32Array([7, 8, 9]));
    expect(f.length).toBe(1);
    expect(f[0]).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7]));
    expect(r.get()).toEqual(new Float32Array([3, 4, 5, 6, 7, 8, 9]));

    r.add(new Float32Array([10, 11, 12]));
    expect(f.length).toBe(1);
    expect(r.get()).toEqual(new Float32Array([6, 7, 8, 9, 10, 11, 12]));

    r.add(new Float32Array([13, 14, 15]));
    expect(f.length).toBe(2);
    expect(f[1]).toEqual(new Float32Array([8, 9, 10, 11, 12, 13, 14]));
    expect(r.get()).toEqual(new Float32Array([9, 10, 11, 12, 13, 14, 15]));
  });

  test("input > buffer", () => {
    const r = recorder(3);
    const f: Array<Float32Array> = [];
    r.onFilled((arg: Float32Array) => {
      f.push(arg.slice());
    });

    r.add(new Float32Array([1, 2, 3, 4, 5, 6, 7]));
    expect(f.length).toBe(2);
    expect(f[0]).toEqual(new Float32Array([1, 2, 3]));
    expect(f[1]).toEqual(new Float32Array([4, 5, 6]));
    expect(r.get()).toEqual(new Float32Array([5, 6, 7]));

    r.add(new Float32Array([8, 9, 10, 11, 12, 13, 14]));
    expect(f.length).toBe(4);
    expect(f[2]).toEqual(new Float32Array([7, 8, 9]));
    expect(f[3]).toEqual(new Float32Array([10, 11, 12]));
    expect(r.get()).toEqual(new Float32Array([12, 13, 14]));
  });
});
