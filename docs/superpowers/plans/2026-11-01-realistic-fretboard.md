# Realistic Fretboard Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement the approved work in this session.

**Goal:** Apply the approved MagicPath guitar materials to every existing chord diagram.

**Architecture:** Keep `buildChordDiagramModel` and all application behavior intact. Extend only the inline SVG presentation, board CSS and offline asset version.

**Tech Stack:** Existing JavaScript, SVG, CSS, Node test runner and Playwright.

**Spec:** `docs/superpowers/specs/2026-11-01-realistic-fretboard-design.md`

## Global Constraints

- No new runtime dependency, remote asset or animation.
- Preserve all chord data, MIDI, 500 ms audition sequencing, pointer handlers, saved selection, accessibility labels and offline behavior.
- Retain `.string-line`, `.fret-line`, `.nut-line`, `.barre-mark` and `.finger-position` semantics.

## Review Focus

- High-position fret numbers must follow the selected position and omit the nut.
- Finger markers must remain centered on their strings and inside fret cells.
- String/fret labels must stay readable on narrow phones and on iPad.
- Swipe, tap, accessible activation and tuner controls must still work.
- Offline/release builds must include all visual resources without remote requests.

### Task 1: Apply and verify the approved appearance

**Files:** Modify `src/diagram-model.js`, `styles.css`, `index.html`, `service-worker.js`, `package.json`, `README.md`, `docs/ARCHITECTURE.md`, `test/diagram-model.test.js`, `e2e/ui-visual.spec.js`.

**Interfaces:** Consume unchanged `renderChordDiagramSvg(voicing)` and existing `buildChordDiagramModel(voicing)`. Produce the same public SVG with dark wood/metal/ivory materials and visible `.string-number`/`.fret-number` text.

- [ ] Add renderer tests for visible strings `[6,5,4,3,2,1]`, open-position frets `[1,2,3,4,5]` and high-position frets `[5,6,7,8,9]`; run `node --test test/diagram-model.test.js` and confirm the missing-label failures.
- [ ] Add browser coverage for those labels, marker alignment and iPad bounds; use existing tap/swipe/offline/accessibility checks for unchanged contracts.
- [ ] Add inline material definitions, neck layers, wound strings, ivory markers and labels; preserve model/handlers. Update board colors and sizing to the reference.
- [ ] Bump release to `0.22.0`, service-worker cache to `v29` and entry asset query to `32-1`; document the design boundary.
- [ ] Run `npm test`, `npm run test:browser`, `npm run build:release`, `npm run test:release`; inspect fresh phone/iPad screenshots and diff.
- [ ] Commit the feature, independently review the complete diff, fix material findings, and prepare a GitHub PR from the pinned upstream base `4e7f76242e56e703f9f37ad28509c6362d0d3833`.
