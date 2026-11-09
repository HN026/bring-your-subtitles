const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse, at, plainText } = require('../extension/subtitles.js');

test('SRT supports BOM, CRLF, multiline text, Unicode and comma timestamps', () => {
  const { cues } = parse('\uFEFF1\r\n00:00:01,200 --> 00:00:03,400\r\n<b>Hello</b> &amp; नमस्ते\r\nSecond line\r\n');
  assert.equal(at(cues, 1.199), '');
  assert.equal(at(cues, 1.2), 'Hello & नमस्ते\nSecond line');
  assert.equal(at(cues, 3.4), '');
});

test('VTT supports metadata, cue identifiers, settings, and skips notes/styles', () => {
  const { cues, skipped } = parse('WEBVTT\nKind: captions\n\nNOTE a comment\nignore\n\nSTYLE\n::cue { color: red }\n\nscene-a\n00:01.000 --> 00:02.500 align:start\n<v Speaker><i>Hello</i></v>');
  assert.equal(cues.length, 1);
  assert.equal(skipped, 0);
  assert.equal(at(cues, 1), 'Hello');
});

test('overlapping cues remain visible, including a long cue behind expired short ones', () => {
  const { cues } = parse('1\n00:00:00,000 --> 00:01:00,000\nLong\n\n2\n00:00:01,000 --> 00:00:02,000\nShort\n\n3\n00:00:04,000 --> 00:00:05,000\nLater');
  assert.equal(at(cues, 1.5), 'Long\nShort');
  assert.equal(at(cues, 10), 'Long');
  assert.equal(at(cues, 4.5), 'Long\nLater');
  assert.equal(at(cues, 0.5), 'Long');
  assert.equal(at(cues, -1), '');
});

test('malformed and reversed timestamps are skipped without discarding good cues', () => {
  const { cues, skipped } = parse('1\n00:99:01,000 --> 00:99:02,000\nBad\n\n2\n00:00:04,000 --> 00:00:03,000\nReversed\n\n3\n00:00:01,000 --> 00:00:02,000\nGood');
  assert.equal(cues.length, 1);
  assert.equal(skipped, 2);
});

test('untrusted markup becomes plain text and invalid entities do not crash parsing', () => {
  assert.equal(plainText('<img src=x onerror=alert(1)><b>Hi</b> &lt;script&gt; &#x110000;'), 'Hi <script> �');
  assert.equal(plainText('{\\an8}Hello &#128512;'), 'Hello 😀');
});

test('empty, unsupported and oversized input produces useful errors', () => {
  assert.throws(() => parse('not subtitles'), /No valid subtitle/);
  assert.throws(() => parse('x'.repeat(5 * 1024 * 1024 + 1)), /smaller than 5 MB/);
});

test('offset uses the video clock, with positive values delaying subtitles', () => {
  const { cues } = parse('1\n00:00:01,000 --> 00:00:02,000\nHello');
  assert.equal(at(cues, 1.5 - 1), '');
  assert.equal(at(cues, 2.5 - 1), 'Hello');
  assert.equal(at(cues, 0.5 - (-1)), 'Hello');
});
