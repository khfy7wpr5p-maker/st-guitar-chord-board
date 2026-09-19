import test from "node:test";
import assert from "node:assert/strict";
import { CHROMATIC_NOTES, detectPitchYin, frequencyToTuning } from "../src/tuner-core.js";

test("chromatic note ring exposes twelve notes", () => {
  assert.deepEqual(CHROMATIC_NOTES,["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"]);
});

test("frequencyToTuning maps A4 and C4 with stable cents", () => {
  const a4=frequencyToTuning(440);
  assert.equal(a4.note,"A");
  assert.equal(a4.octave,4);
  assert.ok(Math.abs(a4.cents) < 1e-9);

  const c4=frequencyToTuning(261.625565);
  assert.equal(c4.note,"C");
  assert.equal(c4.octave,4);
  assert.ok(Math.abs(c4.cents) < 0.01);
});

test("frequencyToTuning reports cents around the nearest semitone", () => {
  const sharpA=frequencyToTuning(445);
  assert.equal(sharpA.note,"A");
  assert.ok(sharpA.cents > 19 && sharpA.cents < 20);
  assert.equal(frequencyToTuning(0),null);
});

test("YIN detector recovers guitar and reference tones from synthetic input", () => {
  const sampleRate=48000;
  for (const expected of [73.416,82.4069,110,261.6256,440,880]) {
    const samples=new Float32Array(2048);
    for (let i=0;i<samples.length;i+=1) samples[i]=0.4*Math.sin(2*Math.PI*expected*i/sampleRate);
    const detected=detectPitchYin(samples,sampleRate);
    assert.ok(detected,`expected ${expected}Hz to be detected`);
    assert.ok(Math.abs(detected-expected) < 0.2,`${detected} was not close to ${expected}`);
  }
});

test("YIN detector ignores silence", () => {
  assert.equal(detectPitchYin(new Float32Array(2048),48000),null);
});
