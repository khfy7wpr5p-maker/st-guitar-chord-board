const ROOT_ALIASES = new Map([
  ["C","C"],["B#","C"],["DO","C"],
  ["C#","C#"],["DB","C#"],["DO#","C#"],["REB","C#"],
  ["D","D"],["RE","D"],
  ["D#","D#"],["EB","D#"],["RE#","D#"],["MIB","D#"],
  ["E","E"],["FB","E"],["MI","E"],
  ["F","F"],["E#","F"],["FA","F"],
  ["F#","F#"],["GB","F#"],["FA#","F#"],["SOLB","F#"],
  ["G","G"],["SOL","G"],
  ["G#","G#"],["AB","G#"],["SOL#","G#"],["LAB","G#"],
  ["A","A"],["LA","A"],
  ["A#","A#"],["BB","A#"],["LA#","A#"],["SIB","A#"],
  ["B","B"],["CB","B"],["SI","B"]
]);

const QUALITIES = [
  ["MAJ7","maj7"],["MAJOR7","maj7"],["MAJÖR7","maj7"],
  ["MIN7","m7"],["MINOR7","m7"],["MİNÖR7","m7"],["M7","m7"],
  ["SUS2","sus2"],["SUS4","sus4"],
  ["7","7"],["5","5"],
  ["MIN","m"],["MINOR","m"],["MİNÖR","m"],["M","m"],
  ["MAJ","major"],["MAJOR","major"],["MAJÖR","major"]
];

export const QUALITY_INTERVALS = Object.freeze({
  major: [0,4,7],
  m: [0,3,7],
  "7": [0,4,7,10],
  maj7: [0,4,7,11],
  m7: [0,3,7,10],
  sus2: [0,2,7],
  sus4: [0,5,7],
  "5": [0,7]
});

export const ROOT_PCS = Object.freeze({
  C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11
});

export function parseChordQuery(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  let token = raw.toUpperCase().replaceAll("♯","#").replaceAll("♭","B").replace(/\\s+/g,"");
  token = token.replace("DİYEZ","#").replace("DIYEZ","#").replace("BEMOL","B");

  const roots = [...ROOT_ALIASES.keys()].sort((a,b)=>b.length-a.length);
  const rootKey = roots.find(k => token.startsWith(k));
  if (!rootKey) return null;
  const root = ROOT_ALIASES.get(rootKey);
  const suffix = token.slice(rootKey.length);

  if (!suffix) return { root, quality:"major", symbol:root };

  for (const [alias, quality] of QUALITIES.sort((a,b)=>b[0].length-a[0].length)) {
    if (suffix === alias) return { root, quality, symbol:formatChordSymbol(root,quality) };
  }
  return null;
}

export function formatChordSymbol(root, quality) {
  const suffix = {major:"",m:"m","7":"7",maj7:"maj7",m7:"m7",sus2:"sus2",sus4:"sus4","5":"5"}[quality];
  if (suffix === undefined) throw new Error("Unsupported chord quality");
  return root + suffix;
}

export function pitchClassesForChord(chord) {
  if (!chord || !(chord.root in ROOT_PCS)) throw new Error("Unsupported root");
  const intervals = QUALITY_INTERVALS[chord.quality];
  if (!intervals) throw new Error("Unsupported chord quality");
  return intervals.map(i => (ROOT_PCS[chord.root] + i) % 12);
}
