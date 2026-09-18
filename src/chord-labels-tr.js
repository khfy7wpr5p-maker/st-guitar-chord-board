const ROOT_NAMES_TR = Object.freeze({
  C:"Do",
  "C#":"Do diyez",
  D:"Re",
  "D#":"Re diyez",
  E:"Mi",
  F:"Fa",
  "F#":"Fa diyez",
  G:"Sol",
  "G#":"Sol diyez",
  A:"La",
  "A#":"La diyez",
  B:"Si"
});

const QUALITY_NAMES_TR = Object.freeze({
  major:"majör",
  m:"minör",
  "7":"yedili",
  maj7:"majör yedili",
  m7:"minör yedili",
  sus2:"sus iki",
  sus4:"sus dört"
});

export function chordNameTr(chord) {
  if (!chord || typeof chord !== "object") throw new TypeError("chord is required");
  const root = ROOT_NAMES_TR[chord.root];
  const quality = QUALITY_NAMES_TR[chord.quality];
  if (!root || !quality) throw new Error("Unsupported chord identity");
  return `${root} ${quality}`;
}
