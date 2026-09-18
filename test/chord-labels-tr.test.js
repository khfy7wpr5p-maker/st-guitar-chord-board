import test from "node:test";
import assert from "node:assert/strict";
import { chordNameTr } from "../src/chord-labels-tr.js";
import { parseChordQuery } from "../src/chord-core.js";

test("renders required Turkish chord readings", () => {
  assert.equal(chordNameTr(parseChordQuery("Am")), "La minör");
  assert.equal(chordNameTr(parseChordQuery("E")), "Mi majör");
  assert.equal(chordNameTr(parseChordQuery("G7")), "Sol yedili");
  assert.equal(chordNameTr(parseChordQuery("F#maj7")), "Fa diyez majör yedili");
  assert.equal(chordNameTr(parseChordQuery("Bm7")), "Si minör yedili");
  assert.equal(chordNameTr(parseChordQuery("Dsus4")), "Re sus dört");
  assert.equal(chordNameTr(parseChordQuery("A5")), "La beş");
  assert.equal(chordNameTr(parseChordQuery("B5")), "Si beş");
  assert.equal(chordNameTr(parseChordQuery("C5")), "Do beş");
});
