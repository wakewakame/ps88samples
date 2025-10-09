import { describe, expect, test } from "vitest";
import { fft, fftRange } from "./fft";

// FFT の正しさを確認するための DFT 実装 (テスト用)
const dft = (x: Float32Array, inverse: boolean) => {
  const len = x.length / 2;

  // 事前に w を計算しておく
  const sign = inverse ? 1 : -1;
  const w = new Float32Array(x.length);
  for (let n = 0; n < len; n++) {
    const theta = (sign * 2 * Math.PI * n) / len;
    w[2 * n + 0] = Math.cos(theta);
    w[2 * n + 1] = Math.sin(theta);
  }

  // DFT
  const y = new Float32Array(x.length);
  for (let k = 0; k < len; k++) {
    for (let n = 0; n < len; n++) {
      const wi = (n * k) % len;
      const xn = [x[2 * n + 0], x[2 * n + 1]];
      const wn = [w[2 * wi + 0], w[2 * wi + 1]];
      y[2 * k + 0] += xn[0] * wn[0] - xn[1] * wn[1];
      y[2 * k + 1] += xn[0] * wn[1] + xn[1] * wn[0];
    }
    if (inverse) {
      y[2 * k + 0] /= len;
      y[2 * k + 1] /= len;
    }
  }

  return y;
};

// FFT の正しさを確認するための DFT 実装 (テスト用)
const dftRange = (
  x: Float32Array,
  hz_start: number,
  hz_end: number,
  len: number,
) => {
  const len_orig = x.length / 2;
  const hz_step = (hz_end - hz_start) / (len - 1);

  // DFT
  const y = new Float32Array(2 * len);
  for (let k = 0; k < len; k++) {
    const hz = hz_start + hz_step * k;
    for (let n = 0; n < x.length / 2; n++) {
      const theta = (-2 * Math.PI * hz * n) / len_orig;
      const xn = [x[2 * n + 0], x[2 * n + 1]];
      const w = [Math.cos(theta), Math.sin(theta)];
      y[2 * k + 0] += xn[0] * w[0] - xn[1] * w[1];
      y[2 * k + 1] += xn[0] * w[1] + xn[1] * w[0];
    }
  }
  return y;
};

describe("fft", () => {
  test("dft", () => {
    // 1 Hz の正弦波用意
    const x = new Float32Array(2 * 8);
    for (let n = 0; n < 8; n++) {
      const theta = (2 * Math.PI * n) / 8;
      x[2 * n + 0] = Math.cos(theta);
      x[2 * n + 1] = Math.sin(theta);
    }
    const expect_dft = new Float32Array(2 * 8);
    expect_dft[2 * 1 + 0] = 8;

    // DFT
    const actual_dft = dft(x, false);
    expect(actual_dft.length).toBe(expect_dft.length);
    for (let n = 0; n < expect_dft.length; n++) {
      expect(actual_dft[n]).toBeCloseTo(expect_dft[n], 1e-10);
    }

    // iDFT
    const actual_idft = dft(actual_dft, true);
    expect(actual_idft.length).toBe(x.length);
    for (let n = 0; n < x.length; n++) {
      expect(actual_idft[n]).toBeCloseTo(x[n], 1e-10);
    }
  });

  test("dftRange", () => {
    // 2 Hz の正弦波用意
    const x = new Float32Array(2 * 8);
    for (let n = 0; n < 8; n++) {
      const theta = (2 * 2 * Math.PI * n) / 8;
      x[2 * n + 0] = Math.cos(theta);
      x[2 * n + 1] = Math.sin(theta);
    }
    const expect_dft = new Float32Array(2 * 4);
    expect_dft[2 * 1 + 0] = 8;

    // 1~4 Hz の範囲を DFT
    const actual_dft = dftRange(x, 1.0, 4.0, 4);
    expect(actual_dft.length).toBe(expect_dft.length);
    for (let n = 0; n < expect_dft.length; n++) {
      expect(actual_dft[n]).toBeCloseTo(expect_dft[n], 1e-10);
    }
  });

  test("fft", () => {
    const len_patterns = [0, 1, 2 * 2 * 3 * 23];
    for (const len of len_patterns) {
      // 乱数列を生成
      const x = new Float32Array(2 * len);
      for (let n = 0; n < len; n++) {
        x[2 * n + 0] = Math.random();
        x[2 * n + 1] = Math.random();
      }

      // DFT と計算が一致することを認
      const expect_fft = dft(x, false);

      // FFT
      const actual_fft = fft(x, false);
      expect(actual_fft.length).toBe(expect_fft.length);
      for (let n = 0; n < expect_fft.length; n++) {
        expect(actual_fft[n]).toBeCloseTo(expect_fft[n], 1e-10);
      }

      // iFFT
      const actual_ifft = fft(actual_fft, true);
      expect(actual_ifft.length).toBe(x.length);
      for (let n = 0; n < x.length; n++) {
        expect(actual_ifft[n]).toBeCloseTo(x[n], 1e-10);
      }
    }
  });

  test("fftRange", () => {
    // 大小さまざまな素因数を持つ長さの配列に対してテスト
    const len = 2 * 2 * 3 * 23;

    // 乱数列を生成
    const x = new Float32Array(2 * len);
    for (let n = 0; n < len; n++) {
      x[2 * n + 0] = Math.random();
      x[2 * n + 1] = Math.random();
    }

    // DFT と計算が一致することを認
    const expect_fft = dftRange(x, 3.0, 4.0, 4);

    // FFT
    const actual_fft = fftRange(x, 3.0, 4.0, 4);
    expect(actual_fft.length).toBe(expect_fft.length);
    for (let n = 0; n < expect_fft.length; n++) {
      expect(actual_fft[n]).toBeCloseTo(expect_fft[n], 1e-10);
    }
  });
});
