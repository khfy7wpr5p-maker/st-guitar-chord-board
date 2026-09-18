# ST Guitar Chord Board

Offline-first, phone-first interactive guitar chord surface.

## Current status — Stage 11

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
- CI cross-checks against pinned ST fretboard, harmony and fingering authorities
- editor-first audio routing avoids suspended Score Audio guitar profiles
- explicit relative major/minor relation for basic major/minor chords
- iPhone-safe standalone PWA shell with safe-area/touch contracts
- offline app-shell fallback with same-origin bounded caching
- WebKit iPhone-profile browser smoke tests
- Chromium service-worker offline reload smoke test

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

### Chord relations

The product does not use the vague label “equivalent chord”. Relations are explicit:

- `C` → **Göreli minör: Am — La minör**
- `Am` → **Göreli majör: C — Do majör**

This relation is shown only for basic major/minor chords. Dominant-to-tonic relations are not inferred from a single chord because the Harmonic Engine requires explicit tonal context for that evidence.

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

Audio routing now prefers the editor-owned `ST_GUITAR_AUDIO.playChord(...)` bridge. The board reports “çevrimdışı hazır” only when that host explicitly declares `capabilities.offlineReady: true`. A separate `ST_SCORE_AUDIO_ENGINE` classical-guitar path is selected only when its profile is product-qualified (`ACTIVE + QUALIFIED`) when profile inspection is available. The current Score Audio guitar profile is suspended, so it is not treated as the preferred production path. A Web Audio oscillator remains development-only.

See [docs/AUDIO-INTEGRATION.md](docs/AUDIO-INTEGRATION.md).

Authority compatibility is documented in [docs/AUTHORITY-CROSSCHECK.md](docs/AUTHORITY-CROSSCHECK.md).

Mobile/browser qualification is documented in [docs/MOBILE-QUALIFICATION.md](docs/MOBILE-QUALIFICATION.md).

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
