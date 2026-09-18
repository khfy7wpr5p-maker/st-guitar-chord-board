import { Chord, Note } from "tonal";
import { parseChordQuery, pitchClassesForChord } from "./chord-core.js";

function sortedUniquePitchClasses(values) {
  return [...new Set(values)].sort((a,b)=>a-b);
}

function tonalPitchClass(note) {
  const parsed=Note.get(note);
  if (parsed.empty || !Number.isInteger(parsed.chroma)) {
    throw new Error(`Tonal returned an unreadable note: ${note}`);
  }
  return parsed.chroma;
}

export function tonalPitchClassesForChord(symbol) {
  const local=parseChordQuery(symbol);
  if (!local) throw new Error(`Unsupported local chord symbol: ${symbol}`);

  const tonal=Chord.get(local.symbol);
  if (tonal.empty || !Array.isArray(tonal.notes) || tonal.notes.length===0) {
    throw new Error(`Tonal cannot resolve canonical chord: ${local.symbol}`);
  }

  return Object.freeze(sortedUniquePitchClasses(tonal.notes.map(tonalPitchClass)));
}

export function validateChordAgainstTonal(symbol) {
  const chord=parseChordQuery(symbol);
  if (!chord) {
    return Object.freeze({
      valid:false,
      symbol:String(symbol ?? ""),
      canonicalSymbol:null,
      localPitchClasses:Object.freeze([]),
      tonalPitchClasses:Object.freeze([]),
      reason:"UNSUPPORTED_LOCAL_CHORD"
    });
  }

  const localPitchClasses=Object.freeze(sortedUniquePitchClasses(pitchClassesForChord(chord)));
  const tonalPitchClasses=tonalPitchClassesForChord(chord.symbol);
  const valid=localPitchClasses.length===tonalPitchClasses.length
    && localPitchClasses.every((value,index)=>value===tonalPitchClasses[index]);

  return Object.freeze({
    valid,
    symbol:String(symbol),
    canonicalSymbol:chord.symbol,
    localPitchClasses,
    tonalPitchClasses,
    reason:valid ? null : "PITCH_CLASS_MISMATCH"
  });
}
