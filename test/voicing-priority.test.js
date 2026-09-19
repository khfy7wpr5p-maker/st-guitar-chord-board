import test from "node:test";
import assert from "node:assert/strict";
import { CHORD_ROOTS, CHORD_QUALITIES } from "../src/chord-catalog.js";
import { formatChordSymbol, parseChordQuery } from "../src/chord-core.js";
import { getCommonOpenVoicing } from "../src/curated-open-voicings.js";
import { generateMovableVoicings } from "../src/movable-voicings.js";
import { getVoicings } from "../src/voicing-library.js";

const TARGETS = Object.freeze({
  A: [
    [-1,0,2,2,2,0],
    [5,7,7,6,5,5],
    [-1,-1,7,9,10,9]
  ],
  A7: [
    [-1,0,2,0,2,0],
    [5,7,5,6,5,5],
    [-1,-1,7,9,8,9]
  ],
  Am: [
    [-1,0,2,2,1,0],
    [5,7,7,5,5,5],
    [-1,-1,7,9,10,8]
  ],
  B: [
    [-1,2,4,4,4,2],
    [7,9,9,8,7,7],
    [-1,-1,9,11,12,11]
  ],
  "G#m": [
    [4,6,6,4,4,4],
    [-1,-1,6,8,9,7],
    [-1,11,13,13,12,11]
  ]
});

function voicingKey(voicing) {
  return voicing.frets.join(",");
}

function baseFret(voicing) {
  const positive=voicing.frets.filter(fret=>fret>0);
  if (voicing.frets.some(fret=>fret===0) || !positive.length || Math.min(...positive)<=1) return 1;
  return Math.min(...positive);
}

test("common guitar chords prioritize a curated open/open-region first voicing", () => {
  for (const symbol of ["A","Am","A7","E","Em","E7","D","Dm","D7","G","G7","B7","F","Fmaj7"]) {
    const first=getVoicings(symbol)[0];
    assert.equal(first.curated,true,symbol);
    assert.ok(first.shape==="open" || first.shape==="open-region",symbol);
  }
});

test("Stage 21 target chords use the reviewed pedagogical ordering", () => {
  for (const [symbol, expected] of Object.entries(TARGETS)) {
    assert.deepEqual(getVoicings(symbol).map(voicing=>voicing.frets),expected,symbol);
  }
});

test("every non-power chord exposes exactly three unique positions", () => {
  for (const root of CHORD_ROOTS) {
    for (const quality of CHORD_QUALITIES.filter(quality=>quality!=="5")) {
      const symbol=formatChordSymbol(root,quality);
      const voicings=getVoicings(symbol);
      assert.equal(voicings.length,3,symbol);
      assert.equal(new Set(voicings.map(voicingKey)).size,3,symbol);
    }
  }
});

test("high-octave duplicates stay out of the top three when three lower candidates exist", () => {
  for (const root of CHORD_ROOTS.filter(root=>root!=="C")) {
    for (const quality of CHORD_QUALITIES.filter(quality=>quality!=="5")) {
      const symbol=formatChordSymbol(root,quality);
      const chord=parseChordQuery(symbol);
      const open=getCommonOpenVoicing(symbol);
      const candidates=[...(open?[open]:[]),...generateMovableVoicings(chord)];
      const unique=[...new Map(candidates.map(voicing=>[voicingKey(voicing),voicing])).values()];
      const lower=unique.filter(voicing=>baseFret(voicing)<12);
      if (lower.length>=3) {
        assert.ok(getVoicings(symbol).every(voicing=>baseFret(voicing)<12),symbol);
      }
    }
  }
});
