# GitHub Pages Distribution

## Goal

Provide a free public delivery path for the offline-first PWA without requiring Render or any application backend.

## Expected URL

```text
https://khfy7wpr5p-maker.github.io/st-guitar-chord-board/
```

## One-time GitHub setting

In the repository:

```text
Settings
→ Pages
→ Build and deployment
→ Source
→ GitHub Actions
```

This repository setting cannot be changed by the current connected GitHub tool, so it must be selected once by a repository administrator.

## Automatic deployment

The workflow `.github/workflows/pages.yml` runs when `main` changes.

It:
1. checks out the repository;
2. installs Node dependencies;
3. executes `npm run build:release`;
4. verifies/downloads the pinned guitar soundfont as part of that build;
5. uploads `dist/` as the GitHub Pages artifact;
6. deploys the artifact through GitHub Pages.

No separate Pages-specific application build exists.

## Offline distribution model

Recipients need internet only for the first load or for receiving a newer release.

After first successful load:
- the Service Worker controls the app;
- application runtime assets are cached;
- the 2,330,622-byte guitar soundfont is cached;
- supported chords continue to use the local soundfont;
- the PWA can be launched later while offline.

## iPhone

Open the Pages URL in Safari, then use **Share → Add to Home Screen**.

## Android

Open the Pages URL in Chrome and choose the browser's **Install app / Add to Home screen** action when available.

Physical Android qualification is still separate from the automated Chromium browser evidence.

## Render migration

Do not disable the current Render site until GitHub Pages has been enabled and its deployed URL has been manually opened and checked.

After Pages is confirmed, Render can be disabled without changing the offline runtime architecture.
