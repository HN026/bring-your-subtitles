/* global browser, chrome */
(async () => {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const status = document.getElementById("status");
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab?.url || "about:blank");
    if (url.protocol !== "https:" || !["www.youtube.com", "youtube.com"].includes(url.hostname)) {
      status.textContent = "Open a video on youtube.com, then click this extension again.";
      return;
    }
    const results = await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["subtitles.js", "content.js"]
    });
    const result = results?.[0]?.result;
    if (result?.ok) window.close();
    else status.textContent = result?.error || "Couldn't open controls. Reload YouTube and try again.";
  } catch (error) {
    status.textContent = `Couldn't open controls. Reload the video and try again. ${error.message}`;
  }
})();
