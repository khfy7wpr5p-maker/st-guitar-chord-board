# ST Guitar Chord Board

Offline-first, phone-first interactive guitar chord surface.

## Current status — Stage 2

The app now targets the complete initial matrix:

- **12 chromatic roots**
- **7 chord families:** major, minor, 7, maj7, m7, sus2, sus4
- **84 searchable chords**
- **minimum 3 exact guitar voicings per chord**
- finger numbers and barre metadata
- exact string/fret -> MIDI playback payloads
- phone-first large tactile chord surface
- no required backend or Render dependency

The C family retains curated open/open-region alternatives. The complete 84-chord matrix is backed by deterministic movable A/E/D-family shapes, transposed and octave-wrapped within fret 20. CI independently verifies that every generated voicing produces exactly the requested chord pitch classes.

The button contains no “Play” or “Dokun” label. Touching the chord surface itself is the play action.

## Audio

The preferred runtime path is the existing ST guitar playback host through `window.ST_GUITAR_AUDIO.playChord(...)`. A Web Audio oscillator exists only as a development fallback; it is not the intended final guitar timbre.

## Run

```bash
npm test
npm run serve
```

Open `http://localhost:4173`.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```text
Chord Search
  -> Chord Core
  -> Curated / Movable Voicing Provider
  -> Fingering / Barre metadata
  -> Large Chord Button
  -> exact MIDI pitches
  -> ST Guitar Audio bridge
```

Cloud services may be added later for accounts or sync without becoming a prerequisite for chord lookup or playback.
