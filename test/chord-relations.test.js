import test from "node:test";
import assert from "node:assert/strict";
import { CHORD_ROOTS } from "../src/chord-catalog.js";
import { formatChordSymbol } from "../src/chord-core.js";
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

test("relative major-minor mapping is reciprocal across all 12 roots", () => {
  for (const root of CHORD_ROOTS) {
    const major=formatChordSymbol(root,"major");
    const relativeMinor=getRelativeRelation(major);
    assert.ok(relativeMinor,major);
    const backToMajor=getRelativeRelation(relativeMinor.symbol);
    assert.equal(backToMajor?.symbol,major,major);

    const minor=formatChordSymbol(root,"m");
    const relativeMajor=getRelativeRelation(minor);
    assert.ok(relativeMajor,minor);
    const backToMinor=getRelativeRelation(relativeMajor.symbol);
    assert.equal(backToMinor?.symbol,minor,minor);
  }
});

test("seventh, suspended and power chords do not invent context-free relations", () => {
  for (const symbol of ["C7","Cmaj7","Cm7","Csus2","Csus4","C5"]) {
    assert.equal(getRelativeRelation(symbol),null,symbol);
  }
});
