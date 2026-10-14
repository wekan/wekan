'use strict';

// Custom board roles (#3022): an administrator builds named roles from the
// capability matrix (models/lib/boardRoleCapabilities.js), and board admins
// give them to members like the built-in roles.
//
// The rules this pins, because each is what keeps a custom role from granting
// more than it says:
//   - a role's capabilities are cleaned (booleans only, write brings moveCard,
//     never manageBoard);
//   - the built-in flags a member also carries (fallbackRoleFor) never grant
//     anything the custom role cannot do, and agree with it on which cards the
//     member sees - checked for EVERY combination;
//   - where code asks for a role by name, a custom role reads as the built-in
//     role that does what it does (uiRoleFor), and a built-in role's own
//     capabilities read back as that role;
//   - a deleted role leaves the fallback; board admin always wins;
//   - invites come from the custom role's own setting on every invite path.
// Run: node tests/customBoardRoles.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const caps = require(path.join(ROOT, 'models/lib/boardRoleCapabilities.js'));
const { roleMayInvite, canInviteToBoard } = require(path.join(ROOT, 'models/lib/invitationBoardPermission.js'));
const { planImportedBoardMember } = require(path.join(ROOT, 'models/lib/importedBoardMemberPlan.js'));

const CARD_CAPS = ['seesAllCards', 'comment', 'write', 'moveCard'];
function* everyCombination() {
  for (let bits = 0; bits < 32; bits += 1) {
    const c = {};
    caps.CUSTOM_ROLE_CAPABILITIES.forEach((cap, i) => { c[cap] = !!(bits & (1 << i)); });
    yield c;
  }
}

test('a role is cleaned: booleans only, writing brings moving, never board settings', () => {
  assert.deepEqual(caps.normalizeCustomCapabilities({ write: true, comment: 'yes', manageBoard: true, isAdmin: true }),
    { seesAllCards: false, comment: false, write: true, moveCard: true, inviteToBoard: false, manageBoard: false });
  assert.deepEqual(caps.normalizeCustomCapabilities(null).manageBoard, false);
  assert.deepEqual(caps.CUSTOM_ROLE_CAPABILITIES, ['seesAllCards', 'comment', 'write', 'moveCard', 'inviteToBoard']);
});

test('the fallback flags never grant more, and see the same cards - every combination', () => {
  for (const c of everyCombination()) {
    const custom = caps.normalizeCustomCapabilities(c);
    const fallback = caps.fallbackRoleFor(custom);
    assert.notEqual(fallback, 'board-admin');
    for (const cap of CARD_CAPS) {
      if (caps.ROLE_CAPABILITIES[fallback][cap]) assert.ok(custom[cap], `${JSON.stringify(custom)} -> ${fallback} would grant ${cap}`);
    }
    assert.equal(caps.ROLE_CAPABILITIES[fallback].seesAllCards, custom.seesAllCards,
      `${JSON.stringify(custom)} -> ${fallback} must scope cards the same way`);
  }
  // An exact match is the built-in role itself.
  for (const role of caps.BOARD_ROLES.filter(r => r !== 'board-admin')) {
    assert.equal(caps.fallbackRoleFor(caps.ROLE_CAPABILITIES[role]), role, role);
  }
  assert.equal(caps.fallbackRoleFor({ seesAllCards: true, moveCard: true }), 'read-only', 'moving alone has no built-in twin');
});

