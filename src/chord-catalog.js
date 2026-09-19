import { formatChordSymbol, parseChordPresentation } from "./chord-core.js";

export const CHORD_ROOTS = Object.freeze(["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]);
export const CHORD_QUALITIES = Object.freeze([
  "major","m","7","maj7","m7","sus2","sus4","5",
  "6","m6","9","add9","dim","aug","m7b5"
]);
export const DISPLAY_ALIAS_ROOTS = Object.freeze(["Db","Eb","Gb","Ab","Bb"]);

export const CHORD_SYMBOLS = Object.freeze(
  CHORD_ROOTS.flatMap(root => CHORD_QUALITIES.map(quality => formatChordSymbol(root, quality)))
);

const SEARCH_SYMBOLS = Object.freeze(
  [...CHORD_ROOTS,...DISPLAY_ALIAS_ROOTS]
    .flatMap(root => CHORD_QUALITIES.map(quality => formatChordSymbol(root,quality)))
);

export function sameRootFamily(chordOrSymbol) {
  const chord = typeof chordOrSymbol === "string" ? parseChordPresentation(chordOrSymbol) : chordOrSymbol;
  if (!chord) return [];
  const displayRoot = chord.displayRoot || chord.root;
  const selected = formatChordSymbol(displayRoot, chord.quality);
  const family = CHORD_QUALITIES.map(quality => formatChordSymbol(displayRoot, quality));
  return [selected, ...family.filter(symbol => symbol !== selected)];
}

export function suggestChordSymbols(input, limit = 8) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new RangeError("limit must be an integer in 1..20");
  }

  const raw = String(input ?? "").trim();
  if (!raw) return ["C","Am","E","G","D","F","A","A5"].slice(0, limit);

  const exact = parseChordPresentation(raw);
  if (exact) return sameRootFamily(exact).slice(0, limit);

  const query = raw.toUpperCase()
    .replaceAll("♯","#")
    .replaceAll("♭","B")
    .replaceAll(" ","")
    .replaceAll("\t","")
    .replaceAll("\n","");
  return SEARCH_SYMBOLS
    .filter(symbol => symbol.toUpperCase().startsWith(query))
    .slice(0, limit);
}
