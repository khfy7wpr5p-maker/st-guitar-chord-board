import { parseChordQuery } from "./chord-core.js";
import { getVoicings, voicingMidi } from "./voicing-library.js";
import { createAudioAdapter } from "./audio-adapter.js";

const root = document.querySelector("#app");
const input = document.querySelector("#chord-search");
const symbolEl = document.querySelector("#chord-symbol");
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
  const voicings = getVoicings(symbol);
  if (!voicings.length) {
    symbolEl.textContent = symbol;
    stringsEl.innerHTML = "<div class='empty'>Bu ilk dilimde C ailesi doğrulanıyor.</div>";
    countEl.textContent = "0 / 0";
    board.disabled = true;
    return;
  }
  index = Math.max(0, Math.min(index, voicings.length - 1));
  const v = voicings[index];
  symbolEl.textContent = symbol;
  stringsEl.innerHTML = v.frets.map((fret,i) => {
    const finger = v.fingers[i];
    const top = fret < 0 ? "×" : fret === 0 ? "○" : String(fret);
    const bottom = fret > 0 && finger > 0 ? String(finger) : "";
    return `<div class="string"><span class="fret">${top}</span><span class="finger">${bottom}</span></div>`;
  }).join("");
  countEl.textContent = `${index+1} / ${voicings.length}`;
  board.disabled = false;
  status.textContent = audio.kind === "host-guitar-audio" ? "Gitar ses motoru bağlı" : "Geliştirme sesi";
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
  await audio.playChord(voicingMidi(v), { symbol, voicingIndex:index });
  board.classList.remove("pressed");
  void board.offsetWidth;
  board.classList.add("pressed");
});
prev.addEventListener("click", () => { index = Math.max(0,index-1); render(); });
next.addEventListener("click", () => { index = Math.min(getVoicings(symbol).length-1,index+1); render(); });

input.value = "C";
render();
root.dataset.ready = "true";