test('by name, a custom role reads as the built-in role that does what it does', () => {
  for (const role of caps.BOARD_ROLES.filter(r => r !== 'board-admin')) {
    assert.equal(caps.uiRoleFor(caps.ROLE_CAPABILITIES[role]), role, `${role} round-trips`);
  }
  for (const c of everyCombination()) {
    const custom = caps.normalizeCustomCapabilities(c);
    const ui = caps.ROLE_CAPABILITIES[caps.uiRoleFor(custom)];
    // Writing and moving: never more than the role. Commenting is not decided
    // by a role name at all - see the next assertions - so a moving role may
    // read as a Worker without being offered a Worker's comments.
    for (const cap of ['write', 'moveCard']) {
      if (ui[cap]) assert.ok(custom[cap], `${JSON.stringify(custom)} -> ${caps.uiRoleFor(custom)} would show ${cap}`);
    }
  }
  // The comment form, reactions and chat ask the comment capability, as the
  // server does - not isNoComments/isReadOnly, which a custom role reads as.
  const details = read('client/components/cards/cardDetails.jade');
  assert.match(details, /if canComment\n\s+\+commentForm/);
  assert.match(read('client/components/activities/comments.jade'), /if canComment\n\s+a\.open-comment-reaction-popup/);
  assert.match(read('client/components/boards/chatView.js'), /Utils\.currentUserCan\('comment'\)/);
  // Since #4527 the helper asks the card's LIST first (a list may allow or
  // refuse commenting for a role) and falls back to the same capability table.
  assert.match(read('client/config/blazeHelpers.js'), /registerHelper\('canComment', \(\) => Utils\.currentUserCanInList\('comment'\)\)/);
  assert.match(read('client/lib/utils.js'), /if \(!list \|\| !list\.roleExceptions\) return Utils\.currentUserCan\(capability, board\);/);
  assert.equal(caps.uiRoleFor({ seesAllCards: true, moveCard: true }), 'worker');
  assert.equal(caps.uiRoleFor({ comment: true }), 'comment-assigned-only');
});

test('a member\'s custom role decides; a deleted one leaves the fallback; board admin wins', () => {
  caps.setCustomRoleLookup(id => ({ mover: { capabilities: { seesAllCards: true, moveCard: true } } })[id] || null);
  try {
    const m = { userId: 'u', isActive: true, customRoleId: 'mover', ...caps.flagsForRole('read-only') };
    assert.equal(caps.memberRoleOf(m), 'custom:mover');
    assert.equal(caps.memberCan([m], 'u', 'moveCard'), true);
    assert.equal(caps.memberCan([m], 'u', 'write'), false);
    assert.equal(caps.memberCan([m], 'u', 'comment'), false);
    assert.equal(caps.memberCan([m], 'u', 'manageBoard'), false);
    assert.equal(caps.memberRoleOf({ ...m, customRoleId: 'deleted' }), 'read-only', 'the fallback flags');
    assert.equal(caps.memberRoleOf({ ...m, isAdmin: true }), 'board-admin');
    assert.equal(caps.memberRoleOf({ ...m, isActive: false }), null);
    assert.equal(caps.roleCan('custom:nope', 'seesAllCards'), false, 'an unknown role may do nothing');
  } finally {
    caps.setCustomRoleLookup(null);
  }
  assert.equal(caps.memberRoleOf({ userId: 'u', isActive: true, customRoleId: 'mover' }), 'normal', 'no lookup: flags');
});

