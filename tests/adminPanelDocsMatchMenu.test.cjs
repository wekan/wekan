'use strict';

// Guard: docs/Features/Admin-Panel is filed the way the Admin Panel menu is.
// Run: node tests/adminPanelDocsMatchMenu.test.cjs
//
// The menu is the structure a reader already has in their head, so the docs are
// laid out to match it: one directory per tab, one page per pane, and a README
// in each listing the panes IN MENU ORDER. Settings (7 panes) and People (9)
// already had a page each; Problems (17) and Attachments (10) did not, and their
// READMEs now index every pane with a dash where no page exists yet.
//
// What this checks is the thing that rots: the menu is defined in code and the
// docs are written by hand, so a pane added to models/lib/adminUrls.js appears in
// the product and nowhere in the documentation, silently. Every pane must be
// LISTED. Whether it has a page of its own is a separate, visible question - a
// dash is an honest gap, and this suite counts them rather than accepting them
// quietly.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs/Features/Admin-Panel');
const src = fs.readFileSync(path.join(ROOT, 'models/lib/adminUrls.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The pane slugs of one page, in the order ADMIN_PAGES declares them - which is
// the order the menu renders.
function panesOf(page) {
  const block = new RegExp(`^  ${page}: \\{\\n([\\s\\S]*?)^  \\},`, 'm').exec(src);
  assert.ok(block, `ADMIN_PAGES has no ${page}`);
  const panes = /panes: \{([\s\S]*?)\n {4}\},/.exec(block[1]);
  assert.ok(panes, `${page} declares no panes`);
  return [...panes[1].matchAll(/^\s*'?([\w-]+)'?: '[\w-]+',/gm)].map(m => m[1]);
}

const PAGES = [
  ['settings', 'Settings'],
  ['people', 'People'],
  ['problems', 'Problems'],
  ['attachments', 'Attachments'],
];

test('every tab in the menu has a directory of its own', () => {
  for (const [, folder] of PAGES) {
    assert.ok(fs.existsSync(path.join(DOCS, folder)),
      `docs/Features/Admin-Panel/${folder} is missing - the menu has that tab`);
    assert.ok(fs.existsSync(path.join(DOCS, folder, 'README.md')),
      `${folder} needs a README indexing its panes`);
  }
});

test('every pane is listed in its README, and by its URL slug', () => {
  // The slug is what makes the link findable: a reader who has
  // /admin/problems/integrity in the address bar can search the docs for it.
  for (const [page, folder] of PAGES) {
    const readme = fs.readFileSync(path.join(DOCS, folder, 'README.md'), 'utf8');
    const missing = panesOf(page).filter(slug => !readme.includes(`\`${slug}\``));
    assert.deepStrictEqual(missing, [],
      `${folder}/README.md does not list these panes, so they exist in the product `
      + `and nowhere in the docs: ${missing.join(', ')}`);
  }
});

test('the README lists them in MENU ORDER (negative)', () => {
  // Alphabetical would be a different document: a reader is matching what they
  // see down the side of the screen.
  for (const [page, folder] of PAGES) {
    const readme = fs.readFileSync(path.join(DOCS, folder, 'README.md'), 'utf8');
    const positions = panesOf(page).map(slug => readme.indexOf(`\`${slug}\``));
    // Settings and People predate the slug column and list panes by label only.
    if (positions.some(p => p === -1)) continue;
    const sorted = [...positions].sort((a, b) => a - b);
    assert.deepStrictEqual(positions, sorted,
      `${folder}/README.md lists its panes in a different order than the menu does`);
  }
});

test('a page that exists is linked from its README (negative)', () => {
  // A doc nobody links to is a doc nobody finds.
  for (const [, folder] of PAGES) {
    const dir = path.join(DOCS, folder);
    const readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
    const unlinked = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .filter(f => !readme.includes(`(${f})`));
    assert.deepStrictEqual(unlinked, [],
      `${folder}/README.md does not link these pages: ${unlinked.join(', ')}`);
  }
});

test('the gaps are counted, not hidden', () => {
  // A dash is an honest "nobody has written this yet". What must not happen is
  // the count quietly growing while the sentence still says a smaller number.
  for (const [page, folder] of PAGES) {
    const readme = fs.readFileSync(path.join(DOCS, folder, 'README.md'), 'utf8');
    const stated = /(\d+) of these (\d+) panes has no page/.exec(readme);
    if (!stated) continue;                      // fully documented tab
    const total = panesOf(page).length;
    assert.strictEqual(Number(stated[2]), total,
      `${folder}/README.md says ${stated[2]} panes and the menu has ${total}`);
    const dashes = (readme.match(/\| — \|/g) || []).length;
    assert.strictEqual(Number(stated[1]), dashes,
      `${folder}/README.md says ${stated[1]} panes lack a page and the table shows ${dashes}`);
  }
});

console.log(`\nadminPanelDocsMatchMenu: ${passed} tests passed`);
