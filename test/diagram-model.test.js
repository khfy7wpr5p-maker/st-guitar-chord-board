import test from "node:test";
import assert from "node:assert/strict";
import { buildChordDiagramModel, renderChordDiagramSvg } from "../src/diagram-model.js";

test("open C diagram preserves mute, open and finger states", () => {
  const model=buildChordDiagramModel({
    frets:[-1,3,2,0,1,0],
    fingers:[-1,3,2,0,1,0],
    barres:[]
  });
  assert.equal(model.baseFret,1);
  assert.deepEqual(model.strings.map(s=>s.state),["muted","fretted","fretted","open","fretted","open"]);
  assert.deepEqual(model.strings.map(s=>s.row),[null,3,2,null,1,null]);
});

test("open-root power chord remains a first-position diagram", () => {
  const model=buildChordDiagramModel({
    frets:[-1,0,2,2,-1,-1],
    fingers:[-1,0,1,2,-1,-1],
    barres:[]
  });
  assert.equal(model.baseFret,1);
  assert.deepEqual(model.strings.map(s=>s.row),[null,null,2,2,null,null]);
});

test("high-position barre diagram rebases to the first visible fret", () => {
  const model=buildChordDiagramModel({
    frets:[8,10,10,9,8,8],
    fingers:[1,3,4,2,1,1],
    barres:[{finger:1,fret:8,fromString:6,toString:1}]
  });
  assert.equal(model.baseFret,8);
  assert.equal(model.barres[0].row,1);
  assert.deepEqual(model.strings.map(s=>s.row),[1,3,3,2,1,1]);
  const svg=renderChordDiagramSvg({
    frets:[8,10,10,9,8,8],
    fingers:[1,3,4,2,1,1],
    barres:[{finger:1,fret:8,fromString:6,toString:1}]
  });
  assert.match(svg,/class="barre-mark"/);
  assert.match(svg,/class="base-fret">8</);
});


test("renderer uses guitar-like string gauges and semantic fret lines", () => {
  const svg=renderChordDiagramSvg({
    frets:[-1,3,2,0,1,0],
    fingers:[-1,3,2,0,1,0],
    barres:[]
  });
  assert.match(svg,/class="string-line string-6"[^>]*stroke-width="4\.8"/);
  assert.match(svg,/class="string-line string-1"[^>]*stroke-width="1\.8"/);
  assert.match(svg,/class="fret-line nut-line"/);
  assert.match(svg,/data-base-fret="1"/);
  assert.match(svg,/aria-label="Gitar akor diyagramı, açık pozisyon"/);
  assert.match(svg,/shape-rendering="geometricPrecision"/);
});

test("high-position renderer exposes the real starting fret without drawing a nut", () => {
  const svg=renderChordDiagramSvg({
    frets:[5,7,7,6,5,5],
    fingers:[1,3,4,2,1,1],
    barres:[{finger:1,fret:5,fromString:6,toString:1}]
  });
  assert.match(svg,/data-base-fret="5"/);
  assert.match(svg,/aria-label="Gitar akor diyagramı, 5\. perdeden"/);
  assert.doesNotMatch(svg,/class="fret-line nut-line"/);
  assert.match(svg,/class="barre-mark"[^>]*data-finger="1"/);
});
