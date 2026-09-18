import test from "node:test";
import assert from "node:assert/strict";
import { parseChordQuery, pitchClassesForChord } from "../src/chord-core.js";
import { COMMON_OPEN_VOICINGS } from "../src/curated-open-voicings.js";
import { voicingMidi } from "../src/voicing-library.js";

test("every curated common-position voicing has exact chord pitch classes", () => {
  assert.ok(Object.keys(COMMON_OPEN_VOICINGS).length >= 30);
  for (const [symbol, voicing] of Object.entries(COMMON_OPEN_VOICINGS)) {
    const chord=parseChordQuery(symbol);
    assert.ok(chord,symbol);
    const expected=[...pitchClassesForChord(chord)].sort((a,b)=>a-b);
    const actual=[...new Set(voicingMidi(voicing).map(midi=>midi%12))].sort((a,b)=>a-b);
    assert.deepEqual(actual,expected,`${symbol}: ${voicing.frets.join(",")}`);
    assert.ok(voicing.frets.some(fret=>fret===0) || voicing.shape==="open-region",symbol);
  }
});
