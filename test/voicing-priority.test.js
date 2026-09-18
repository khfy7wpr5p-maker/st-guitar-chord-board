import test from "node:test";
import assert from "node:assert/strict";
import { getVoicings } from "../src/voicing-library.js";

test("common guitar chords prioritize a curated open/open-region first voicing", () => {
  for (const symbol of ["A","Am","A7","E","Em","E7","D","Dm","D7","G","G7","B7","F","Fmaj7"]) {
    const first=getVoicings(symbol)[0];
    assert.equal(first.curated,true,symbol);
    assert.ok(first.shape==="open" || first.shape==="open-region",symbol);
  }
});
