import { formatChordSymbol, parseChordQuery } from "./chord-core.js";

export const CHORD_ROOTS = Object.freeze(["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]);
export const CHORD_QUALITIES = Object.freeze(["major","m","7","maj7","m7","sus2","sus4"]);

export const CHORD_SYMBOLS = Object.freeze(
  CHORD_ROOTS.flatMap(root => CHORD_QUALITIES.map(quality => formatChordSymbol(root, quality)))
);

export function sameRootFamily(chordOrSymbol) {
  const chord = typeof chordOrSymbol === "string" ? parseChordQuery(chordOrSymbol) : chordOrSymbol;
  if (!chord) return [];
  const selected = formatChordSymbol(chord.root, chord.quality);
  const family = CHORD_QUALITIES.map(quality => formatChordSymbol(chord.root, quality));
  return [selected, ...family.filter(symbol => symbol !== selected)];
}

export function suggestChordSymbols(input, limit = 7) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new RangeError("limit must be an integer in 1..20");
  }

  const raw = String(input ?? "").trim();
  if (!raw) return ["C","Am","E","G","D","F","A"].slice(0, limit);

  const exact = parseChordQuery(raw);
  if (exact) return sameRootFamily(exact).slice(0, limit);

  const query = raw.toUpperCase().replaceAll("♯","#").replaceAll("♭","B").replace(/\s+/g,"");
  return CHORD_SYMBOLS
    .filter(symbol => symbol.toUpperCase().startsWith(query))
    .slice(0, limit);
}
