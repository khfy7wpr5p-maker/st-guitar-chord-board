# ST Guitar Chord Board

Offline-first, phone-first interactive guitar chord surface.

## Stage 1

The first validated vertical slice provides:

- local chord search for `C`, `Cm`, `C7`, `Cmaj7`, `Cm7`, `Csus2`, `Csus4`;
- Turkish aliases such as `Do majör`;
- one large tactile chord button designed as the primary phone interaction;
- finger numbers, open/muted strings and barre metadata;
- at least three exact guitar voicings for every Stage-1 chord;
- exact string/fret -> MIDI playback payloads;
- an audio adapter for the existing ST guitar playback host;
- a development-only Web Audio fallback;
- service-worker application-shell caching;
- no required backend or Render dependency.

The button contains no “Play” or “Dokun” label. Touching the chord surface itself is the play action.

## Run

```bash
npm test
npm run serve
```

Open `http://localhost:4173`.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Core direction:

```text
Chord Search
  -> Chord Core
  -> Voicing Provider
  -> Fingering / Barre
  -> Large Chord Button
  -> exact MIDI pitches
  -> ST Guitar Audio bridge
```

The core is intentionally backend-free. Cloud services can be added later for accounts or sync without becoming a prerequisite for chord lookup or playback.
