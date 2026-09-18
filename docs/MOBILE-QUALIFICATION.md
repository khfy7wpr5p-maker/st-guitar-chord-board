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

## Remaining physical gate

Before a production mobile claim, test on a real iPhone/Safari device:

1. add/open the PWA;
2. verify safe-area layout and scrolling;
3. search and switch chord variants;
4. tap the large chord surface repeatedly;
5. verify first-gesture audio unlock;
6. disconnect network;
7. relaunch the installed PWA;
8. verify chord search/diagrams;
9. verify guitar playback only if the editor host declares and demonstrates locally packaged audio assets.

A physical pass should be recorded separately; CI must not be used as a substitute for that evidence.
