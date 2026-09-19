import test from "node:test";
import assert from "node:assert/strict";
import { CHORD_ROOTS, CHORD_QUALITIES } from "../src/chord-catalog.js";
import {
  formatChordSymbol,
  parseChordQuery,
  pitchClassesForChord
} from "../src/chord-core.js";
import { getVoicings, voicingMidi } from "../src/voicing-library.js";

function displayedVoicings() {
  return CHORD_ROOTS.flatMap(root =>
    CHORD_QUALITIES.flatMap(quality => {
      const symbol=formatChordSymbol(root,quality);
      return getVoicings(symbol).map((voicing,index)=>({symbol,index,voicing}));
    })
  );
}

test("open A major uses 2-3-4 fingering", () => {
  const voicing=getVoicings("A")[0];
  assert.deepEqual(voicing.frets,[-1,0,2,2,2,0]);
  assert.deepEqual(voicing.fingers,[-1,0,2,3,4,0]);
  assert.deepEqual(voicing.barres,[]);
});

test("open G uses 3-2-4 fingering", () => {
  const voicing=getVoicings("G")[0];
  assert.deepEqual(voicing.frets,[3,2,0,0,0,3]);
  assert.deepEqual(voicing.fingers,[3,2,0,0,0,4]);
  assert.deepEqual(voicing.barres,[]);
});

test("D major second position uses only index barre", () => {
  const voicing=getVoicings("D")[1];
  assert.deepEqual(voicing.frets,[-1,5,7,7,7,5]);
  assert.deepEqual(voicing.fingers,[-1,1,2,3,4,1]);
  assert.deepEqual(voicing.barres,[
    {finger:1,fret:5,fromString:5,toString:1}
  ]);
});

test("E major third position uses only index barre", () => {
  const voicing=getVoicings("E")[2];
  assert.deepEqual(voicing.frets,[-1,7,9,9,9,7]);
  assert.deepEqual(voicing.fingers,[-1,1,2,3,4,1]);
  assert.deepEqual(voicing.barres,[
    {finger:1,fret:7,fromString:5,toString:1}
  ]);
});

test("all displayed barres use finger 1", () => {
  const displayed=displayedVoicings();
  assert.equal(displayed.length,276);
  for (const {symbol,index,voicing} of displayed) {
    for (const barre of voicing.barres || []) {
      assert.equal(barre.finger,1,`${symbol} position ${index+1}`);
    }
  }
});

test("no displayed voicing encodes an implicit non-index barre", () => {
  for (const {symbol,index,voicing} of displayedVoicings()) {
    for (const finger of [2,3,4]) {
      const uses=voicing.fingers.filter((value,stringIndex) =>
        value===finger && voicing.frets[stringIndex]>0
      ).length;
      assert.ok(uses<=1,`${symbol} position ${index+1} repeats finger ${finger}`);
    }
  }
});

test("catalog cardinality remains exactly 276", () => {
  let total=0;
  for (const root of CHORD_ROOTS) {
    for (const quality of CHORD_QUALITIES) {
      const expected=quality==="5" ? 2 : 3;
      const voicings=getVoicings(formatChordSymbol(root,quality));
      assert.equal(voicings.length,expected,`${root} ${quality}`);
      total+=voicings.length;
    }
  }
  assert.equal(total,276);
});

test("every displayed voicing preserves exact chord pitch identity", () => {
  let checked=0;
  for (const root of CHORD_ROOTS) {
    for (const quality of CHORD_QUALITIES) {
      const symbol=formatChordSymbol(root,quality);
      const chord=parseChordQuery(symbol);
      const expected=[...pitchClassesForChord(chord)].sort((a,b)=>a-b);
      for (const voicing of getVoicings(symbol)) {
        const actual=[...new Set(voicingMidi(voicing).map(midi=>midi%12))].sort((a,b)=>a-b);
        assert.deepEqual(actual,expected,`${symbol}: ${voicing.frets.join(",")}`);
        checked+=1;
      }
    }
  }
  assert.equal(checked,276);
});
