import { parseChordQuery } from "./chord-core.js";
import { chordNameTr } from "./chord-labels-tr.js";
import { getVoicings, voicingMidi } from "./voicing-library.js";
import { createAudioAdapter } from "./audio-adapter.js";
import { renderChordDiagramSvg } from "./diagram-model.js";

const root = document.querySelector("#app");
const input = document.querySelector("#chord-search");
const symbolEl = document.querySelector("#chord-symbol");
const readingEl = document.querySelector("#chord-reading");
const board = document.querySelector("#chord-button");
const stringsEl = document.querySelector("#strings");
const countEl = document.querySelector("#variant-count");
const prev = document.querySelector("#prev");
const next = document.querySelector("#next");
const status = document.querySelector("#status");
const audio = createAudioAdapter(window);

let symbol = "C";
let index = 0;

function render() {
  const chord = parseChordQuery(symbol);
  const voicings = getVoicings(symbol);
  if (!voicings.length || !chord) {
    symbolEl.textContent = symbol;
    readingEl.textContent = "";
    stringsEl.innerHTML = "<div class='empty'>Akor bulunamadı.</div>";
    countEl.textContent = "0 / 0";
    board.disabled = true;
    return;
  }
  index = Math.max(0, Math.min(index, voicings.length - 1));
  const v = voicings[index];
  symbolEl.textContent = symbol;
  readingEl.textContent = chordNameTr(chord);
  stringsEl.innerHTML = renderChordDiagramSvg(v);
  countEl.textContent = `${index+1} / ${voicings.length}`;
  board.disabled = false;
  board.setAttribute("aria-label", `${symbol}, ${chordNameTr(chord)} akorunu çal`);
  status.textContent = audio.kind === "development-web-audio" ? "Geliştirme sesi" : "Gitar ses motoru bağlı";
}

function selectQuery(value) {
  const parsed = parseChordQuery(value);
  if (!parsed) {
    status.textContent = "Akor bulunamadı";
    return;
  }
  symbol = parsed.symbol;
  index = 0;
  render();
}

input.addEventListener("input", e => selectQuery(e.target.value));
board.addEventListener("click", async () => {
  const v = getVoicings(symbol)[index];
  if (!v) return;
  const positions = v.frets.flatMap((fret, stringIndex) =>
    fret < 0 ? [] : [{ stringNumber: 6 - stringIndex, fret }]
  );
  try {
    await audio.playChord(voicingMidi(v), { symbol, voicingIndex:index, positions });
    board.classList.remove("pressed");
    void board.offsetWidth;
    board.classList.add("pressed");
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Ses hatası";
  }
});
prev.addEventListener("click", () => { index = Math.max(0,index-1); render(); });
next.addEventListener("click", () => { index = Math.min(getVoicings(symbol).length-1,index+1); render(); });

input.value = "C";
render();
root.dataset.ready = "true";
