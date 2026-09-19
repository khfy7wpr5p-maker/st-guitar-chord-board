const ROOT_SPECS = new Map([
  ["C",{root:"C",displayRoot:"C"}],["B#",{root:"C",displayRoot:"B#"}],["DO",{root:"C",displayRoot:"C"}],
  ["C#",{root:"C#",displayRoot:"C#"}],["DB",{root:"C#",displayRoot:"Db"}],["DO#",{root:"C#",displayRoot:"C#"}],["REB",{root:"C#",displayRoot:"Db"}],
  ["D",{root:"D",displayRoot:"D"}],["RE",{root:"D",displayRoot:"D"}],
  ["D#",{root:"D#",displayRoot:"D#"}],["EB",{root:"D#",displayRoot:"Eb"}],["RE#",{root:"D#",displayRoot:"D#"}],["MIB",{root:"D#",displayRoot:"Eb"}],
  ["E",{root:"E",displayRoot:"E"}],["FB",{root:"E",displayRoot:"Fb"}],["MI",{root:"E",displayRoot:"E"}],
  ["F",{root:"F",displayRoot:"F"}],["E#",{root:"F",displayRoot:"E#"}],["FA",{root:"F",displayRoot:"F"}],
  ["F#",{root:"F#",displayRoot:"F#"}],["GB",{root:"F#",displayRoot:"Gb"}],["FA#",{root:"F#",displayRoot:"F#"}],["SOLB",{root:"F#",displayRoot:"Gb"}],
  ["G",{root:"G",displayRoot:"G"}],["SOL",{root:"G",displayRoot:"G"}],
  ["G#",{root:"G#",displayRoot:"G#"}],["AB",{root:"G#",displayRoot:"Ab"}],["SOL#",{root:"G#",displayRoot:"G#"}],["LAB",{root:"G#",displayRoot:"Ab"}],
  ["A",{root:"A",displayRoot:"A"}],["LA",{root:"A",displayRoot:"A"}],
  ["A#",{root:"A#",displayRoot:"A#"}],["BB",{root:"A#",displayRoot:"Bb"}],["LA#",{root:"A#",displayRoot:"A#"}],["SIB",{root:"A#",displayRoot:"Bb"}],
  ["B",{root:"B",displayRoot:"B"}],["CB",{root:"B",displayRoot:"Cb"}],["SI",{root:"B",displayRoot:"B"}]
]);

const QUALITIES = [
  ["M7B5","m7b5"],["MIN7B5","m7b5"],["MINOR7B5","m7b5"],
  ["ADD9","add9"],
  ["MAJ7","maj7"],["MAJOR7","maj7"],["MAJÖR7","maj7"],
  ["MIN7","m7"],["MINOR7","m7"],["MINÖR7","m7"],["MİNÖR7","m7"],["M7","m7"],
  ["MIN6","m6"],["MINOR6","m6"],["MINÖR6","m6"],["MİNÖR6","m6"],["M6","m6"],
  ["SUS2","sus2"],["SUS4","sus4"],
  ["DIM","dim"],["°","dim"],["AUG","aug"],["+","aug"],
  ["9","9"],["7","7"],["6","6"],["5","5"],
  ["MIN","m"],["MINOR","m"],["MINÖR","m"],["MİNÖR","m"],["M","m"],
  ["MAJ","major"],["MAJOR","major"],["MAJÖR","major"]
];

const SORTED_QUALITIES = Object.freeze([...QUALITIES].sort((a,b)=>b[0].length-a[0].length));
const SORTED_ROOT_KEYS = Object.freeze([...ROOT_SPECS.keys()].sort((a,b)=>b.length-a.length));

export const QUALITY_INTERVALS = Object.freeze({
  major: [0,4,7],
  m: [0,3,7],
  "7": [0,4,7,10],
  maj7: [0,4,7,11],
  m7: [0,3,7,10],
  sus2: [0,2,7],
  sus4: [0,5,7],
  "5": [0,7],
  dim: [0,3,6],
  aug: [0,4,8],
  "6": [0,4,7,9],
  m6: [0,3,7,9],
  "9": [0,4,7,10,2],
  add9: [0,4,7,2],
  m7b5: [0,3,6,10]
});

export const ROOT_PCS = Object.freeze({
  C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11
});

function normalizeToken(input) {
  let token = String(input ?? "").trim().toUpperCase()
    .replaceAll("♯","#")
    .replaceAll("♭","B")
    .replaceAll(" ","")
    .replaceAll("\t","")
    .replaceAll("\n","");
  return token.replace("DİYEZ","#").replace("DIYEZ","#").replace("BEMOL","B");
}

export function parseChordPresentation(input) {
  const token = normalizeToken(input);
  if (!token) return null;

  for (const rootKey of SORTED_ROOT_KEYS) {
    if (!token.startsWith(rootKey)) continue;
    const suffix = token.slice(rootKey.length);
    const quality = !suffix
      ? "major"
      : SORTED_QUALITIES.find(([alias]) => suffix === alias)?.[1];
    if (!quality) continue;

    const spec = ROOT_SPECS.get(rootKey);
    return Object.freeze({
      root: spec.root,
      quality,
      symbol: formatChordSymbol(spec.root,quality),
      displayRoot: spec.displayRoot,
      displaySymbol: formatChordSymbol(spec.displayRoot,quality)
    });
  }

  return null;
}

export function parseChordQuery(input) {
  const parsed = parseChordPresentation(input);
  if (!parsed) return null;
  return { root:parsed.root, quality:parsed.quality, symbol:parsed.symbol };
}

export function formatChordSymbol(root, quality) {
  const suffix = {
    major:"",m:"m","7":"7",maj7:"maj7",m7:"m7",sus2:"sus2",sus4:"sus4","5":"5",
    dim:"dim",aug:"aug","6":"6",m6:"m6","9":"9",add9:"add9",m7b5:"m7b5"
  }[quality];
  if (suffix === undefined) throw new Error("Unsupported chord quality");
  return root + suffix;
}

export function pitchClassesForChord(chord) {
  if (!chord || !(chord.root in ROOT_PCS)) throw new Error("Unsupported root");
  const intervals = QUALITY_INTERVALS[chord.quality];
  if (!intervals) throw new Error("Unsupported chord quality");
  return intervals.map(i => (ROOT_PCS[chord.root] + i) % 12);
}
