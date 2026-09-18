# Audio integration

## Runtime priority

Chord Board audio routing is intentionally conservative:

1. **Editor-owned guitar bridge** — `window.ST_GUITAR_AUDIO`
2. **Qualified ST Score Audio classical-guitar profile**
3. **Development Web Audio fallback**

The editor bridge is first because the user already has guitar MIDI/sampler playback in the editor and it avoids depending on a separate product-qualification state.

## Existing editor bridge

The editor may expose:

```js
window.ST_GUITAR_AUDIO = {
  playChord(payload) { /* editor-owned implementation */ }
};
```

The payload contains the exact MIDI list plus chord/voicing/physical string-fret metadata. Chord Board does not choose a different voicing in the audio layer.

## ST Score Audio fallback

The board can also consume an exposed `ST_SCORE_AUDIO_ENGINE`.

When `getInstrumentProfile()` is available, Chord Board requires:

```text
CLASSICAL_GUITAR.lifecycle === ACTIVE
CLASSICAL_GUITAR.sampleReadiness === QUALIFIED
```

before selecting that path. A qualified path performs, inside the user's chord-button gesture:

1. `unlockFromUserGesture()`
2. `setInstrument("CLASSICAL_GUITAR")`
3. one concurrent `audition(...)` call for every sounding guitar string

Each audition receives exact MIDI plus physical `stringNumber` and `fret` evidence.

Legacy hosts that implement the audition contract but predate profile inspection remain compatible.

## Current qualification evidence

Fresh read of `khfy7wpr5p-maker/st-score-audio-engine` at commit
`26117ae90f213e208e06fb5c084fc0fad9f4ca86` shows:

- `CLASSICAL_GUITAR.lifecycle = SUSPENDED`
- `CLASSICAL_GUITAR.sampleReadiness = SUSPENDED`
- FreePats Spanish Classical Guitar manifest range: MIDI 40..84
- source revision: `6f4eb1b092acc88f5448cea1a0001bd07b971af8`
- redistribution mode: external runtime fetch

Therefore Chord Board does **not** treat that path as production-qualified today.

## Offline behavior

Chord lookup, diagrams, voicings and playback routing require no Render/backend service.

True offline guitar timbre depends on the selected audio host:
- if the editor bridge packages its guitar sound locally, chord playback can be fully offline;
- the current Score Audio FreePats manifest uses external runtime fetch, so that specific path is not yet a proof of full offline sample availability.

The development oscillator is only a diagnostic fallback and is not the intended guitar timbre.


## Stage 10 offline capability contract

An editor-owned bridge may optionally declare:

```js
window.ST_GUITAR_AUDIO = {
  capabilities: { offlineReady: true },
  playChord(payload) { /* ... */ }
};
```

Chord Board treats this declaration conservatively:

- `true` → host explicitly claims guitar playback assets are available offline;
- `false` → host explicitly says offline guitar playback is not ready;
- absent → offline status is unknown.

The UI never upgrades an unknown audio path to “offline ready”.

Fresh editor evidence at `seslitab-guitar-reader@49d76b8a2317b38bf728e20240258daa92b62c1e` shows use of `smplr` with `electric_guitar_jazz`, but does not by itself prove those soundfont assets are packaged locally.
