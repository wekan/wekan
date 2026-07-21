'use strict';

// Wiring guards for the "import always creates virtual users, map later" feature:
//   - Import never asks for member mapping up front (single step, empty mapping), so
//     every imported member is brought in as a virtual (placeholder) user.
//   - Import is bounded by a hang-mitigation watchdog (client + server) so it can never
//     spin forever.
//   - A board admin maps a virtual member to an existing real board user LATER from the
//     sidebar member-avatar popup, via a board-scoped, no-escalation server method.
//
// Run: node tests/importVirtualMembers.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('importVirtualMembers:');

test('import runs immediately with no member-mapping step', () => {
  const js = read('client/components/import/import.js');
  assert.ok(/this\.steps = \['importTextarea'\]/.test(js), 'only the textarea step remains (no importMapMembers step)');
  // finishImport must not build a mapping from membersToMap — every member is virtual.
  const fi = js.slice(js.indexOf('this.finishImport'));
  assert.ok(/const mappingById = \{\};/.test(fi), 'finishImport passes an empty membersMapping');
  assert.ok(!/membersMapping\.forEach/.test(fi), 'no per-member wekanId mapping is applied at import');
});

test('import is bounded by a client-side watchdog (no infinite spinner)', () => {
  const js = read('client/components/import/import.js');
  assert.ok(/Meteor\.setTimeout\(/.test(js) && /import-timeout/.test(js), 'a watchdog surfaces import-timeout');
  assert.ok(/Meteor\.clearTimeout\(watchdog\)/.test(js), 'the watchdog is cleared on completion');
});

test('import is bounded on the server by a hard deadline', () => {
  const srv = read('models/import.js');
  assert.ok(/withDeadline\(/.test(srv), 'importBoard wraps creator.create with a deadline');
  assert.ok(/WEKAN_IMPORT_TIMEOUT_MS/.test(srv), 'deadline is configurable');
  assert.ok(/'import-timeout'/.test(srv), 'server raises import-timeout');
});

test('the deadline + map-plan helpers are CommonJS (importable + testable)', () => {
  assert.ok(/module\.exports = \{ withDeadline \}/.test(read('models/lib/withDeadline.js')));
  assert.ok(/module\.exports = \{ planBoardMemberMapping \}/.test(read('models/lib/boardMemberMapPlan.js')));
});

test('the board-scoped map method is board-scoped and no-escalation', () => {
  const srv = read('server/importedUserReconciliation.js');
  assert.ok(/mapImportedBoardMember\b/.test(srv), 'exposes mapImportedBoardMember');
  assert.ok(/planBoardMemberMapping\(/.test(srv), 'authorizes/decides via the pure planner');
  // Scoped to one board: card queries and the membership update are keyed by boardId.
  assert.ok(/Cards\.find\(\{ boardId, /.test(srv), 'card reassignment is scoped to the board');
  assert.ok(/Boards\.direct\.updateAsync\(boardId,/.test(srv), 'only this board\'s members are changed');
  // Activities/comments reassignment is also board-scoped.
  assert.ok(/\{ boardId, userId: placeholderId \}/.test(srv), 'activities/comments reassignment is board-scoped');
});

test('the sidebar offers mapping only for virtual members, to existing real board users', () => {
  const js = read('client/components/sidebar/sidebar.js');
  const jade = read('client/components/sidebar/sidebar.jade');
  assert.ok(/isImportedMember\(\)/.test(js) && /authenticationMethod === 'imported'/.test(js),
    'a virtual-member helper detects imported placeholders');
  assert.ok(/if isImportedMember/.test(jade), 'the map action shows only for virtual members');
  assert.ok(/'click \.js-map-imported-member': Popup\.open\('mapImportedMember'\)/.test(js), 'opens the picker');
  assert.ok(/Meteor\.call\('mapImportedBoardMember'/.test(js), 'picking a target calls the board-scoped method');
  // The picker excludes imported placeholders (can only map onto REAL users) and the self.
  assert.ok(/authenticationMethod !== 'imported'/.test(js) && /activeMembers\(\)/.test(js),
    'targets are existing active real board members only');
});

test('i18n keys for the map action exist', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const k of ['map-to-existing-user', 'map-to-existing-user-desc', 'map-to-existing-user-none', 'import-timeout']) {
    assert.ok(typeof en[k] === 'string' && en[k].length > 0, `missing i18n key: ${k}`);
  }
});

console.log(`\n${passed} tests passed`);
