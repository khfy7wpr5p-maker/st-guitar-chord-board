import test from "node:test";
import assert from "node:assert/strict";
import { formatChordSymbol, parseChordQuery, pitchClassesForChord } from "../src/chord-core.js";
import { getVoicings, voicingMidi } from "../src/voicing-library.js";

const ROOTS=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const QUALITIES=["major","m","7","maj7","m7","sus2","sus4"];

test("parses symbolic and Turkish chord queries", () => {
  assert.deepEqual(parseChordQuery("Cmaj7"), {root:"C",quality:"maj7",symbol:"Cmaj7"});
  assert.deepEqual(parseChordQuery("Do majör"), {root:"C",quality:"major",symbol:"C"});
  assert.deepEqual(parseChordQuery("Cm7"), {root:"C",quality:"m7",symbol:"Cm7"});
  assert.deepEqual(parseChordQuery("Csus4"), {root:"C",quality:"sus4",symbol:"Csus4"});
  assert.deepEqual(parseChordQuery("Sibmaj7"), {root:"A#",quality:"maj7",symbol:"A#maj7"});
});

test("C family interval semantics are exact", () => {
  assert.deepEqual(pitchClassesForChord(parseChordQuery("C7")), [0,4,7,10]);
  assert.deepEqual(pitchClassesForChord(parseChordQuery("Csus2")), [0,2,7]);
});

test("all 84 initial chords expose at least three exact guitar voicings", () => {
  let chordCount=0;
  for (const root of ROOTS) {
    for (const quality of QUALITIES) {
      const symbol=formatChordSymbol(root,quality);
      const chord=parseChordQuery(symbol);
      const expected=[...pitchClassesForChord(chord)].sort((a,b)=>a-b);
      const voicings=getVoicings(symbol);
      chordCount+=1;
      assert.ok(voicings.length>=3,symbol);
      for (const voicing of voicings) {
        assert.equal(voicing.frets.length,6);
        assert.equal(voicing.fingers.length,6);
        assert.ok(voicing.frets.every(f=>Number.isInteger(f)&&f>=-1&&f<=20),symbol);
        const midis=voicingMidi(voicing);
        assert.ok(midis.length>=3);
        const actual=[...new Set(midis.map(m=>m%12))].sort((a,b)=>a-b);
        assert.deepEqual(actual,expected,`${symbol} ${voicing.frets.join(",")}`);
      }
    }
  }
  assert.equal(chordCount,84);
});
