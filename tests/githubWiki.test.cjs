'use strict';

// Guard: a GitHub wiki as cards (models/lib/githubWiki.js) - one page one
// card, [[links]] as "link to card", the page history as the card's history.
// Run: node tests/githubWiki.test.cjs

const assert = require('assert');
const w = require('../models/lib/githubWiki.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }

test('file names are page names; non-pages are not', () => {
  assert.strictEqual(w.pageNameFromPath('Getting-Started.md'), 'Getting Started');
  assert.strictEqual(w.pageNameFromPath('docs/Install-on-Linux.markdown'), 'Install on Linux');
  assert.strictEqual(w.pageNameFromPath('Home.md'), 'Home');
  assert.strictEqual(w.pageNameFromPath('logo.png'), null);
  assert.strictEqual(w.pageKey('Getting Started'), w.pageKey('getting-started'));
  assert.ok(w.isSpecialPage('_Sidebar') && !w.isSpecialPage('Sidebar notes'));
});

const cards = { home: { _id: 'c1', url: '/b/B/x/c1' }, 'getting-started': { _id: 'c2', url: '/b/B/x/c2' } };
const cardFor = key => cards[key] || null;
const repoWikiUrl = 'https://github.com/wekan/wekan/wiki';

test('[[links]] in both orders, markdown links and wiki URLs point at the cards', () => {
  const text = 'See [[Getting Started]], [[the start|Home]], [[Home|start page]], '
    + '[guide](Getting-Started) and [full](https://github.com/wekan/wekan/wiki/Home#top).';
  const { text: out, linkedCardIds } = w.rewriteWikiLinks(text, { repoWikiUrl, cardFor });
  assert.strictEqual(out, 'See [Getting Started](/b/B/x/c2), [the start](/b/B/x/c1), [start page](/b/B/x/c1), '
    + '[guide](/b/B/x/c2) and [full](/b/B/x/c1).');
  assert.deepStrictEqual(linkedCardIds, ['c2', 'c1']);
});

test('negative: missing pages, images, outside and anchor links stay as they are', () => {
  const text = '[[No Such Page]] ![logo](Home) [x](https://example.com/Home) [y](#Home) [z](logo.png)';
  const { text: out, linkedCardIds } = w.rewriteWikiLinks(text, { repoWikiUrl, cardFor });
  assert.strictEqual(out, text);
  assert.deepStrictEqual(linkedCardIds, []);
});

test('history: one edit per commit that changed the text, oldest first', () => {
  const h = w.pageHistory([
    { commit: 'a', at: '2020-01-01', author: 'alice', text: 'one' },
    { commit: 'b', at: '2020-01-02', author: 'bob', text: 'one' },
    { commit: 'c', at: '2020-01-03', author: 'bob', text: 'two' },
    { commit: 'd', at: '2020-01-04', author: 'carol', text: null },
  ]);
  assert.deepStrictEqual(h.map(e => [e.commit, e.previous, e.next]), [['a', null, 'one'], ['c', 'one', 'two'], ['d', 'two', null]]);
});

test('Home first, then by name', () => {
  assert.deepStrictEqual(w.sortPages([{ name: 'Zeta' }, { name: 'alpha' }, { name: 'Home' }]).map(p => p.name), ['Home', 'alpha', 'Zeta']);
});

console.log(`# ${passed} passed`);
