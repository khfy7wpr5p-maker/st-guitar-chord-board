# Architecture

## Product rule

The chord board is an offline-first, phone-first instrument surface. The selected chord is the primary large tactile control. There is no required backend.

## Runtime flow

```text
Search input
  -> Chord parser / normalizer
  -> Chord identity (root + quality)
  -> Voicing provider
  -> Fingering metadata
  -> Large chord button
  -> MIDI notes for exact selected voicing
  -> AudioAdapter
       -> preferred: ST editor / ST Score Audio guitar bridge
       -> development fallback only: Web Audio oscillator
```

## Stage boundaries

### Stage 0 — contracts
- chord identity
- supported quality vocabulary
- voicing shape contract
- host audio adapter contract
- offline-first policy

### Stage 1 — validated vertical slice
- C, Cm, C7, Cmaj7, Cm7, Csus2, Csus4
- >=3 voicings per chord
- open and barre examples
- finger numbers
- exact MIDI derivation from string/fret
- large phone control
- local search
- service-worker shell

### Stage 2 — generator integration
Replace the curated Stage-1 provider with an adapter over:
- `musicxml-to-guitar-tab-engine` fretboard / physical candidate authority
- `st-guitar-fingering-training` deterministic fingering/barre authority

Generated candidates must be validated independently before UI exposure.

### Stage 3 — harmonic search integration
Adapter over `st-guitar-harmonic-engine` for:
- root/quality semantics
- note-set -> candidate chord search
- enharmonic aliases
- later chord relations

### Stage 4 — production guitar audio
Connect to the existing editor/ST audio guitar playback bridge. The chord board sends exact MIDI pitches for the selected voicing; it does not synthesize or infer a different voicing in the audio layer.

### Stage 5 — expansion
- all 12 roots
- seven initial families: major, minor, 7, maj7, m7, sus2, sus4
- minimum three ranked guitar voicings each
- offline package qualification
- iPhone touch/audio validation

## Non-goals
- server-side chord calculation
- Render dependency for core use
- account/login in core
- AI-required chord lookup
- silent substitution of a different voicing
