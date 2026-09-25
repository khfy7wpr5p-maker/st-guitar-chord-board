import test from "node:test";
import assert from "node:assert/strict";

async function loadAccessibilityModel() {
  try {
    return await import("../src/accessibility-model.js");
  } catch (error) {
    assert.fail(`accessibility model module is required: ${error?.message || error}`);
  }
}

const OPEN_C=Object.freeze({
  frets:[-1,3,2,0,1,0],
  fingers:[-1,3,2,0,1,0],
  barres:[]
});

test("open C accessibility model preserves 6-to-1 string order and spoken states", async () => {
  const { buildChordAccessibilityModel }=await loadAccessibilityModel();
  const model=buildChordAccessibilityModel({
    symbol:"C",
    chordName:"Do majör",
    voicing:OPEN_C,
    position:1,
    totalPositions:3
  });

  assert.equal(model.label,"C, Do majör, pozisyon 1 / 3");
  assert.deepEqual(model.strings.map(entry=>entry.stringNumber),[6,5,4,3,2,1]);
  assert.deepEqual(model.strings.map(entry=>entry.text),[
    "6. tel çalınmaz",
    "5. tel, 3. perde, 3. parmak",
    "4. tel, 2. perde, 2. parmak",
    "3. tel açık",
    "2. tel, 1. perde, 1. parmak",
    "1. tel açık"
  ]);
  assert.equal(
    model.description,
    "6. tel çalınmaz. 5. tel, 3. perde, 3. parmak. 4. tel, 2. perde, 2. parmak. 3. tel açık. 2. tel, 1. perde, 1. parmak. 1. tel açık. Akoru çalmak için çift dokunun."
  );
});

test("fretted string without a finger falls back to fret-only narration", async () => {
  const { buildChordAccessibilityModel }=await loadAccessibilityModel();
  const model=buildChordAccessibilityModel({
    symbol:"A5",
    chordName:"La beş",
    voicing:{
      frets:[5,7,7,-1,-1,-1],
      fingers:[1,0,0,-1,-1,-1],
      barres:[]
    },
    position:1,
    totalPositions:2
  });

  assert.equal(model.strings[1].text,"5. tel, 7. perde");
  assert.equal(model.strings[2].text,"4. tel, 7. perde");
});

test("barre and high-fret voicings announce real fret and string span", async () => {
  const { buildChordAccessibilityModel }=await loadAccessibilityModel();
  const model=buildChordAccessibilityModel({
    symbol:"A",
    chordName:"La majör",
    voicing:{
      frets:[5,7,7,6,5,5],
      fingers:[1,3,4,2,1,1],
      barres:[{finger:1,fret:5,fromString:6,toString:1}]
    },
    position:2,
    totalPositions:3
  });

  assert.equal(model.label,"A, La majör, pozisyon 2 / 3");
  assert.equal(model.strings[0].text,"6. tel, 5. perde, 1. parmak");
  assert.equal(model.strings[5].text,"1. tel, 5. perde, 1. parmak");
  assert.deepEqual(model.barres,[
    {
      finger:1,
      fret:5,
      fromString:6,
      toString:1,
      text:"1. parmakla 5. perdede 6. telden 1. tele bare"
    }
  ]);
  assert.match(model.description,/1\. parmakla 5\. perdede 6\. telden 1\. tele bare\./);
  assert.match(model.description,/Akoru çalmak için çift dokunun\.$/);
});
