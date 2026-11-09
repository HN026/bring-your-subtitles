const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../extension/popup.js'), 'utf8');

async function popup({ namespace = 'chrome', url = 'https://www.youtube.com/watch?v=demo', result = { ok: true }, failure } = {}) {
  const status = { textContent: '' };
  const calls = [];
  let closed = false;
  const api = {
    tabs: { query: async () => [{ id: 12, url }] },
    scripting: { executeScript: async request => {
      calls.push(request);
      if (failure) throw new Error(failure);
      return [{ result }];
    } }
  };
  const context = { URL, document: { getElementById: () => status }, window: { close: () => { closed = true; } }, [namespace]: api };
  await vm.runInNewContext(source, context);
  return { status: status.textContent, calls, closed };
}

for (const namespace of ['chrome', 'browser']) {
  test(`${namespace} API injects both scripts into the active tab`, async () => {
    const result = await popup({ namespace });
    assert.equal(result.closed, true);
    assert.equal(result.calls[0].target.tabId, 12);
    assert.deepEqual(Array.from(result.calls[0].files), ['subtitles.js', 'content.js']);
  });
}

test('unsupported pages and lookalike domains cannot trigger injection', async () => {
  for (const url of ['https://example.com', 'https://youtube.com.example.com/watch', 'http://www.youtube.com/watch', 'about:blank']) {
    const result = await popup({ url });
    assert.equal(result.calls.length, 0);
    assert.match(result.status, /Open a video/);
  }
});

test('player-not-ready and browser permission failures stay visible', async () => {
  const missing = await popup({ result: { ok: false, error: 'Start a video first.' } });
  assert.equal(missing.closed, false);
  assert.equal(missing.status, 'Start a video first.');
  const failed = await popup({ failure: 'Permission denied' });
  assert.equal(failed.closed, false);
  assert.match(failed.status, /Permission denied/);
});
