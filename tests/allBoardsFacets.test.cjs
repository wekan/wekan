'use strict';

// #4791: All Boards grouped by first letter, by board labels and by
// organization subgroups.
// Run: node tests/allBoardsFacets.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const f = require('../models/lib/allBoardsFacets.js');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const boards = [
  { _id: 'b1', title: 'apple', orgs: [{ orgId: 'o1', isActive: true }], teams: [{ teamId: 't1' }] },
  { _id: 'b2', title: 'Avocado', orgs: [{ orgId: 'o1', isActive: false }] },
  { _id: 'b3', title: '🎉 Party', teams: [{ teamId: 't1' }] },
  { _id: 'b4', title: '  banana' },
];

// Positive.
const facets = f.boardFacets(boards, { orgNames: { o1: 'Acme' }, teamNames: { t1: 'Devs' }, boardLabels: { work: ['b1', 'b4', 'gone'] } });
assert.deepEqual(facets.chars.map(c => [c.key, c.count]), [['A', 2], ['B', 1], ['🎉', 1]].sort((a, b) => a[0].localeCompare(b[0])),
  'one group per first character, any case, emoji whole');
assert.deepEqual(facets.orgs, [{ key: 'o1', name: 'Acme', count: 1 }], 'an inactive link does not count');
assert.deepEqual(facets.teams, [{ key: 't1', name: 'Devs', count: 2 }]);
assert.deepEqual(facets.labels, [{ key: 'work', count: 2 }], 'only boards still visible are counted');
assert.deepEqual(f.facetSelector({ type: 'char', value: 'a' }), { title: { $regex: '^\\s*(A|a)' } });
assert.deepEqual(f.facetSelector({ type: 'label', value: 'work' }, { work: ['b1'] }), { _id: { $in: ['b1'] } });
const applied = f.applyBoardLabel({}, 'fruit', boards, 'AN');
assert.deepEqual(applied.labels.fruit, ['b4'], 'name includes, any case');
assert.equal(applied.added, 1);
console.log('  ok - characters, organizations, teams and labels, with their counts');

// Negative.
assert.equal(f.facetSelector(null), null);
assert.equal(f.facetSelector({ type: 'x', value: 'y' }), null);
assert.equal(f.facetSelector({ type: 'char', value: { $ne: 1 } }), null);
assert.deepEqual(f.facetSelector({ type: 'char', value: '.*' }), { title: { $regex: '^\\s*(\\.|\\.)' } }, 'escaped');
assert.deepEqual(f.facetSelector({ type: 'label', value: 'none' }, {}), { _id: { $in: [] } }, 'an unknown label shows nothing');
assert.equal(f.cleanLabel('a.b$c\u0000'), 'abc', 'no dots or dollars (they are object keys)');
assert.equal(f.applyBoardLabel({}, '', boards, 'a').added, 0);
assert.equal(f.applyBoardLabel({}, 'x', boards, '   ').added, 0, 'no empty match-everything');
console.log('  ok - unknown facets, injected values and empty labels change nothing');

// Server: counted over the boards the member sees, never more.
const server = read('server/allBoardsFacets.js');
assert.match(server, /boardVisibilitySelectors\(\{ userId: user\._id,[\s\S]{0,200}includePublic: false \}\)/);
assert.match(server, /_id: \{ \$nin: hidden \}/, 'hidden boards stay out');
for (const m of ['allBoardsFacets', 'applyBoardLabel', 'removeBoardLabel']) {
  assert.match(server, new RegExp(`async ${m}\\([^)]*\\) \\{[\\s\\S]{0,120}if \\(!this\\.userId\\) throw`), m);
}
const page = read('server/publications/boards.js');
assert.match(page, /facet: Match\.Optional\(Match\.ObjectIncluding\(\{ type: String, value: String \}\)\),/);
assert.match(page, /const facetPart = facetSelector\(params\.facet, \(user\.profile \|\| \{\}\)\.boardLabels\);\s*\n\s*if \(facetPart\) selector\.\$and = \[/);
const jade = read('client/components/boards/boardsList.jade');
assert.match(jade, /\.board-facets\s*\n\s*if hasBoardFacets/);
assert.match(jade, /form\.board-label-apply\.js-apply-board-label/);
console.log('  ok - visibility and hidden boards respected; paged view filtered on the server');
console.log('\nallBoardsFacets: all tests passed');
