'use strict';

// GHSA-r4gm-mjj9-g3x8: board role permissions apply to every board view.
//
// The Board Email View published the title, description and email metadata of
// every card in a list or label to an assigned-only member, and counted them,
// because its access check was board.isVisibleBy() - true for any active
// member. The same shape - "a member of the board, so every card of it" - sat
// in other per-card paths: the cross-board subtask picker listed other cards'
// titles, the notification publications kept sending the full documents of
// cards a member could no longer see, and comments, button rules, checklist
// moves, issue state, watching, the card-opened webhook and every card edit
// through Cards.allow took a normal-assigned-only member's board `write` as
// leave to touch any card.
// Run: node tests/boardRoleViews.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const scope = require('../models/lib/boardCardScope');
const { emailFolderSelector, emailSearchSelector } = require('../models/lib/emailView');
const { buttonRuleAllowed } = require('../models/lib/buttonRulePermission');

const board = {
  _id: 'B',
  members: [
    { userId: 'restricted', isActive: true, isReadAssignedOnly: true },
    { userId: 'writerOwn', isActive: true, isNormalAssignedOnly: true },
    { userId: 'normal', isActive: true },
  ],
};
const mine = { _id: 'c1', boardId: 'B', assignees: ['writerOwn', 'restricted'] };
const theirs = { _id: 'c2', boardId: 'B', assignees: ['normal'] };

// The real selectorFor() from server/emailView.js, with its pure helpers.
const emailSource = read('server/emailView.js');
const selectorBody = emailSource.split('async function selectorFor(board, userId, folder, search) {')[1].split('\n}\n')[0];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const selectorFor = new AsyncFunction('mergeCardScope', 'emailFolderSelector', 'emailSearchSelector', 'inboxListId',
  'assignedOnlyCardScope', 'board', 'userId', 'folder', 'search', selectorBody);
const emailSelector = (userId, folder, search) => selectorFor(scope.mergeCardScope, emailFolderSelector,
  emailSearchSelector, async () => 'INBOX', scope.assignedOnlyCardScope, board, userId, folder, search);

test('Email View: an assigned-only member\'s mailbox holds only their cards, in every folder', async () => {
  for (const folder of ['inbox', 'sent', 'all', 'list:L2', 'label:x1']) {
    const selector = await emailSelector('restricted', folder, 'secret');
    assert.deepEqual(selector.$and[1], { assignees: { $in: ['restricted'] } }, folder);
    // The folder and the search are still there, beside the role.
    assert.equal(selector.$and[0].boardId, 'B', folder);
    assert.ok(JSON.stringify(selector.$and[0]).includes('secret'), folder);
  }
});

test('Email View: an ordinary member sees the whole folder (negative)', async () => {
  const selector = await emailSelector('normal', 'list:L2', '');
  assert.deepEqual(selector.$and[1], {});
  assert.equal(selector.$and[0].listId, 'L2');
});

