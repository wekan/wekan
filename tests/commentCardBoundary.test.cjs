'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { commentCardMatchesBoard, recordCommentBoundaryDenial } = require('../models/lib/commentCardBoundary');
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
  const run = new AsyncFunction('req', 'res', 'Authentication', 'ReactiveCache', 'allowIsBoardMemberCommentOnly', 'commentCardMatchesBoard', 'recordCommentBoundaryDenial', 'sendJsonResult', source.slice(start, end) + '\nreturn "validated-boundary";');
  for (const foreign of [false, true]) {
    const logs = [], responses = [];
    const result = await run({ params: { boardId: 'A', cardId: 'card' }, userId: 'u' }, {},
      { checkLoggedIn() {}, checkBoardExists() {}, async checkAdminOrCondition() {} },
      { getBoard: async () => ({}), getCard: async query => ({ _id: query._id, boardId: foreign ? 'B' : query.boardId }) },
      () => true, commentCardMatchesBoard, source => logs.push(source), (res, data) => responses.push(data));
    assert.equal(result, foreign ? undefined : 'validated-boundary');
    assert.equal(logs.length, foreign ? 1 : 0);
    if (foreign) assert.equal(responses[0].code, 404);
  }
});
test('DDP insertion and rebinding cannot bypass the boundary', async () => {
  const source = read('server/permissions/cardComments.js');
  const at = source.indexOf('CardComments.deny({');
  let deny;
  new Function('CardComments', 'Cards', 'commentCardMatchesBoard', 'recordCommentBoundaryDenial', source.slice(at, source.indexOf('CardComments.allow({', at)))(
    { deny: value => { deny = value; } }, { findOneAsync: async id => ({ _id: id, boardId: 'B' }) }, commentCardMatchesBoard, () => {});
  assert.equal(await deny.insert('u', { cardId: 'c', boardId: 'A' }), true);
  assert.equal(await deny.insert('u', { cardId: 'c', boardId: 'B' }), false);
  assert.equal(deny.update('u', {}, ['cardId']), true);
  assert.equal(deny.update('u', {}, ['boardId']), true);
  assert.equal(deny.update('u', {}, ['text']), false);
});
test('negative: every externally supplied REST comment insert is preceded by the card boundary', () => {
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.js') ? [file] : [];
  });
  const paths = walk(path.join(root, 'server')).filter(file => /CardComments\.(?:direct\.)?insertAsync\(/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(paths.map(file => path.relative(root, file)).sort(), ['server/models/cardComments.js', 'server/routes/inboundEmail.js']);
  const source = read('server/models/cardComments.js');
  const at = source.indexOf("WebApp.handlers.post('/api/boards/:boardId/cards/:cardId/comments'");
  assert.ok(source.indexOf('commentCardMatchesBoard(card, paramCardId, paramBoardId)', at) < source.indexOf('CardComments.direct.insertAsync(', at));
  // Inbound email derives boardId from the authenticated/authorized card,
  // rather than accepting an independent board id from an HTTP parameter.
  assert.match(read('server/routes/inboundEmail.js'), /boardId:\s*card\.boardId/);
});
