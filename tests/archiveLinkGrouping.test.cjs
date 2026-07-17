'use strict';

// Plain-Node regression guard (no Meteor) for issue #3199: in the board
// Archive sidebar's Cards tab, each archived card's "Restore - Delete" links
// used to be a loose sibling <p.quiet> BETWEEN two archived cards with
// near-equal spacing (minicard-wrapper margin-bottom: 8px above, p
// margin-bottom: 1vh below), so users could not tell which card the links
// belonged to. The fix wraps each card together with ITS links in an
// .archived-card-item group, closes the gap between the card and its links,
// and puts a clear separator gap below the whole group. Spacing-only (works
// in every board color/theme) and RTL-safe (logical properties).
// Run: node tests/archiveLinkGrouping.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const jade = read('client/components/sidebar/sidebarArchives.jade');
const css = read('client/components/sidebar/sidebar.css');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ---------------------------------------------------------------------------
// Markup: card + its links live inside one wrapper
// ---------------------------------------------------------------------------

test('each archived card is wrapped in an .archived-card-item group', () => {
  assert.ok(
    /each archivedCards\n(?:\s*\/\/-.*\n)*\s*\.archived-card-item\n/.test(jade),
    'the archivedCards each-block must start with an .archived-card-item wrapper',
  );
});

test('the minicard AND its restore/delete links are both inside the wrapper', () => {
  const block = jade.match(/\.archived-card-item\n([\s\S]*?)\n {10}else/);
  assert.ok(block, 'found the .archived-card-item block (up to the each/else)');
  const body = block[1];
  assert.ok(body.includes('.minicard-wrapper.js-minicard'), 'card is inside the wrapper');
  assert.ok(body.includes('a.js-restore-card'), 'restore link is inside the wrapper');
  assert.ok(body.includes('a.js-delete-card'), 'delete link is inside the wrapper');
  // Indentation proof: the links' p.quiet is nested DEEPER than the wrapper,
  // i.e. it is a child of .archived-card-item, not a loose sibling.
  const wrapperIndent = jade.match(/^(\s*)\.archived-card-item$/m)[1].length;
  const pIndent = body.match(/^(\s*)p\.quiet$/m)[1].length;
  assert.ok(pIndent > wrapperIndent, 'p.quiet is indented under .archived-card-item');
});

test('negative: no top-level minicard-wrapper sibling of the links remains', () => {
  // Before the fix .minicard-wrapper.js-minicard sat directly under the
  // each-block at 12-space indentation, with p.quiet as its SIBLING.
  assert.ok(
    !/^ {12}\.minicard-wrapper\.js-minicard$/m.test(jade),
    'the card must no longer be a direct child of the each-block',
  );
});

test('lists and swimlanes tabs keep their grouped li structure (unchanged)', () => {
  // Those tabs were never ambiguous: title + links share one bordered
  // li.archived-lists-item. Make sure the fix did not disturb them.
  const liCount = (jade.match(/li\.archived-lists-item/g) || []).length;
  assert.strictEqual(liCount, 2, 'one grouped li per tab (lists + swimlanes)');
  assert.ok(/a\.js-restore-list/.test(jade));
  assert.ok(/a\.js-restore-swimlane/.test(jade));
});

// ---------------------------------------------------------------------------
// CSS: tight link-to-card attachment, clear gap below the group
// ---------------------------------------------------------------------------

function rule(selector) {
  const re = new RegExp(
    selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}',
  );
  const m = css.match(re);
  assert.ok(m, `CSS rule "${selector}" exists in sidebar.css`);
  return m[1];
}

test('the group has a clear separator gap below it (logical property)', () => {
  const body = rule('.archived-card-item');
  const m = body.match(/margin-block-end:\s*([\d.]+)em/);
  assert.ok(m, 'uses margin-block-end in em (RTL/writing-mode safe)');
  assert.ok(parseFloat(m[1]) >= 1, 'gap below the group is at least 1em');
});

test('no gap is left between the card and its own links', () => {
  const wrapper = rule('.archived-card-item .minicard-wrapper');
  assert.ok(/margin-bottom:\s*0/.test(wrapper), 'card margin-bottom zeroed');
  const links = rule('.archived-card-item p.quiet');
  assert.ok(/margin-block-start:\s*\d+px/.test(links), 'links hug the card above');
  assert.ok(/margin-block-end:\s*0/.test(links), 'no extra margin below the links');
});

test('link indent is RTL-safe (padding-inline-start, not padding-left)', () => {
  const links = rule('.archived-card-item p.quiet');
  assert.ok(/padding-inline-start:/.test(links));
  assert.ok(!/padding-left:/.test(links), 'no physical left padding');
});

test('negative: grouping is spacing-only — no theme-fragile colors added', () => {
  const block = css.match(/\.archived-card-item[\s\S]*?p\.quiet\s*\{[^}]*\}/)[0];
  assert.ok(!/color:|background|border(?!-)/.test(block),
    'no hardcoded colors/borders that would break dark board themes');
});

test('negative: ambiguous pre-fix spacing cannot silently return', () => {
  // The old ambiguity needed BOTH the 8px card margin (from minicard.css)
  // and the loose sibling p. With the wrapper + zeroed margin in place,
  // ensure no sidebar rule reintroduces a margin between card and links.
  const wrapper = rule('.archived-card-item .minicard-wrapper');
  assert.ok(!/margin-bottom:\s*[1-9]/.test(wrapper));
});

console.log(`\n${passed} tests passed`);
