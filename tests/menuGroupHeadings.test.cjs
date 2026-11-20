'use strict';
// The list, card and swimlane menus of the Swimlanes view are grouped under
// headings (2026-11-20), as the board menu and the Board View menu are. Each
// heading sits inside its group's own condition, so a member who sees none of
// a group sees no heading over nothing.
// Run: node --test tests/menuGroupHeadings.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const template = (file, name) => {
  const src = read(file);
  const start = src.indexOf(`template(name="${name}")`);
  return src.slice(start, src.indexOf('\ntemplate(', start + 1));
};
const headings = body => [...body.matchAll(/(?:li|h4)\.menu-group-heading \{\{_ '([a-z-]+)'\}\}/g)].map(m => m[1]);

const MENUS = [
  ['client/components/lists/listHeader.jade', 'listActionPopup',
    ['menu-group-share', 'menu-group-export', 'add', 'watch', 'edit', 'settings', 'menu-group-move-copy', 'archives']],
  ['client/components/cards/cardDetails.jade', 'cardDetailsActionsPopup',
    ['menu-group-move-copy', 'watch', 'appearance', 'menu-group-share', 'archives']],
  ['client/components/swimlanes/swimlaneHeader.jade', 'swimlaneActionPopup',
    ['menu-group-share', 'menu-group-export', 'add', 'appearance', 'menu-group-move-copy', 'archives']],
];

test('each menu has its groups\' headings, in order, each in English', () => {
  for (const [file, name, expected] of MENUS) {
    assert.deepStrictEqual(headings(template(file, name)), expected, name);
    for (const key of expected) assert.strictEqual(typeof en[key], 'string', key);
  }
});

test('a heading is right above its group, inside the same condition', () => {
  const card = template('client/components/cards/cardDetails.jade', 'cardDetailsActionsPopup');
  assert.match(card, /if cardMenuWrites\n\s*li\.menu-group-heading \{\{_ 'menu-group-move-copy'\}\}/);
  assert.match(card, /unless currentUser\.isWorker\n\s*li\.menu-group-heading \{\{_ 'archives'\}\}\n\s*if archived/);
  const list = template('client/components/lists/listHeader.jade', 'listActionPopup');
  assert.match(list, /h4\.menu-group-heading \{\{_ 'settings'\}\}\n\s*if currentUser\.isBoardAdmin/);
  assert.match(list, /if mayWriteList\n\s*hr\n\s*h4\.menu-group-heading \{\{_ 'archives'\}\}\n\s*ul\.pop-over-list/);
  const swim = template('client/components/swimlanes/swimlaneHeader.jade', 'swimlaneActionPopup');
  assert.match(swim, /li\.menu-group-heading \{\{_ 'archives'\}\}\n\s*li: a\.js-close-swimlane/);
});

test('negative: a heading is not an entry - no js- class, no link, nothing to click', () => {
  for (const [file, name] of MENUS) {
    for (const line of template(file, name).split('\n').filter(l => l.includes('menu-group-heading'))) {
      assert.doesNotMatch(line, /js-|a\(|a\./, `${name}: ${line.trim()}`);
    }
  }
  assert.match(read('client/components/main/popup.css'), /\.pop-over \.menu-group-heading \{[^}]*pointer-events: none;/);
});
