'use strict';

// Guard: AssignedBleed, read siblings (2026-10-02). An assigned-only member (isReadAssignedOnly,
// isNormalAssignedOnly, isCommentAssignedOnly) sees only the cards assigned to
// them. The board publication enforced that, but several other read paths
// asked only "is this a member of the board?" and so showed that member every
// card of it:
//   - the attachment API (REST and DDP): list enumerated every attachment of
//     the board, download and info served any of them;
//   - the activities publication: a board's whole activity feed, and the
//     feed of any card by id;
//   - Due Cards with "all users", and Global Search;
//   - the structural move dialog's card and checklist-item pickers;
//   - position history for the board and a card's original position.
// and (GHSA-3cgr-47wm-9cc9, 2026-10-15) six more that served files or their
// text after a membership check alone: the /cdn/storage and /cfs/files
// downloads, Attachments.protected, the legacy download route and
// publication, the document-text search, and linked-list cards.
// Run: node tests/assignedOnlyReads.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const scope = require('../models/lib/boardCardScope');

function loadAttachments(cards) {
  const src = read('server/lib/assignedOnlyAttachments.js')
    .replace(/^import [^\n]*\n/gm, '').replace(/^const \{ isAssignedOnlyMember \} = require[^\n]*\n/m, '')
    .replace(/^export /gm, '');
  const ReactiveCache = {
    getCards: async selector => cards.filter(c => c.boardId === selector.boardId && c.assignees.includes(selector.assignees)),
    getCard: async id => cards.find(c => c._id === id),
  };
  const lib = { records: [] };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'ReactiveCache', 'isAssignedOnlyMember', 'require',
    `${src}\nexports.assignedOnlyAttachmentScope = assignedOnlyAttachmentScope;\nexports.mayReadBoardAttachment = mayReadBoardAttachment;` +
    `\nexports.assignedOnlyCardIds = assignedOnlyCardIds;\nexports.isBoardLevelFile = isBoardLevelFile;`)(
    lib, ReactiveCache, scope.isAssignedOnlyMember, () => ({ record: r => lib.records.push(r) }));
  return lib;
}

const board = {
  _id: 'b',
  members: [
    { userId: 'restricted', isActive: true, isNormalAssignedOnly: true },
    { userId: 'normal', isActive: true },
  ],
};
const cards = [
  { _id: 'mine', boardId: 'b', assignees: ['restricted'] },
  { _id: 'theirs', boardId: 'b', assignees: ['normal'] },
  { _id: 'elsewhere', boardId: 'other', assignees: ['restricted'] },
];

test('the reported shape: an assigned-only member reads only their own cards\' attachments', async () => {
  const { assignedOnlyAttachmentScope, mayReadBoardAttachment, records } = loadAttachments(cards);
  assert.deepEqual(await assignedOnlyAttachmentScope(board, 'restricted'), { 'meta.cardId': { $in: ['mine'] } });
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { cardId: 'theirs' } }), false);
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { cardId: 'elsewhere' } }), false);
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: {} }), false);
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { cardId: 'mine' } }), true);
  // An ordinary member is not narrowed (negative).
  assert.equal(await assignedOnlyAttachmentScope(board, 'normal'), null);
  assert.equal(await mayReadBoardAttachment(board, 'normal', { meta: { cardId: 'mine' } }), true);
  // The three refusals are in Admin Panel -> Problems, and never disable.
  assert.equal(records.length, 3);
  assert.deepEqual([...new Set(records.map(r => `${r.key}/${r.action}/${r.userId}`))], ['authz.assigned/blocked/restricted']);
  assert.match(read('models/lib/securityCategories.js'), /'authz\.assigned':\s*\{[^}]*severity: 'medium'/);
});

