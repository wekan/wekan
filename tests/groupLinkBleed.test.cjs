'use strict';

// Guard: GroupLinkBleed (GHSA-v544-rmr5-38gx). Boards.allow lets a board admin
// update any field of their board, and two checks lived only inside Meteor
// methods: "a board admin may add only the organizations and teams they belong
// to" (#5141, setBoardOrgs/setBoardTeams) and inviteUserToBoard's checks (who
// may invite, disabled accounts, the #6116 same organization/team policy). A
// client calling Boards.update / Boards.insert directly - /boards/update over
// DDP - skipped both: it could attach any team or organization to its board,
// so the whole group saw it and became members, and push any user id into
// members.
//
// This runs the REAL deny rules of server/permissions/boards.js in a vm, with
// stubbed imports, against the reporter's writes and against every write the
// client legitimately makes. A write is refused when any deny rule says so,
// exactly as Meteor's allow/deny decides.
// Run: node tests/groupLinkBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const guards = require('../models/lib/boardWriteGuards');

function loadRules() {
  const denies = [];
  const recorded = [];
  const Boards = { deny: rules => denies.push(rules), allow: () => {} };
  const resolve = spec => {
    if (spec === '/server/lib/securityLog') return { record: evt => recorded.push(evt) };
    if (spec === '/models/attachments') return { default: { findOneAsync: async () => null } };
    return require(path.join(ROOT, spec));
  };
  const src = read('server/permissions/boards.js')
    .replace(/^import Boards from .*$/m, '')
    .replace(/^import TableVisibilityModeSettings from .*$/m,
      'const TableVisibilityModeSettings = { findOneAsync: async () => null };')
    .replace(/^import \{ findWhere, where \} from .*$/m,
      'const where = (a, q) => (a || []).filter(x => Object.keys(q).every(k => x[k] === q[k]));'
      + 'const findWhere = (a, q) => where(a, q)[0];')
    .replace(/^import \{[^}]*\} from '\/server\/lib\/utils';$/m,
      'const allowIsBoardAdminOrSiteAdmin = () => true; const canUpdateBoardSort = () => false;'
      + 'const canUpdateBoardSameWidthValue = () => false;')
    .replace(/^import \{[^}]*\} from '\/server\/lib\/subtaskDepositAccess';$/m,
      'const canWriteSubtaskDeposit = async () => true; const recordSubtaskDepositDenial = () => {};')
    // CreateBleed's rule (tests/createBleed.test.cjs): creating a board is
    // allowed here, so these tests see the group and member rules alone.
    .replace(/^import \{ mayCreateBoard \} from '\/server\/lib\/boardCreationGuard';$/m,
      'const mayCreateBoard = async () => true;');
  assert.ok(!/^import /m.test(src), 'every import of server/permissions/boards.js is stubbed');
  vm.runInNewContext(src, { Boards, require: resolve, console });
  return { denies, recorded };
}

const ADMIN = 'admin';
const board = () => ({
  _id: 'b1',
  members: [
    { userId: ADMIN, isAdmin: true, isActive: true },
    { userId: 'bob', isAdmin: false, isActive: true },
    { userId: 'gone', isAdmin: false, isActive: false },
  ],
  teams: [{ teamId: 'mine', teamDisplayName: 'Mine', isActive: true }],
});
const fieldsOf = modifier => [...new Set(Object.values(modifier).flatMap(a => Object.keys(a).map(k => k.split('.')[0])))];

async function refusedUpdate(modifier, doc = board()) {
  const { denies, recorded } = loadRules();
  for (const rules of denies) {
    if (rules.update && await rules.update(ADMIN, doc, fieldsOf(modifier), modifier)) return { refused: true, recorded };
  }
  return { refused: false, recorded };
}
async function refusedInsert(doc) {
  const { denies, recorded } = loadRules();
  for (const rules of denies) {
    if (rules.insert && await rules.insert(ADMIN, doc)) return { refused: true, recorded };
  }
  return { refused: false, recorded };
}

const newMember = userId => ({ userId, isAdmin: false, isActive: true, isNoComments: false, isCommentOnly: false,
  isWorker: false, isNormalAssignedOnly: false, isCommentAssignedOnly: false, isReadOnly: false, isReadAssignedOnly: false });

test('the reported attack: a foreign team, organization or domain written straight to the board is refused and recorded', async () => {
  for (const modifier of [
    { $set: { teams: [{ teamId: 'foreign', teamDisplayName: 'x', isActive: true }] } },
    { $push: { teams: { teamId: 'foreign', teamDisplayName: 'x', isActive: true } } },
    { $addToSet: { orgs: { orgId: 'foreign', orgDisplayName: 'x', isActive: true } } },
    { $set: { 'teams.0.teamId': 'foreign' } },
    { $set: { domains: [{ domain: 'example.com', isActive: true }] } },
    { $set: { title: 'harmless', orgs: [{ orgId: 'foreign', orgDisplayName: 'x', isActive: true }] } },
  ]) {
    const { refused, recorded } = await refusedUpdate(modifier);
    assert.equal(refused, true, JSON.stringify(modifier));
    assert.equal(recorded[0].key, 'authz.group-link', JSON.stringify(modifier));
    assert.equal(recorded[0].action, 'blocked');
  }
  for (const field of ['teams', 'orgs', 'domains']) {
    const { refused, recorded } = await refusedInsert({ title: 'x', [field]: [{ isActive: true }] });
    assert.equal(refused, true, field);
    assert.equal(recorded[0].source, 'ddp:boards.insert');
  }
});

