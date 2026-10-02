'use strict';

// Guard: RepointBleed (2026-10-02). Rule Triggers, Actions and Rules, and
// webhook Integrations, are allowed to a board admin of the board the document
// is on BEFORE the update. Nothing refused the update itself changing boardId,
// so any registered user - admin of a board they just created - could:
//   - move a rule trigger to '*' (or unset it), which the rule matcher matched
//     on EVERY board, and have a "send email" action mail them card titles,
//     descriptions, comments and attachments from every private board;
//   - move a webhook integration onto someone else's private board and receive
//     its activity, or turn it into a two-way hook that rewrites its comments.
// Run: node tests/repointBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function loadGuard() {
  const records = [];
  const src = read('server/lib/boardRepointGuard.js').replace(/^export /gm, '');
  const lib = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', 'require', `${src}\nexports.changesBoardId = changesBoardId;\nexports.denyBoardRepoint = denyBoardRepoint;`)(
    lib, name => (name === '/server/lib/securityLog' ? { record: r => records.push(r) } : {}));
  return { ...lib, records };
}

test('the reported attack: moving a trigger or a webhook to another board is refused and recorded', () => {
  const { denyBoardRepoint, records } = loadGuard();
  const deny = denyBoardRepoint('triggers');
  const doc = { _id: 't', boardId: 'mine' };
  for (const [fields, modifier] of [
    [['boardId'], { $set: { boardId: '*' } }],
    [['boardId'], { $set: { boardId: 'victim' } }],
    [['boardId'], { $unset: { boardId: 1 } }],
    [['old'], { $rename: { old: 'boardId' } }],
  ]) {
    assert.equal(deny.update('attacker', doc, fields, modifier), true, JSON.stringify(modifier));
  }
  assert.equal(records.length, 4);
  assert.deepEqual(Object.keys(records[0]).sort(), ['action', 'detail', 'key', 'source', 'userId']);
  assert.equal(records[0].key, 'authz.repoint');
  assert.equal(records[0].action, 'blocked');
  // Ordinary edits are untouched and unrecorded (negative).
  assert.equal(deny.update('admin', doc, ['title'], { $set: { title: 'x' } }), false);
  assert.equal(deny.update('admin', doc, ['url', 'enabled'], { $set: { url: 'https://hooks.example', enabled: true } }), false);
  assert.equal(records.length, 4);
});

test('custom fields and comment reactions follow the same rule', () => {
  const fields = read('server/permissions/customFields.js');
  assert.match(fields, /CustomFields\.deny\(\{\s*async insert\(userId, doc\) \{\s*if \(!\(await boardsWithoutWrite\(userId, doc\.boardIds \|\| \[\]\)\)\.length\) return false;/);
  assert.match(fields, /const changed = \[\.\.\.before\.filter\(id => !after\.includes\(id\)\), \.\.\.after\.filter\(id => !before\.includes\(id\)\)\];/);
  assert.match(read('server/permissions/cardCommentReactions.js'), /CardCommentReactions\.deny\(denyBoardRepoint\('cardCommentReactions', \['boardId', 'cardCommentId'\]\)\);/);
  const { denyBoardRepoint } = loadGuard();
  const reactions = denyBoardRepoint('cardCommentReactions', ['boardId', 'cardCommentId']);
  assert.equal(reactions.update('u', {}, ['cardCommentId'], { $set: { cardCommentId: 'foreign' } }), true);
  assert.equal(reactions.update('u', {}, ['reactions'], { $set: { reactions: [] } }), false);
});

test('all four collections refuse a board change, and the matcher keeps a rule on its own board', () => {
  for (const [file, coll] of [['triggers', 'Triggers'], ['actions', 'Actions'], ['rules', 'Rules'], ['integrations', 'Integrations']]) {
    assert.match(read(`server/permissions/${file}.js`), new RegExp(`${coll}\\.deny\\(denyBoardRepoint\\('${file}'\\)\\);`), file);
  }
  const helper = read('server/rulesHelper.js');
  assert.match(helper, /return uniqueRules\(matchingRules\.filter\(rule => rule\.enabled !== false && rule\.boardId === activity\.boardId\)\);/);
  assert.match(read('models/lib/securityCategories.js'), /'authz\.repoint':\s*\{[^}]*bleed: 'RepointBleed'/);
});

test('negative: every board-owned collection with a client update rule refuses a board change', () => {
  // A permissions file whose update rule decides by doc.boardId must also
  // refuse moving the document off that board.
  const BOARD_GUARDS = /denyBoardRepoint\(|denyCrossBoardMove|denyCrossBoardMoveByChecklistItem|field === 'boardId'|name === 'boardId'|boardsWithoutWrite\(/;
  const dir = path.join(ROOT, 'server/permissions');
  const missing = fs.readdirSync(dir).filter(f => f.endsWith('.js')).filter(f => {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const allow = src.slice(src.indexOf('.allow('));
    if (!/update\s*\(/.test(allow) || !/doc\.boardId/.test(allow)) return false;
    return !BOARD_GUARDS.test(src);
  });
  // userPositionHistory has no client update path to guard: inserts are the
  // issue there (PositionHistoryBleed), see tests/positionHistoryBleed*.
  assert.deepEqual(missing.filter(f => f !== 'userPositionHistory.js'), []);
});
