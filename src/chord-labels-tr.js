const ROOT_NAMES_TR = Object.freeze({
  C:"Do",
  "C#":"Do diyez",
  Db:"Re bemol",
  D:"Re",
  "D#":"Re diyez",
  Eb:"Mi bemol",
  E:"Mi",
  Fb:"Fa bemol",
  "E#":"Mi diyez",
  F:"Fa",
  "F#":"Fa diyez",
  Gb:"Sol bemol",
  G:"Sol",
  "G#":"Sol diyez",
  Ab:"La bemol",
  A:"La",
  "A#":"La diyez",
  Bb:"Si bemol",
  B:"Si",
  Cb:"Do bemol",
  "B#":"Si diyez"
});

const QUALITY_NAMES_TR = Object.freeze({
  major:"majör",
  m:"minör",
  "7":"yedili",
  maj7:"majör yedili",
  m7:"minör yedili",
  sus2:"sus iki",
  sus4:"sus dört",
  "5":"beş",
  dim:"eksilmiş",
  aug:"artırılmış",
  "6":"altılı",
  m6:"minör altılı",
  "9":"dokuzlu",
  add9:"add dokuz",
  m7b5:"minör yedili bemol beş"
});

export function chordNameTr(chord) {
  if (!chord || typeof chord !== "object") throw new TypeError("chord is required");
  const root = ROOT_NAMES_TR[chord.displayRoot || chord.root];
  const quality = QUALITY_NAMES_TR[chord.quality];
  if (!root || !quality) throw new Error("Unsupported chord identity");
  return `${root} ${quality}`;
}
