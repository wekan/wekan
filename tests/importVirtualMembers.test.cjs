'use strict';

// Wiring guards for import member handling:
//   - #6506: import shows the OPTIONAL "map members" step so imported members can be
//     mapped to existing WeKan users; members left unmapped (or skipped) are brought in
//     as virtual (placeholder) users, NOT collapsed onto the importing user.
//   - Import is bounded by a hang-mitigation watchdog (client + server) so it can never
//     spin forever.
//   - A board admin can also map a virtual member to an existing real board user LATER
//     from the sidebar member-avatar popup, via a board-scoped, no-escalation method.
//
// Run: node tests/importVirtualMembers.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('importVirtualMembers:');

test('#6506: import shows the map-members step and builds the mapping from it', () => {
  const js = read('client/components/import/import.js');
  assert.ok(/this\.steps = \['importTextarea', 'importMapMembers'\]/.test(js),
    'the wizard includes the importMapMembers step again');
  // finishImport builds the mapping from the members the user mapped (member.wekanId).
  const fi = js.slice(js.indexOf('this.finishImport'));
  assert.ok(/this\.membersToMap\.get\(\)/.test(fi) && /member\.wekanId/.test(fi),
    'finishImport builds membersMapping from the mapped members');
  assert.ok(/mappingById\[member\.id\] = member\.wekanId/.test(fi),
    'each mapped member maps its imported id to the chosen existing user');
  // The skip button and the textarea "without mapping" button both still bypass it.
  assert.ok(/js-import-skip-mapping/.test(js) && /js-import-without-mapping/.test(js),
    'skip / import-without-mapping remain available');
});

test('#6506: unmapped Trello members become virtual users (both JSON and API import)', () => {
  const tc = read('models/trelloCreator.js');
  assert.ok(/async createPlaceholderUsers\(board\)/.test(tc), 'trelloCreator creates placeholder users');
  assert.ok(/await this\.createPlaceholderUsers\(board\)/.test(tc), 'create() runs it before building the board');
  // Unmapped members map to an existing user by username, else a virtual placeholder.
  assert.ok(/if \(this\.members\[member\.id\]\) continue;/.test(tc), 'already-mapped members are kept');
  assert.ok(/ReactiveCache\.getUser\(\{ username: member\.username \}\)/.test(tc), 'auto-maps by username');
  assert.ok(/loginDisabled: true/.test(tc) && /isActive: false/.test(tc) && /authenticationMethod: 'imported'/.test(tc),
    'placeholders are inert imported users');
  // wekanCreator keeps an explicit UI mapping instead of overwriting it with a placeholder.
  const wc = read('models/wekanCreator.js');
  assert.ok(/if \(this\.members\[u\._id\]\) continue;/.test(wc),
    'wekanCreator does not clobber an explicit mapping with the identity placeholder');
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

test('the deadline + map-plan helpers are importable + testable', () => {
  // withDeadline is a client-reachable helper, so it is an ES module (export) to keep
  // rspack from flagging module.exports as an ES-module assignment; boardMemberMapPlan is
  // server-only and stays CommonJS.
  assert.ok(/export \{ withDeadline \}/.test(read('models/lib/withDeadline.js')));
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

test('#6508: the board publishes authenticationMethod so the member popup can detect a virtual member', () => {
  const pub = read('server/publications/boards.js');
  // The board composite's member-user cursor must publish authenticationMethod, or
  // isImportedMember() reads undefined and the in-board "Remap User" action never shows.
  const at = pub.indexOf("'profile.fullname': 1");
  assert.ok(at > -1, 'board member user fields exist');
  const block = pub.slice(at, at + 800);
  assert.ok(/authenticationMethod: 1/.test(block),
    'the board member user fields must include authenticationMethod (for in-board Remap)');
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
    'targets are real users, never another placeholder');
});

// #6519: the picker listed ONLY board members, so a freshly imported board offered
// nobody but the admin and there was no way to reach any other user.
test('#6519: the picker can search every real user, not just board members', () => {
  const js = read('client/components/sidebar/sidebar.js');
  const jade = read('client/components/sidebar/sidebar.jade');
  assert.ok(/js-map-target-search-input/.test(jade), 'the picker has a search box');
  assert.ok(/keyup \.js-map-target-search-input/.test(js), 'typing searches');
  assert.ok(/Meteor\.call\('searchUsers'/.test(js),
    'search goes through the same permission-checked searchUsers method as add-member');
  assert.ok(/map-to-existing-user-not-member/.test(jade),
    'a target who is not on the board yet is labelled as such');
});

test('#6519: mapping onto a non-member adds them with the PLACEHOLDER role, after the invite policy', () => {
  const plan = read('models/lib/boardMemberMapPlan.js');
  const srv = read('server/importedUserReconciliation.js');
  // The added entry copies the placeholder's flags - never a higher role.
  assert.ok(/isAdmin: placeholderMember\.isAdmin === true/.test(plan),
    'the added member gets the placeholder role, not an arbitrary one');
  assert.ok(/addedMember/.test(plan), 'the plan says whether a membership is created');
  // Creating a membership must clear the same bar as inviting the user would.
  assert.ok(/plan\.addedMember/.test(srv) && /checkMayAddBoardMember/.test(srv),
    'the invite policy runs when (and only when) a membership is created');
  assert.ok(/boardMembersFromSameOrgOrTeamOnly/.test(srv), 'the #6116 org/team restriction is enforced');
  assert.ok(/allowedRoles/.test(srv), 'the roles-allowed-to-invite setting is enforced');
  assert.ok(/loginDisabled/.test(srv), 'a deactivated account is never added');
  // The checks must happen BEFORE anything is written.
  assert.ok(srv.indexOf('checkMayAddBoardMember(board, caller, target)') < srv.indexOf('Cards.find({ boardId,'),
    'the policy check precedes every write');
});

test('i18n keys for the map action exist', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const k of ['map-to-existing-user', 'map-to-existing-user-desc', 'map-to-existing-user-none',
    'map-to-existing-user-search', 'map-to-existing-user-not-member',
    'map-to-existing-user-no-results', 'import-timeout']) {
    assert.ok(typeof en[k] === 'string' && en[k].length > 0, `missing i18n key: ${k}`);
  }
});

console.log(`\n${passed} tests passed`);
