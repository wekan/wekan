'use strict';

// Escape closes a popup or a menu even for a member who turned keyboard
// shortcuts off (WCAG 2.1.2, 1.4.13). The hotkeys filter returned false for
// such a member before it reached its "always handle escape" line, so every
// popup stayed open - found by tests/playwright/specs/feature-help.e2e.js.
// Run: node --test tests/escapeWithoutShortcuts.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'client/lib/keyboard.js'), 'utf8');
const filter = src.slice(src.indexOf('hotkeys.filter = (event) => {'), src.indexOf('// We can trigger events!'));

test('Escape is let through before the keyboard-shortcuts setting is looked at', () => {
  const escape = filter.indexOf('if (event.keyCode === 27)');
  const setting = filter.indexOf('isKeyboardShortcuts()');
  assert.ok(escape > 0 && setting > 0);
  assert.ok(escape < setting, 'Escape first');
});

// The filter, run as the browser would, for a member with shortcuts off.
test('negative: for a member with shortcuts off, Escape passes and any other key does not', () => {
  const body = `${filter.replace('hotkeys.filter = ', 'return ')}return true;\n};`;
  const make = new Function('ReactiveCache', 'window', 'Element', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'document', body);
  const run = make({ getCurrentUser: () => ({ isKeyboardShortcuts: () => false }) }, { getSelection: () => ({ type: 'None' }) },
    class {}, class {}, class {}, class {}, { activeElement: null });
  assert.equal(run({ keyCode: 27, target: {} }), true);
  assert.equal(run({ keyCode: 70, target: {} }), false);
});
