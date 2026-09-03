'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'models/lib/importPipeline.js'), 'utf8');
const pipeline = {};
new Function('exports', source
  .replace(/export async function (\w+)/g, 'async function $1') +
  '\nexports.writeImportedEntity = writeImportedEntity;' +
  '\nexports.runImportPipeline = runImportPipeline;')(pipeline);

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log('  ok -', name);
}

(async () => {
  console.log('importPipeline:');

  await test('writer inserts, touches and records the new id once', async () => {
    const calls = [];
    const collection = { direct: {
      insertAsync: async doc => { calls.push(['insert', doc]); return 'new-id'; },
      updateAsync: async (...args) => calls.push(['update', ...args]),
    } };
    const ids = {};
    const result = await pipeline.writeImportedEntity(collection, { title: 'List' }, {
      ids, sourceId: 'old-id', touch: { updatedAt: 7 },
    });
    assert.strictEqual(result, 'new-id');
    assert.deepStrictEqual(ids, { 'old-id': 'new-id' });
    assert.deepStrictEqual(calls, [
      ['insert', { title: 'List' }],
      ['update', 'new-id', { $set: { updatedAt: 7 } }],
    ]);
  });

  await test('writer leaves optional mapping and touch operations out', async () => {
    let updates = 0;
    const collection = { direct: {
      insertAsync: async () => 'new-id',
      updateAsync: async () => { updates += 1; },
    } };
    assert.strictEqual(await pipeline.writeImportedEntity(collection, {}), 'new-id');
    assert.strictEqual(updates, 0);
  });

  await test('pipeline preserves adapter order and carries the board id', async () => {
    const calls = [];
    const creator = {
      prepare: async (input, boardId) => calls.push(['prepare', input, boardId]),
      board: async input => { calls.push(['board', input]); return 'board-id'; },
      cards: async (input, boardId) => calls.push(['cards', input, boardId]),
    };
    const board = { cards: [{ id: 1 }] };
    const result = await pipeline.runImportPipeline(creator, board, [
      { method: 'prepare' },
      { method: 'board', createsBoard: true },
      { method: 'cards', source: 'cards' },
    ]);
    assert.strictEqual(result, 'board-id');
    assert.deepStrictEqual(calls, [
      ['prepare', board, undefined],
      ['board', board],
      ['cards', board.cards, 'board-id'],
    ]);
  });

  await test('a missing optional collection normalizes to an empty array', async () => {
    let input;
    const creator = {
      board: async () => 'board-id',
      cards: async value => { input = value; },
    };
    await pipeline.runImportPipeline(creator, {}, [
      { method: 'board', createsBoard: true },
      { method: 'cards', source: 'cards' },
    ]);
    assert.deepStrictEqual(input, []);
  });

  await test('malformed input and a pipeline without a board fail closed', async () => {
    await assert.rejects(() => pipeline.runImportPipeline({}, [], []), TypeError);
    await assert.rejects(() => pipeline.runImportPipeline({}, {}, []),
      /did not create a board/);
  });

  await test('both source adapters use the common pipeline and writer', async () => {
    for (const file of ['models/wekanCreator.js', 'models/trelloCreator.js']) {
      const contents = fs.readFileSync(path.join(root, file), 'utf8');
      assert.ok(contents.includes('runImportPipeline(this, board'));
      assert.ok(contents.includes('writeImportedEntity('));
    }
  });

  console.log(`\nimportPipeline: ${passed} tests passed`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
