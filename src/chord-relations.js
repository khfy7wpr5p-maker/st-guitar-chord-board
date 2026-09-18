import { ROOT_PCS, formatChordSymbol, parseChordQuery } from "./chord-core.js";

const ROOT_BY_PC = Object.freeze(
  Object.fromEntries(Object.entries(ROOT_PCS).map(([root, pc]) => [pc, root]))
);

export const RELATION_TYPES = Object.freeze({
  RELATIVE_MAJOR: "relative_major",
  RELATIVE_MINOR: "relative_minor"
});

export function getRelativeRelation(chordOrSymbol) {
  const chord = typeof chordOrSymbol === "string" ? parseChordQuery(chordOrSymbol) : chordOrSymbol;
  if (!chord) return null;

  if (chord.quality === "major") {
    const rootPc = (ROOT_PCS[chord.root] + 9) % 12;
    return Object.freeze({
      type: RELATION_TYPES.RELATIVE_MINOR,
      labelTr: "Göreli minör",
      symbol: formatChordSymbol(ROOT_BY_PC[rootPc], "m")
    });
  }

  if (chord.quality === "m") {
    const rootPc = (ROOT_PCS[chord.root] + 3) % 12;
    return Object.freeze({
      type: RELATION_TYPES.RELATIVE_MAJOR,
      labelTr: "Göreli majör",
      symbol: formatChordSymbol(ROOT_BY_PC[rootPc], "major")
    });
  }

  return null;
}
