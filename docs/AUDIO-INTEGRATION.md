# Audio integration

## Preferred host

The chord board can consume the existing `st-score-audio-engine` runtime without a backend.

The host exposes one initialized engine instance:

```js
window.ST_SCORE_AUDIO_ENGINE = audioEngine;
```

The adapter then performs, inside the user's chord-button gesture:

1. `unlockFromUserGesture()`
2. `setInstrument("CLASSICAL_GUITAR")`
3. one concurrent `audition(...)` call for every sounding guitar string

Each audition receives:

- the exact MIDI pitch derived from the selected string/fret voicing;
- `instrumentId: "CLASSICAL_GUITAR"`;
- the physical `stringNumber` and `fret` when known;
- a bounded duration/velocity;
- a unique request id.

This uses the Audio Engine's existing `polyphony`, `sample-instrument`, and iOS gesture-unlock capabilities. The chord board never asks the audio layer to choose or alter a voicing.

## Existing editor bridge

If the editor continues to own its own guitar sampler, it may instead expose:

```js
window.ST_GUITAR_AUDIO = {
  playChord(payload) { /* editor-owned implementation */ }
};
```

The payload contains the exact MIDI list plus chord/voicing/position metadata.

## Product qualification note

The `st-score-audio-engine` repository currently retains the classical-guitar profile but marks its product lifecycle as suspended. Direct use here is therefore an integration seam, not a claim that production sample qualification has been reopened. A production release must either explicitly resume/qualify that profile or use the editor-owned bridge.

## Offline behavior

No network service or Render process is required for playback logic. For true offline guitar timbre, the qualified sample assets must also be packaged/cached locally by the host.
