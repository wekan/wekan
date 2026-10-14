'use strict';

// Shared labels (#2761, #4698): catalogs for every board, an organization's
// boards and a team's. A board uses one by copying it (sharedLabelId), so every
// label feature works on it unchanged; a catalog edit reaches every copy, a
// deletion leaves the copies; nobody is sent another organization's labels.
// Run: node tests/sharedLabels.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../models/lib/sharedLabels');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const board = { orgs: [{ orgId: 'o1', isActive: true }, { orgId: 'o2', isActive: false }], teams: [{ teamId: 't1', isActive: true }],
  labels: [{ _id: 'b1', name: 'Mine', color: 'red' }, { _id: 'b2', name: 'Urgent', color: 'red', sharedLabelId: 's-done' }] };

test('which shared labels a board may use: every board, its organizations, its teams', () => {
  assert.equal(L.availableOn({ scope: 'instance' }, board), true);
  assert.equal(L.availableOn({ scope: 'org', scopeId: 'o1' }, board), true);
  assert.equal(L.availableOn({ scope: 'team', scopeId: 't1' }, board), true);
  // Negative: another organization's, an inactive assignment, an unknown scope.
  assert.equal(L.availableOn({ scope: 'org', scopeId: 'o9' }, board), false);
  assert.equal(L.availableOn({ scope: 'org', scopeId: 'o2' }, board), false, 'the organization is no longer on the board');
  assert.equal(L.availableOn({ scope: 'board' }, board), false);
  const offered = L.offeredTo(board, [{ _id: 's-done', scope: 'instance' }, { _id: 's-new', scope: 'instance' }, { _id: 's-other', scope: 'team', scopeId: 't9' }]);
  assert.deepEqual(offered.map(l => l._id), ['s-new'], 'not one the board already has, not another team\'s');
});

test('a board uses one by copying it, linked', () => {
  assert.deepEqual(L.boardCopyOf({ _id: 's1', name: 'Urgent', color: '#ff0000', scope: 'instance' }, 'x1'),
    { _id: 'x1', name: 'Urgent', color: '#ff0000', sharedLabelId: 's1' });
});

test('what a shared label may be (negative: bad colour, scope, missing organization, long name)', () => {
  const ok = c => ['red', 'green'].includes(c) || /^#[0-9a-f]{6}$/i.test(c);
  assert.deepEqual(L.cleanSharedLabel({ name: ' Urgent ', color: 'red', scope: 'instance', scopeId: 'ignored' }, ok),
    { name: 'Urgent', color: 'red', scope: 'instance', scopeId: null });
  assert.throws(() => L.cleanSharedLabel({ color: 'chartreuse', scope: 'instance' }, ok), /shared-label-color/);
  assert.throws(() => L.cleanSharedLabel({ color: 'red', scope: 'board' }, ok), /shared-label-scope/);
  assert.throws(() => L.cleanSharedLabel({ color: 'red', scope: 'org' }, ok), /shared-label-scope/);
  assert.throws(() => L.cleanSharedLabel({ name: 'x'.repeat(101), color: 'red', scope: 'instance' }, ok), /too-long/);
});

test('the server: site admins edit the catalogs, edits reach every copy, users see only their own organizations\' labels', () => {
  const s = read('server/sharedLabels.js');
  assert.match(s, /'sharedLabels\.save'[\s\S]*?await requireSiteAdmin\(this\.userId\)/);
  assert.match(s, /'sharedLabels\.remove'[\s\S]*?await requireSiteAdmin\(this\.userId\)/);
  assert.match(s, /await updateCopies\(labelId, clean\.name, clean\.color\)/);
  assert.match(s, /\$unset\[`labels\.\$\{i\}\.sharedLabelId`\] = ''/, 'deleting keeps the copies, unlinked');
  assert.match(s, /\{ scope: 'org', scopeId: \{ \$in: orgIds \} \}/);
  assert.match(s, /'boards\.useSharedLabel'[\s\S]*?allowIsBoardMemberWithWriteAccess\(this\.userId, board\)[\s\S]*?availableOn\(label, board\)/);
  assert.match(read('client/components/cards/labels.jade'), /js-use-shared-label/);
  assert.match(read('models/lib/adminUrls.js'), /labels: 'shared-labels-setting'/);
});
