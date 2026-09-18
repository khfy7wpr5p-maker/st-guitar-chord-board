import test from "node:test";
import assert from "node:assert/strict";
import { getRelativeRelation, RELATION_TYPES } from "../src/chord-relations.js";

test("major chords expose relative minor", () => {
  assert.deepEqual(getRelativeRelation("C"), {
    type: RELATION_TYPES.RELATIVE_MINOR,
    labelTr: "Göreli minör",
    symbol: "Am"
  });
  assert.equal(getRelativeRelation("E").symbol,"C#m");
});

test("minor chords expose relative major", () => {
  assert.deepEqual(getRelativeRelation("Am"), {
    type: RELATION_TYPES.RELATIVE_MAJOR,
    labelTr: "Göreli majör",
    symbol: "C"
  });
  assert.equal(getRelativeRelation("C#m").symbol,"E");
});

test("seventh and suspended chords do not invent context-free relations", () => {
  for (const symbol of ["C7","Cmaj7","Cm7","Csus2","Csus4"]) {
    assert.equal(getRelativeRelation(symbol),null,symbol);
  }
});