test('invites: a custom role by its own setting, a built-in role by the Admin Panel list, on every path', () => {
  caps.setCustomRoleLookup(id => ({ inv: { capabilities: { inviteToBoard: true } }, quiet: { capabilities: {} } })[id] || null);
  try {
    assert.equal(roleMayInvite('custom:inv', []), true);
    assert.equal(roleMayInvite('custom:quiet', ['custom:quiet', 'normal']), false, 'the list cannot grant a custom role');
    assert.equal(roleMayInvite('normal', ['normal']), true);
    assert.equal(roleMayInvite('worker', ['normal']), false);
    assert.equal(roleMayInvite(null, ['normal']), false);
    const board = { members: [{ userId: 'a', isActive: true, customRoleId: 'inv' }] };
    assert.equal(canInviteToBoard({ _id: 'a' }, board, []), true);
  } finally {
    caps.setCustomRoleLookup(null);
  }
  // Negative: no invite path keeps its own list check.
  for (const file of ['server/models/users.js', 'server/importedUserReconciliation.js', 'models/users.js']) {
    const src = read(file);
    assert.doesNotMatch(src, /allowedRoles\.includes\(board\.memberRole|allowed\.includes\(role\)/, `${file} asks roleMayInvite`);
    assert.match(src, /roleMayInvite\(/, file);
  }
});

test('the board helpers, the role popup and the server keep a custom role consistent', () => {
  const boards = read('models/boards.js');
  for (const helper of ['hasNoComments', 'hasCommentOnly', 'hasWorker', 'hasNormalAssignedOnly', 'hasCommentAssignedOnly', 'hasReadOnly', 'hasReadAssignedOnly']) {
    assert.match(boards, new RegExp(`  ${helper}\\(memberId\\) \\{\\n    const custom = this\\.customUiRoleOf\\(memberId\\);`), `${helper} asks the custom role first`);
  }
  assert.match(boards, /\$unset: \{\n\s+\[`members\.\$\{memberIndex\}\.customRoleId`\]: '',/, 'a built-in role replaces a custom one');
  assert.match(boards, /'members\.\$\.customRoleId': \{/, 'the schema allows it');
  const server = read('server/customBoardRoles.js');
  assert.match(server, /'customBoardRoles\.save'[\s\S]*?await requireSiteAdmin\(this\.userId\)/);
  assert.match(server, /'customBoardRoles\.remove'[\s\S]*?await requireSiteAdmin\(this\.userId\)/);
  assert.match(server, /'boards\.setMemberCustomRole'[\s\S]*?await allowIsBoardAdminOrSiteAdmin\(this\.userId, board\)/);
  assert.match(server, /throw new Meteor\.Error\('last-board-admin'\)/, 'the last board admin cannot be turned into a custom role');
  assert.match(server, /await refreshMembersOf\(roleId, capabilities\)/, 'changing a role rewrites its members\' fallback flags');
  // REST whole-board reads judge a custom role by whether it sees all cards.
  caps.setCustomRoleLookup(id => ({ all: { capabilities: { seesAllCards: true } }, mine: { capabilities: { comment: true, write: true } } })[id] || null);
  try {
    const { memberReadsWholeBoard } = require(path.join(ROOT, 'models/lib/boardReadAccess.js'));
    assert.equal(memberReadsWholeBoard({ userId: 'u', isActive: true, customRoleId: 'all', isReadOnly: true }, 'u'), true);
    assert.equal(memberReadsWholeBoard({ userId: 'u', isActive: true, customRoleId: 'mine', isReadAssignedOnly: true }, 'u'), false);
  } finally {
    caps.setCustomRoleLookup(null);
  }
});

test('an imported or mapped member: all eight flags, and no foreign custom role', () => {
  const plan = planImportedBoardMember({ wekanId: 'x', isActive: true, isReadOnly: true, customRoleId: 'their-role' }, 'importer');
  assert.equal(plan.customRoleId, undefined, 'another instance\'s role id means nothing here');
  assert.equal(plan.isReadOnly, true);
  const src = read('models/lib/boardMemberMapPlan.js');
  for (const flag of Object.values(caps.ROLE_FLAGS)) assert.match(src, new RegExp(`${flag}: placeholderMember\\.${flag} === true`), flag);
});

test('Admin Panel: custom roles are edited there and listed in Roles Status', () => {
  const jade = read('client/components/settings/peopleBody.jade');
  for (const cls of ['js-custom-role-name', 'js-custom-role-cap', 'js-custom-role-save', 'js-custom-role-delete']) assert.ok(jade.includes(cls), cls);
  const js = read('client/components/settings/peopleBody.js');
  assert.match(js, /Meteor\.call\('customBoardRoles\.save'/);
  assert.match(js, /all\.push\(\{ _id: `custom:\$\{role\._id\}`/);
  const popup = read('client/components/sidebar/sidebar.jade');
  assert.match(popup, /js-set-custom-role/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['custom-roles', 'custom-roles-desc', 'custom-role-name', 'add-custom-role', 'custom-role-sees-all', 'roles-status-move']) assert.ok(en[key], key);
});
