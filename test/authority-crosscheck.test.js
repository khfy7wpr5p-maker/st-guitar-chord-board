import test from "node:test";
import assert from "node:assert/strict";
import { CHORD_ROOTS, CHORD_QUALITIES } from "../src/chord-catalog.js";
import { formatChordSymbol, QUALITY_INTERVALS } from "../src/chord-core.js";
import { getVoicings, voicingMidi } from "../src/voicing-library.js";
import {
  AUTHORITY_SOURCES,
  FINGERING_AUTHORITY,
  GUITAR_AUTHORITY,
  HARMONIC_AUTHORITY,
  PRODUCT_HARMONIC_EXTENSIONS,
  authorityPositionToMidi,
  validateFingeringResource
} from "../src/authority-baseline.js";

test("authority provenance is pinned to reviewed source revisions", () => {
  assert.equal(AUTHORITY_SOURCES.fretboard.commit,"1d8ced644f544f7e991f7275eda77a2ce557774e");
  assert.equal(AUTHORITY_SOURCES.harmony.commit,"f631ec8c30df616b9d83d9269e56278742878d32");
  assert.equal(AUTHORITY_SOURCES.fingering.commit,"06564c494c15acc7a1a2ec20219854d234281cf9");
});

test("local source-backed chord intervals match harmonic-engine authority", () => {
  for (const [quality, intervals] of Object.entries(HARMONIC_AUTHORITY)) {
    assert.deepEqual(QUALITY_INTERVALS[quality],intervals,quality);
  }
});

test("power chord interval is an explicit product extension, not attributed to harmonic engine", () => {
  assert.deepEqual(PRODUCT_HARMONIC_EXTENSIONS["5"],[0,7]);
  assert.deepEqual(QUALITY_INTERVALS["5"],PRODUCT_HARMONIC_EXTENSIONS["5"]);
  assert.equal(Object.prototype.hasOwnProperty.call(HARMONIC_AUTHORITY,"5"),false);
});

test("every displayed voicing round-trips against authoritative standard tuning", () => {
  assert.deepEqual(GUITAR_AUTHORITY.tuning.map(item=>item.midi),[40,45,50,55,59,64]);
  for (const root of CHORD_ROOTS) {
    for (const quality of CHORD_QUALITIES) {
      const symbol=formatChordSymbol(root,quality);
      for (const voicing of getVoicings(symbol)) {
        const expected=voicing.frets.flatMap((fret,index) =>
          fret < 0 ? [] : [authorityPositionToMidi(6-index,fret)]
        );
        assert.deepEqual(voicingMidi(voicing),expected,symbol);
      }
    }
  }
});

test("every displayed voicing stays within deterministic fingering resource boundary", () => {
  let checked=0;
  for (const root of CHORD_ROOTS) {
    for (const quality of CHORD_QUALITIES) {
      const symbol=formatChordSymbol(root,quality);
      for (const voicing of getVoicings(symbol)) {
        const result=validateFingeringResource(voicing);
        assert.ok(result.feasible,`${symbol}: ${voicing.frets.join(",")} needs ${result.minimumStandardFingers} groups`);
        assert.ok(result.minimumStandardFingers<=FINGERING_AUTHORITY.maxStandardFingers);
        checked+=1;
      }
    }
  }
  assert.equal(checked,276);
});

test("learned fingering ranker remains outside runtime authority", () => {
  assert.equal(FINGERING_AUTHORITY.deterministicPhysicalValidityIsAuthority,true);
  assert.equal(FINGERING_AUTHORITY.learnedRuntimeConnectionAuthorized,false);
  assert.equal(FINGERING_AUTHORITY.learnedProductionAuthorized,false);
});
