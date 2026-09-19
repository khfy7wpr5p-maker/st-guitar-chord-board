export const AUTHORITY_SOURCES = Object.freeze({
  fretboard: Object.freeze({
    repository: "khfy7wpr5p-maker/musicxml-to-guitar-tab-engine",
    commit: "1d8ced644f544f7e991f7275eda77a2ce557774e",
    tuningBlob: "700b29b3722fa98392fa98ef5782c36334d07b6e",
    fretboardBlob: "2bea47ace9427fcc611b81241429ef6a6868978e"
  }),
  harmony: Object.freeze({
    repository: "khfy7wpr5p-maker/st-guitar-harmonic-engine",
    commit: "f631ec8c30df616b9d83d9269e56278742878d32",
    chordsBlob: "b1488ebae12ae6ab7df435a8b26fae7818d1e2f7",
    alterationsBlob: "3eb2dda88b9acdc82db2fbe51d2113d0ac77d604"
  }),
  fingering: Object.freeze({
    repository: "khfy7wpr5p-maker/st-guitar-fingering-training",
    commit: "06564c494c15acc7a1a2ec20219854d234281cf9",
    feasibilityBlob: "29d5a093d6cc9266751ef17b8c98f4fa8f642e63",
    plausibilityBlob: "fee315cc9e0eee29aed798bb1eea218ae9276749"
  })
});

export const GUITAR_AUTHORITY = Object.freeze({
  stringCount: 6,
  tuning: Object.freeze([
    Object.freeze({ number: 6, pitch: "E2", midi: 40 }),
    Object.freeze({ number: 5, pitch: "A2", midi: 45 }),
    Object.freeze({ number: 4, pitch: "D3", midi: 50 }),
    Object.freeze({ number: 3, pitch: "G3", midi: 55 }),
    Object.freeze({ number: 2, pitch: "B3", midi: 59 }),
    Object.freeze({ number: 1, pitch: "E4", midi: 64 })
  ]),
  minimumFret: 0,
  maximumFret: 20,
  fretSemantics: "RELATIVE_FROM_CAPO"
});

export const HARMONIC_AUTHORITY = Object.freeze({
  major: Object.freeze([0,4,7]),
  m: Object.freeze([0,3,7]),
  "7": Object.freeze([0,4,7,10]),
  maj7: Object.freeze([0,4,7,11]),
  m7: Object.freeze([0,3,7,10]),
  sus2: Object.freeze([0,2,7]),
  sus4: Object.freeze([0,5,7])
});

export const PRODUCT_HARMONIC_EXTENSIONS = Object.freeze({
  "5": Object.freeze([0,7]),
  dim: Object.freeze([0,3,6]),
  aug: Object.freeze([0,4,8]),
  "6": Object.freeze([0,4,7,9]),
  m6: Object.freeze([0,3,7,9]),
  "9": Object.freeze([0,4,7,10,2]),
  add9: Object.freeze([0,4,7,2]),
  m7b5: Object.freeze([0,3,6,10])
});

export const FINGERING_AUTHORITY = Object.freeze({
  maxStandardFingers: 4,
  candidateMinimumFret: 0,
  candidateMaximumFret: 20,
  learnedRuntimeConnectionAuthorized: false,
  learnedProductionAuthorized: false,
  deterministicPhysicalValidityIsAuthority: true,
  feasibilityRuleVersion: "S1-H-B.v1",
  plausibilityRuleVersion: "S1-H-A.v1"
});

function stringNumberForIndex(index) {
  return 6 - index;
}

export function authorityPositionToMidi(stringNumber, fret) {
  if (!Number.isInteger(stringNumber) || stringNumber < 1 || stringNumber > 6) {
    throw new RangeError("stringNumber must be in 1..6");
  }
  if (!Number.isInteger(fret) || fret < GUITAR_AUTHORITY.minimumFret || fret > GUITAR_AUTHORITY.maximumFret) {
    throw new RangeError("fret is outside authoritative 0..20 range");
  }
  const string = GUITAR_AUTHORITY.tuning.find(item => item.number === stringNumber);
  return string.midi + fret;
}

function stringFretMap(frets) {
  if (!Array.isArray(frets) || frets.length !== GUITAR_AUTHORITY.stringCount) {
    throw new TypeError("frets must contain exactly six string entries");
  }
  const map = new Map();
  frets.forEach((fret,index) => {
    if (!Number.isInteger(fret) || fret < -1 || fret > GUITAR_AUTHORITY.maximumFret) {
      throw new RangeError("voicing fret must be -1 or within 0..20");
    }
    if (fret >= 0) map.set(stringNumberForIndex(index), fret);
  });
  if (!map.size) throw new TypeError("voicing must contain at least one sounding string");
  return map;
}

function blockersBetween(stringFrets, fret, leftString, rightString) {
  const lo=Math.min(leftString,rightString);
  const hi=Math.max(leftString,rightString);
  const blockers=[];
  for (let string=lo+1; string<hi; string+=1) {
    if (!stringFrets.has(string)) continue;
    const required=stringFrets.get(string);
    if (required===0 || (required>0 && required<fret)) blockers.push(string);
  }
  return blockers;
}

export function minimumStandardFingers(frets) {
  const stringFrets=stringFretMap(frets);
  const positiveFrets=[...new Set([...stringFrets.values()].filter(fret=>fret>0))].sort((a,b)=>a-b);
  let groups=0;

  for (const fret of positiveFrets) {
    const targets=[...stringFrets.entries()]
      .filter(([,value])=>value===fret)
      .map(([string])=>string)
      .sort((a,b)=>a-b);

    if (!targets.length) continue;
    groups+=1;
    for (let i=1;i<targets.length;i+=1) {
      if (blockersBetween(stringFrets,fret,targets[i-1],targets[i]).length) groups+=1;
    }
  }
  return groups;
}

export function validateFingeringResource(voicing) {
  if (!voicing || !Array.isArray(voicing.frets) || !Array.isArray(voicing.fingers)) {
    throw new TypeError("voicing must expose frets and fingers");
  }
  if (voicing.frets.length !== 6 || voicing.fingers.length !== 6) {
    throw new TypeError("voicing must describe six strings");
  }
  const minimum=minimumStandardFingers(voicing.frets);
  return Object.freeze({
    minimumStandardFingers: minimum,
    feasible: minimum <= FINGERING_AUTHORITY.maxStandardFingers
  });
}
