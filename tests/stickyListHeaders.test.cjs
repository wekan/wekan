'use strict';
(async () => {

// Plain-Node source-pattern regression test (no Meteor) for issue #3847:
// "Sticky/frozen list header while scrolling a list's cards" - the reporter
// wants a list's title/header to stay visible instead of scrolling out of
// view with the cards.
//
// This pins the source-level wiring only:
//   - models/boards.js defines a board-wide `stickyListHeaders` boolean field
//     that defaults to false (current behaviour unchanged) with getter/setter;
//   - server/models/users.js exposes a `setStickyListHeaders` Meteor method
//     that only a board member may call;
//   - the List hamburger/action menu (listActionPopup in listHeader.jade,
//     per the maintainer's instruction to put the toggle there) has an entry
//     that flips it, and listHeader.js wires the click handler + a helper
//     that reads the board's current value;
//   - client/components/lists/list.jade/list.js add a `list-sticky-header`
//     class driven by the board setting, and list.css makes `.list-header`
//     `position: sticky` only under that class.
//
// What this test can NOT verify (no browser here): that scrolling a long
// list's cards actually keeps the header pinned on screen. That is a visual/
// runtime behaviour; only the CSS rule and its conditional wiring are
// checked here.
//
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/stickyListHeaders.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const boardsSrc = read('models/boards.js');
const usersServerSrc = read('server/models/users.js');
const listHeaderJade = read('client/components/lists/listHeader.jade');
const listHeaderJs = read('client/components/lists/listHeader.js');
const listJade = read('client/components/lists/list.jade');
const listJs = read('client/components/lists/list.js');
const listCss = read('client/components/lists/list.css');

// --- The board field defaults to false --------------------------------------

test('Boards schema defines stickyListHeaders defaulting to false', () => {
  const m = boardsSrc.match(
    /stickyListHeaders:\s*\{[\s\S]*?type:\s*Boolean,[\s\S]*?defaultValue:\s*(true|false)/,
  );
  assert.ok(m, 'stickyListHeaders is declared in the Boards schema');
  assert.strictEqual(m[1], 'false', 'defaults to false (unchanged behaviour)');
});

test('Boards has a getter/setter pair for the toggle', () => {
  assert.ok(/getStickyListHeaders\(\)\s*\{\s*return\s*!!this\.stickyListHeaders;/.test(boardsSrc),
    'getStickyListHeaders() coerces to boolean');
  assert.ok(/async setStickyListHeaders\(stickyListHeaders\)/.test(boardsSrc),
    'setStickyListHeaders(...) exists');
  assert.ok(/\$set:\s*\{\s*stickyListHeaders:\s*!!stickyListHeaders\s*\}/.test(boardsSrc),
    'setter persists a coerced boolean');
});

// --- The Meteor method is member-gated --------------------------------------

test('server exposes a member-gated setStickyListHeaders Meteor method', () => {
  const m = usersServerSrc.match(
    /async setStickyListHeaders\(boardId, stickyListHeaders\)\s*\{([\s\S]*?)\n  \},/,
  );
  assert.ok(m, 'setStickyListHeaders method body found');
  const body = m[1];
  assert.ok(/check\(boardId, String\)/.test(body), 'checks boardId type');
  assert.ok(/check\(stickyListHeaders, Boolean\)/.test(body), 'checks value type');
  assert.ok(/not-logged-in/.test(body), 'rejects anonymous callers');
  assert.ok(/board\.hasMember\(this\.userId\)/.test(body),
    'only a board member may flip the board-wide toggle');
  assert.ok(/Boards\.updateAsync\(boardId,\s*\{\s*\$set:\s*\{\s*stickyListHeaders/.test(body),
    'writes stickyListHeaders on the board');
});

// --- The List hamburger menu carries the toggle -----------------------------

test('listActionPopup (the List hamburger menu) has a sticky-list-headers entry', () => {
  // Must live in the listActionPopup template - the same popup as "Set WIP
  // Limit" and "Collapse" - per the maintainer's instruction to reach it from
  // the per-list menu even though the effect is board-wide.
  const popupMatch = listHeaderJade.match(
    /template\(name="listActionPopup"\)([\s\S]*?)(?=\ntemplate\(name=)/,
  );
  assert.ok(popupMatch, 'listActionPopup template found');
  const popup = popupMatch[1];
  assert.ok(popup.includes('js-toggle-sticky-list-headers'),
    'the toggle click target is inside listActionPopup');
  assert.ok(popup.includes("{{_ 'sticky-list-headers'}}"),
    'the toggle label uses the i18n key');
  assert.ok(popup.includes('isStickyListHeaders'),
    'the checkbox icon reflects the current board state');
  // Sits alongside the existing WIP-limit toggle this menu already has.
  const wipIdx = popup.indexOf('js-set-wip-limit');
  const stickyIdx = popup.indexOf('js-toggle-sticky-list-headers');
  assert.ok(wipIdx >= 0 && stickyIdx >= 0 && stickyIdx > wipIdx,
    'the new entry sits after the existing "Set WIP Limit" entry');
});

test('listHeader.js wires the click handler and a board-reading helper', () => {
  assert.ok(/isStickyListHeaders\(\)\s*\{/.test(listHeaderJs),
    'isStickyListHeaders() helper is defined');
  assert.ok(/getStickyListHeaders\(\)/.test(listHeaderJs),
    'the helper reads the board via getStickyListHeaders()');
  const clickMatch = listHeaderJs.match(
    /'click \.js-toggle-sticky-list-headers'\(event\)\s*\{([\s\S]*?)\n  \},/,
  );
  assert.ok(clickMatch, 'click handler for the menu entry is registered');
  assert.ok(/Meteor\.call\('setStickyListHeaders', list\.boardId, enabled\)/.test(clickMatch[1]),
    'the click handler flips the board-wide setting through the Meteor method');
});

// --- CSS is applied conditionally, scoped to the list's own scroll area ----

test('list.jade/list.js drive a list-sticky-header class from the board setting', () => {
  assert.ok(/stickyListHeaders/.test(listJade),
    'list.jade reads the stickyListHeaders helper');
  assert.ok(listJade.includes('list-sticky-header'),
    'list.jade toggles the list-sticky-header class');
  const helperMatch = listJs.match(
    /stickyListHeaders\(\)\s*\{([\s\S]*?)\n  \},/,
  );
  assert.ok(helperMatch, 'Template.list.helpers defines stickyListHeaders()');
  assert.ok(/getStickyListHeaders\(\)/.test(helperMatch[1]),
    'the list-level helper reads the board-wide value, not a per-list one');
});

test('list.css pins .list-header only under .list-sticky-header, scoped to .list', () => {
  const ruleMatch = listCss.match(
    /\.list\.list-sticky-header \.list-header\s*\{([\s\S]*?)\}/,
  );
  assert.ok(ruleMatch, 'the conditional sticky rule exists');
  const body = ruleMatch[1];
  assert.ok(/position:\s*sticky/.test(body), 'sets position: sticky');
  assert.ok(/top:\s*0/.test(body), 'pins to the top of the scrolling container');
  assert.ok(/z-index/.test(body), 'stays above the cards that scroll under it');
  // Negative: unconditional selectors must NOT also force position: sticky -
  // the default (unset board field) must keep the historical layout.
  const bareHeaderRules = [...listCss.matchAll(/(^|\n)\.list-header\s*\{([\s\S]*?)\}/g)]
    .map(m => m[2]);
  bareHeaderRules.forEach(body => {
    assert.ok(!/position:\s*sticky/.test(body),
      'the unconditional .list-header rule does not itself go sticky');
  });
});

test('negative: no OTHER template wires a per-list (rather than board-wide) toggle', () => {
  // Guards against the toggle accidentally being duplicated as a per-list
  // field elsewhere, which would fragment the setting the CSS above assumes
  // is board-wide.
  const listsModelSrc = read('models/lists.js');
  assert.ok(!/stickyListHeaders/.test(listsModelSrc),
    'the Lists schema itself carries no stickyListHeaders field');
});

// --- i18n --------------------------------------------------------------------

test('en.i18n.json has the sticky-list-headers key', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(typeof en['sticky-list-headers'], 'string');
  assert.ok(en['sticky-list-headers'].length > 0);
});

test('every locale file has the sticky-list-headers key', () => {
  const dir = path.join(repoRoot, 'imports/i18n/data');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'));
  const missing = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (typeof data['sticky-list-headers'] !== 'string' || !data['sticky-list-headers'].length) {
      missing.push(f);
    }
  }
  assert.deepStrictEqual(missing, [], 'every language file must have the key');
});

console.log(`\n${passed} tests passed`);

})().catch(e => { console.error(e); process.exit(1); });
