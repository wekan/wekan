'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('client/lib/keyboard.js', 'utf8');
const filterSource = source.slice(source.indexOf('hotkeys.filter ='), source.indexOf('// Handle non-Latin keyboards'));
class Element {
  constructor(control = false) { this.control = control; }
  closest() { return this.control ? this : null; }
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
for (const control of [new HTMLInputElement(), new HTMLSelectElement(), new HTMLTextAreaElement(), new Element(true)]) {
  document.activeElement = control;
  assert.equal(hotkeys.filter(event), false, 'synthetic shortcuts respect focused controls');
  assert.equal(hotkeys.filter({ ...event, target: control }), false, 'native control targets stay protected');
}
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
