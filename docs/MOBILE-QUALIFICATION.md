# Mobile qualification

## Automated browser gates

Stage 11 adds two deliberately separate browser gates.

### WebKit iPhone-profile smoke

Playwright WebKit runs with the `iPhone 13` device profile and verifies:

- application boot on a phone viewport;
- `Am` search -> `La minör`;
- same-root suggestion strip;
- relative-major relation card;
- relation navigation;
- voicing variation navigation;
- the large chord button remains within viewport width;
- tapping the large chord surface dispatches the exact MIDI/string-fret payload through an injected editor-style guitar bridge.

This is Safari/WebKit regression evidence, but it is **not** a physical iPhone qualification.

### Chromium offline-PWA smoke

Playwright currently exposes service-worker inspection/support only for Chromium-based browser automation. The offline gate therefore runs separately in Chromium and verifies:

- service worker installs and controls the page;
- the app shell is cached;
- after the browser context is forced offline, a reload still boots the application;
- the default `C / Do majör` surface remains available offline.

This proves the current app-shell offline behavior in automated browser CI. It does not prove that external guitar soundfont assets are locally packaged.

## Physical gate — owner acceptance recorded

Stage 23 records manual owner testing on a physical phone. No blocking defect was reported in normal product use.

This acceptance closes the current product-level phone gate. Automated WebKit/Chromium qualification continues to run in CI, and the manual pass must not be interpreted as an exhaustive device/browser matrix across every iPhone or Android model.
