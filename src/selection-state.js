import { parseChordPresentation } from "./chord-core.js";
import { getVoicings } from "./voicing-library.js";

export const SELECTION_STORAGE_KEY = "st-guitar-chord-board:last-selection:v1";
export const DEFAULT_SELECTION_STATE = Object.freeze({
  symbol: "C",
  voicingIndex: 0
});

function normalizeSelectionState(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  if (typeof candidate.symbol !== "string" || !Number.isInteger(candidate.voicingIndex)) return null;

  const chord = parseChordPresentation(candidate.symbol);
  if (!chord) return null;

  const voicings = getVoicings(chord.displaySymbol);
  if (
    candidate.voicingIndex < 0 ||
    candidate.voicingIndex >= voicings.length
  ) return null;

  return {
    symbol: chord.displaySymbol,
    voicingIndex: candidate.voicingIndex
  };
}

export function loadSelectionState(storage) {
  try {
    const raw = storage?.getItem?.(SELECTION_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SELECTION_STATE };
    const normalized = normalizeSelectionState(JSON.parse(raw));
    return normalized ?? { ...DEFAULT_SELECTION_STATE };
  } catch {
    return { ...DEFAULT_SELECTION_STATE };
  }
}

export function saveSelectionState(storage, state) {
  try {
    const normalized = normalizeSelectionState(state);
    if (!normalized || !storage?.setItem) return false;
    storage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}
