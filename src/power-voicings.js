import { ROOT_PCS } from "./chord-core.js";

const OPEN_PCS = Object.freeze({
  6: 4,
  5: 9
});

function rootFret(rootPc, stringNumber) {
  return (rootPc - OPEN_PCS[stringNumber] + 12) % 12;
}

function powerShapeOnSixth(rootPc) {
  const root = rootFret(rootPc, 6);
  const openRoot = root === 0;
  return Object.freeze({
    frets: [root, root + 2, root + 2, -1, -1, -1],
    fingers: [openRoot ? 0 : 1, openRoot ? 1 : 3, openRoot ? 2 : 4, -1, -1, -1],
    barres: [],
    shape: "POWER_ROOT_6",
    generated: true
  });
}

function powerShapeOnFifth(rootPc) {
  const root = rootFret(rootPc, 5);
  const openRoot = root === 0;
  return Object.freeze({
    frets: [-1, root, root + 2, root + 2, -1, -1],
    fingers: [-1, openRoot ? 0 : 1, openRoot ? 1 : 3, openRoot ? 2 : 4, -1, -1],
    barres: [],
    shape: "POWER_ROOT_5",
    generated: true
  });
}

export function generatePowerVoicings(chord) {
  if (!chord || chord.quality !== "5" || !(chord.root in ROOT_PCS)) return [];
  const rootPc = ROOT_PCS[chord.root];
  return [powerShapeOnSixth(rootPc), powerShapeOnFifth(rootPc)];
}
