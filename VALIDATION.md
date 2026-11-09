# Validation — 2026-11-09

Status: local-file prototype implemented and automated checks passing. Live YouTube acceptance and store distribution are outstanding.

## Completed

- 11 Node tests passed: SRT/VTT parsing, Unicode, overlapping cues, backward seeks, timestamp validation, entity handling, malformed input, offset direction, Chrome/Firefox launcher API selection, page restrictions and injection error handling.
- 17 controlled-player checks passed in installed headless Google Chrome.
- The same 17 checks passed in installed headless Firefox.
- JavaScript syntax checks passed for the extension scripts.
- Controls use DOM creation APIs rather than HTML string injection. The fixture enables `require-trusted-types-for 'script'` to exercise this in supporting browsers.
- Browser checks use disposable profiles and a loopback-only fixture server. No user browser profile or settings were modified.

The browser fixture covers local file import, subtitle text treated as plain text, forward/backward seeking, delay controls, hide/show, known ad-state suppression, closing/reopening controls, font size, same-video navigation, replacement of the video element, repeated injection, clearing subtitles when the video changes and removing a file.

## Remaining acceptance

The automated fixture runs the extension's parser and overlay scripts against a controlled HTML video element. Launcher API tests use mock extension APIs. Neither proves installation, active-tab permission grants, toolbar popup behavior, real playback, fullscreen layout or compatibility with the current live YouTube player.

Before calling this release verified end to end, install it in both browsers and follow the manual acceptance steps in `README.md`, including fullscreen and navigation between YouTube videos.

## Deliberately deferred

- Browsing/searching subtitle providers, importing a URL and automatic subtitle matching. Files manually downloaded from providers can already be imported.
- Remembering subtitles/settings across reloads, timing drift correction, ASS/SSA and archive support.
- Store submission/signing. Firefox loading is temporary until the extension is signed; Chrome can use the unpacked directory in developer mode.
