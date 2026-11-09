(() => {
  function timestamp(value) {
    const match = /^(?:(\d{2,}):)?([0-5]\d):([0-5]\d)[,.](\d{3})$/.exec(value);
    if (!match) return NaN;
    return Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
  }

  function plainText(value) {
    // Strip subtitle formatting, then decode entities. Never interpret subtitle text as HTML.
    const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
    return value.replace(/<[^>]*>/g, "").replace(/\{\\[^}]*\}/g, "")
      .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
        if (entity[0] !== "#") return entities[entity.toLowerCase()] || whole;
        const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
        return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
          ? String.fromCodePoint(code) : "�";
      }).trim();
  }

  function parse(source) {
    if (typeof source !== "string" || source.length > 5 * 1024 * 1024) throw new Error("Choose a subtitle file smaller than 5 MB.");
    const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
    const cues = [];
    let skipped = 0;
    for (const block of normalized.split(/\n[\t ]*\n/)) {
      const lines = block.split("\n");
      if (/^(WEBVTT(?:\s|$)|NOTE(?:\s|$)|STYLE(?:\s|$)|REGION(?:\s|$))/.test(lines[0])) continue;
      const timing = lines.findIndex(line => line.includes("-->"));
      if (timing < 0) { if (block) skipped++; continue; }
      const match = /^(\S+)\s+-->\s+(\S+)(?:\s+.*)?$/.exec(lines[timing].trim());
      const start = match ? timestamp(match[1]) : NaN;
      const end = match ? timestamp(match[2]) : NaN;
      const text = plainText(lines.slice(timing + 1).join("\n"));
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !text) { skipped++; continue; }
      cues.push({ start, end, text });
    }
    if (!cues.length) throw new Error("No valid subtitle cues found. Choose a UTF-8 SRT or VTT file.");
    cues.sort((a, b) => a.start - b.start || a.end - b.end);
    let maximum = 0;
    for (const cue of cues) { maximum = Math.max(maximum, cue.end); cue.maxEnd = maximum; }
    return { cues, skipped };
  }

  function at(cues, time) {
    let low = 0;
    let high = cues.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (cues[mid].start <= time) low = mid + 1;
      else high = mid;
    }
    const active = [];
    for (let i = low - 1; i >= 0 && cues[i].maxEnd > time; i--) {
      if (cues[i].end > time) active.push(cues[i].text);
    }
    return active.reverse().join("\n");
  }

  const api = { timestamp, plainText, parse, at };
  globalThis.BringYourSubtitles = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
