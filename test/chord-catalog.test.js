import test from "node:test";
import assert from "node:assert/strict";
import { CHORD_SYMBOLS, sameRootFamily, suggestChordSymbols } from "../src/chord-catalog.js";

test("catalog exposes exactly 84 canonical chord symbols", () => {
  assert.equal(CHORD_SYMBOLS.length,84);
  assert.equal(new Set(CHORD_SYMBOLS).size,84);
});

test("exact symbol search returns selected chord then same-root family", () => {
  assert.deepEqual(suggestChordSymbols("Am"),["Am","A","A7","Amaj7","Am7","Asus2","Asus4"]);
  assert.deepEqual(suggestChordSymbols("E"),["E","Em","E7","Emaj7","Em7","Esus2","Esus4"]);
});

test("partial symbol search narrows canonical symbols", () => {
  assert.deepEqual(suggestChordSymbols("F#ma"),["F#maj7"]);
  assert.deepEqual(sameRootFamily("G7")[0],"G7");
});
