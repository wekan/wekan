'use strict';

// #6840: "open due date by d sometimes not works ... this happens when the keyboard
// is not English (Farsi): it opens the popup but closes it at a glance."
//
// client/lib/keyboard.js re-dispatched every key typed on another script as its
// Latin key, a leftover from Mousetrap. hotkeys-js, which replaced it, resolves a
// key from event.code and keyCode itself, so a Farsi or Cyrillic key on the d key
// already ran the shortcut, and the copy ran it again: the due date editor opened
// and the repeat clicked the same control, closing it.
//
// Run: node tests/keyboardNonLatinOnce.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const keyboard = read('client/lib/keyboard.js');

test('keyboard.js no longer re-dispatches a keydown, so a shortcut runs once on every layout', () => {
  assert.doesNotMatch(keyboard, /new KeyboardEvent\('keydown'/, 'no synthetic keydown');
  assert.doesNotMatch(keyboard, /document\.dispatchEvent\(/, 'no re-dispatch');
  assert.doesNotMatch(keyboard, /window\.addEventListener\('keydown'/, 'the one keydown listener is hotkeys-js\'s');
  assert.match(keyboard, /\/\/ Handle non-Latin keyboards\n\/\/\n\/\/ Nothing to do here, on purpose \(#6840\)/, 'and the reason is written where the handler was');
});

test('negative, anywhere in client/: no other handler turns a typed character back into a Latin key', () => {
  const offenders = [];
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach(entry => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return entry.name === 'node_modules' ? null : walk(rel);
    if (!entry.name.endsWith('.js')) return null;
    if (/String\.fromCharCode\(e(vent)?\.(which|keyCode)\)/.test(read(rel))) offenders.push(rel);
    return null;
  });
  walk('client');
  assert.deepEqual(offenders, []);
});

test('hotkeys-js resolves a letter from event.code, so a non-Latin character on the d key is d', () => {
  // The library's own rule, read from the installed source: a Latin event.key wins,
  // then event.code 'Key<letter>' - which a Farsi or Cyrillic key has - then keyCode.
  const lib = read('node_modules/hotkeys-js/dist/hotkeys-js.js');
  const at = lib.indexOf('function getLayoutIndependentKeyCode');
  const fn = lib.slice(at, lib.indexOf('\n}\n', at) + 3);
  const resolve = vm.runInNewContext(`${fn}; getLayoutIndependentKeyCode`);
  const keyMap = {};
  const modifierMap = {};
  const press = event => resolve(event, keyMap, modifierMap);
  assert.equal(press({ key: 'd', code: 'KeyD', keyCode: 68 }), 68, 'Latin');
  assert.equal(press({ key: 'ی', code: 'KeyD', keyCode: 68 }), 68, 'Farsi');
  assert.equal(press({ key: 'в', code: 'KeyD', keyCode: 68 }), 68, 'Cyrillic');
  assert.equal(press({ key: 'ی', code: 'KeyD', keyCode: 0 }), 68, 'a browser that gives no keyCode for it');
  // and a key that is no letter of ours resolves to something else, not to d
  assert.notEqual(press({ key: 'ی', code: 'KeyS', keyCode: 83 }), 68);
});
