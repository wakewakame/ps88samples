/**
 * 高速フーリエ変換 (FFT)
 * 参考: https://github.com/wakewakame/fft/blob/cbbd39aa5dbaaf9fa5e8840fc2cf987b03368735/docs/fft.md
 *
 * @param x - 入力信号 (実部と虚部が交互に格納された Float32Array)
 * @param inverse - 逆変換を行う場合は true
 * @returns 変換後の信号 (実部と虚部が交互に格納された Float32Array)
 */
export const fft = (x: Float32Array, inverse: boolean) => {
  console.assert(x.length % 2 == 0);
  const len_orig = x.length / 2;

  // 事前に w を計算しておく
  const sign = inverse ? 1 : -1;
  const w = new Float32Array(x.length);
  for (let n = 0; n < len_orig; n++) {
    const theta = (sign * 2 * Math.PI * n) / len_orig;
    w[2 * n + 0] = Math.cos(theta);
    w[2 * n + 1] = Math.sin(theta);
  }

  // 出力用 (y1 と y2 を交互に使い回す)
  let y1 = x.slice();
  let y2 = new Float32Array(x.length);

  // FFT
  let len = len_orig;
  let stride = 1;
  const factors = [2, 3, 5, 7];
  while (len >= 2) {
    // len を 2 つの整数の積に分解
    const len1 = factors.find((x) => len % x === 0) ?? len;
    const len2 = len / len1;

    // バタフライ演算
    if (len1 === 2) {
      // Cooley-Tukey FFT
      // 高速化のため、基数が小さいとは式を展開
      for (let n2 = 0; n2 < len2; n2++) {
        const wi = (stride * n2) % len_orig;
        for (let offset = 0; offset < stride; offset++) {
          const ai = stride * n2 + offset;
          const bi = stride * (n2 + len2) + offset;
          const a = [y1[2 * ai + 0], y1[2 * ai + 1]];
          const b = [y1[2 * bi + 0], y1[2 * bi + 1]];
          const ba = [a[0] - b[0], a[1] - b[1]];
          const wn = [w[2 * wi + 0], w[2 * wi + 1]];
          const ba_x_wn = [
            ba[0] * wn[0] - ba[1] * wn[1],
            ba[0] * wn[1] + ba[1] * wn[0],
          ];
          const y2i = [
            stride * (2 * n2 + 0) + offset,
            stride * (2 * n2 + 1) + offset,
          ];
          y2[2 * y2i[0] + 0] = a[0] + b[0];
          y2[2 * y2i[0] + 1] = a[1] + b[1];
          y2[2 * y2i[1] + 0] = ba_x_wn[0];
          y2[2 * y2i[1] + 1] = ba_x_wn[1];
        }
      }
    } else if (factors.includes(len1)) {
      // Cooley-Tukey FFT
      y2.fill(0);
      for (let k1 = 0; k1 < len1; k1++) {
        for (let n1 = 0; n1 < len1; n1++) {
          for (let n2 = 0; n2 < len2; n2++) {
            const k = len1 * n2 + k1;
            const n = len2 * n1 + n2;
            const wi = (stride * n * k1) % len_orig;
            for (let offset = 0; offset < stride; offset++) {
              const k_ = stride * k + offset;
              const n_ = stride * n + offset;
              const y1n = [y1[2 * n_ + 0], y1[2 * n_ + 1]];
              const wn = [w[2 * wi + 0], w[2 * wi + 1]];
              y2[2 * k_ + 0] += y1n[0] * wn[0] - y1n[1] * wn[1];
              y2[2 * k_ + 1] += y1n[0] * wn[1] + y1n[1] * wn[0];
            }
          }
        }
      }
    } else if (len2 == 1) {
      // len が小さい素因数を持たない場合は Bluestein's FFT にフォールバック
      const w2 = new Float32Array(2 * len);
      for (let n = 0; n < len; n++) {
        const theta = (sign * Math.PI * n * n) / len;
        w2[2 * n + 0] = Math.cos(theta);
        w2[2 * n + 1] = Math.sin(theta);
      }
      const len_ceil = 1 << Math.ceil(Math.log2(2 * len - 1));
      for (let offset = 0; offset < stride; offset++) {
        const a = new Float32Array(2 * len_ceil);
        for (let n = 0; n < len; n++) {
          const y1i = stride * n + offset;
          const y1n = [y1[2 * y1i + 0], y1[2 * y1i + 1]];
          const w2n = [w2[2 * n + 0], w2[2 * n + 1]];
          a[2 * n + 0] = y1n[0] * w2n[0] - y1n[1] * w2n[1];
          a[2 * n + 1] = y1n[0] * w2n[1] + y1n[1] * w2n[0];
        }
        const b = new Float32Array(2 * len_ceil);
        for (let n = 0; n < len; n++) {
          b[2 * n + 0] = w2[2 * n + 0];
          b[2 * n + 1] = -w2[2 * n + 1];
        }
        for (let n = 1; n < len; n++) {
          b[2 * (len_ceil - n) + 0] = w2[2 * n + 0];
          b[2 * (len_ceil - n) + 1] = -w2[2 * n + 1];
        }
        const a_fft = fft(a, false);
        const b_fft = fft(b, false);
        const y_fft = new Float32Array(2 * len_ceil);
        for (let n = 0; n < len_ceil; n++) {
          const an = [a_fft[2 * n + 0], a_fft[2 * n + 1]];
          const bn = [b_fft[2 * n + 0], b_fft[2 * n + 1]];
          y_fft[2 * n + 0] = an[0] * bn[0] - an[1] * bn[1];
          y_fft[2 * n + 1] = an[0] * bn[1] + an[1] * bn[0];
        }
        const y = fft(y_fft, true);
        for (let k = 0; k < len; k++) {
          const y2i = stride * k + offset;
          const yn = [y[2 * k + 0], y[2 * k + 1]];
          const bn = [b[2 * k + 0], -b[2 * k + 1]];
          y2[2 * y2i + 0] = yn[0] * bn[0] - yn[1] * bn[1];
          y2[2 * y2i + 1] = yn[0] * bn[1] + yn[1] * bn[0];
        }
      }
    } else {
      throw new Error("unexpected");
    }

    // y1 と y2 を入れ替えて次のステップへ
    [y1, y2] = [y2, y1];
    len = len2;
    stride *= len1;
  }

  // 逆変換の場合は正規化
  if (inverse) {
    for (let k = 0; k < y1.length; k++) {
      y1[k] /= len_orig;
    }
  }

  return y1;
};

