'use strict';

// wekan/wekan#3249: semi-open boards - permission 'instance', readable by every
// signed-in user and never in an unauthenticated response.
// Run: node tests/boardPermission.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { BOARD_PERMISSIONS, readableWithoutMembership, withoutMembershipSelectors, isOpenPermission } =
  require('../models/lib/boardPermission.js');
const { boardVisibilitySelectors, starredPublicBoardSelector } = require('../models/lib/boardVisibilitySelectors.js');
const { importedBoardPermission } = require('../models/lib/importedBoardPermission.js');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

// The rule.
assert.deepEqual(BOARD_PERMISSIONS, ['private', 'instance', 'public']);
assert.equal(readableWithoutMembership('public', false), true);
assert.equal(readableWithoutMembership('public', true), true);
assert.equal(readableWithoutMembership('instance', true), true);
assert.equal(readableWithoutMembership('instance', false), false, 'never for somebody signed out');
for (const other of ['private', undefined, null, 'Instance', 'org', '']) {
  assert.equal(readableWithoutMembership(other, true), false, String(other));
}
assert.deepEqual(withoutMembershipSelectors(false), [{ permission: 'public' }]);
assert.deepEqual(withoutMembershipSelectors(true), [{ permission: 'public' }, { permission: 'instance' }]);
assert.ok(isOpenPermission('public') && isOpenPermission('instance') && !isOpenPermission('private'));
console.log('  ok - instance boards are readable signed in, never signed out');

// The shared selector builder: instance only with a user, and it drops out
// with public from relationship-only lists and searches.
const has = (clauses, permission) => clauses.some(c => c.permission === permission);
assert.ok(!has(boardVisibilitySelectors({}), 'instance'), 'anonymous subscriber');
assert.ok(has(boardVisibilitySelectors({ userId: 'u' }), 'instance'));
assert.ok(!has(boardVisibilitySelectors({ userId: 'u', includePublic: false }), 'instance'));
assert.ok(!has(boardVisibilitySelectors({ userId: 'u', membersOnly: true }), 'instance'));
assert.deepEqual(starredPublicBoardSelector(['b']).permission, { $in: ['public', 'instance'] });
// Import keeps it, and still fails closed on anything unknown.
assert.equal(importedBoardPermission('instance'), 'instance');
assert.equal(importedBoardPermission('public'), 'public');
for (const bad of [undefined, 'org', 'INSTANCE', {}]) assert.equal(importedBoardPermission(bad), 'private');
console.log('  ok - the shared selectors and import follow the same rule');

// The object check and the schema.
const boards = read('models/boards.js');
assert.match(boards, /allowedValues: BOARD_PERMISSIONS,/);
assert.match(boards, /isVisibleBy\(user\) \{[\s\S]*?if \(readableWithoutMembership\(this\.permission, !!\(user && user\._id\)\)\) \{\s*return true;\s*\}\s*return user && this\.isActiveMember\(user\._id\);/);
assert.match(boards, /isPublic\(\) \{\s*return this\.permission === 'public';/, 'isPublic still means anybody');
console.log('  ok - isVisibleBy grants instance boards to a signed-in user only');

// Negative, tree-wide: every remaining "public" check in server and model code
// is either an anonymous path that must stay public-only, or text. A new read
// gate written as `isPublic()` would silently leave instance boards out (or,
// written the other way, let them out anonymously), so each one is listed.
const REVIEWED = {
  'models/avatars.server.js': [1, 'an avatar is anonymous-readable only through a PUBLIC board'],
  'server/routes/avatarServer.js': [1, 'same, on the avatar route'],
  'server/routes/universalFileServer.js': [2, 'anonymous avatar reads; a signed-in reader uses readableWithoutMembership'],
  'server/lib/cardOgTags.js': [2, 'link previews are unauthenticated, so public only'],
  'server/routes/cardOgTags.js': [1, 'comment about the same'],
  'models/export.js': [6, 'the no-token branch; instance boards authenticate and pass isVisibleBy'],
  'models/exportCharts.js': [1, 'same'],
  'models/exportExcel.js': [1, 'same'],
  'models/exportExcelCard.js': [2, 'same (one is a comment)'],
  'models/exportPDF.js': [2, 'same'],
  'models/boards.js': [4, 'isPublic, visibilityIcon and a comment'],
  'models/lib/boardViewSettings.js': [3, 'per-visibility views; instance uses the private side'],
  'models/lib/boardVisibilitySelectors.js': [1, 'comment'],
  'models/lib/boardPermission.js': [3, 'the rule itself'],
  'models/lib/importedBoardPermission.js': [1, 'import keeps public and instance'],
  'models/trelloCreator.js': [1, 'Trello visibility mapping; Trello "org" stays private'],
  'server/lib/schemaUpgradeSteps.js': [1, 'case repair of stored values'],
  'server/models/boards.js': [1, '/api/boards_count counts each kind'],
  'server/publications/boards.js': [1, 'the admin report filter lists instance beside it'],
};
const PATTERN = "isPublic\\(\\)|permission: 'public'|permission ?===? ?'public'|=== 'public'";
const hits = execFileSync('git', ['grep', '-cE', PATTERN, '--', 'server', 'models', ':!**/tests/**'], { cwd: ROOT })
  .toString().trim().split('\n').filter(Boolean)
  .map(line => { const i = line.lastIndexOf(':'); return [line.slice(0, i), Number(line.slice(i + 1))]; });
const unexpected = hits.filter(([file, count]) => !REVIEWED[file] || REVIEWED[file][0] !== count);
assert.deepEqual(unexpected, [], 'a public-only check was added or removed; review it for instance boards and update this list');
for (const file of Object.keys(REVIEWED)) {
  assert.ok(hits.some(([f]) => f === file), `${file} no longer has its reviewed check - remove it from the list`);
}
console.log('  ok - every remaining public-only check is a reviewed anonymous path');

// The anonymous paths really stay public-only.
assert.match(read('server/lib/cardOgTags.js'), /if \(typeof board\.isPublic !== 'function' \|\| !board\.isPublic\(\)\) return null;/);
assert.match(read('server/publications/cards.js'), /if \(!userId\) \{[\s\S]{0,200}if \(board\.permission !== 'public'\) return this\.ready\(\);/);
assert.match(read('server/publications/boards.js'), /permission: signedIn \? \{ \$in: \['public', 'instance'\] \} : 'public'/);
console.log('  ok - link previews and anonymous publications never include instance boards');
