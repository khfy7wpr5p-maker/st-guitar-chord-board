import { parseChordPresentation } from "./chord-core.js";
import { chordNameTr } from "./chord-labels-tr.js";
import { suggestChordSymbols } from "./chord-catalog.js";
import { getRelativeRelation } from "./chord-relations.js";
import { getVoicings, voicingMidi } from "./voicing-library.js";
import { createAudioAdapter } from "./audio-adapter.js";
import { renderChordDiagramSvg } from "./diagram-model.js";
import { loadSelectionState, saveSelectionState } from "./selection-state.js";
import { RELEASE_AUDIO } from "./release-config.js";
import { installStandaloneGuitarBridge } from "./standalone-guitar-audio.js";

const root = document.querySelector("#app");
const input = document.querySelector("#chord-search");
const suggestionsEl = document.querySelector("#suggestions");
const relationEl = document.querySelector("#relation");
const symbolEl = document.querySelector("#chord-symbol");
const readingEl = document.querySelector("#chord-reading");
const board = document.querySelector("#chord-button");
const stringsEl = document.querySelector("#strings");
const countEl = document.querySelector("#variant-count");
const prev = document.querySelector("#prev");
const next = document.querySelector("#next");
const status = document.querySelector("#status");

if (RELEASE_AUDIO.enabled) {
  installStandaloneGuitarBridge(window, { soundfontUrl:RELEASE_AUDIO.instrumentUrl });
}

const audio = createAudioAdapter(window);

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = browserStorage();
const restoredSelection = loadSelectionState(storage);

const SWIPE_MIN_DISTANCE = 48;
const SWIPE_AXIS_RATIO = 1.25;
const SWIPE_CLICK_SUPPRESSION_MS = 450;

let symbol = restoredSelection.symbol;
let index = restoredSelection.voicingIndex;
let gesture = null;
let suppressClickUntil = 0;

function renderSuggestions(value) {
  const suggestions = suggestChordSymbols(value);
  suggestionsEl.innerHTML = suggestions.map(candidate => {
    const chord = parseChordPresentation(candidate);
    const reading = chord ? chordNameTr(chord) : "";
    const selected = candidate === symbol;
    return `<button type="button" class="suggestion${selected ? " selected" : ""}" data-symbol="${candidate}" aria-pressed="${selected}">
      <strong>${candidate}</strong>
      <span>${reading}</span>
    </button>`;
  }).join("");
}

function renderRelation(chord) {
  const relation = getRelativeRelation(chord);
  if (!relation) {
    relationEl.hidden = true;
    relationEl.innerHTML = "";
    return;
  }

  const relatedChord = parseChordPresentation(relation.symbol);
  const reading = relatedChord ? chordNameTr(relatedChord) : "";
  relationEl.hidden = false;
  relationEl.innerHTML = `<button type="button" class="relation-card" data-symbol="${relation.symbol}">
    <span class="relation-label">${relation.labelTr}</span>
    <strong>${relation.symbol}</strong>
    <span class="relation-reading">${reading}</span>
  </button>`;
}

function render() {
  const chord = parseChordPresentation(symbol);
  const voicings = getVoicings(symbol);
  if (!voicings.length || !chord) {
    symbolEl.textContent = symbol;
    readingEl.textContent = "";
    stringsEl.innerHTML = "<div class='empty'>Akor bulunamadı.</div>";
    countEl.textContent = "0 / 0";
    board.disabled = true;
    renderRelation(null);
    return;
  }

  index = Math.max(0, Math.min(index, voicings.length - 1));
  const v = voicings[index];
  symbol = chord.displaySymbol;
  symbolEl.textContent = chord.displaySymbol;
  readingEl.textContent = chordNameTr(chord);
  stringsEl.innerHTML = renderChordDiagramSvg(v);
  countEl.textContent = `${index+1} / ${voicings.length}`;
  board.disabled = false;
  board.setAttribute("aria-label", `${chord.displaySymbol}, ${chordNameTr(chord)} akorunu çal`);
  status.textContent = audio.kind === "development-web-audio"
    ? "Geliştirme sesi"
    : audio.offlineReady === true
      ? "Gitar sesi bağlı · çevrimdışı hazır"
      : "Gitar ses motoru bağlı";
  renderSuggestions(input.value);
  renderRelation(chord);
}

function persistSelection() {
  saveSelectionState(storage, { symbol, voicingIndex:index });
}

function selectSymbol(nextSymbol) {
  const parsed = parseChordPresentation(nextSymbol);
  if (!parsed) return false;
  symbol = parsed.displaySymbol;
  index = 0;
  render();
  persistSelection();
  return true;
}

function changeVoicing(delta) {
  const voicings = getVoicings(symbol);
  if (!voicings.length) return false;
  const nextIndex = Math.max(0, Math.min(voicings.length - 1, index + delta));
  if (nextIndex === index) return false;
  index = nextIndex;
  render();
  persistSelection();
  return true;
}

input.addEventListener("input", e => {
  const value = e.target.value;
  renderSuggestions(value);
  if (!selectSymbol(value)) {
    status.textContent = value.trim() ? "Önerilerden bir akor seçin" : "";
  }
});

suggestionsEl.addEventListener("click", event => {
  const button = event.target.closest("button[data-symbol]");
  if (!button) return;
  input.value = button.dataset.symbol;
  selectSymbol(button.dataset.symbol);
});

relationEl.addEventListener("click", event => {
  const button = event.target.closest("button[data-symbol]");
  if (!button) return;
  input.value = button.dataset.symbol;
  selectSymbol(button.dataset.symbol);
});

board.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse") return;
  gesture = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY
  };
});

board.addEventListener("pointercancel", event => {
  if (gesture?.pointerId === event.pointerId) gesture = null;
});

board.addEventListener("pointerup", event => {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  gesture = null;

  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);
  if (horizontal < SWIPE_MIN_DISTANCE || horizontal <= vertical * SWIPE_AXIS_RATIO) return;

  event.preventDefault();
  changeVoicing(dx < 0 ? 1 : -1);
  suppressClickUntil = performance.now() + SWIPE_CLICK_SUPPRESSION_MS;
});

board.addEventListener("click", async event => {
  if (performance.now() <= suppressClickUntil) {
    event.preventDefault();
    return;
  }

  const chord = parseChordPresentation(symbol);
  const v = getVoicings(symbol)[index];
  if (!v || !chord) return;
  const positions = v.frets.flatMap((fret, stringIndex) =>
    fret < 0 ? [] : [{ stringNumber: 6 - stringIndex, fret }]
  );
  try {
    await audio.playChord(voicingMidi(v), {
      symbol: chord.symbol,
      displaySymbol: chord.displaySymbol,
      voicingIndex:index,
      positions
    });
    board.classList.remove("pressed");
    void board.offsetWidth;
    board.classList.add("pressed");
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Ses hatası";
  }
});

prev.addEventListener("click", () => { changeVoicing(-1); });
next.addEventListener("click", () => { changeVoicing(1); });

input.value = symbol;
render();
root.dataset.ready = "true";
