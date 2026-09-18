# Architecture

## Product rule

The chord board is an offline-first, phone-first instrument surface. The selected chord is the primary large tactile control. There is no required backend.

## Runtime flow

```text
Search input
  -> Chord parser / normalizer
  -> Chord identity (root + quality)
  -> Voicing provider
       -> curated open/open-region voicings when available
       -> deterministic movable A/E/D-family generator
  -> Fingering / barre metadata
  -> Large chord button
  -> exact MIDI notes for selected string/fret voicing
  -> AudioAdapter
       -> preferred: ST editor / ST Score Audio guitar bridge
       -> development fallback only: Web Audio oscillator
```

## Implemented stages

### Stage 0 — contracts ✅
- chord identity
- supported quality vocabulary
- voicing shape contract
- host audio adapter contract
- offline-first policy

### Stage 1 — validated vertical slice ✅
- C, Cm, C7, Cmaj7, Cm7, Csus2, Csus4
- >=3 exact voicings per chord
- curated open/barre examples
- finger numbers
- exact MIDI derivation
- large phone control
- local search
- service-worker shell

### Stage 2 — 84-chord deterministic expansion
- 12 roots × 7 chord families
- three movable shape families per quality
- generated frets bounded to 0..20
- octave wrapping keeps high transpositions on the practical board
- exact pitch-class equality required in CI
- C-family curated open alternatives remain available

## Next stages

### Stage 3 — ST engine authority adapters
Cross-check generated candidates against:
- `musicxml-to-guitar-tab-engine` fretboard / physical candidate authority
- `st-guitar-fingering-training` deterministic fingering/barre authority
- `st-guitar-harmonic-engine` chord-identity authority

The chord-board runtime remains local; these integrations should produce or validate compact product data rather than introducing a server requirement.

### Stage 4 — production guitar audio (integration seam implemented)
The runtime adapter now supports the real ST Score Audio `audition()` contract and passes exact MIDI plus physical string/fret evidence for every sounding string. It also retains the editor-owned bridge.

Remaining product gate: explicitly resume/qualify the classical-guitar sample profile or bind the editor's already-qualified guitar sampler. The audio layer may not silently substitute a different voicing.

### Stage 5 — product hardening
- curated open-position library for common keys
- enharmonic display preference
- chord relations
- note-set -> chord search
- iPhone touch/audio qualification
- full offline asset qualification

## Non-goals
- server-side chord calculation
- Render dependency for core use
- account/login in core
- AI-required chord lookup
- silent substitution of a different voicing