test('negative: every attachment API read applies the assigned-only rule', () => {
  for (const file of ['server/attachmentApi.js', 'server/routes/attachmentApi.js']) {
    const src = read(file);
    // Each "access this attachment" refusal also asks mayReadBoardAttachment.
    const refusals = src.split('\n').filter(l => /hasMember\((this\.)?userId\)/.test(l));
    for (const line of refusals.filter(l => !/download-background|Background/.test(l))) {
      const i = src.indexOf(line);
      const next = src.slice(i, src.indexOf('\n', src.indexOf('\n', i) + 1));
      if (/access this attachment/.test(next)) assert.match(line, /mayReadBoardAttachment\(/, `${file}: ${line.trim()}`);
    }
    // Each board-wide listing is narrowed.
    let at = src.indexOf("{ 'meta.boardId': boardId }");
    assert.ok(at > 0, file);
    while (at > 0) {
      const window = src.slice(Math.max(0, at - 300), at + 900);
      assert.match(window, /assignedOnlyAttachmentScope\(board, (this\.)?userId\)/, `${file} @${at}`);
      at = src.indexOf("{ 'meta.boardId': boardId }", at + 1);
    }
  }
});

test('the other read paths apply the same rule', () => {
  const activities = read('server/publications/activities.js');
  assert.match(activities, /if \(!mayCopyFromBoard\(board, this\.userId, card\)\) \{\n\s*return this\.ready\(\);/);
  assert.match(activities, /if \(kind === 'board' && isAssignedOnlyMember\(board, this\.userId\)\)/);
  const cardsPub = read('server/publications/cards.js');
  assert.match(cardsPub, /\{ boardId: \{ \$in: assignedOnlyBoards \}, assignees: userId \}/);
  assert.match(cardsPub, /\{ boardId: \{ \$in: assignedOnlyBoardIds \}, assignees: userId \}/);
  const move = read('server/moveBoardObjects.js');
  assert.match(move, /result\.cardId = await projected\(Cards, \{[^}]*\.\.\.cardScope \}\)/);
  assert.match(move, /Cards\.findOneAsync\(\{ _id: targetChecklist\.cardId, boardId: target\.boardId, \.\.\.cardScope \}\)\) result\.itemId/);
  const history = read('server/methods/positionHistory.js');
  assert.equal((history.match(/\.\.\.\(scope \|\| \{\}\),/g) || []).length, 2);
  assert.match(history, /if \(!mayCopyFromBoard\(cardBoard, this\.userId, card\)\)/);
});

// ---- GHSA-3cgr-47wm-9cc9: the read paths 1a218ea did not reach -------------

test('GHSA-3cgr-47wm-9cc9: board files stay readable, other cards\' files do not, and the refusal names its path', async () => {
  const { assignedOnlyCardIds, mayReadBoardAttachment, isBoardLevelFile, records } = loadAttachments(cards);
  assert.deepEqual(await assignedOnlyCardIds(board, 'restricted'), ['mine']);
  assert.equal(await assignedOnlyCardIds(board, 'normal'), null, 'an ordinary member is not narrowed');
  // The board's own background and map image are part of the board.
  for (const source of ['board-background', 'api-background', 'board-map']) {
    assert.equal(isBoardLevelFile({ meta: { boardId: 'b', source } }), true, source);
    assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { boardId: 'b', source } }), true, source);
  }
  // Negative: a card's file is never board-level, whatever it calls itself,
  // and an unknown card-less file is still refused.
  assert.equal(isBoardLevelFile({ meta: { cardId: 'theirs', source: 'board-background' } }), false);
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { cardId: 'theirs', source: 'board-background' } }), false);
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { source: 'import' } }), false);
  records.length = 0;
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { cardId: 'theirs' } }, 'file-server:cdn'), false);
  assert.deepEqual(records.map(r => `${r.key}/${r.action}/${r.source}`), ['authz.assigned/blocked/file-server:cdn']);
});

test('GHSA-3cgr-47wm-9cc9: each reported path applies the assigned-only rule', () => {
  // 1. /cdn/storage/attachments and /cfs/files/attachments.
  const ufs = read('server/routes/universalFileServer.js');
  assert.match(ufs, /if \(!canReadBoard\(user && user\._id, board\)\) return false;\n\s*return await mayReadBoardAttachment\(board, user && user\._id, attachment, source\);/);
  assert.match(ufs, /isAuthorizedForBoard\(req, board, attachment, 'file-server:cdn'\)/);
  assert.match(ufs, /isAuthorizedForBoard\(req, board, attachment, 'file-server:cfs'\)/);
  assert.doesNotMatch(ufs, /isAuthorizedForBoard\(req, board\)/, 'no caller without the attachment');
  // 4. The document-text search: narrowed to the member's own cards.
  const search = ufs.slice(ufs.indexOf('async searchAttachmentDocumentText('), ufs.indexOf('function setFileHeaders'));
  assert.match(search, /const assignedCardIds = await assignedOnlyCardIds\(board, this\.userId\);/);
  assert.match(search, /\.\.\.\(assignedCardIds \? \{ cardId: \{ \$in: assignedCardIds \} \} : \{\}\)/);
  // 2. Attachments.protected (ostrio:files' own download route).
  const prot = read('models/attachments.server.js');
  const body = prot.slice(prot.indexOf('Attachments.protected = async function'), prot.indexOf('\n};', prot.indexOf('Attachments.protected = async function')));
  assert.match(body, /if \(!board\.hasMember\(this\.userId\)\) return false;\n\s*return require\('\/server\/lib\/assignedOnlyAttachments'\)\n\s*\.mayReadBoardAttachment\(board, this\.userId, fileObj, 'attachments:protected'\);/);
  // 3. The legacy download route.
  assert.match(read('server/routes/legacyAttachments.js'),
    /!canReadBoard\(userId, board\) \|\|\n\s*!\(await mayReadBoardAttachment\(board, userId, attachment, 'legacy-attachments:download'\)\)/);
  // 6. The legacy publication: without a cardId, only the member's cards;
  // another card's id is refused and recorded.
  const pub = read('server/publications/legacyAttachments.js');
  assert.match(pub, /if \(assigned && cardId && !assigned\.includes\(cardId\)\) \{[\s\S]*?source: 'legacy-attachments:publish'[\s\S]*?return this\.ready\(\);/);
  assert.match(pub, /const cardClause = cardId \? \{ cardId \} : \(assigned \? \{ cardId: \{ \$in: assigned \} \} : \{\}\);\n\s*const selector = \{ boardId, \.\.\.cardClause \};/);
  // 5. Linked-list cards: scoped by the SOURCE board's rule.
  const linked = read('server/linkedLists.js');
  assert.match(linked, /const source = await visibleBoard\(this\.userId, list\.linkedBoardId\);/);
  assert.match(linked, /archived: false,\n\s*\.\.\.\(assignedOnlyCardScope\(source, this\.userId\) \|\| \{\}\) \}/);
});

