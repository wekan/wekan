'use strict';

// #6872: "Requested by" (and "Assigned by") never reached the minicard. The
// opened card's + button picks board members into card.requesters /
// card.assigners (user ids, cardIdentityPicker), and the free-text
// requestedBy / assignedBy is optional - but the minicard only drew the free
// text, so a requester picked the usual way was not shown at all. And the
// field's icon was a cart on the card and the minicard but a head with a plus
// in Card Settings, with Assigned by the other way round.
// Run: node tests/minicardRequestedAssignedBy6872.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

const minicardJade = read('client/components/cards/minicard.jade');
const minicardJs = read('client/components/cards/minicard.js');
const detailsJade = read('client/components/cards/cardDetails.jade');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows');

// The `if $eq field "<key>"` block of a template, up to the next field.
function block(src, key) {
  const start = src.indexOf(`if $eq field "${key}"`);
  assert.ok(start >= 0, key);
  const next = src.indexOf('if $eq field "', start + 1);
  return src.slice(start, next < 0 ? undefined : next);
}
const rowOf = key => CARD_SETTINGS_ROWS.find(r => r.key === key);

const FIELDS = [
  { key: 'requestedBy', ids: 'getRequesters', text: 'getRequestedBy', helper: 'hasRequestedByOnMinicard' },
  { key: 'assignedBy', ids: 'getAssigners', text: 'getAssignedBy', helper: 'hasAssignedByOnMinicard' },
];

for (const f of FIELDS) {
  test(`${f.key}: the minicard draws the picked members as avatars`, () => {
    const b = block(minicardJade, f.key);
    assert.match(b, new RegExp(`each userId in ${f.ids}\\s+\\+userAvatar\\(userId=userId noRemove=true\\)`));
    assert.match(b, new RegExp(`if ${f.text}\\s+span \\{\\{ ${f.text} \\}\\}`));
  });

  test(`${f.key}: shown when EITHER a member was picked or a name typed`, () => {
    assert.match(block(minicardJade, f.key), new RegExp(`if ${f.helper}\\b`));
    assert.match(minicardJs, new RegExp(
      `${f.helper}\\(\\) \\{\\s*return !!this\\.${f.text}\\(\\) \\|\\| \\(this\\.${f.ids}\\(\\) \\|\\| \\[\\]\\)\\.length > 0;`));
  });

  test(`${f.key}: Card Settings, the opened card and the minicard use one icon`, () => {
    const icon = (block(minicardJade, f.key).match(/i\.fa\.(fa-[a-z-]+)/) || [])[1];
    assert.ok(icon, `${f.key} minicard icon`);
    assert.strictEqual((block(detailsJade, f.key).match(/i\.fa\.(fa-[a-z-]+)/) || [])[1], icon, 'opened card');
    const row = rowOf(f.key);
    assert.ok(row, `${f.key} settings row`);
    assert.deepStrictEqual(row.icons, [icon], 'Card Settings row');
  });
}

test('the two fields keep distinct icons (Requested by is the cart)', () => {
  assert.deepStrictEqual(rowOf('requestedBy').icons, ['fa-shopping-cart']);
  assert.deepStrictEqual(rowOf('assignedBy').icons, ['fa-user-plus']);
});

// Negative: the shape of the fault was a minicard person block gated on the
// free-text value alone. No such block may come back for either field.
test('negative: no minicard block gates a person field on its free text alone', () => {
  for (const f of FIELDS) {
    assert.doesNotMatch(block(minicardJade, f.key), new RegExp(`^\\s*if ${f.text}\\s*$\\n\\s*\\.minicard-`, 'm'), f.key);
  }
});

console.log(`\n${passed} tests passed`);
