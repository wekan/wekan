'use strict';

// #1931: an existing card from another board as a subtask, for users who may
// write both boards.
// Run: node tests/crossBoardSubtasks.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { collectAllAncestorIds, wouldCreateParentCycle, withParentAdded, cardParentIds } = require('../models/lib/cardParents.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

(async () => {
  // The loop check the server runs, across boards: A (board 1) <- B (board 2) <- C (board 1).
  const cards = { A: {}, B: { parentId: 'A', parentIds: ['A'] }, C: { parentId: 'B', parentIds: ['B'] } };
  const parentsOf = ids => ids.map(id => cards[id]).filter(Boolean);
  const ancestorsOfC = await collectAllAncestorIds(cardParentIds(cards.C), parentsOf);
  assert.deepEqual(ancestorsOfC.sort(), ['A', 'B']);
  assert.equal(wouldCreateParentCycle('A', 'C', ancestorsOfC), true, 'A under C would close a loop across boards');
  assert.equal(wouldCreateParentCycle('X', 'C', ancestorsOfC), false, 'an unrelated card of another board is fine');
  assert.deepEqual(withParentAdded({ parentId: 'P1', parentIds: ['P1'] }, 'P2').parentIds, ['P1', 'P2'], 'it keeps the parents it has');
  console.log('  ok - loops are found through every parent, across boards');

  const server = read('server/crossBoardSubtasks.js');
  const add = server.slice(server.indexOf('async addCrossBoardSubtask('));
  // Positive: the write right to BOTH boards, then the loop check, then the write.
  // ...and both CARDS by the caller's board role (GHSA-r4gm-mjj9-g3x8).
  assert.match(add, /if \(!\(await writableBoard\(this\.userId, parent\.boardId\)\) \|\| !\(await writableBoard\(this\.userId, child\.boardId\)\) \|\|\n\s+!\(await canEditCardOrLinkedCard\(this\.userId, parent\)\) \|\| !\(await canEditCardOrLinkedCard\(this\.userId, child\)\)\) \{\s*throw new Meteor\.Error\('not-authorized'\);/);
  assert.ok(add.indexOf('wouldCreateParentCycle') < add.indexOf('Cards.updateAsync'), 'checked before the write');
  assert.match(server, /return board && !board\.archived && allowIsBoardMemberWithWriteAccess\(userId, board\) \? board : null;/);
  // Negative: no template or linked card, no archived card, never without a user.
  assert.match(add, /if \(!parent \|\| !child \|\| child\.archived \|\| NOT_ATTACHABLE\.includes\(child\.type\)\) throw/);
  assert.match(server, /const NOT_ATTACHABLE = \['template-card', 'cardType-linkedCard', 'cardType-linkedBoard'\];/);
  for (const m of server.matchAll(/async (\w+)\(/g)) {
    if (m[1] === 'writableBoard') continue;
    const body = server.slice(m.index, m.index + 600);
    assert.match(body, /if \(!this\.userId\) throw new Meteor\.Error\('not-authorized'\);/, `${m[1]} needs a user`);
  }
  const candidates = server.slice(server.indexOf('async crossBoardSubtaskCandidates('), server.indexOf('async addCrossBoardSubtask('));
  assert.match(candidates, /_id: \{ \$nin: \[parentCardId, \.\.\.ancestors\] \}/, 'never the card itself or its ancestors');
  assert.match(candidates, /q\.replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|\[\\\]\\\\\]\/g, '\\\\\$&'\)/, 'the search is escaped');
  assert.match(read('server/imports.js'), /import '\/server\/crossBoardSubtasks';/);
  console.log('  ok - write access to both boards, ordinary cards only, checked on the server');

  // UI: a board picker; another board's cards and the attach go through the server.
  const jade = read('client/components/cards/subtasks.jade');
  assert.match(jade, /select\.js-add-existing-subtask-board\s*\n\s*each subtaskSourceBoards\s*\n\s*option\(value=_id selected=isSourceBoard\)/);
  const js = read('client/components/cards/subtasks.js');
  assert.match(js, /Meteor\.call\('crossBoardSubtaskCandidates', parentId, boardId, term \|\| ''/);
  assert.match(js, /if \(contextCard && isOtherSourceBoard\(Template\.instance\(\)\)\) \{[\s\S]{0,300}Meteor\.callAsync\('addCrossBoardSubtask', parentCardId, String\(cardId\)\)/);
  console.log('  ok - the popup picks a board, and another board goes through the server');
  console.log('\ncrossBoardSubtasks: all tests passed');
})().catch(e => { console.error(e); process.exit(1); });
