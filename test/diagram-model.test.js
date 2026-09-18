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
