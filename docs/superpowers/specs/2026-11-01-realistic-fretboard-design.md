# Approved realistic guitar fretboard

The owner approved the MagicPath image in project `467390975682158592`, image
`467391591330484224`, and requested its implementation on 2026-11-01.

## Outcome and scope

Match the approved warm, light card, dark wooden fingerboard, wood edging, ivory
nut, metal frets, wound bass strings, thinner treble strings and ivory numbered
finger markers. Show string numbers 6–1 and actual fret numbers. The diagram
continues to represent the selected chord and position, including high positions
and barres. Keep the existing search, tuner, suggestions and relation/navigation
controls in their established locations.

## Approach

Extend the existing inline SVG renderer and CSS. SVG gradients and a small grain
pattern provide the approved material/light treatment, while the existing model
remains authoritative for geometry and finger placement. A fixed screenshot
cannot follow all 528 voicings; a WebGL scene would add dependencies and a second
rendering path. Neither is needed for the approved appearance.

The production design has no external image, font, CDN, runtime dependency or
animation. Preserve all chord data, MIDI, 500 ms audition sequencing, pointer
handlers, saved selection, accessibility labels and offline behavior. Existing
installs receive the updated assets through a new service-worker cache version.

## Acceptance

- Phone and iPad layouts have no horizontal overflow or clipped numeric labels.
- Open C and fifth-fret A show correct fingering, open/muted strings, string
  numbers and actual fret numbers; a high position never draws a nut.
- The complete unit suite, WebKit phone interactions, offline reload and packaged
  release-audio checks pass. Inspect fresh phone/iPad screenshots.
- Deliver on an isolated feature branch and PR; production merge is a separate
  action. MagicPath's API quota is exhausted, so the approved image already
  retrieved in this conversation is the reference, not an installable component.
