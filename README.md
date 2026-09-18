# ST Guitar Chord Board

Offline-first, phone-first interactive guitar chord surface.

## Current status — Stage 6

The app targets the complete initial matrix:

- **12 chromatic roots**
- **7 chord families:** major, minor, 7, maj7, m7, sus2, sus4
- **84 searchable chord symbols**
- **minimum 3 exact guitar voicings per chord**
- Turkish reading shown for every selected chord
- compact same-root chord-family suggestions
- curated open/open-region first voicings for common guitar chords
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

When a valid chord is entered, the compact suggestion strip shows the selected chord first and then the other supported qualities on the same root. Example:

```text
Am | A | A7 | Amaj7 | Am7 | Asus2 | Asus4
```

This is deliberately described as the **same-root chord family**, not as harmonic equivalence.

The product does not require the user to enter chord tones such as `A C E`. Note-set chord search is outside the product scope.

### Guitar voicings

The C family retains curated open/open-region alternatives. Stage 6 also adds curated first-position/open alternatives for common A, E, D, G, B and F-family shapes where practical. Remaining positions continue to come from the deterministic movable A/E/D-family generator.

CI verifies:

- all 84 canonical chords remain searchable;
- every displayed voicing contains exactly the requested chord pitch classes;
- generated frets stay within the bounded guitar range;
- curated common shapes are exact and prioritized as the first variation.

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
  -> Local Chord Catalog / Same-root Suggestions
  -> Chord Core
  -> Turkish Display Name
  -> Curated Open + Movable Voicing Provider
  -> Fingering / Barre metadata
  -> Large Chord Button
  -> exact MIDI pitches
  -> ST Guitar Audio bridge
```

Cloud services may be added later for accounts or sync without becoming a prerequisite for chord lookup or playback.