test('GHSA-3cgr-47wm-9cc9 linked lists: the source board\'s scope narrows the cards', () => {
  // The selector linkedListCards builds, for the reporter's case.
  const selector = (source, userId) => ({ boardId: 'b', listId: 'l', archived: false, ...(scope.assignedOnlyCardScope(source, userId) || {}) });
  assert.deepEqual(selector(board, 'restricted'), { boardId: 'b', listId: 'l', archived: false, assignees: { $in: ['restricted'] } });
  assert.deepEqual(selector(board, 'normal'), { boardId: 'b', listId: 'l', archived: false }, 'an ordinary member sees the whole list');
});

test('negative: every file that serves attachment or document data applies the rule, or says why not', () => {
  // The SHAPE of "serves attachment data to a client": a download route, the
  // ostrio:files access hook, a legacy-record or document-text query, or an
  // attachment publication.
  const SERVES = /getOldAttachmentStream\(|DocumentPreviews\.find\(|cfs\.attachments\.filerecord'\)\.find|Attachments\.protected\s*=|interceptDownload|WebApp\.(handlers|connectHandlers)\.use\(['"]\/(cdn|cfs)|Meteor\.publish\([^)]*[Aa]ttachment/;
  const GUARD = /mayReadBoardAttachment\(|assignedOnlyAttachmentScope\(|assignedOnlyCardIds\(/;
  const EXEMPT = {
    'models/avatars.server.js': 'user avatars, not card files',
    'server/lib/legacyAvatarRead.js': 'user avatars, not card files',
    'server/routes/avatarServer.js': 'user avatars, not card files',
    'models/lib/attachmentBackwardCompatibility.js': 'library: its callers authorize',
    'models/lib/fileStoreStrategy.js': 'storage library: its callers authorize',
    'server/attachmentBulkMove.js': 'site-admin storage move',
    'server/migrations/migrateAttachments.js': 'server-side migration',
    'server/models/attachmentStorageSettings.js': 'site-admin storage settings',
    'server/publications/attachmentMigrationStatus.js': 'migration counters, no card content',
    'server/publications/attachments.js': 'site-admin Files report only',
    'server/publications/notifications.js': "only the user's own notifications, which activityPlans already scopes",
  };
  const files = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!['node_modules', '_build', '.build'].includes(e.name)) walk(rel); }
      else if (/\.js$/.test(e.name)) files.push(rel);
    }
  };
  walk('server'); walk('models');
  const serving = files.filter(f => SERVES.test(read(f)));
  const unguarded = serving.filter(f => !GUARD.test(read(f)) && !EXEMPT[f]);
  assert.deepEqual(unguarded, [], 'a new path serves attachment data without the assigned-only rule');
  // Every exemption is still a serving file: a stale one hides nothing.
  assert.deepEqual(Object.keys(EXEMPT).filter(f => !serving.includes(f)), []);
  // The six reported files are among the guarded ones.
  for (const f of ['server/routes/universalFileServer.js', 'models/attachments.server.js', 'server/routes/legacyAttachments.js',
    'server/publications/legacyAttachments.js']) assert.ok(serving.includes(f) && GUARD.test(read(f)), f);
});