/**
 * 指定した周波数範囲の FFT を計算する (Bluestein's FFT)
 *
 * @param x - 入力信号 (実部と虚部が交互に格納された Float32Array)
 * @param hz_start - 周波数範囲の開始 (Hz, x の長さを 1 Hz とする)
 * @param hz_end - 周波数範囲の終了 (Hz, x の長さを 1 Hz とする)
 * @param len - 出力信号の長さ (複素数の個数)
 * @returns 変換後の信号 (実部と虚部が交互に格納された Float32Array)
 */
export const fftRange = (
  x: Float32Array,
  hz_start: number,
  hz_end: number,
  len: number,
) => {
  // Bluestein's FFT を用いて、指定した周波数範囲の FFT を計算する
  console.assert(x.length % 2 == 0);
  const len_orig = x.length / 2;
  const hz_step = (hz_end - hz_start) / (len - 1);
  const len_ceil = 1 << Math.ceil(Math.log2(len_orig + len - 1));
  const a = new Float32Array(2 * len_ceil);
  for (let n = 0; n < len_orig; n++) {
    const hz = hz_start + (hz_step * n) / 2;
    const theta = (-2 * Math.PI * hz * n) / len_orig;
    const w = [Math.cos(theta), Math.sin(theta)];
    const xn = [x[2 * n + 0], x[2 * n + 1]];
    a[2 * n + 0] = xn[0] * w[0] - xn[1] * w[1];
    a[2 * n + 1] = xn[0] * w[1] + xn[1] * w[0];
  }
  const b = new Float32Array(2 * len_ceil);
  for (let n = 0; n < len; n++) {
    const hz = (hz_step * n) / 2;
    const theta = (-2 * Math.PI * hz * n) / len_orig;
    const w = [Math.cos(theta), Math.sin(theta)];
    b[2 * n + 0] = w[0];
    b[2 * n + 1] = -w[1];
  }
  for (let n = 1; n < len_orig; n++) {
    const hz = (hz_step * n) / 2;
    const theta = (-2 * Math.PI * hz * n) / len_orig;
    const w = [Math.cos(theta), Math.sin(theta)];
    b[2 * (len_ceil - n) + 0] = w[0];
    b[2 * (len_ceil - n) + 1] = -w[1];
  }
  const a_fft = fft(a, false);
  const b_fft = fft(b, false);
  const y_fft = new Float32Array(2 * len_ceil);
  for (let n = 0; n < len_ceil; n++) {
    const an = [a_fft[2 * n + 0], a_fft[2 * n + 1]];
    const bn = [b_fft[2 * n + 0], b_fft[2 * n + 1]];
    y_fft[2 * n + 0] = an[0] * bn[0] - an[1] * bn[1];
    y_fft[2 * n + 1] = an[0] * bn[1] + an[1] * bn[0];
  }
  const y = fft(y_fft, true).slice(0, 2 * len);
  for (let k = 0; k < len; k++) {
    const yn = [y[2 * k + 0], y[2 * k + 1]];
    const bn = [b[2 * k + 0], -b[2 * k + 1]];
    y[2 * k + 0] = yn[0] * bn[0] - yn[1] * bn[1];
    y[2 * k + 1] = yn[0] * bn[1] + yn[1] * bn[0];
  }
  return y;
};

/**
 * ハニング窓を適用する
 *
 * @param x - 入力信号 (実部と虚部が交互に格納された Float32Array)
 * @param inverse - 逆変換を行う場合は true
 * @returns 窓関数を適用した信号 (実部と虚部が交互に格納された Float32Array)
 */
export const window = (x: Float32Array, inverse: boolean) => {
  console.assert(x.length % 2 == 0);
  const len = x.length / 2;
  const y = x.slice();
  for (let n = 0; n < len; n++) {
    const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / len);
    if (inverse) {
      y[2 * n + 0] /= window;
      y[2 * n + 1] /= window;
    } else {
      y[2 * n + 0] *= window;
      y[2 * n + 1] *= window;
    }
  }
  return y;
};
