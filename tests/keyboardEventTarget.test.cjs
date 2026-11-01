'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('client/lib/keyboard.js', 'utf8');
const filterSource = source.slice(source.indexOf('hotkeys.filter ='), source.indexOf('// Handle non-Latin keyboards'));
// `control` is the one selector this fake element matches - 'button',
// 'a[href]' (a link, such as the minicard itself), '[role="tab"]' - or none.
class Element {
  constructor(control = null) { this.control = control; }
  closest(selectors) {
    return this.control && selectors.split(',').map(s => s.trim()).includes(this.control) ? this : null;
  }
}
class HTMLInputElement extends Element {}
class HTMLSelectElement extends Element {}
class HTMLTextAreaElement extends Element {}
const document = { activeElement: new Element() };
let user = null;
let selection = 'Caret';
const hotkeys = {};
vm.runInNewContext(filterSource, {
  hotkeys, document, Element, HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement,
  ReactiveCache: { getCurrentUser: () => user },
  window: { getSelection: () => ({ type: selection }) },
});
const event = { target: document, keyCode: 87 };
assert.equal(hotkeys.filter(event), true, 'document-targeted shortcut uses the active body');
assert.equal(hotkeys.filter({ keyCode: 87 }), true, 'missing target uses the active element');
for (const control of [new HTMLInputElement(), new HTMLSelectElement(), new HTMLTextAreaElement()]) {
  document.activeElement = control;
  assert.equal(hotkeys.filter(event), false, 'synthetic shortcuts respect focused text controls');
  assert.equal(hotkeys.filter({ ...event, target: control }), false, 'native control targets stay protected');
}
// A01: a focused control keeps the keys it uses itself - Enter for all of
// them, Space for a button (so Space still activates it instead of toggling a
// card member), End/Home/arrows for a tab.
const ownKeys = [
  ['button', [13, 32]],
  ['a[href]', [13]],
  ['[role="tab"]', [13, 35, 36, 37, 38, 39, 40]],
];
for (const [kind, keys] of ownKeys) {
  const control = new Element(kind);
  document.activeElement = control;
  for (const keyCode of keys) {
    assert.equal(hotkeys.filter({ target: control, keyCode }), false, `focused ${kind} keeps key ${keyCode}`);
    assert.equal(hotkeys.filter({ target: document, keyCode }), false, `synthetic key ${keyCode} respects the focused ${kind}`);
  }
  // #6755: closing a popup returns focus to the button that opened it, and a
  // click on a minicard leaves the minicard's link focused. Letter, digit and
  // ? shortcuts were then refused until a reload; they must pass.
  for (const keyCode of [68, 81, 65, 87, 49, 191]) {
    assert.equal(hotkeys.filter({ target: control, keyCode }), true, `#6755: key ${keyCode} works with a ${kind} focused`);
    assert.equal(hotkeys.filter({ target: document, keyCode }), true, `#6755: synthetic key ${keyCode} works with a ${kind} focused`);
  }
}
// #6755: Space is not a link's own key, so on a focused minicard it is the
// board's Space shortcut; the arrows are not a button's or a link's.
const link = new Element('a[href]');
assert.equal(hotkeys.filter({ target: link, keyCode: 32 }), true, '#6755: Space on a focused minicard link is a shortcut');
for (const keyCode of [38, 40]) {
  assert.equal(hotkeys.filter({ target: link, keyCode }), true, `key ${keyCode} on a focused link is a shortcut`);
  assert.equal(hotkeys.filter({ target: new Element('button'), keyCode }), true, `key ${keyCode} on a focused button is a shortcut`);
}
document.activeElement = new Element();
document.activeElement = Object.assign(new Element(), { isContentEditable: true });
assert.equal(hotkeys.filter(event), false);
document.activeElement = null;
assert.equal(hotkeys.filter(event), false, 'no focus must not throw or run a shortcut');
assert.equal(hotkeys.filter({ ...event, keyCode: 27 }), true, 'Escape remains available');
document.activeElement = new Element();
selection = 'Range';
assert.equal(hotkeys.filter(event), false);
selection = 'Caret';
user = { isKeyboardShortcuts: () => false };
assert.equal(hotkeys.filter(event), false);
console.log('keyboardEventTarget: native and document-targeted shortcuts preserve focus guards');
