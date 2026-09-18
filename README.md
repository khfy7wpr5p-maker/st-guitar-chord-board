# ST Guitar Chord Board

Offline-first, phone-first interactive guitar chord surface.

## Current status — Stage 5

The app targets the complete initial matrix:

- **12 chromatic roots**
- **7 chord families:** major, minor, 7, maj7, m7, sus2, sus4
- **84 searchable chord symbols**
- **minimum 3 exact guitar voicings per chord**
- Turkish reading shown for every selected chord
- finger numbers and barre metadata
- exact string/fret -> MIDI playback payloads
- phone-first large tactile chord surface with a real six-string chord diagram
- no required backend or Render dependency

### Search and naming rule

Search is symbol-first. Typing familiar chord symbols is sufficient:

- `Am` → **La minör**
- `E` → **Mi majör**
- `G7` → **Sol yedili**
- `F#maj7` → **Fa diyez majör yedili**

The product does not require the user to enter chord tones such as `A C E`. Note-set chord search is outside the current product scope.

The C family retains curated open/open-region alternatives. The complete 84-chord matrix is backed by deterministic movable A/E/D-family shapes, transposed and octave-wrapped within fret 20. CI independently verifies that every generated voicing produces exactly the requested chord pitch classes.

The button contains no “Play” or “Dokun” label. Touching the chord surface itself is the play action.

The button renders a real guitar diagram: six strings, visible fret window, open/muted markers, finger numbers, base-fret labels for high positions, and barre geometry.

## Audio

The preferred runtime path directly supports an exposed `ST_SCORE_AUDIO_ENGINE`: the chord button unlocks audio from the user gesture, selects `CLASSICAL_GUITAR`, and sends one concurrent `audition(...)` request per sounding string. The editor-owned `ST_GUITAR_AUDIO.playChord(...)` bridge remains supported. A Web Audio oscillator exists only as a development fallback.

See [docs/AUDIO-INTEGRATION.md](docs/AUDIO-INTEGRATION.md).

## Run

```bash
npm test
npm run serve
```

Open `http://localhost:4173`.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```text
Chord Symbol Search
  -> Chord Core
  -> Turkish Display Name
  -> Curated / Movable Voicing Provider
  -> Fingering / Barre metadata
  -> Large Chord Button
  -> exact MIDI pitches
  -> ST Guitar Audio bridge
```

Cloud services may be added later for accounts or sync without becoming a prerequisite for chord lookup or playback.
