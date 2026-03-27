import * as midiManager from 'midi-file';

const mid = 'TVRoZAAAAAYAAAABA8BNVHJrAAABmQCQTH+HQIBMAACQQ3+DYIBDAACQTH+DYIBMAACQSn+DYIBKAACQSH+DYIBIAACQR3+DYIBHAACQSH+DYIBIAACQTX+HQIBNAACQTX+HQIBNAACQTX+HQIBNAACQQ3+HQIBDAACQTH+HQIBMAACQRX+DYIBFAACQTH+DYIBMAACQSn+DYIBKAACQSH+DYIBIAACQR3+DYIBHAACQSH+DYIBIAACQSn+HQIBKAACQSn+HQIBKAACQSn+LIIBKAACQS3+DYIBLAACQTH+HQIBMAACQQ3+DYIBDAACQTH+DYIBMAACQSn+DYIBKAACQSH+DYIBIAACQR3+DYIBHAACQSH+DYIBIAACQUX+HQIBRAACQUX+HQIBRAACQUX+HQIBRAACQT3+DYIBPAACQTX+DYIBNAACQTH+HQIBMAACQSn+DYIBKAACQSH+DYIBIAACQRX+HQIBFAACQR3+HQIBHAACQSH+DYIBIAACQQ3+DYIBDAACQQX+DYIBBAACQQ3+DYIBDAACQQH+HQIBAAACQQ3+HQIBDAAD/LwA=';
const midiPlayer = (data: Uint8Array) => {
  const midiData = midiManager.parseMidi(data);
  console.log(midiData);
  let tempo = 120;
  let offsetTick = 0;
  let index = 0;
  return (durTick: number, sampleRate: number) => {
    const events = [];
    let tick = 0;
    index = index % midiData.tracks[0].length;
    while (index < midiData.tracks[0].length) {
      const event = midiData.tracks[0][index];
      const deltaTick = (sampleRate * event.deltaTime * 60) / (midiData.header.ticksPerBeat! * tempo);
      tick += deltaTick - offsetTick;
      if (tick > durTick) {
        offsetTick += durTick;
        break;
      }
      offsetTick = 0;
      index += 1;
      if (event.type === 'setTempo') {
        tempo = 60000000 / event.microsecondsPerBeat;
      }
      if (event.type === 'noteOn' || event.type === 'noteOff') {
        events.push({
          timing: tick,
          type: event.type === 'noteOn' ? 'NoteOn' : 'NoteOff',
          note: event.noteNumber,
          velocity: event.velocity / 127,
        });
      }
    }
    return events;
  };
};
const player = midiPlayer((Uint8Array as any).fromBase64(mid));

let r = 0;
let buffer1: number[] = [];  // ピッチ描画用の配列
let buffer2: number[] = [];  // 音量描画用の配列

const toVoicyNote = () => {
  let note = 69;
  let noteV = 0;
  let velocity = 0;
  let velocityV = 0;
  return (targetNote: number, targetVelocity: number): [number, number] => {
    const a = 0.000007;
    const b = 0.997;
    noteV += (targetNote - note) * a;
    note += noteV;
    noteV *= b;
    velocityV += (targetVelocity - velocity) * a;
    velocity += velocityV;
    velocityV *= b;
    return [note, velocity];
  };
};

const noteToPitch = (note: number): number => {
  const noteToFreq = (note: number) => 440 * Math.pow(2, (note - 69) / 12);
  return noteToFreq(note);
};

const pitchToWave = (r: number) => {
  const wave = Math.sin(r) * 0.01;
  return wave;
};

const voice = toVoicyNote();
let note = 0;
let velocity = 0;
ps88.audio((ctx) => {
  const length = ctx.audio[0]?.length ?? 0;

  const events = player(length, ctx.sampleRate);
  //const events = ctx.midi;

  const noteAndVelocities = [...Array(length)].map((_, i) => {
    for (let event of events) {
      if (event.type === 'NoteOn' && event.timing <= i) {
        note = event.note;
        velocity = event.velocity;
      }
      if (event.type === 'NoteOff' && event.note === note && event.timing <= i) {
        note = note - 12;
        velocity = 0;
      }
    }
    const noteAndVelocity = voice(note, velocity);
    return noteAndVelocity;
  });
  for (let i = 0; i < length; i++) {
    r += 2 * Math.PI * noteToPitch(noteAndVelocities[i][0]) / ctx.sampleRate;
    const wave = pitchToWave(r) * noteAndVelocities[i][1];
    for (let ch of ctx.audio) {
      ch[i] = wave;
    }
  }

  // 描画用にバッファリング
  if (ctx.audio.length > 0) {
    buffer1 = buffer1.concat([...noteAndVelocities.map(n => n[0])]).slice(-ctx.sampleRate * 5);
    buffer2 = buffer2.concat([...noteAndVelocities.map(n => n[1])]).slice(-ctx.sampleRate * 5);
  }
});

ps88.gui((ctx) => {
  try {
    // 波形の描画
    for (let x = 0; x <= ctx.w; x++) {
      const i = ((buffer1.length - 2) * x) / ctx.w;
      const i1 = Math.max(Math.floor(i), 0);
      const i2 = Math.min(i1 + 1, buffer1.length - 1);
      const p = i - i1;
      const v1 = buffer1[i1] * (1 - p) + buffer1[i2] * p;
      const minMax = [69-24, 69+24];
      const v2 = (v1 - minMax[0]) / (minMax[1] - minMax[0]);
      const v3 = (buffer2[i1] * (1 - p) + buffer2[i2] * p) * 5;
      const y = (1 - v2) * ctx.h;
      ctx.addPolygon(
        [
          [x + 0, y - buffer2[i1] * v3],
          [x + 0, y + buffer2[i1] * v3],
          [x + 1, y + buffer2[i1] * v3],
          [x + 1, y - buffer2[i1] * v3],
        ],
        { fill: 0xffffffff },
      );
    }
  } catch (e) {
    console.error(e);
  }
});
