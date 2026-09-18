# ST Guitar Chord Board

Offline-first, phone-first interactive guitar chord surface.

## Current status — Stage 16

The app targets:

- **12 chromatic roots**
- **8 chord families:** major, minor, 7, maj7, m7, sus2, sus4, power chord (5)
- **96 searchable chord symbols**
- original 84 chords keep **3+ exact guitar voicings**
- the 12 power chords use **exactly 2 guitar positions**
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
- pinned build-time local guitar soundfont vendoring path
- same-origin local smplr bridge with explicit offlineReady capability
- enharmonic display spelling preserved for flat chord input
- Tonal.js development/CI theory cross-check across all 96 canonical chords and displayed voicings
- horizontal swipe navigation between chord voicings on the large chord surface

### Search and naming rule

Search is symbol-first:

- `Am` → **La minör**
- `E` → **Mi majör**
- `A5` → **La beş**
- `B5` → **Si beş**
- `C5` → **Do beş**
- `G7` → **Sol yedili**
- `Bb5` → **Si bemol beş**
- `Ebmaj7` → **Mi bemol majör yedili**

When a valid chord is entered, the compact suggestion strip shows the selected chord first and then the other supported qualities on the same root.

Enharmonic spelling is presentation-safe: `Bb5` and `A#5` use the same physical pitch/fret identity, but the interface keeps the spelling the user entered. Flat input also keeps flat same-root suggestions such as `Bb / Bbm / Bb7 / ... / Bb5`.

### Power chords

Power chords are a deliberately smaller product family:

- 12 roots: `C5` through `B5`
- harmonic set: root + perfect fifth
- displayed guitar shape may repeat the root at the octave
- exactly two positions:
  1. root on string 6
  2. root on string 5

Examples:

```text
A5: 5-7-7-x-x-x   | x-0-2-2-x-x
B5: 7-9-9-x-x-x   | x-2-4-4-x-x
C5: 8-10-10-x-x-x | x-3-5-5-x-x
```

Power chords do not receive relative-major/minor relation cards.

### Chord relations

The product does not use the vague label “equivalent chord”. Relations are explicit:

- `C` → **Göreli minör: Am — La minör**
- `Am` → **Göreli majör: C — Do majör**

This relation is shown only for basic major/minor chords.

### Guitar voicings

The original 84 chord identities retain the existing 3+ voicing rule. Power chords are the only current exception and intentionally expose exactly two positions.

CI verifies:

- all 96 canonical chords remain searchable;
- every displayed voicing contains exactly the requested pitch classes;
- all 12 power chords have exactly two positions;
- generated frets stay within the bounded guitar range;
- common open shapes remain prioritized.

The button contains no “Play” or “Dokun” label. Touching the chord surface itself is the play action.

On touch devices, swipe left/right directly on the large chord surface to move between voicings. Vertical gestures remain available for page scrolling. A recognized swipe suppresses the synthetic click that would otherwise play the chord accidentally. The existing ‹ / › controls remain available.

## Audio

Audio routing prefers the editor-owned `ST_GUITAR_AUDIO.playChord(...)` bridge. The board reports “çevrimdışı hazır” only when that host explicitly declares `capabilities.offlineReady: true`.

See [docs/AUDIO-INTEGRATION.md](docs/AUDIO-INTEGRATION.md).

Local offline-audio packaging is documented in [docs/LOCAL-AUDIO-PACKAGING.md](docs/LOCAL-AUDIO-PACKAGING.md).

Authority compatibility is documented in [docs/AUTHORITY-CROSSCHECK.md](docs/AUTHORITY-CROSSCHECK.md).

Tonal theory validation and its runtime isolation boundary are documented in [docs/TONAL-THEORY-VALIDATION.md](docs/TONAL-THEORY-VALIDATION.md).

Mobile/browser qualification is documented in [docs/MOBILE-QUALIFICATION.md](docs/MOBILE-QUALIFICATION.md).

## Run

```bash
npm test
npm run vendor:guitar-audio   # optional: prepare local guitar soundfont
npm run serve
```

Open `http://localhost:4173`.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Cloud services may be added later for accounts or sync without becoming a prerequisite for chord lookup or playback.


### Stage 15 — Tonal theory validation ✅
Implemented:
- pinned `tonal@6.4.3` as a development-only dependency;
- all 96 canonical chord identities are independently cross-checked against Tonal pitch classes;
- every displayed guitar voicing is cross-checked directly against the Tonal chord identity;
- power chords use Tonal's standard `5` chord definition;
- enharmonic display aliases are validated through the existing canonical ST identity;
- CI guards that Tonal is not imported by the browser app or service-worker app shell.

Runtime contract:
- ST remains authoritative for product vocabulary, Turkish naming, guitar voicings, fingering and playback payloads;
- Tonal is a development/CI regression oracle only;
- installed/offline use requires no Tonal CDN, npm runtime, backend or network connection.


### Stage 16 — swipe voicing navigation ✅
Implemented:
- swipe left selects the next voicing;
- swipe right selects the previous voicing;
- navigation is bounded at the first/last voicing;
- vertical gestures remain available for scrolling;
- recognized swipe suppresses the following synthetic click;
- normal tap-to-play and existing ‹ / › controls remain unchanged;
- WebKit iPhone smoke covers horizontal navigation, click suppression and vertical-gesture rejection.