test('Email View: the page, the count and the reply all apply the role', () => {
  assert.match(emailSource, /await selectorFor\(board, this\.userId, options\.folder, options\.search\);\n\s+const page/);
  assert.match(emailSource, /Cards\.find\(await selectorFor\(board, this\.userId, options\.folder, options\.search\)\)\.countAsync\(\)/);
  assert.doesNotMatch(emailSource, /selectorFor\(board, options\./, 'no caller without the user');
  assert.match(emailSource, /isAssignedOnlyMember\(board, userId\) && !\(card\.assignees \|\| \[\]\)\.includes\(userId\)\) \{[\s\S]*?source: 'email-view:reply'/);
});

test('the card rule: assigned-only members pass only for their own cards', () => {
  assert.equal(scope.assignedOnlyAllowsCard(board, 'restricted', mine), true);
  assert.equal(scope.assignedOnlyAllowsCard(board, 'restricted', theirs), false);
  assert.equal(scope.assignedOnlyAllowsCard(board, 'restricted', { _id: 'c3', boardId: 'B' }), false, 'no assignees: not theirs');
  assert.equal(scope.assignedOnlyAllowsCard(board, 'restricted', null), false);
  // Everyone else passes, and so does a non-member here: visibility is the
  // board's own question, asked before this one (negative).
  assert.equal(scope.assignedOnlyAllowsCard(board, 'normal', theirs), true);
  assert.equal(scope.assignedOnlyAllowsCard(board, 'stranger', theirs), true);
  // mayCopyFromBoard is the same rule under its older name.
  assert.equal(scope.mayCopyFromBoard(board, 'writerOwn', theirs), false);
  assert.equal(scope.mayCopyFromBoard(board, 'writerOwn', mine), true);
});

test('button rules: a card\'s button runs only on a card the caller sees', () => {
  assert.equal(buttonRuleAllowed('writerOwn', board, 'c1', mine), true);
  assert.equal(buttonRuleAllowed('writerOwn', board, 'c2', theirs), false);
  assert.equal(buttonRuleAllowed('writerOwn', board, undefined, undefined), true, 'a board-level button');
  assert.equal(buttonRuleAllowed('normal', board, 'c2', theirs), true, 'an ordinary member (negative)');
  assert.equal(buttonRuleAllowed('restricted', board, 'c1', mine), false, 'read-only roles never run rules');
});

test('card edits: the canonical decision and its batch twin apply the card rule', () => {
  const src = read('server/lib/linkedCardPermission.js');
  const single = src.slice(src.indexOf('export async function canEditCardOrLinkedCard('), src.indexOf('export async function editableCardIds('));
  // Before the list rule and the board write answer, so neither can grant it.
  assert.ok(single.indexOf('isAssignedOnlyMember(sourceBoard, userId)') < single.indexOf('listException('));
  assert.match(single, /source: 'card:edit'/);
  const batch = src.slice(src.indexOf('export async function editableCardIds('));
  assert.ok(batch.indexOf('isAssignedOnlyMember(sourceBoard, userId)') < batch.indexOf('allowIsBoardMemberWithWriteAccess('));
  // A card without its assignees is looked up, not treated as unassigned.
  assert.match(src, /const unknown = cards\.filter\(card => !Array\.isArray\(card\.assignees\) && card\._id\)/);
  // Every Cards.allow update goes through it.
  assert.match(read('server/permissions/cards.js'), /if \(await canEditCardOrLinkedCard\(userId, doc, board\)\) return true;/);
});

test('each other per-card path applies the card rule', () => {
  const cross = read('server/crossBoardSubtasks.js');
  assert.match(cross, /\.\.\.\(assignedOnlyCardScope\(target, this\.userId\) \|\| \{\}\) \};/, 'candidates: only cards seen on the target');
  assert.equal((cross.match(/canEditCardOrLinkedCard\(this\.userId, (parent|child)\)/g) || []).length, 3);
  assert.match(read('server/permissions/cardComments.js'), /if \(!assignedOnlyAllowsCard\(await Boards\.findOneAsync\(doc\.boardId\), userId, card\)\)/);
  assert.match(read('server/models/cardComments.js'), /assignedOnlyAllowsCard\(board, req\.userId, card\)/);
  assert.match(read('server/models/checklists.js'), /canEditCardOrLinkedCard\(this\.userId, sourceCard, sourceBoard\)\) \|\|\n\s+!\(await canEditCardOrLinkedCard\(this\.userId, newCard, targetBoard\)\)/);
  assert.match(read('server/versionControlView.js'), /if \(!\(await canEditCardOrLinkedCard\(userId, card, board\)\)\) throw/);
  assert.match(read('server/notifications/watch.js'), /watchableType === 'card' &&\n\s+!require\('\/models\/lib\/boardCardScope'\)\.assignedOnlyAllowsCard\(board, userId, watchableObj\)/);
  assert.match(read('server/notifications/outgoing.js'), /assignedOnlyAllowsCard\(integrationBoard, this\.userId, card\)/);
});

