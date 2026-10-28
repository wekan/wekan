'use strict';

// GitHub CodeQL alert 591 (js/insecure-randomness, CWE-338): the key that lets
// a request read the SERVER's dynamic modules (packages/dynamic-import, the
// ?key= of /__meteor__/dynamic-import/fetch) came from Math.random(), whose
// xorshift128+ state can be recovered from its earlier outputs, and was
// compared with ===. meteor shell's connection key, which runs code in the
// server process, was made the same way. Both forks (rebased onto Meteor 3.6-rc.1, see
// docs/Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md) take their keys from
// the crypto RNG now and compare them in constant time.
// Run: node tests/meteorForkRandomKeys.test.cjs

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function cut(src, start) {
  const at = src.indexOf(start);
  assert.notStrictEqual(at, -1, `not found: ${start}`);
  let depth = 0;
  for (let i = src.indexOf('{', at); i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}' && --depth === 0) return src.slice(at, i + 1);
  }
  throw new Error(`unbalanced: ${start}`);
}

const di = read('packages/dynamic-import/server.js');
const shell = read('packages/shell-server/shell-server.js');
const ctx = { randomBytes: crypto.randomBytes, timingSafeEqual: crypto.timingSafeEqual, Buffer };
const { randomId, diKeyMatches } = vm.runInNewContext(`(() => {
  ${cut(di, 'function randomId(n) {')}
  ${cut(di, 'function keyMatches(given, expected) {')}
  return { randomId, diKeyMatches: keyMatches };
})()`, ctx);
const shellKeyMatches = vm.runInNewContext(`(${cut(shell, 'function keyMatches(given, expected) {')})`, ctx);

test('the dynamic-import server key is 40 hex characters from the crypto RNG, never repeated', () => {
  const keys = new Set();
  for (let i = 0; i < 2000; i += 1) {
    const key = randomId(40);
    assert.match(key, /^[0-9a-f]{40}$/);
    keys.add(key);
  }
  assert.strictEqual(keys.size, 2000);
  assert.match(di, /client\.setSecretKey\(info\.key = randomId\(40\)\)/);
});

test('the meteor shell key is 128 bits from the crypto RNG', () => {
  assert.match(shell, /this\.key = randomBytes\(16\)\.toString\("hex"\);/);
});

for (const [name, keyMatches] of [['dynamic-import', diKeyMatches], ['meteor shell', shellKeyMatches]]) {
  test(`${name}: a key matches only itself, compared in constant time`, () => {
    const key = randomId(40);
    assert.strictEqual(keyMatches(key, key), true);
    assert.strictEqual(keyMatches(key.slice(0, 39), key), false, 'a shorter guess');
    assert.strictEqual(keyMatches(`${key}0`, key), false, 'a longer guess');
    assert.strictEqual(keyMatches(key.replace(/.$/, c => (c === '0' ? '1' : '0')), key), false, 'one character wrong');
    for (const bad of [undefined, null, 42, [key], { toString: () => key }]) {
      assert.strictEqual(keyMatches(bad, key), false, `not a string: ${String(bad)}`);
    }
    assert.strictEqual(keyMatches('', undefined), false, 'no key set is no match');
  });
}

test('both forks decide with keyMatches, not ===', () => {
  assert.match(cut(di, 'function getPlatform(request) {'), /keyMatches\(secretKey, dynamicImportInfo\[p\]\.key\)/);
  assert.ok(!/secretKey === dynamicImportInfo/.test(di), 'the key is not compared with ===');
  assert.match(shell, /if \(!keyMatches\(options\.key, this\.key\)\)/);
  assert.ok(!/options\.key !== this\.key/.test(shell), 'the shell key is not compared with !==');
});

test('negative: no Math.random() anywhere in the forks, outside their tests', () => {
  for (const name of require('./lib/meteorPackageForks.cjs').METEOR_PACKAGE_FORKS) {
    const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
      const rel = path.join(dir, e.name);
      if (e.name === '.npm' || e.name === 'node_modules') return [];
      return e.isDirectory() ? walk(rel) : [rel];
    });
    for (const rel of walk(`packages/${name}`)) {
      if (!/\.(c?m?js|ts)$/.test(rel) || /tests?[^/]*\.js$|_tests\.js$|-tests\.js$/.test(rel)) continue;
      const code = read(rel).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      assert.ok(!/Math\.random\(/.test(code), `${rel} uses Math.random()`);
    }
  }
});

test('negative: no key, secret, token, nonce, salt, password or code is made from Math.random() anywhere', () => {
  const SHAPE = /\b\w*(?:key|secret|token|nonce|salt|passw|code)\w*\s*(?:=|:)\s*[^;\n]*Math\.random\(/i;
  // The check finds what CodeQL found.
  assert.ok(SHAPE.test('    this.key = Math.random().toString(36).slice(2);'));
  assert.ok(SHAPE.test('client.setSecretKey(info.key = randomId(40)); const resetToken = Math.random();'));
  const hits = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.npm', '_build', '.build', 'tests', 'fontawesome-free'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (/\.(c?m?js|ts)$/.test(e.name) && !/_tests?\.js$|-tests?\.js$|\.tests\.js$/.test(e.name)) {
        read(rel).split('\n').forEach((line, i) => {
          if (SHAPE.test(line.replace(/\/\/.*$/, ''))) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
        });
      }
    }
  };
  ['client', 'server', 'models', 'imports', 'packages', 'config'].forEach(walk);
  assert.deepStrictEqual(hits, [], 'use crypto.randomBytes / crypto.getRandomValues / Random.secret()');
});

console.log(`\n${passed} passed`);
