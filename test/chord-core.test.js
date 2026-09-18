import test from "node:test";
import assert from "node:assert/strict";
import { formatChordSymbol, parseChordPresentation, parseChordQuery, pitchClassesForChord } from "../src/chord-core.js";
import { getVoicings, voicingMidi } from "../src/voicing-library.js";

const ROOTS=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const STANDARD_QUALITIES=["major","m","7","maj7","m7","sus2","sus4"];

function assertExactVoicing(symbol, voicing) {
  const chord=parseChordQuery(symbol);
  const expected=[...pitchClassesForChord(chord)].sort((a,b)=>a-b);
  assert.equal(voicing.frets.length,6);
  assert.equal(voicing.fingers.length,6);
  assert.ok(voicing.frets.every(f=>Number.isInteger(f)&&f>=-1&&f<=20),symbol);
  const midis=voicingMidi(voicing);
  assert.ok(midis.length>=3);
  const actual=[...new Set(midis.map(m=>m%12))].sort((a,b)=>a-b);
  assert.deepEqual(actual,expected,`${symbol} ${voicing.frets.join(",")}`);
}

test("parses symbolic and Turkish chord queries", () => {
  assert.deepEqual(parseChordQuery("Cmaj7"), {root:"C",quality:"maj7",symbol:"Cmaj7"});
  assert.deepEqual(parseChordQuery("Do majör"), {root:"C",quality:"major",symbol:"C"});\n  assert.deepEqual(parseChordQuery("Do minör"), {root:"C",quality:"m",symbol:"Cm"});
  assert.deepEqual(parseChordQuery("Cm7"), {root:"C",quality:"m7",symbol:"Cm7"});
  assert.deepEqual(parseChordQuery("Csus4"), {root:"C",quality:"sus4",symbol:"Csus4"});
  assert.deepEqual(parseChordQuery("Sibmaj7"), {root:"A#",quality:"maj7",symbol:"A#maj7"});
  assert.deepEqual(parseChordQuery("A5"), {root:"A",quality:"5",symbol:"A5"});
  assert.deepEqual(parseChordQuery("C#5"), {root:"C#",quality:"5",symbol:"C#5"});
});

test("flat presentation preserves spelling while canonical identity stays stable", () => {
  assert.deepEqual(parseChordPresentation("Bb5"), {
    root:"A#", quality:"5", symbol:"A#5", displayRoot:"Bb", displaySymbol:"Bb5"
  });
  assert.deepEqual(parseChordPresentation("Si bemol 5"), {
    root:"A#", quality:"5", symbol:"A#5", displayRoot:"Bb", displaySymbol:"Bb5"
  });
  assert.deepEqual(parseChordPresentation("Ebmaj7"), {
    root:"D#", quality:"maj7", symbol:"D#maj7", displayRoot:"Eb", displaySymbol:"Ebmaj7"
  });
  assert.deepEqual(parseChordQuery("Bb5"), {root:"A#",quality:"5",symbol:"A#5"});
});

test("enharmonic power symbols resolve to identical physical voicings", () => {
  assert.deepEqual(getVoicings("Bb5"),getVoicings("A#5"));
  assert.deepEqual(getVoicings("Gb5"),getVoicings("F#5"));
});

test("chord interval semantics are exact", () => {
  assert.deepEqual(pitchClassesForChord(parseChordQuery("C7")), [0,4,7,10]);
  assert.deepEqual(pitchClassesForChord(parseChordQuery("Csus2")), [0,2,7]);
  assert.deepEqual(pitchClassesForChord(parseChordQuery("C5")), [0,7]);
});

test("the original 84 chords retain at least three exact guitar voicings", () => {
  let chordCount=0;
  for (const root of ROOTS) {
    for (const quality of STANDARD_QUALITIES) {
      const symbol=formatChordSymbol(root,quality);
      const voicings=getVoicings(symbol);
      chordCount+=1;
      assert.ok(voicings.length>=3,symbol);
      for (const voicing of voicings) assertExactVoicing(symbol,voicing);
    }
  }
  assert.equal(chordCount,84);
});

test("all 12 power chords expose exactly two exact guitar positions", () => {
  for (const root of ROOTS) {
    const symbol=formatChordSymbol(root,"5");
    const voicings=getVoicings(symbol);
    assert.equal(voicings.length,2,symbol);
    assert.deepEqual(voicings.map(v=>v.shape),["POWER_ROOT_6","POWER_ROOT_5"]);
    for (const voicing of voicings) assertExactVoicing(symbol,voicing);
  }
});

test("requested power-chord examples use familiar two-position geometry", () => {
  assert.deepEqual(getVoicings("A5").map(v=>v.frets),[
    [5,7,7,-1,-1,-1],
    [-1,0,2,2,-1,-1]
  ]);
  assert.deepEqual(getVoicings("B5").map(v=>v.frets),[
    [7,9,9,-1,-1,-1],
    [-1,2,4,4,-1,-1]
  ]);
  assert.deepEqual(getVoicings("C5").map(v=>v.frets),[
    [8,10,10,-1,-1,-1],
    [-1,3,5,5,-1,-1]
  ]);
});
