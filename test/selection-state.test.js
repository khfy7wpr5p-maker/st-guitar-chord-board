import test from "node:test";
import assert from "node:assert/strict";
import {
  SELECTION_STORAGE_KEY,
  loadSelectionState,
  saveSelectionState
} from "../src/selection-state.js";

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key,value) { data.set(key,String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test("selection state round-trips display symbol and voicing index", () => {
  const storage=memoryStorage();
  saveSelectionState(storage,{symbol:"Bb5",voicingIndex:1});
  assert.deepEqual(loadSelectionState(storage),{symbol:"Bb5",voicingIndex:1});
});

test("invalid or stale persisted state falls back safely", () => {
  for (const raw of [
    "{bad json",
    JSON.stringify({symbol:"NotAChord",voicingIndex:0}),
    JSON.stringify({symbol:"A5",voicingIndex:99}),
    JSON.stringify({symbol:"A5",voicingIndex:-1}),
    JSON.stringify({symbol:"A5",voicingIndex:1.5})
  ]) {
    const storage=memoryStorage({[SELECTION_STORAGE_KEY]:raw});
    assert.deepEqual(loadSelectionState(storage),{symbol:"C",voicingIndex:0});
  }
});

test("storage failures never block the default selection", () => {
  const storage={
    getItem(){ throw new Error("blocked"); },
    setItem(){ throw new Error("blocked"); }
  };
  assert.deepEqual(loadSelectionState(storage),{symbol:"C",voicingIndex:0});
  assert.doesNotThrow(()=>saveSelectionState(storage,{symbol:"A5",voicingIndex:1}));
});
