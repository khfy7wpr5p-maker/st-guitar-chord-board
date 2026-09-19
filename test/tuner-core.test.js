import test from "node:test";
import assert from "node:assert/strict";
import {
  CHROMATIC_NOTES,
  TUNER_SIGNAL_DEFAULTS,
  adaptiveRmsFloor,
  detectPitchYin,
  frequencyToTuning,
  shouldHoldReading,
  signalRms,
  updateNoiseFloor
} from "../src/tuner-core.js";

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


test("sensitive tuner floor detects a weak sustained guitar-like tone", () => {
  const sampleRate=48000;
  const expected=329.6276;
  const samples=new Float32Array(2048);
  for (let i=0;i<samples.length;i+=1) samples[i]=0.004*Math.sin(2*Math.PI*expected*i/sampleRate);
  const rms=signalRms(samples);
  assert.ok(rms > 0.002 && rms < 0.004);
  const floor=adaptiveRmsFloor(TUNER_SIGNAL_DEFAULTS.initialNoiseFloor);
  assert.ok(floor < 0.002);
  const detected=detectPitchYin(samples,sampleRate,{rmsFloor:floor,threshold:0.2});
  assert.ok(detected);
  assert.ok(Math.abs(detected-expected) < 0.3);
});

test("adaptive noise floor rises slowly and never learns a detected note as noise", () => {
  let floor=TUNER_SIGNAL_DEFAULTS.initialNoiseFloor;
  for (let i=0;i<40;i+=1) floor=updateNoiseFloor(floor,0.004);
  assert.ok(floor > TUNER_SIGNAL_DEFAULTS.initialNoiseFloor);
  assert.ok(floor < 0.004);
  const duringNote=updateNoiseFloor(floor,0.02,{signalDetected:true});
  assert.equal(duringNote,floor);
});

test("sustain hold keeps the last note visible across brief pitch dropouts", () => {
  assert.equal(shouldHoldReading(1000,1799),true);
  assert.equal(shouldHoldReading(1000,1800),true);
  assert.equal(shouldHoldReading(1000,1801),false);
  assert.equal(shouldHoldReading(Number.NEGATIVE_INFINITY,1200),false);
});
