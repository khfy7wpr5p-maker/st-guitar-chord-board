import test from "node:test";
import assert from "node:assert/strict";
import {
  CHROMATIC_NOTES,
  TUNER_SIGNAL_DEFAULTS,
  adaptiveRmsFloor,
  choosePrecisionPitch,
  detectPitchHighPrecision,
  detectPitchYin,
  detectPitchYinDetailed,
  frequencyToTuning,
  normalizedAutocorrelation,
  shouldHoldReading,
  signalRms,
  smoothTuningReading,
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
  assert.equal(shouldHoldReading(1000,1899),true);
  assert.equal(shouldHoldReading(1000,1900),true);
  assert.equal(shouldHoldReading(1000,1901),false);
  assert.equal(shouldHoldReading(Number.NEGATIVE_INFINITY,1200),false);
});


test("display smoothing damps small cent jitter while staying responsive", () => {
  const previous=frequencyToTuning(440);
  const next=frequencyToTuning(441);
  const smoothed=smoothTuningReading(previous,next);
  assert.equal(smoothed.note,"A");
  assert.ok(Math.abs(smoothed.cents) < Math.abs(next.cents));
  assert.ok(smoothed.cents > 0);
  assert.ok(smoothed.frequency > previous.frequency);
  assert.ok(smoothed.frequency < next.frequency);
});

test("display smoothing responds faster to a larger tuning correction", () => {
  const previous=frequencyToTuning(440);
  const small=frequencyToTuning(441);
  const large=frequencyToTuning(445);
  const smallMove=smoothTuningReading(previous,small);
  const largeMove=smoothTuningReading(previous,large);
  const smallRatio=smallMove.cents/small.cents;
  const largeRatio=largeMove.cents/large.cents;
  assert.ok(largeRatio > smallRatio);
});

test("display smoothing snaps immediately when the detected note changes", () => {
  const previous=frequencyToTuning(440);
  const next=frequencyToTuning(466.1637615);
  const smoothed=smoothTuningReading(previous,next);
  assert.equal(smoothed.note,"A♯");
  assert.equal(smoothed.midi,next.midi);
  assert.equal(smoothed.frequency,next.frequency);
  assert.equal(smoothed.cents,next.cents);
});

test("detailed YIN exposes confidence for a clean guitar tone", () => {
  const sampleRate=48000;
  const expected=110;
  const samples=new Float32Array(4096);
  for (let i=0;i<samples.length;i+=1) samples[i]=0.25*Math.sin(2*Math.PI*expected*i/sampleRate);
  const result=detectPitchYinDetailed(samples,sampleRate,{rmsFloor:0.001,threshold:0.18});
  assert.ok(result);
  assert.ok(Math.abs(result.frequency-expected)<0.15);
  assert.ok(result.confidence>0.9);
  assert.ok(normalizedAutocorrelation(samples,result.period)>0.95);
});

test("high precision detector tracks a weak harmonic-rich low E2", () => {
  const sampleRate=48000;
  const expected=82.4069;
  const samples=new Float32Array(8192);
  for (let i=0;i<samples.length;i+=1) {
    const phase=2*Math.PI*expected*i/sampleRate;
    samples[i]=0.0035*(0.72*Math.sin(phase)+0.38*Math.sin(2*phase)+0.18*Math.sin(3*phase))+0.00018*Math.sin(i*1.731);
  }
  const result=detectPitchHighPrecision(samples,sampleRate,{rmsFloor:0.0012,threshold:0.18});
  assert.ok(result,"weak E2 should be detected");
  assert.ok(Math.abs(result.frequency-expected)<0.25,String(result.frequency)+" was not close to E2");
  assert.ok(result.confidence>=0.68);
});

test("high precision detector rejects silence and unpitched low-level noise", () => {
  assert.equal(detectPitchHighPrecision(new Float32Array(8192),48000,{rmsFloor:0.001}),null);
  const noise=new Float32Array(8192);
  let state=0x12345678;
  for (let i=0;i<noise.length;i+=1) {
    state=(1664525*state+1013904223)>>>0;
    noise[i]=((state/0xffffffff)*2-1)*0.003;
  }
  const result=detectPitchHighPrecision(noise,48000,{rmsFloor:0.001});
  assert.equal(result,null);
});

test("precision candidate consensus blends agreeing windows and guards octave disagreement", () => {
  const short={frequency:82.5,confidence:0.82,periodicity:0.8};
  const long={frequency:82.4,confidence:0.91,periodicity:0.9};
  const agreed=choosePrecisionPitch(short,long);
  assert.ok(agreed);
  assert.ok(agreed.frequency>82.39 && agreed.frequency<82.51);
  assert.equal(agreed.consensus,true);

  const octave=choosePrecisionPitch(
    {frequency:164.8,confidence:0.82,periodicity:0.8},
    {frequency:82.4,confidence:0.86,periodicity:0.86}
  );
  assert.ok(octave);
  assert.ok(Math.abs(octave.frequency-82.4)<0.01);
  assert.equal(octave.octaveGuard,true);
});