test('the member variant: adding or bringing back a member from the client is refused and recorded', async () => {
  for (const modifier of [
    { $push: { members: newMember('stranger') } },
    { $addToSet: { members: newMember('stranger') } },
    { $set: { members: [...board().members, newMember('stranger')] } },
    { $set: { 'members.3': newMember('stranger') } },
    { $set: { 'members.1': newMember('stranger') } },
    { $set: { 'members.1.userId': 'stranger' } },
    { $set: { 'members.$.isActive': true } },
    { $set: { 'members.2.isActive': true } },
    { $set: { 'members.2': { ...board().members[2], isActive: true } } },
    { $set: { members: board().members.map(m => ({ ...m, isActive: true })) } },
  ]) {
    const { refused, recorded } = await refusedUpdate(modifier);
    assert.equal(refused, true, JSON.stringify(modifier));
    assert.equal(recorded.at(-1).key, 'authz.member-add', JSON.stringify(modifier));
  }
});

test('negative: what the client legitimately writes still passes and is not logged', async () => {
  for (const modifier of [
    // setMemberPermission (models/boards.js), dotted $set + $unset.
    { $set: { 'members.1.isAdmin': true, 'members.1.isCommentOnly': false }, $unset: { 'members.1.customRoleId': '' } },
    // removeMember: deactivate, keep the last admin, orphan cleanup.
    { $set: { 'members.1.isActive': false, 'members.1.isAdmin': false }, $unset: { 'members.1.grantedBy': '' } },
    { $set: { 'members.0.isActive': true } },
    { $set: { members: board().members.filter(m => m.userId !== 'bob') } },
    { $pull: { members: { userId: 'bob' } } },
    // Ordinary board settings.
    { $set: { title: 'Renamed', color: 'belize' } },
    { $set: { allowsSubtasks: true } },
  ]) {
    const { refused, recorded } = await refusedUpdate(modifier);
    assert.equal(refused, false, JSON.stringify(modifier));
    assert.deepEqual(recorded, [], JSON.stringify(modifier));
  }
  // The UI creates a board without groups or other members.
  const { refused } = await refusedInsert({ title: 'New', members: [newMember(ADMIN)], teams: [], orgs: [] });
  assert.equal(refused, false);
});

test('the pure helpers', () => {
  assert.equal(guards.isGroupLinkField('teams'), true);
  assert.equal(guards.isGroupLinkField('orgs.0.orgId'), true);
  assert.equal(guards.isGroupLinkField('domainsX'), false);
  assert.equal(guards.isGroupLinkField('title'), false);
  assert.equal(guards.addsBoardMember(board(), { $rename: { 'members': 'x' } }), true);
  assert.equal(guards.addsBoardMember(board(), { $set: { 'members.1.isWorker': true } }), false);
  assert.equal(guards.addsBoardMember({}, { $set: { 'members.0.isActive': false } }), true, 'no members: no index exists');
});

test('the methods keep their checks, the catalog has the keys', () => {
  const methods = read('server/models/boards.js');
  for (const name of ['setBoardOrgs', 'setBoardTeams']) {
    const start = methods.indexOf(`async ${name}(`);
    const guard = methods.indexOf('forbiddenNewGroupIds(', start);
    const write = methods.indexOf('Boards.updateAsync(', start);
    assert.ok(start > 0 && guard > start && guard < write, `${name} checks before writing`);
  }
  const catalog = read('models/lib/securityCategories.js');
  assert.match(catalog, /'authz\.group-link':\s*\{[^}]*bleed: 'GroupLinkBleed'[^}]*cwe: 'CWE-863'/);
  assert.match(catalog, /'authz\.member-add':\s*\{[^}]*bleed: 'GroupLinkBleed'[^}]*cwe: 'CWE-863'/);
});

// The shape of the fault: a field whose only check sits inside a Meteor method
// is still writable by a client through the collection, unless a deny rule
// names it. Every board field a method guards with an ownership/membership
// check must be named by a Boards.deny rule - or, for members, by the add
// guard.
test('negative: no board field guarded only by a method is left client-writable', () => {
  const methods = read('server/models/boards.js');
  const perms = read('server/permissions/boards.js') + read('models/boards.js');
  const guarded = new Set();
  for (const m of methods.matchAll(/forbiddenNewGroupIds\(\{\s*previous: board\.(\w+)/g)) guarded.add(m[1]);
  assert.deepEqual([...guarded].sort(), ['orgs', 'teams']);
  for (const field of [...guarded, 'domains']) {
    assert.ok(guards.GROUP_LINK_FIELDS.includes(field), `${field} is denied to client writes`);
  }
  assert.match(perms, /addsBoardMember\(doc, modifier\)/);
  // No client code writes these fields directly: the UI goes through the methods.
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'tests' || e.name === 'node_modules' || e.name.startsWith('_build')) return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (rel.endsWith('.js') ? [rel] : []);
  });
  const offenders = walk('client').filter(file =>
    /Boards\.update(Async)?\([^;]*\b(teams|orgs|domains)\s*:/.test(read(file))
    || /Boards\.update(Async)?\([^;]*\$(push|addToSet)\s*:\s*\{\s*members\b/.test(read(file)));
  assert.deepEqual(offenders, []);
});
