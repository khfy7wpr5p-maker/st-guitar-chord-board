# Tonal theory validation boundary

Stage 15 adds Tonal.js as a **development and CI cross-check**, not as a browser runtime dependency.

## Purpose

The Chord Board keeps ownership of:

- supported product vocabulary;
- canonical chord identity and Turkish presentation;
- guitar voicings and fingering metadata;
- string/fret -> MIDI playback payloads;
- offline-first runtime behavior.

Tonal independently resolves each canonical chord symbol and supplies a second pitch-class interpretation. CI compares that interpretation with both the local chord model and every displayed guitar voicing.

## Current contract

- package: `tonal@6.4.3`
- license: MIT
- scope: `devDependency`
- browser runtime import: **forbidden**
- service-worker app-shell inclusion: **forbidden**
- network requirement for installed application: **none**

All 96 canonical product chords are checked. Enharmonic display aliases such as `Bbmaj7` are first canonicalized by the existing ST parser, preserving the product rule that display spelling is separate from physical pitch identity.

## Why this is isolated

The installed Chord Board must continue to work offline without npm packages, a CDN, Render, or another backend. Tonal is therefore an independent regression oracle in development/CI. A future product expansion may use a separately reviewed adapter, but it must not silently replace ST chord search, naming, voicing selection, or offline guarantees.
