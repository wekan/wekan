'use strict';
// JSON read a chunk at a time (server/lib/streamJson.js), so an uploaded JSON
// export is never one string: the same value as JSON.parse, whatever the
// chunk boundaries, and the same refusals.
// Run: node --test tests/streamJson.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const { Readable } = require('node:stream');
const { JsonStreamParser, parseJsonStream, parseJsonText, MAX_DEPTH } = require('../server/lib/streamJson');

// A random document with every kind of value, escapes and astral characters.
function randomValue(rng, depth = 0) {
  const pick = rng() * (depth > 4 ? 6 : 8) | 0;
  if (pick === 0) return null;
  if (pick === 1) return rng() < 0.5;
  if (pick === 2) return Math.round((rng() - 0.5) * 1e6) / (rng() < 0.5 ? 1 : 1000);
  if (pick === 3) return -0.5e-7;
  if (pick === 4 || pick === 5) {
    const parts = ['plain', 'ä€', '"quoted"', 'back\\slash', 'line\nbreak', '\t', '😀𝄞', '\u0001', '/', ' '];
    return Array.from({ length: rng() * 4 | 0 }, () => parts[rng() * parts.length | 0]).join('');
  }
  if (pick === 6) return Array.from({ length: rng() * 5 | 0 }, () => randomValue(rng, depth + 1));
  const o = {};
  for (let n = rng() * 5 | 0; n > 0; n -= 1) o[`k${rng() * 100 | 0}${['', 'ö', '"', '😀'][rng() * 4 | 0]}`] = randomValue(rng, depth + 1);
  return o;
}
function chunks(text, rng) {
  const out = [];
  for (let i = 0; i < text.length;) { const n = 1 + (rng() * 7 | 0); out.push(text.slice(i, i + n)); i += n; }
  return out;
}
let seed = 42;
const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

test('the same value as JSON.parse for 500 random documents in random chunks', () => {
  for (let n = 0; n < 500; n += 1) {
    const text = JSON.stringify(randomValue(rng), null, n % 3 ? 0 : 2);
    const parser = new JsonStreamParser();
    for (const part of chunks(text, rng)) parser.write(part);
    assert.deepStrictEqual(parser.end(), JSON.parse(text), text.slice(0, 80));
  }
});

test('a file read as a stream, a byte order mark, and escapes split between chunks', async () => {
  const text = '\uFEFF{"a":[1,2,{"b":"\\u00e4\\ud83d\\ude00\\n"}],"c":-12.5e2,"d":true,"e":null}';
  const stream = Readable.from(chunks(text, rng));
  assert.deepStrictEqual(await parseJsonStream(stream), { a: [1, 2, { b: 'ä😀\n' }], c: -1250, d: true, e: null });
  assert.strictEqual(parseJsonText('  "x"  '), 'x');
  assert.strictEqual(parseJsonText('0'), 0);
});

test('a key named __proto__ is an own property, never the prototype', () => {
  const value = parseJsonText('{"__proto__":{"polluted":true},"a":1}');
  assert.strictEqual(Object.getPrototypeOf(value), Object.prototype);
  assert.deepStrictEqual(Object.keys(value), ['__proto__', 'a']);
  assert.strictEqual({}.polluted, undefined);
  assert.deepStrictEqual(parseJsonText('{"a":1,"a":2}'), { a: 2 }, 'the last duplicate wins, as JSON.parse');
});

test('negative: what JSON.parse refuses is refused', () => {
  for (const bad of ['', '{', '[1,]', '{"a":1,}', '{"a" 1}', '[1 2]', '01', '1.', '.5', '+1', 'tru', 'nul', '"a', '"\\x"',
    '"\\u12"', '"a\nb"', '{a:1}', '[1]]', '1 2', '{"a":1}{}', "'a'", 'NaN', 'Infinity']) {
    assert.throws(() => parseJsonText(bad), SyntaxError, JSON.stringify(bad));
    assert.throws(() => JSON.parse(bad), SyntaxError, `JSON.parse also refuses ${JSON.stringify(bad)}`);
  }
  assert.throws(() => parseJsonText('['.repeat(MAX_DEPTH + 1) + ']'.repeat(MAX_DEPTH + 1)), /nested deeper/);
  assert.deepStrictEqual(parseJsonText('['.repeat(MAX_DEPTH) + ']'.repeat(MAX_DEPTH)).length, 1);
});

test('the upload reader parses JSON from the file as a stream', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'server/lib/importUploadSource.js'), 'utf8');
  assert.match(src, /parseJsonStream\(fs\.createReadStream\(file/);
});
