import * as fft from "../lib/fft.ts";

const record = new Float32Array(4096);
const spectrum = new Float32Array(512);

ps88.audio((ctx) => {
  // TODO
  //
  // やりたいこと:
  // - 三次元のグラフを描画する
  // - X: 周波数
  // - Y: スペクトラム
  // - Z: 時間軸
  //
  // 必要な実装
  // - FFT のためのバッファを用意
  // - FFT の時間変化を記録するためのバッファを用意
  // - グラフをレンダリングする処理の実装
  //     - vec4, mat4, 各種演算関数の用意
  //     - クォータにオン行列生成関数の用意
  //     - MVP 変換の実装

  /*
  const x = new Float32Array(record.length * 2);
  for (let n = 0; n < record.length; n++) {
    x[2 * n + 0] = record[n];
    x[2 * n + 1] = 0;
  }
  const x_window = fft.window(x, false);
  const y = fft.fftRange(x_window, 10 * record.length / ctx.sampleRate, 2048 * record.length / ctx.sampleRate, spectrum.length);
  for (let k = 0; k < spectrum.length; k++) {
    const re = y[2 * k + 0];
    const im = y[2 * k + 1];
    spectrum[k] = Math.sqrt(re * re + im * im) * 0.02;
  }
  */
});

ps88.gui((ctx) => {
});
