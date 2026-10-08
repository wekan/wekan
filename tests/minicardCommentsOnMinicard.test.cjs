'use strict';

// Issue #4285: show a card's comments directly on the minicard (not just
// inside the opened card), useful for classroom/at-a-glance use, with a
// "more" affordance when there are too many/too long comments.
//
// Wired into Board Settings > Card the same way allowsReceivedDate /
// allowsReceivedDateOnMinicard already are: a board-level default
// (allowsComments, pre-existing - whether commenting is enabled at all) and
// a new allowsCommentsOnMinicard toggle (display-only, OFF by default so
// existing boards are unaffected). This test pins:
//  - the new board field exists, defaults to false, and is in the
//    server-side allow-list of client-writable board fields;
//  - the Card Settings sidebar panel has a row that toggles it, following
//    the exact 3-column card-settings-row/card-settings-column pattern;
//  - the minicard only renders comments when the flag is true, reusing the
//    card's existing `comments()` helper rather than a new subscription;
//  - the preview caps the number of comments and truncates long ones, with
//    a "more" link that relies on the minicard already being a link to the
//    full card (no new in-place expand interaction - scope stays display
//    only, no reply/edit from the minicard).
//
// Run: node tests/minicardCommentsOnMinicard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('minicardCommentsOnMinicard:');

test('the board schema has the new field, off by default', () => {
  const boards = read('models/boards.js');
  const at = boards.indexOf('allowsCommentsOnMinicard: {');
  assert.ok(at !== -1, 'allowsCommentsOnMinicard must be declared in the Boards schema');
  const field = boards.slice(at, at + 300);
  assert.ok(/type: Boolean/.test(field));
  assert.ok(/defaultValue: false/.test(field),
    'must default to false so existing boards are unaffected (issue scope)');
  assert.ok(/setAllowsCommentsOnMinicard/.test(boards),
    'mirrors the setAllowsX(...) pattern the other allowsX fields already have');
});

