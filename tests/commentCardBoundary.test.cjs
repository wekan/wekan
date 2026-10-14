'use strict';
// Hall of Fame regression coverage: CommentBoundaryBleed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { commentCardMatchesBoard, recordCommentBoundaryDenial } = require('../models/lib/commentCardBoundary');
const { hasPrivateCommentWrite } = require('../models/lib/commentPrivateFields');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
test('comment boundary accepts the real card board and rejects foreign or missing cards', () => {
  const card = { _id: 'cardB', boardId: 'B' };
  assert.equal(commentCardMatchesBoard(card, 'cardB', 'B'), true);
  for (const args of [[card, 'cardB', 'A'], [card, 'other', 'B'], [null, 'cardB', 'A'], [card, {}, 'B']]) {
    assert.equal(commentCardMatchesBoard(...args), false);
  }
  assert.doesNotThrow(() => recordCommentBoundaryDenial('test'), 'missing logger cannot break denial');
});
test('REST attack returns 404 before any insert, while legitimate comments still reach validation', async () => {
  const source = read('server/models/cardComments.js');
  const at = source.indexOf("WebApp.handlers.post('/api/boards/:boardId/cards/:cardId/comments'");
  const start = source.indexOf('    const paramBoardId', at);
  const end = source.indexOf('    // Validate the required', start);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction('req', 'res', 'Authentication', 'ReactiveCache', 'allowIsBoardMemberCommentOnly', 'commentCardMatchesBoard', 'recordCommentBoundaryDenial', 'sendJsonResult', 'canCommentInList', source.slice(start, end) + '\nreturn "validated-boundary";');
  for (const foreign of [false, true]) {
    const logs = [], responses = [];
    const result = await run({ params: { boardId: 'A', cardId: 'card' }, userId: 'u' }, {},
      { checkLoggedIn() {}, checkBoardExists() {}, async checkAdminOrCondition() {} },
      { getBoard: async () => ({}), getCard: async query => ({ _id: query._id, boardId: foreign ? 'B' : query.boardId }) },
      () => true, commentCardMatchesBoard, source => logs.push(source), (res, data) => responses.push(data),
      // #4527: the card's list may allow or refuse commenting; here it allows.
      async () => true);
    assert.equal(result, foreign ? undefined : 'validated-boundary');
    assert.equal(logs.length, foreign ? 1 : 0);
    if (foreign) assert.equal(responses[0].code, 404);
  }
});
test('DDP insertion and rebinding cannot bypass the boundary', async () => {
  const source = read('server/permissions/cardComments.js');
  const at = source.indexOf('CardComments.deny({');
  let deny;
  new Function('CardComments', 'Cards', 'commentCardMatchesBoard', 'recordCommentBoundaryDenial', 'hasPrivateCommentWrite', 'recordCommentPrivateDenial', source.slice(at, source.indexOf('CardComments.allow({', at)))(
    { deny: value => { deny = value; } }, { findOneAsync: async id => ({ _id: id, boardId: 'B' }) }, commentCardMatchesBoard, () => {}, hasPrivateCommentWrite, () => {});
  assert.equal(await deny.insert('u', { cardId: 'c', boardId: 'A' }), true);
  assert.equal(await deny.insert('u', { cardId: 'c', boardId: 'B' }), false);
  assert.equal(deny.update('u', {}, ['cardId']), true);
  assert.equal(deny.update('u', {}, ['boardId']), true);
  assert.equal(deny.update('u', {}, ['text']), false);
  assert.equal(await deny.insert('u', { cardId: 'c', boardId: 'B', webhookResponseRevision: 'forged' }), true);
  assert.equal(deny.update('u', {}, ['text'], { $rename: { text: 'webhookResponseRevision' } }), true);
});
test('negative: every externally supplied REST comment insert is preceded by the card boundary', () => {
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.js') ? [file] : [];
  });
  const paths = walk(path.join(root, 'server')).filter(file => /CardComments\.(?:direct\.)?insertAsync\(/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(paths.map(file => path.relative(root, file)).sort(),
    ['server/emailToCard.js', 'server/lib/listSyncIssueDetails.js', 'server/models/cardComments.js', 'server/routes/inboundEmail.js',
      'server/rulesHelper.js']);
  // A rule's "add comment" writes on the card the rule ran for, with that
  // card's own board id, as a person who may comment there.
  const rulesHelper = read('server/rulesHelper.js');
  assert.match(rulesHelper, /const board = await ReactiveCache\.getBoard\(card\.boardId\);[\s\S]{0,120}memberCan\(board, authorId, 'comment'\)[\s\S]{0,40}CardComments\.insertAsync\(\{ text: text\.slice\(0, 65536\), boardId: card\.boardId, cardId: card\._id,/);
  // List sync's issue comments go only onto cards found ON the synced list's
  // own board and list, and are written with that board's id - the tracker
  // never names a card.
  const issueDetails = read('server/lib/listSyncIssueDetails.js');
  assert.match(issueDetails, /Cards\.find\(\{\s*boardId: list\.boardId, listId: list\._id, syncSourceKey: sourceKey,/);
  assert.match(issueDetails, /CardComments\.insertAsync\(\{\s*boardId: list\.boardId, cardId: card\._id,/);
  // #794: an emailed reply is a comment on a card found ON the board of the
  // address it was sent to, by a member with write access there - the card is
  // never named by the sender.
  const emailToCard = read('server/emailToCard.js');
  assert.match(emailToCard, /Cards\.findOneAsync\(\{ boardId: board\._id, archived: false, 'email\.threadIds'/);
  assert.match(emailToCard, /allowIsBoardMemberWithWriteAccess\(user\._id, board\)/);
  assert.match(read('server/emailView.js'), /ReactiveCache\.getCard\(\{ _id: input\.cardId, boardId: board\._id \}\)/);
  const source = read('server/models/cardComments.js');
  const at = source.indexOf("WebApp.handlers.post('/api/boards/:boardId/cards/:cardId/comments'");
  assert.ok(source.indexOf('commentCardMatchesBoard(card, paramCardId, paramBoardId)', at) < source.indexOf('CardComments.direct.insertAsync(', at));
  // Inbound email derives boardId from the authenticated/authorized card,
  // rather than accepting an independent board id from an HTTP parameter.
  assert.match(read('server/routes/inboundEmail.js'), /boardId:\s*card\.boardId/);
});
