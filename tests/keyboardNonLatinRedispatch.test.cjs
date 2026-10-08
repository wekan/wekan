'use strict';
// The non-Latin keyboard handler in client/lib/keyboard.js re-dispatches a key
// typed on another script as its Latin key code, so shortcuts work on, e.g., a
// Cyrillic layout. It used to treat every SHIFTED Latin key as "another
// language" too ('D' is not 'd'), so each Shift shortcut fired twice: Shift+D
// (#6750) opened the due date editor and the duplicate closed it again.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('client/lib/keyboard.js', 'utf8');
const start = source.indexOf('// Handle non-Latin keyboards');
const handlerSource = source.slice(start, source.indexOf('\n});\n', start) + 5);
const body = {};
const dispatched = [];
let listener;
class KeyboardEvent { constructor(type, init) { Object.assign(this, { type }, init); } }
vm.runInNewContext(handlerSource, {
  window: { addEventListener: (type, fn) => { if (type === 'keydown') listener = fn; } },
  document: { body, dispatchEvent: event => dispatched.push(event) },
  KeyboardEvent,
});
assert.equal(typeof listener, 'function');
const press = (key, which, extra = {}) => { dispatched.length = 0; listener({ target: body, key, which, shiftKey: false, ...extra }); return dispatched.slice(); };

// Negative: Latin keys, shifted or not, and modifier keys are never duplicated.
assert.deepEqual(press('d', 68), []);
assert.deepEqual(press('D', 68, { shiftKey: true }), [], 'Shift+D must not fire twice');
assert.deepEqual(press('Shift', 16, { shiftKey: true }), [], 'Shift itself is not a character');
assert.deepEqual(press('!', 49, { shiftKey: true }), [], 'Shift+1 must not fire twice');
assert.deepEqual(press('Enter', 13), []);
// Negative: only keydowns on the page body, as before.
assert.deepEqual((() => { dispatched.length = 0; listener({ target: {}, key: 'в', which: 68 }); return dispatched.slice(); })(), []);

// Positive: a Cyrillic letter maps to its Latin key, with its modifiers.
const plain = press('в', 68);
assert.equal(plain.length, 1);
assert.equal(plain[0].key, 'd');
assert.equal(plain[0].shiftKey, false);
const shifted = press('В', 68, { shiftKey: true });
assert.equal(shifted.length, 1);
assert.equal(shifted[0].key, 'd');
assert.equal(shifted[0].shiftKey, true, 'Shift shortcuts keep working on non-Latin layouts');
// Negative: a non-Latin character on a key with no Latin letter or digit.
assert.deepEqual(press('ё', 192), []);

console.log('keyboardNonLatinRedispatch: shifted Latin keys are not duplicated; non-Latin letters still map');
