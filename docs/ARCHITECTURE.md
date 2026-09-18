# Architecture

## Product rule

The chord board is an offline-first, phone-first instrument surface. The selected chord is the primary large tactile control. There is no required backend.

## Runtime flow

```text
Symbol search input
  -> Local 84-chord catalog
  -> same-root suggestion family
  -> Chord parser / normalizer
  -> Turkish chord reading
  -> Voicing provider
       -> curated common open/open-region voicing when available
       -> curated C-family alternatives
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
- C-family vertical slice
- >=3 exact voicings per chord
- finger numbers
- exact MIDI derivation
- large phone control
- local search
- service-worker shell

### Stage 2 — 84-chord deterministic expansion ✅
- 12 roots × 7 chord families
- three movable shape families per quality
- generated frets bounded to 0..20
- exact pitch-class equality required in CI

### Stage 3 — ST audio contract integration ✅
- direct `ST_SCORE_AUDIO_ENGINE.audition()` adapter
- exact MIDI + physical string/fret evidence
- polyphonic chord dispatch
- editor-owned guitar bridge retained

### Stage 4 — tactile guitar diagram ✅
- six-string SVG chord chart
- open/mute markers
- finger numbers
- barre geometry
- automatic base-fret window

### Stage 5 — Turkish chord naming ✅
- symbol-first search
- Turkish reading under every selected symbol
- note-set search removed from product scope

### Stage 6 — search UX + common guitar positions
- offline 84-chord catalog
- compact same-root suggestion family
- selected symbol ranked first
- curated first-position/open alternatives for common A/E/D/G/B/F shapes
- deterministic movable shapes retained as additional variations
- no server dependency

## Next stages

### Stage 7 — engine authority cross-check ✅
Pinned compatibility baselines now cross-check product data against:
- `musicxml-to-guitar-tab-engine` standard tuning, six-string layout and 0..20 fret bounds;
- `st-guitar-harmonic-engine` exact major/minor/7/maj7/m7 and sus2/sus4 interval templates;
- `st-guitar-fingering-training` deterministic four-finger/barre resource boundary.

Every displayed voicing is checked in CI. The learned fingering ranker remains explicitly outside runtime because its source repository still records runtime/production authorization as false.

The chord-board runtime remains local; Stage 7 adds compatibility guards, not a backend or cross-repository runtime dependency.

### Stage 8 — mobile/audio qualification
- iPhone touch and layout checks
- explicit classical-guitar sample qualification or editor sampler binding
- full offline sample-asset qualification
- cache/version migration checks

### Stage 9 — chord relationship layer
If added, relationships must be explicitly categorized (for example same-root family, relative major/minor, or tonal-context relation). The UI must not call musically different chords “equivalent” without a precise relation definition.

## Non-goals
- server-side chord calculation
- Render dependency for core use
- account/login in core
- AI-required chord lookup
- note-set chord search
- silent substitution of a different voicing
