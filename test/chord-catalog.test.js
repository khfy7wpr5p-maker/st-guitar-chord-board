import test from "node:test";
import assert from "node:assert/strict";
import { CHORD_SYMBOLS, sameRootFamily, suggestChordSymbols } from "../src/chord-catalog.js";

test("catalog exposes exactly 96 canonical chord symbols", () => {
  assert.equal(CHORD_SYMBOLS.length,96);
  assert.equal(new Set(CHORD_SYMBOLS).size,96);
});

test("exact symbol search returns selected chord then complete same-root family", () => {
  assert.deepEqual(suggestChordSymbols("Am"),["Am","A","A7","Amaj7","Am7","Asus2","Asus4","A5"]);
  assert.deepEqual(suggestChordSymbols("E"),["E","Em","E7","Emaj7","Em7","Esus2","Esus4","E5"]);
  assert.deepEqual(suggestChordSymbols("A5"),["A5","A","Am","A7","Amaj7","Am7","Asus2","Asus4"]);
});

test("flat spelling remains stable across same-root suggestions", () => {
  assert.deepEqual(suggestChordSymbols("Bb5"),["Bb5","Bb","Bbm","Bb7","Bbmaj7","Bbm7","Bbsus2","Bbsus4"]);
  assert.deepEqual(sameRootFamily("Eb7"),["Eb7","Eb","Ebm","Ebmaj7","Ebm7","Ebsus2","Ebsus4","Eb5"]);
  assert.deepEqual(suggestChordSymbols("Bbma"),["Bbmaj7"]);
});

test("partial symbol search narrows canonical symbols", () => {
  assert.deepEqual(suggestChordSymbols("F#ma"),["F#maj7"]);
  assert.deepEqual(sameRootFamily("G7")[0],"G7");
});
