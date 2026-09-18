import test from "node:test";
import assert from "node:assert/strict";
import { parseChordQuery, pitchClassesForChord } from "../src/chord-core.js";
import { getVoicings, voicingMidi } from "../src/voicing-library.js";

test("parses symbolic and Turkish chord queries", () => {
  assert.deepEqual(parseChordQuery("Cmaj7"), {root:"C",quality:"maj7",symbol:"Cmaj7"});
  assert.deepEqual(parseChordQuery("Do majör"), {root:"C",quality:"major",symbol:"C"});
  assert.deepEqual(parseChordQuery("Cm7"), {root:"C",quality:"m7",symbol:"Cm7"});
  assert.deepEqual(parseChordQuery("Csus4"), {root:"C",quality:"sus4",symbol:"Csus4"});
});

test("C family interval semantics are exact", () => {
  assert.deepEqual(pitchClassesForChord(parseChordQuery("C7")), [0,4,7,10]);
  assert.deepEqual(pitchClassesForChord(parseChordQuery("Csus2")), [0,2,7]);
});

test("stage-1 C family has three exact guitar voicings each", () => {
  for (const symbol of ["C","Cm","C7","Cmaj7","Cm7","Csus2","Csus4"]) {
    const chord = parseChordQuery(symbol);
    const expected = [...pitchClassesForChord(chord)].sort((a,b)=>a-b);
    const voicings = getVoicings(symbol);
    assert.ok(voicings.length >= 3, symbol);
    for (const voicing of voicings) {
      assert.equal(voicing.frets.length, 6);
      assert.equal(voicing.fingers.length, 6);
      const midis = voicingMidi(voicing);
      assert.ok(midis.length >= 3);
      const actual = [...new Set(midis.map(m=>m%12))].sort((a,b)=>a-b);
      assert.deepEqual(actual, expected, `${symbol} ${voicing.frets.join(",")}`);
    }
  }
});
