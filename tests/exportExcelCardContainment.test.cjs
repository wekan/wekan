'use strict';

// GHSA-6p5m-f9p2-wqm5 — cross-board IDOR in the single-card Excel export.
// Run: node tests/exportExcelCardContainment.test.cjs
//
//   GET /api/boards/:boardId/lists/:listId/cards/:cardId/exportExcel
//
// authorised against :boardId and then read the card named by :cardId, with
// nothing tying the two together. canExport() asks "may this user see the board
// in :boardId?" - it never sees :cardId - and _buildAndWrite() then resolved the
// card with a bare primary-key lookup. So the two identifiers came apart: one
// decided the authorisation, the other decided the data.
//
// The precondition is self-service: POST /api/boards takes `permission` straight
// from the request body, so any authenticated user can mint their own PUBLIC
// board, name it as :boardId, and pass the id of a card in somebody else's
// private board as :cardId. The workbook that comes back carries that card's
// title, description, members and assignees, every comment with its author,
// checklists, subtasks, attachment metadata - and, because image attachments are
// read through getReadStream() and embedded with workbook.addImage, the
// attachment BYTES. :listId was never used in any query, so it could be
// anything. One board, reused, made it a scriptable bulk read.
//
// The same route shape for PDF has always been right - ExporterCardPDF resolves
// getCard({ _id, boardId, listId }) - which is what makes this an omission rather
// than a decision, and is why the fix is the PDF exporter's query, not a new
// mechanism.
//
// This suite is a source guard: there is no server here to issue requests to. It
// pins the constrained lookup in both places it now lives, that the route checks
// BEFORE either branch builds (including the public branch, which skips
// authentication entirely), and that the PDF control it copies is still there.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const exporter = read('models/server/ExporterExcelCard.js');
const route = read('models/exportExcelCard.js');
const pdf = read('models/server/ExporterCardPDF.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Declarations only: the file explains the old shape at length, and prose about
// a bare lookup must not read as one.
const code = src => src.split('\n')
  .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
  .join('\n');

test('the exporter resolves the card INSIDE the authorised board and list', () => {
  const body = code(exporter);
  assert.ok(/getCard\(\{\s*_id: this\._cardId,\s*boardId: this\._boardId,\s*listId: this\._listId,?\s*\}\)/.test(body),
    'the lookup must carry boardId and listId, so a card outside the authorised ' +
    'board does not resolve at all');
  assert.ok(!/getCard\(this\._cardId\)/.test(body),
    'the bare primary-key lookup is the vulnerability itself');
});

test('nothing downstream can be reached when the card does not resolve', () => {
  // The fan-out (checklists, checklist items, subtasks, comments, attachments)
  // is all keyed on the same card id and carries no board constraint of its own,
  // so constraining the CARD is what makes those safe by construction.
  const body = code(exporter);
  const lookup = body.indexOf('getCard({');
  const guard = body.indexOf("res.end('Card not found')");
  const fanout = body.indexOf('getChecklists({ cardId: this._cardId })');
  assert.ok(lookup !== -1 && guard > lookup,
    'the 404 must still follow the lookup');
  assert.ok(fanout === -1 || fanout > guard,
    'and every query keyed on the card id must come after it');
});

test('the route binds the two identifiers before EITHER branch builds', () => {
  const body = code(route);
  assert.ok(/getCard\(\{\s*_id: paramCardId,\s*boardId,\s*listId: paramListId,?\s*\}\)/.test(body),
    'the route has both identifiers in hand, so it states their relationship');
  const check = body.indexOf('_id: paramCardId');
  const publicBranch = body.indexOf('board.isPublic()');
  const firstBuild = body.indexOf('exporter.build(res)');
  assert.ok(check !== -1 && check < publicBranch,
    'the PUBLIC branch skips authentication entirely, so the containment check ' +
    'has to come before it, not inside the authenticated path');
  assert.ok(check < firstBuild, 'and before anything is exported');
});

test('a card that is not in the board is a 404, not a 403', () => {
  const body = code(route);
  const at = body.indexOf('_id: paramCardId');
  const after = body.slice(at, at + 400);
  assert.ok(/404/.test(after),
    'whether a card id exists at all is not something an unauthorised caller ' +
    'should learn from the difference between 403 and 404');
  assert.ok(/Card not found/.test(after));
});

test('the PDF exporter this copies is unchanged', () => {
  assert.ok(/getCard\(\{\s*\n?\s*_id: this\._cardId,\s*\n?\s*boardId: this\._boardId,\s*\n?\s*listId: this\._listId,?\s*\n?\s*\}\)/.test(code(pdf)),
    'it is the control that showed the Excel exporter was an omission; if it ' +
    'ever loses the constraint, the same hole opens on the PDF route');
});

test('the two single-card export routes are the only ones of this shape', () => {
  // The reporter recommended auditing every /api/boards/:boardId/.../:childId
  // route for the same authorize-on-parent / read-on-child mismatch.
  const files = ['models/exportExcelCard.js', 'models/exportPDF.js'];
  for (const file of files) {
    assert.ok(/cards\/:cardId\/export/.test(read(file)),
      `${file} should still be a single-card export route`);
  }
  // The attachment API takes the card id and then checks it against the named
  // board - the correct direction, and already in place.
  assert.ok(/card\.boardId !== boardId/.test(read('server/attachmentApi.js')),
    'the attachment handler already enforces containment; if that check goes, ' +
    'the same class of bug reopens there');
});

console.log(`\n${passed} passed`);