test('notifications: only what the user may still read, by board and by card', () => {
  const src = read('server/publications/notifications.js');
  assert.match(src, /return await readableActivities\(await ReactiveCache\.getActivities\(/);
  assert.match(src, /return canReadBoard\(userId, board\) && assignedOnlyAllowsCard\(board, userId, card\);/);
  // The activity list itself comes from the filtered set too.
  assert.match(src, /async function activityCursor\(\) \{\n\s+const readable = await activityDocs\(\);/);
  // Every notification* publication reads activityDocs()/activityCursor(), never the raw ids.
  for (const m of src.matchAll(/Meteor\.publish\('(notification\w+)'[\s\S]*?\n\}\);/g)) {
    assert.match(m[0], /activityDocs\(\)|activityCursor\(\)/, m[1]);
  }
});

test('negative: every server path that returns card data applies the board role, or says why not', () => {
  // The names that apply the rule, directly or through a helper that does.
  const GUARD = /assignedOnly|isAssignedOnlyMember|mayCopyFromBoard|assignedOnlyAllowsCard|publishBoardMatches|canEditCardOrLinkedCard|editableCardIds|mayReadBoardAttachment|filterReadableHistoryRows|requireHistoryRowAccess|canExportBoardData|exporter\.canExport|memberReadsWholeBoard|checkBoardAccess|canSeeCard|requireButtonRuleContext|AssignedOnly/;
  const SERVES = /Meteor\.publish\(|Meteor\.methods\(|WebApp\.(handlers|connectHandlers)|JsonRoutes/;
  const READS = /Cards\.(find|findOne|aggregate|rawCollection)|getCards?\(|CardComments\.(find|findOne)|getCardComments?\(|Checklists\.find|getChecklists?\(|ChecklistItems\.find|Activities\.find|getActivities\(/;
  const EXEMPT = {
    'server/activityPub.js': 'public boards only',
    'server/routes/cardOgTags.js': 'public boards only (buildCardOpenGraphTags)',
    'server/attachmentMigration.js': 'migration progress: counts and ids, no card content',
    'server/bots.js': 'board admins only',
    'server/caldavSync.js': 'board admins only',
    'server/listPermissions.js': 'board admins only',
    'server/emailToCard.js': 'address settings; inbound mail is matched by inboundEmailUserMatch',
    'server/routes/inboundEmail.js': 'inbound mail, matched by inboundEmailUserMatch',
    'server/importedUserReconciliation.js': 'site admins only',
    'server/sandstorm.js': 'site admins only',
    'server/methods/cleanupTemplateContainers.js': 'site admins only',
    'server/methods/repairBrokenCards.js': 'site admins only',
    'server/migrations/deleteDuplicateEmptyLists.js': 'site admins only',
    'server/migrations/fixAllFileUrls.js': 'site admins only',
    'server/migrations/migrateAttachments.js': 'moves storage, returns no card content',
    'server/shareTarget.js': 'creates a card; returns only its id',
    'server/tableViewCards.js': 'creates a card; returns only its id',
    'server/trelloApiImport.js': 'imports into a board; returns no other card',
    'server/methods/ruleSuggestions.js': 'board admins only; returns list, label and member names, no card content',
  };
  const files = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!['node_modules', '_build', '.build', 'tests'].includes(e.name)) walk(rel); }
      else if (e.name.endsWith('.js')) files.push(rel);
    }
  };
  walk('server'); walk('models'); walk('imports');
  const serving = files.filter(f => { const t = read(f); return SERVES.test(t) && READS.test(t); });
  const unguarded = serving.filter(f => !GUARD.test(read(f)) && !EXEMPT[f]);
  assert.deepEqual(unguarded, [], 'a server path returns card data without the board role');
  assert.deepEqual(Object.keys(EXEMPT).filter(f => !serving.includes(f) || GUARD.test(read(f))), [],
    'every exemption is still a path that needs one');
});

// ---- the read and move paths the full audit found (2026-10-16) -------------

test('the board publication: ancestors, linked sources and their subtasks and dependencies by role', () => {
  const src = read('server/publications/boards.js');
  assert.match(src, /async function roleVisibleCards\(userId, cards\) \{[\s\S]*?assignedOnlyAllowsCard\(boards\.get\(card\.boardId\), userId, card\)/);
  // linked source ids, ancestors, subtasks of linked sources, dependency targets
  assert.equal((src.match(/await roleVisibleCards\(thisUserId,/g) || []).length, 4);
  // Those reads carry the assignees the rule needs.
  assert.match(src, /\{ _id: \{ \$in: linkedIds \} \},\n\s+\{ fields: \{ _id: 1, boardId: 1, assignees: 1 \} \}/);
  assert.match(src, /\{ _id: \{ \$in: ancestorIds \} \},\n\s+\{ fields: \{ _id: 1, boardId: 1, assignees: 1 \} \}/);
  // Reactions follow the comments.
  assert.match(src, /const scope = assignedOnlyCardScope\(board, thisUserId\);\n\s+if \(scope\) \{[\s\S]*?getCardCommentReactions\(\n\s+\{ boardId: board\._id, cardId: \{ \$in:/);
  // All Boards tiles count by role.
  assert.match(src, /\{ boardId: \{ \$in: restricted \}, assignees: userId \}/);
  assert.match(src, /\{ \$match: countMatch \}/);
  assert.doesNotMatch(src, /\$match: \{ boardId: \{ \$in: countedBoardIds \}, archived: false \}/);
});

test('activities, Chat view, the All Boards feed and position history read by the card\'s own board role', () => {
  const acts = read('server/publications/activities.js');
  assert.match(acts, /feedBoards\.filter\(b => isAssignedOnlyMember\(b, this\.userId\)\)/);
  assert.match(acts, /\{ boardId: \{ \$nin: restrictedIds \} \}/);
  assert.doesNotMatch(acts, /\{ boardId: \{ \$ne: board\._id \} \}/, 'a linked board no longer passes whole');
  // Assigned means assignees; a card's members are not its assignees.
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!['node_modules', '_build', '.build', 'tests'].includes(e.name)) walk(rel); }
      else if (e.name.endsWith('.js') && /\$or: \[\{ assignees: [\w.]+ \}, \{ members: [\w.]+ \}\]/.test(read(rel))) offenders.push(rel);
    }
  };
  walk('server'); walk('models');
  assert.deepEqual(offenders, []);
  assert.doesNotMatch(read('server/chatView.js'), /\(card\.members \|\| \[\]\)\.includes\(this\.userId\)/);
  // Every per-card position-history method asks the card, as getCardDescription did.
  const history = read('server/methods/positionHistory.js');
  for (const name of ['trackCard', 'getCardOriginalPosition', 'hasCardMoved', 'getCardDescription']) {
    const body = history.slice(history.indexOf(`async 'positionHistory.${name}'(cardId)`));
    assert.match(body.slice(0, body.indexOf('\n  },')), /if \(!mayCopyFromBoard\(cardBoard, this\.userId, card\)\)/, name);
  }
});

test('My Attachments, /api/user/cards and Scrum rollover counts by role', () => {
  const cards = read('server/publications/cards.js');
  assert.match(cards, /!require\('\/models\/lib\/boardCardScope'\)\.assignedOnlyAllowsCard\(cardBoard, userId, card\)/);
  const rest = read('server/models/cards.js');
  assert.match(rest, /visibleBoards\.has\(card\.boardId\) &&\n\s+assignedOnlyAllowsCard\(visibleBoards\.get\(card\.boardId\), userId, card\)/);
  assert.match(read('server/scrum.js'), /if \(restricted\) \{ delete sprint\.rolloverTotal; delete sprint\.rolloverDone; \}/);
});

test('REST writes and moves: an assigned-only member cannot act on cards they cannot see', () => {
  const auth = read('server/authentication.js');
  const write = auth.slice(auth.indexOf('async checkBoardWriteAccess('), auth.indexOf('async checkBoardAdmin('));
  assert.match(write, /const writeAccess = capability && !isAssignedOnlyMember\(board, userId\);/);
  // The GHSA-f396 canary still fires for a role without the capability (negative).
  assert.match(write, /if \(!capability\) \{[\s\S]*?tripCanary\(writeRefusalCanary\(board, userId\)/);
  assert.match(read('server/publications/swimlanes.js'),
    /requireBoardMutation\(this\.userId, sourceBoard, 'moveSwimlane:source', Meteor\);[\s\S]*?mayCopyFromBoard\(sourceBoard, this\.userId\)/);
  assert.match(read('server/moveBoardObjects.js'), /if \(!mayCopyFromBoard\(sourceBoard, this\.userId, owner \|\| undefined\)\) \{[\s\S]*?source: 'move-board-objects'/);
  for (const file of ['server/attachmentApi.js', 'server/routes/attachmentApi.js']) {
    assert.match(read(file), /mayReadBoardAttachment\(sourceBoard, (this\.)?userId, sourceAttachment, 'attachment-api:move'\)/, file);
  }
});

// ---- custom roles (Admin Panel → People → Roles → Custom roles) ------------

test('custom roles: every combination is narrowed in every view exactly when it does not see all cards', async () => {
  const caps = require('../models/lib/boardRoleCapabilities');
  const { memberReadsWholeBoard } = require('../models/lib/boardReadAccess');
  const NAMES = ['seesAllCards', 'comment', 'write', 'moveCard', 'inviteToBoard'];
  const roles = new Map();
  caps.setCustomRoleLookup(id => roles.get(id) || null);
  try {
    for (let bits = 0; bits < 1 << NAMES.length; bits += 1) {
      const capabilities = Object.fromEntries(NAMES.map((name, i) => [name, Boolean(bits & (1 << i))]));
      const role = caps.normalizeCustomCapabilities(capabilities);
      const id = `role${bits}`;
      roles.set(id, { _id: id, capabilities });
      // The member as server/customBoardRoles.js memberFields() writes it.
      const member = { userId: 'c', isActive: true, customRoleId: id, ...caps.flagsForRole(caps.fallbackRoleFor(capabilities)) };
      const board = { _id: 'B', members: [member, { userId: 'normal', isActive: true }] };
      const ownCard = { _id: 'own', boardId: 'B', assignees: ['c'] };
      const otherCard = { _id: 'other', boardId: 'B', assignees: ['normal'] };
      const label = JSON.stringify(role);
      const narrowed = !role.seesAllCards;
      // The custom role decides capabilities; the mirror decides which cards.
      assert.equal(caps.memberRoleOf(member), `custom:${id}`, label);
      assert.equal(caps.memberCan(board, 'c', 'write'), role.write, label);
      assert.equal(scope.isAssignedOnlyMember(board, 'c'), narrowed, label);
      assert.deepEqual(scope.assignedOnlyCardScope(board, 'c'), narrowed ? { assignees: { $in: ['c'] } } : null, label);
      assert.equal(memberReadsWholeBoard(member, 'c'), role.seesAllCards, `${label} REST whole-board reads`);
      // Every card-level rule, as each view's server path asks it.
      assert.equal(scope.assignedOnlyAllowsCard(board, 'c', ownCard), true, label);
      assert.equal(scope.assignedOnlyAllowsCard(board, 'c', otherCard), role.seesAllCards, label);
      assert.equal(buttonRuleAllowed('c', board, 'other', otherCard), role.write && role.seesAllCards, `${label} button`);
      assert.equal(buttonRuleAllowed('c', board, 'own', ownCard), role.write, `${label} own-card button`);
      // REST writes: the capability, and never for an assigned-only member.
      assert.equal(caps.memberCan(board, 'c', 'write') && !scope.isAssignedOnlyMember(board, 'c'),
        role.write && role.seesAllCards, `${label} REST writes`);
      // The Email View's real selector.
      const selector = await selectorFor(scope.mergeCardScope, emailFolderSelector, emailSearchSelector,
        async () => 'INBOX', scope.assignedOnlyCardScope, board, 'c', 'all', '');
      assert.deepEqual(selector.$and[1], narrowed ? { assignees: { $in: ['c'] } } : {}, `${label} Email View`);
    }
  } finally {
    caps.setCustomRoleLookup(() => null);
  }
});

test('custom roles: nothing sets the role flags without the custom role following', () => {
  // A flag written with the custom role left in place would let the role's
  // capabilities apply while the flags say which cards - the two could then
  // disagree. Only two writers set them: memberFields() with the custom role,
  // and setMemberPermission(), which removes it.
  const custom = read('server/customBoardRoles.js');
  assert.match(custom, /const flags = flagsForRole\(fallbackRoleFor\(capabilities\)\);[\s\S]*?fields\[`members\.\$\{index\}\.customRoleId`\] = roleId;/);
  assert.match(custom, /await refreshMembersOf\(roleId, capabilities\);/, 'saving a role rewrites its members on every board');
  const boards = read('models/boards.js');
  const setter = boards.slice(boards.indexOf('async setMemberPermission('), boards.indexOf('async setAllowsSubtasks('));
  assert.match(setter, /\$unset: \{\n\s+\[`members\.\$\{memberIndex\}\.customRoleId`\]: '',/);
  const writers = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!['node_modules', '_build', '.build', 'tests'].includes(e.name)) walk(rel); }
      else if (e.name.endsWith('.js') && /`members\.\$\{\w+\}\.is(NormalAssignedOnly|CommentAssignedOnly|ReadAssignedOnly|NoComments|CommentOnly|Worker|ReadOnly)`/.test(read(rel))) writers.push(rel);
    }
  };
  walk('server'); walk('models');
  assert.deepEqual(writers, ['models/boards.js'], 'only setMemberPermission writes a flag by member index');
});
