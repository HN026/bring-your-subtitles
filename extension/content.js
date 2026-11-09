(() => {
  if (globalThis.__bringYourSubtitles) return globalThis.__bringYourSubtitles.open();
  const player = document.querySelector("#movie_player");
  if (!player || !player.querySelector("video")) return { ok: false, error: "Start a YouTube video first, then click the extension again." };

  const host = document.createElement("div");
  host.style.cssText = "position:absolute;inset:0;z-index:2147483646;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "closed" });
  // Build with DOM APIs so page Trusted Types policies cannot block controls.
  const style = document.createElement("style");
  style.textContent = `
      :host { all: initial; }
      * { box-sizing: border-box; }
      [hidden] { display: none !important; }
      .panel { position: absolute; top: 12px; right: 12px; width: min(340px, calc(100% - 24px)); max-height: calc(100% - 24px); overflow: auto; padding: 18px; border: 1px solid #485367; border-radius: 14px; color: #f3f6fc; background: #151c28f5; box-shadow: 0 10px 35px #0008; font: 13px/1.5 system-ui, sans-serif; pointer-events: auto; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
      h2 { font-size: 16px; margin: 0; }
      button, input { font: inherit; }
      button { border: 1px solid #526176; border-radius: 7px; background: #2b384d; color: white; padding: 6px 10px; cursor: pointer; }
      button:hover { background: #405475; }
      button:focus-visible, input:focus-visible { outline: 2px solid #99bbff; outline-offset: 2px; }
      .upload { display: block; background: #d8e5ff; color: #102344; text-align: center; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 650; }
      .upload:focus-within { outline: 2px solid #99bbff; outline-offset: 2px; }
      .file { position: absolute; width: 1px; height: 1px; opacity: 0; }
      .status { overflow-wrap: anywhere; margin: 10px 0 14px; color: #c2cfe2; }
      label.setting { display: block; margin-top: 12px; }
      .row { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
      input[type=number] { min-width: 0; width: 100%; padding: 6px; border: 1px solid #526176; border-radius: 5px; background: #0e1520; color: white; }
      input[type=range] { width: 100%; accent-color: #9abbff; }
      .hint { color: #aebed4; font-size: 12px; margin: 6px 0; }
      .actions { display: flex; gap: 8px; margin-top: 14px; }
      .captions { position: absolute; bottom: 12%; left: 4%; width: 92%; text-align: center; white-space: pre-line; overflow-wrap: anywhere; color: white; font: 500 clamp(16px, 2.5vw, 32px)/1.35 system-ui, sans-serif; text-shadow: 0 2px 4px #000; }
      .text { background: #000b; border-radius: 4px; padding: 2px 7px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  `;
  shadow.append(style);
  function element(tag, attributes = {}, ...children) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    node.append(...children);
    return node;
  }
  const button = (id, title, label) => element("button", { id, ...(label ? { "aria-label": label } : {}) }, title);
  const hint = value => element("p", { class: "hint" }, value);
  const setting = (id, title) => element("label", { class: "setting", for: id }, title);
  shadow.append(
    element("section", { class: "panel", "aria-label": "Subtitle controls" },
      element("header", {}, element("h2", {}, "Bring Your Subtitles"), button("close", "✕", "Close subtitle controls")),
      element("label", { class: "upload" }, "Choose SRT or VTT file",
        element("input", { class: "file", id: "file", type: "file", accept: ".srt,.vtt,text/vtt,application/x-subrip" })),
      element("p", { class: "status", id: "status", role: "status" }, "Choose a local file, including one downloaded from a subtitle site."),
      setting("offset", "Subtitle delay (seconds)"),
      element("div", { class: "row" },
        button("earlier", "−0.5", "Show subtitles half a second earlier"),
        element("input", { id: "offset", type: "number", value: "0", step: "0.1", min: "-86400", max: "86400" }),
        button("later", "+0.5", "Show subtitles half a second later")),
      hint("Positive = later. Negative = earlier."),
      element("label", { class: "setting", for: "size" }, "Text size ", element("output", { id: "sizeLabel" }, "28"), " px"),
      element("input", { id: "size", type: "range", min: "14", max: "64", value: "28" }),
      element("label", { class: "setting", for: "position" }, "Height above bottom ", element("output", { id: "positionLabel" }, "12"), "%"),
      element("input", { id: "position", type: "range", min: "5", max: "70", value: "12" }),
      element("div", { class: "actions" }, button("toggle", "Hide subtitles"), button("clear", "Remove file")),
      hint("Files stay in this tab. Click the extension icon to reopen these controls. YouTube’s own captions can be turned off with CC.")),
    element("div", { class: "captions", hidden: "" }, element("span", { class: "text" }))
  );
  const $ = selector => shadow.querySelector(selector);
  const panel = $(".panel");
  const captions = $(".captions");
  const text = $(".text");
  const status = $("#status");
  $("#toggle").setAttribute("aria-pressed", "false");
  let cues = [];
  let offset = 0;
  let visible = true;
  let video = null;
  let frame = 0;
  let fileRevision = 0;
  const videoKey = () => {
    const url = new URL(location.href);
    return url.searchParams.get("v") || url.pathname;
  };
  let key = videoKey();

  function render() {
    const ad = host.parentElement?.classList.contains("ad-showing") || host.parentElement?.classList.contains("ad-interrupting");
    const next = visible && video && !ad && key === videoKey() ? BringYourSubtitles.at(cues, video.currentTime - offset) : "";
    if (text.textContent !== next) text.textContent = next;
    captions.hidden = !next;
  }
  function tick() {
    frame = 0;
    render();
    if (video && !video.paused && !video.ended && cues.length && visible) frame = requestAnimationFrame(tick);
  }
  function refresh() {
    cancelAnimationFrame(frame);
    tick();
  }
  function reset(message) {
    fileRevision++;
    cues = [];
    offset = 0;
    $("#offset").value = "0";
    $("#file").value = "";
    status.textContent = message;
    refresh();
  }
  function attach() {
    const current = document.querySelector("#movie_player");
    const nextVideo = current?.querySelector("video");
    const nextKey = videoKey();
    if (key !== nextKey) {
      key = nextKey;
      reset("New video. Choose its subtitle file.");
    }
    if (current && host.parentElement !== current) current.append(host);
    host.hidden = !nextVideo;
    if (nextVideo !== video) {
      if (video) for (const event of ["timeupdate", "seeked", "play", "pause", "ended", "ratechange"]) video.removeEventListener(event, refresh);
      video = nextVideo;
      if (video) for (const event of ["timeupdate", "seeked", "play", "pause", "ended", "ratechange"]) video.addEventListener(event, refresh);
      refresh();
    }
    render();
  }
  // Keep clicks and keyboard shortcuts in controls from reaching YouTube's player.
  for (const event of ["click", "dblclick", "keydown", "keyup", "pointerdown"]) panel.addEventListener(event, e => e.stopPropagation());
  $("#close").onclick = () => { panel.hidden = true; };
  $("#file").onchange = async event => {
    const file = event.target.files[0];
    if (!file) return;
    const revision = ++fileRevision;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Choose a file smaller than 5 MB.");
      const result = BringYourSubtitles.parse(await file.text());
      if (revision !== fileRevision) return;
      cues = result.cues;
      visible = true;
      $("#toggle").textContent = "Hide subtitles";
      $("#toggle").setAttribute("aria-pressed", "false");
      status.textContent = `${file.name} · ${cues.length} cues${result.skipped ? ` · ${result.skipped} invalid blocks skipped` : ""}`;
      refresh();
    } catch (error) {
      if (revision === fileRevision) status.textContent = `${error.message}${cues.length ? " Previous subtitles are still loaded." : ""}`;
    } finally {
      if (revision === fileRevision) event.target.value = "";
    }
  };
  function setOffset(value) {
    offset = Math.round(Math.max(-86400, Math.min(86400, Number(value) || 0)) * 10) / 10;
    $("#offset").value = String(offset);
    refresh();
  }
  $("#offset").oninput = event => {
    offset = Math.max(-86400, Math.min(86400, Number(event.target.value) || 0));
    refresh();
  };
  $("#offset").onchange = event => setOffset(event.target.value);
  $("#earlier").onclick = () => setOffset(offset - 0.5);
  $("#later").onclick = () => setOffset(offset + 0.5);
  $("#size").oninput = event => {
    captions.style.fontSize = `${event.target.value}px`;
    $("#sizeLabel").value = event.target.value;
  };
  captions.style.fontSize = "28px";
  $("#position").oninput = event => {
    captions.style.bottom = `${event.target.value}%`;
    $("#positionLabel").value = event.target.value;
  };
  $("#toggle").onclick = () => {
    visible = !visible;
    $("#toggle").textContent = visible ? "Hide subtitles" : "Show subtitles";
    $("#toggle").setAttribute("aria-pressed", String(!visible));
    refresh();
  };
  $("#clear").onclick = () => reset("Subtitles removed. Choose another file.");
  globalThis.__bringYourSubtitles = {
    open() {
      attach();
      panel.hidden = false;
      $("#file").focus();
      return video ? { ok: true } : { ok: false, error: "Start a YouTube video first." };
    }
  };
  player.append(host);
  attach();
  setInterval(attach, 750);
  return globalThis.__bringYourSubtitles.open();
})();
