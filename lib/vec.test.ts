import { describe, expect, test } from "vitest";
import * as vec from "./vec";

describe("vec", () => {
  test("basic", () => {
    expectArray(vec.add([1, 2], [3, 4]), [4, 6]);
    expectArray(vec.sub([1, 2], [3, 4]), [-2, -2]);
    expectArray(vec.mul([1, 2], [3, 4]), [3, 8]);
    expectArray(vec.div([1, 2], 3), [1 / 3, 2 / 3]);
    expect(vec.len([3, 4])).toBeCloseTo(5);
    expectArray(vec.norm([3, 4]), [3 / 5, 4 / 5]);
    expectArray(vec.norm([0, 0]), [1, 0]);
    expectArray(vec.rot([3, 4], Math.PI / 2), [-4, 3]);
    expectArray(vec.rot90([3, 4], 1), [-4, 3]);
    expect(vec.getRot([1, 3 ** 0.5])).toBeCloseTo(Math.PI / 3);
    expect(vec.intersection([-1, -1], [2, 2], [1, 0], [-2, 2])).toBeCloseTo(
      3 / 4,
    );
  });
});

const expectArray = (received: number[], expected: number[], precision = 2) => {
  expect(received.length).toBe(expected.length);
  for (let i = 0; i < Math.min(received.length, expected.length); i++) {
    expect(received[i]).toBeCloseTo(expected[i], precision);
  }
};
