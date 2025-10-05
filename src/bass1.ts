let notes: {
  note: number;
  velo: number;
  time: number;
  envelope: number;
  releasedTime: number | null;
  unused: boolean;
}[] = [];
let buffer: number[] = [];
ps88.audio((ctx) => {
  try {
    // MIDI の記録
    if (ctx.midi.length > 0) {
      for (const msg of ctx.midi) {
        if (msg.type === "NoteOn") {
          console.log(msg.note);
          notes.push({
            note: msg.note,
            velo: msg.velocity,
            time: 0,
            envelope: 0.0,
            releasedTime: null,
            unused: false,
          });
        }
        if (msg.type === "NoteOff") {
          notes.forEach((n) => (n.releasedTime = n.time));
        }
      }
    }
    notes = notes.filter((n) => !n.unused);

    // 波形の生成
    for (let i = 0; i < (ctx.audio[0]?.length ?? 0); i++) {
      for (const n of notes) {
        const freq = 440 * Math.pow(2, (n.note - 69) / 12);
        let v = 0;
        // ノコギリ波をフーリエ展開したっぽいもの
        for (let k = 1; k <= 8; k++) {
          v +=
            (k % 2 === 0 ? -1 : 1) *
            ((0.5 * n.velo) / Math.pow(k, 1.5)) *
            Math.sin(n.time * freq * k * 2 * Math.PI);
        }
        // エンベロープ
        n.envelope +=
          n.releasedTime === null
            ? (1.0 - n.envelope) * 0.01
            : (0.0 - n.envelope) * 0.001;
        v *= n.envelope;
        // 十分に減衰したらノートを削除
        if (n.releasedTime !== null && n.envelope < 0.001) {
          n.unused = true;
        }
        for (const ch of ctx.audio) {
          ch[i] += v;
        }
        n.time += 1 / ctx.sampleRate;
      }
    }

    // 描画用にバッファリング
    if (ctx.audio.length > 0) {
      buffer = buffer.concat([...ctx.audio[0]]).slice(-4096);
    }
  } catch (e) {
    console.error(e);
  }
});

ps88.gui((ctx) => {
  try {
    // 波形の描画
    const wave: [number, number][] = [];
    for (let x = 0; x <= ctx.w; x++) {
      const i = ((buffer.length - 2) * x) / ctx.w;
      const i1 = Math.max(Math.floor(i), 0);
      const i2 = Math.min(i1 + 1, buffer.length - 1);
      const p = i - i1;
      const v = buffer[i1] * (1 - p) + buffer[i2] * p;
      const y = (v + 1) * 0.5 * ctx.h;
      wave.push([x, y]);
    }
    ctx.addPolygon(wave, { stroke: 0xffffffff, strokeWidth: 1 });
  } catch (e) {
    console.error(e);
  }
});