test('the new field is a distinct name from the pre-existing allowsComments', () => {
  const boards = read('models/boards.js');
  assert.ok(/allowsComments: {/.test(boards), 'the pre-existing "commenting enabled" flag must still be there');
  assert.notStrictEqual(
    boards.indexOf('allowsComments: {'),
    boards.indexOf('allowsCommentsOnMinicard: {'),
    'the new minicard-display flag must not reuse/rename the existing allowsComments field',
  );
});

test('the server allow-list can be written to from the client', () => {
  const serverBoards = read('server/models/boards.js');
  assert.ok(/'allowsCommentsOnMinicard'/.test(serverBoards),
    'without this, Boards.update from the sidebar toggle would be rejected');
});

test('Card Settings has a row for it, the same entry as its "on card" toggle', () => {
  // The rows of Board Settings / Card are a table the template draws from
  // (models/lib/cardSettingsRows.js); one entry carries both the card and
  // the minicard toggle of a field, the way one hand-written row once did.
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows');
  const row = CARD_SETTINGS_ROWS.find(r => r.key === 'comments');
  assert.ok(row, 'a comments row');
  assert.strictEqual(row.minicard.toggle, 'js-field-has-comments-on-minicard');
  assert.strictEqual(row.minicard.field, 'allowsCommentsOnMinicard');
  assert.strictEqual(row.card.toggle, 'js-field-has-comments',
    'expected a matching "on card" column reusing allowsComments');
  assert.strictEqual(row.card.field, 'allowsComments');

  const sidebarJs = read('client/components/sidebar/sidebar.js');
  assert.ok(/'click \.js-field-has-comments-on-minicard'/.test(sidebarJs));
  assert.ok(/allowsCommentsOnMinicard: newValue/.test(sidebarJs));
  assert.ok(/Boards\.update\(tpl\.currentBoard\._id, \{ \$set: \{ allowsCommentsOnMinicard: newValue \} \}\)/
    .test(sidebarJs),
    'a direct client Boards.update, no dedicated method - matching every other allowsXOnMinicard toggle');
});

test('the minicard gates rendering on the board flag, reusing the existing comments() helper', () => {
  const minicardJs = read('client/components/cards/minicard.js');
  assert.ok(/showCommentsOnMinicard\(\)/.test(minicardJs));
  assert.ok(/board\.allowsCommentsOnMinicard/.test(minicardJs));
  assert.ok(/commentsForMinicard\(\)/.test(minicardJs));
  assert.ok(/this\.comments\(\)/.test(minicardJs),
    'must reuse the card comments() helper the count badge already calls, not a new subscription');

  const minicardJade = read('client/components/cards/minicard.jade');
  assert.ok(/if showCommentsOnMinicard/.test(minicardJade),
    'the comments preview block must be gated behind the flag');
  const at = minicardJade.indexOf('if showCommentsOnMinicard');
  const block = minicardJade.slice(at, at + 700);
  assert.ok(/commentsForMinicard/.test(block));
  assert.ok(/hasMore/.test(block), 'a "more" affordance must be offered when truncated/overflowing');
  assert.ok(!/textarea|js-add-comment|js-submit.*comment/i.test(block),
    'display only - no in-place commenting/reply UI on the minicard (scope discipline)');
});

test('the preview caps comment count and per-comment length', () => {
  const minicardJs = read('client/components/cards/minicard.js');
  const at = minicardJs.indexOf('commentsForMinicard()');
  const fn = minicardJs.slice(at, at + 900);
  const maxCommentsMatch = fn.match(/MAX_COMMENTS\s*=\s*(\d+)/);
  const maxLengthMatch = fn.match(/MAX_LENGTH\s*=\s*(\d+)/);
  assert.ok(maxCommentsMatch, 'must cap the number of comments shown');
  assert.ok(maxLengthMatch, 'must cap the length of each shown comment');
  assert.ok(Number(maxCommentsMatch[1]) <= 5, 'stays a small, compact preview (2-3ish), not the whole thread');
  assert.ok(Number(maxLengthMatch[1]) <= 200, 'each comment stays a short excerpt, not the full text');
});

test('the "more" link opens the full card via the minicard\'s own existing link, not a new expand-in-place UI (negative)', () => {
  const minicardJade = read('client/components/cards/minicard.jade');
  const listBodyJade = read('client/components/lists/listBody.jade');
  // The whole minicard is already wrapped by a.minicard-wrapper.js-minicard
  // linking to the card - the "more" affordance rides on that rather than
  // reimplementing card-opening logic inside the minicard template.
  assert.ok(/a\.minicard-wrapper\.js-minicard/.test(listBodyJade));
  const at = minicardJade.indexOf('minicard-comments-more');
  assert.ok(at !== -1);
  const around = minicardJade.slice(Math.max(0, at - 200), at + 200);
  assert.ok(!/js-expand-all-comments|js-show-all-comments/.test(around),
    'no separate in-place "expand all comments" interaction - that is the scope creep the issue warned against');
});

// Email report (2026-10-08): with seven assignees the comment preview read
// "Någr…" beside the row of avatars. The avatar rows are floats, and each
// .minicard-comment is overflow: hidden - a block formatting context, which a
// float NARROWS to whatever width it leaves. The comments must clear the
// floats and wrap instead of being cut on one line.
function cssRule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = css.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`));
  return m ? m[1] : null;
}
function allCss() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (e.name.endsWith('.css')) out.push([rel, read(rel)]);
    }
  })('client');
  return out;
}

test('the comments start on their own line, under the avatar and badge floats', () => {
  const css = read('client/components/cards/minicard.css');
  const avatars = cssRule(css,
    '.minicard .minicard-members,\n.minicard .minicard-assignees,\n.minicard .minicard-creator');
  assert.ok(avatars && /float: inline-end/.test(avatars),
    'precondition: the avatar rows are floats - the reason the comments must clear them');
  assert.ok(/float: inline-start/.test(cssRule(css, '.minicard .badges')),
    'precondition: the badges float on the other side');
  const comments = cssRule(css, '.minicard .minicard-comments');
  assert.ok(comments, '.minicard .minicard-comments rule');
  assert.ok(/clear: both;/.test(comments),
    'clear: both - not inline-start only, the avatars float on the inline-END side');
  assert.ok(/width: 100%/.test(comments), 'the full width of the minicard');

  const order = require('../models/lib/cardFieldOrder').orderedMinicardSections();
  assert.ok(order.indexOf('assignee') < order.indexOf('comments'),
    'precondition: by default the comments come after the assignees, which is how they met');
});

test('the comment text wraps and is clamped at the end, never cut by nowrap', () => {
  const css = read('client/components/cards/minicard.css');
  const text = cssRule(css, '.minicard .minicard-comment-text');
  assert.ok(text, '.minicard .minicard-comment-text rule');
  assert.ok(/white-space: normal/.test(text), 'the text wraps');
  assert.ok(/-webkit-line-clamp: 3/.test(text), 'a three-line clamp, ellipsis at the end');
  assert.ok(/min-width: 0/.test(text), 'a flex item that may shrink below its content width');
  assert.ok(/overflow-wrap: anywhere/.test(text), 'a long word or URL breaks instead of overflowing');
});

test('negative: nothing keeps a minicard comment on one line, or lays avatars over it', () => {
  for (const [rel, css] of allCss()) {
    const re = /([^{}]*)\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(css))) {
      const sel = m[1];
      const body = m[2];
      if (/\.minicard-comment(?:s|-text|-icon)?\b(?!-more)/.test(sel)) {
        assert.ok(!/white-space:\s*nowrap/.test(body),
          `${rel}: "${sel.trim()}" puts the comment back on one line`);
        assert.ok(!/position:\s*absolute/.test(body),
          `${rel}: "${sel.trim()}" takes the comment out of the flow`);
        assert.ok(!/clear:\s*(?:none|inline-start|left|right|inline-end)\b/.test(body),
          `${rel}: "${sel.trim()}" clears only one side, the avatars float on the other`);
      }
      if (/\.minicard-(?:assignees|members|creator)\b/.test(sel) && /\.minicard\b/.test(sel)) {
        assert.ok(!/position:\s*absolute/.test(body),
          `${rel}: "${sel.trim()}" lays the avatars over the card's other lines`);
      }
    }
  }
  const jade = read('client/components/cards/minicard.jade');
  const assignees = jade.indexOf('.minicard-assignees.js-minicard-assignees');
  const comments = jade.indexOf('.minicard-comments');
  const between = jade.slice(assignees, comments);
  assert.ok(/\n        if \$eq section "comments"/.test(between),
    'the comments are a section of their own, not nested inside the avatar row');
});

console.log(`\nminicardCommentsOnMinicard: ${passed} tests passed`);
