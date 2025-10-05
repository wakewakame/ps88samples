import * as ui from "../lib/ui.ts";

const keyboard = new Map();
const record = new Float32Array(48000 * 5);
let rec = false;
let start = 0;
let end = record.length;
let pitch = 0.0;

ps88.audio((ctx) => {
  for (const event of ctx.midi) {
    if (event.type === "NoteOn") {
      keyboard.set(event.note, { time: start, ...event });
    }
    if (event.type === "NoteOff") {
      keyboard.delete(event.note);
    }
  }

  const length = ctx.audio[0]?.length ?? 0;
  if (rec) {
    record.copyWithin(0, length);
  }
  const recordOffset = Math.max(record.length - length, 0);
  for (let i = 0; i < length; i++) {
    let wave = 0;
    for (const key of keyboard.values()) {
      if (i < key.timing || rec) {
        continue;
      }
      wave +=
        1.0 * record[Math.min(Math.floor(key.time), record.length - 1, end)];
      key.time += 1 * Math.pow(2, (key.note - 69 + pitch) / 12);
    }
    if (rec) {
      record[recordOffset + i] = 0;
    }
    for (const ch of ctx.audio) {
      if (rec) {
        record[recordOffset + i] += ch[i] / ctx.audio.length;
      }
      ch[i] = wave;
    }
  }
});

const t1 = ui.drag2(
  [
    [0, 0],
    [-9, 9],
    [-9, 24],
    [9, 24],
    [9, 9],
  ],
  50,
  240,
  590,
  240,
  50,
  240,
);
const t2 = ui.drag2(
  [
    [0, 0],
    [-9, 9],
    [-9, 24],
    [9, 24],
    [9, 9],
  ],
  50,
  240,
  590,
  240,
  590,
  240,
);
const b = ui.button(320, 360);
const p1 = ui.drag(100, 440, 540, 440);
ps88.gui((ctx) => {
  ui.rect(ctx, 0, 0, ctx.w, ctx.h, 0x000000ff);
  ui.graph(ctx, record, 3, 50, 0, 540, 240, 0xffffffff, 1);
  ui.rect(ctx, 0, 0, t1.get()[0], 480, 0x000000bb);
  ui.rect(ctx, t2.get()[0], 0, 640 - t2.get()[0], 480, 0x000000bb);
  t1.draw(ctx);
  t2.draw(ctx);
  start = Math.floor(((t1.get()[0] - 50) * record.length) / 540);
  end = Math.floor(((t2.get()[0] - 50) * record.length) / 540);
  b.draw(ctx);
  rec = b.get().rec;
  p1.draw(ctx);
  pitch = ((p1.get()[0] - 100 - 220) * 12) / 440;
  ui.rect(ctx, 100, 439, 440, 2, 0xffffffff);
  ctx.addText("pitch", 40, 445, { size: 16, color: 0xffffffff });
});
