import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CHORD_ROOTS, CHORD_QUALITIES } from "../src/chord-catalog.js";
import { formatChordSymbol } from "../src/chord-core.js";
import { getVoicings, voicingMidi } from "../src/voicing-library.js";
import {
  tonalPitchClassesForChord,
  validateChordAgainstTonal
} from "../src/tonal-theory-validator.js";

function voicingPitchClasses(voicing) {
  return [...new Set(voicingMidi(voicing).map(midi=>midi%12))].sort((a,b)=>a-b);
}

test("Tonal independently agrees with all 180 canonical chord pitch-class identities", () => {
  let checked=0;
  for (const root of CHORD_ROOTS) {
    for (const quality of CHORD_QUALITIES) {
      const symbol=formatChordSymbol(root,quality);
      const result=validateChordAgainstTonal(symbol);
      assert.equal(result.valid,true,`${symbol}: local=${result.localPitchClasses} tonal=${result.tonalPitchClasses}`);
      checked+=1;
    }
  }
  assert.equal(checked,180);
});

test("every displayed guitar voicing agrees with the Tonal chord identity", () => {
  let checked=0;
  for (const root of CHORD_ROOTS) {
    for (const quality of CHORD_QUALITIES) {
      const symbol=formatChordSymbol(root,quality);
      const expected=tonalPitchClassesForChord(symbol);
      for (const voicing of getVoicings(symbol)) {
        assert.deepEqual(voicingPitchClasses(voicing),expected,`${symbol}: ${voicing.frets.join(",")}`);
        checked+=1;
      }
    }
  }
  assert.equal(checked,528);
});

test("enharmonic display aliases validate through canonical identity", () => {
  const bb=validateChordAgainstTonal("Bbmaj7");
  assert.equal(bb.valid,true);
  assert.equal(bb.canonicalSymbol,"A#maj7");

  const gb5=validateChordAgainstTonal("Gb5");
  assert.equal(gb5.valid,true);
  assert.equal(gb5.canonicalSymbol,"F#5");
});

test("Tonal remains development-only and outside the browser runtime", () => {
  const app=fs.readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  const worker=fs.readFileSync(new URL("../service-worker.js",import.meta.url),"utf8");
  assert.doesNotMatch(app,/from\s+["']tonal["']/);
  assert.doesNotMatch(app,/tonal-theory-validator/);
  assert.doesNotMatch(worker,/tonal-theory-validator/);
});
