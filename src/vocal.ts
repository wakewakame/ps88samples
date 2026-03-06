let time = 0;
let buffer1: number[] = [];  // ピッチ描画用の配列
let buffer2: number[] = [];  // 音量描画用の配列

// TODO:
// - [x] ハードコードされた MIDI を正弦波で再生できるようにする
// - [ ] 適当な MIDI をハードコードする (愛の挨拶とか)
// - [ ] MIDI をボーカルやトランペットのような雰囲気に近づけるように音量・ピッチの抑揚を変化させる
// - [x] 音量・ピッチのグラフを描画する
// - [ ] 音色を正弦波意外にもプログラマブルに変えられるようにする

const pressedNote = (time: number): number => {
  const midi = [69 - 12, 69, 69 + 12];
  return midi[Math.floor(time) % midi.length];
};

const toVoicyNote = () => {
  // ここに副作用を書く
  // MEMO:
  // - 未来の note を見てから現在の抑揚を計算したいため、ここでは数秒の遅延を許容し、数秒分の note をバッファリングする
  // - note が変化する直前と直後でピッチを落としたり音量を落としたりする
  // - 特に note が変化した直後は目標となる音程に近づける際に揺らぎが発生するはずなので、それをうまく表現したい
  return (note: number): [number, number] => {
    const velocity = 1;
    return [note, velocity];
  };
};

const noteToPitch = (note: number): number => {
  const noteToFreq = (note: number) => 440 * Math.pow(2, (note - 69) / 12);
  return noteToFreq(note);
};

const pitchToWave = (freq: number) => {
  const wave = Math.sin(time * freq * 2 * Math.PI);
  return wave;
};

const voice = toVoicyNote();
ps88.audio((ctx) => {
  const length = ctx.audio[0]?.length ?? 0;
  const noteAndVelocities = [...Array(length)].map(() => {
    const noteAndVelocity = voice(pressedNote(time));
    time += 1 / ctx.sampleRate;
    return noteAndVelocity;
  });
  for (let i = 0; i < length; i++) {
    const wave = pitchToWave(noteToPitch(noteAndVelocities[i][0])) * noteAndVelocities[i][1];
    for (let ch of ctx.audio) {
      ch[i] = wave;
    }
  }

  // 描画用にバッファリング
  if (ctx.audio.length > 0) {
    buffer1 = buffer1.concat([...noteAndVelocities.map(n => n[0])]).slice(-128);
    buffer2 = buffer2.concat([...noteAndVelocities.map(n => n[1])]).slice(-128);
  }
});

ps88.gui((ctx) => {
  try {
    // 波形の描画
    const wave: [number, number][] = [];
    for (let x = 0; x <= ctx.w; x++) {
      const i = ((buffer1.length - 2) * x) / ctx.w;
      const i1 = Math.max(Math.floor(i), 0);
      const i2 = Math.min(i1 + 1, buffer1.length - 1);
      const p = i - i1;
      const v1 = buffer1[i1] * (1 - p) + buffer1[i2] * p;
      const minMax = [69-24, 69+24];
      const v2 = (v1 - minMax[0]) / (minMax[1] - minMax[0]);
      const y = (1 - v2) * ctx.h;
      wave.push([x, y - buffer2[i1] * 10]);
      wave.push([x, y + buffer2[i1] * 10]);
    }
    ctx.addPolygon(wave, { stroke: 0xffffffff, strokeWidth: 1 });
  } catch (e) {
    console.error(e);
  }
});
