# Contributing

Open an issue for a bug or proposed change. For playback bugs, include the browser/version, whether the player was in fullscreen, and a minimal subtitle example you have permission to share. Do not attach private subtitle files or credentials.

The extension has no build dependencies. Use Node.js 22 or newer and Python 3.10 or newer:

```sh
node --test tests/*.test.cjs
node --check extension/content.js
node --check extension/popup.js
python3 scripts/package.py
```

On macOS with Chrome and Firefox installed, run `python3 tests/check-browsers.py` for the controlled-player checks. See [VALIDATION.md](VALIDATION.md) for the distinction between these checks and live YouTube acceptance.

Keep subtitle content out of HTML sinks, preserve the narrow permission scope, and document any new data transmission or provider integration. Update the changelog for user-visible changes.
