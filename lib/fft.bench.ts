import { describe, bench } from "vitest";
import { fft } from "./fft";

describe("benchmark", () => {
  const len_patterns = [128, 1024, 4096, 48000, 96000];
  for (const len of len_patterns) {
    const x = new Float32Array(2 * len);
    for (let n = 0; n < len; n++) {
      x[2 * n + 0] = Math.random();
      x[2 * n + 1] = Math.random();
    }
    bench(`fft(${len})`, () => {
      const y = fft(x, false);
      eval(`${y[0]}`); // 最適化防止
    });
  }
});
