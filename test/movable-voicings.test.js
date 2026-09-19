import test from "node:test";
import assert from "node:assert/strict";
import { parseChordQuery } from "../src/chord-core.js";
import { generateMovableVoicings } from "../src/movable-voicings.js";

function findFrets(symbol, expected) {
  return generateMovableVoicings(parseChordQuery(symbol))
    .find(voicing=>voicing.frets.join(",")===expected.join(","));
}

test("octave-equivalent placement exposes lower practical movable shapes", () => {
  const cases=[
    ["A",[5,7,7,6,5,5],"E",5],
    ["B",[-1,2,4,4,4,2],"A",2],
    ["G#m",[4,6,6,4,4,4],"Em",4],
    ["G#m",[-1,-1,6,8,9,7],"Dm",null]
  ];

  for (const [symbol,frets,shape,barreFret] of cases) {
    const match=findFrets(symbol,frets);
    assert.ok(match, symbol + ": " + frets.join(","));
    assert.equal(match.shape,shape,symbol);
    if (barreFret!==null) {
      assert.ok(match.barres.some(barre=>barre.fret===barreFret),symbol);
    }
  }
});

test("bounded placement never turns a played negative fret into a mute", () => {
  const invalid=[-1,-1,1,1,0,-1].join(",");
  const generated=generateMovableVoicings(parseChordQuery("G#m"));
  assert.equal(generated.some(voicing=>voicing.frets.join(",")===invalid),false);
  for (const voicing of generated) {
    assert.ok(voicing.frets.every(fret=>Number.isInteger(fret)&&fret>=-1&&fret<=20));
  }
});
