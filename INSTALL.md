# Install Bring Your Subtitles

## Chrome

1. Unzip the release archive.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked**, then select the unzipped folder containing `manifest.json`.
4. Open a YouTube video and click **Bring Your Subtitles** in Chrome's extensions menu.
5. Click **Choose SRT or VTT file** inside the video player.

## Firefox 140+

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and choose the release ZIP, or its extracted `manifest.json`.
3. Open a YouTube video, click the extension icon, then choose a subtitle file.

Firefox removes temporary add-ons after a browser restart. Permanent installation requires a Mozilla-signed package.

## Watching

Positive delay shows subtitles later; negative delay shows them earlier. Adjust size and position as needed. Close the controls to watch; click the extension icon to reopen them. Turn off YouTube's own CC if captions overlap.

Use UTF-8 SRT or VTT files up to 5 MB. Download and unzip files from subtitle sites before selecting them. Files are cleared when changing videos or refreshing the page.

This is an unsigned prototype. Live YouTube acceptance remains outstanding; subtitle-site search and automatic matching are not included.

Source and issue tracker: https://github.com/HN026/bring-your-subtitles
