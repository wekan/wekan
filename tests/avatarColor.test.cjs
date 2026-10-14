'use strict';

// Guard: #2110 - minicard avatars in the order people were added, with their
// name as a tooltip, and a lasting colour per person.
// Run: node tests/avatarColor.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const a = require('../models/lib/avatarColor.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (x, y) => { const [l1, l2] = [luminance(x), luminance(y)].sort((p, q) => q - p); return (l1 + 0.05) / (l2 + 0.05); };

test('the same person, the same colour, every time', () => {
  assert.deepStrictEqual(a.avatarColors('u1'), a.avatarColors('u1'));
  assert.strictEqual(a.avatarColorStyle('abc'), a.avatarColorStyle('abc'));
  assert.strictEqual(a.avatarColorStyle(''), '', 'negative: no person, no colour');
});

test('people are spread over the colours', () => {
  const used = new Set(Array.from({ length: 2000 }, (_, i) => a.avatarColors(`user${i}`)[0]));
  assert.strictEqual(used.size, a.PALETTE.length);
});

test('every colour keeps the initials readable (WCAG AA, 4.5:1)', () => {
  for (const [bg, fg] of a.PALETTE) assert.ok(contrast(bg, fg) >= 4.5, `${fg} on ${bg}: ${contrast(bg, fg).toFixed(2)}`);
});

test('UI: the colour is on the initials avatar, the name is the tooltip, the order is the stored one', () => {
  assert.match(read('client/components/users/userAvatar.jade'), /svg\.avatar\.avatar-initials\([^)]*style="\{\{colorStyle\}\}"/);
  assert.match(read('client/components/users/userAvatar.jade'), /title="\{\{#if userData\}\}\{\{userData\.profile\.fullname\}\} \(\{\{userData\.username\}\}\)/);
  assert.match(read('client/components/users/userAvatar.css'), /\.avatar-initials text \{\s*fill: currentColor;/);
  // Members are drawn as stored, in the order they were added - not sorted.
  assert.match(read('client/components/cards/minicard.jade'), /each getMembers\n\s+\+userAvatar\(userId=this\)/);
  assert.doesNotMatch(read('models/cards.js').slice(read('models/cards.js').indexOf('  getMembers() {'), read('models/cards.js').indexOf('  getAssignees() {')), /\.sort\(/);
});

test('negative: the minicard no longer draws its avatars reversed', () => {
  const css = read('client/components/cards/minicard.css');
  const rule = sel => (css.match(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{([^}]*)\\}`)) || [])[1] || '';
  assert.doesNotMatch(rule('.minicard .minicard-members .member,\n.minicard .minicard-assignees .member'), /float: inline-end/);
  assert.match(css, /justify-content: flex-end;/);
});

console.log(`# ${passed} passed`);
