'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'models/lib/importPipeline.js'), 'utf8');
const pipeline = {};
new Function('exports', source
  .replace(/export (async )?function (\w+)/g, '$1function $2') +
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

  await test('writer restores a source createdAt that the schema autoValue replaced (#1992)', async () => {
    const createdAt = new Date('2020-01-02T03:04:05Z');
    const stored = {};
    const raw = [];
    const collection = {
      // Like collection2, the insert rewrites the caller's document in place.
      direct: { insertAsync: async doc => { doc.createdAt = new Date(); Object.assign(stored, doc); return 'new-id'; } },
      rawCollection: () => ({ updateOne: async (filter, update) => { raw.push([filter, update]); Object.assign(stored, update.$set); } }),
    };
    await pipeline.writeImportedEntity(collection, { title: 'Card', createdAt });
    assert.deepStrictEqual(raw, [[{ _id: 'new-id' }, { $set: { createdAt } }]]);
    assert.strictEqual(stored.createdAt.toISOString(), '2020-01-02T03:04:05.000Z');
  });

  await test('writer does not write createdAt that is missing, invalid, or has no raw collection', async () => {
    let rawWrites = 0;
    const collection = {
      direct: { insertAsync: async () => 'new-id' },
      rawCollection: () => ({ updateOne: async () => { rawWrites += 1; } }),
    };
    for (const createdAt of [undefined, null, '2020-01-02', new Date('garbage'), 0]) {
      await pipeline.writeImportedEntity(collection, { createdAt });
    }
    assert.strictEqual(rawWrites, 0);
    await pipeline.writeImportedEntity({ direct: { insertAsync: async () => 'id' } }, { createdAt: new Date() });
  });

  await test('every creator inserts dated documents through the restoring writer', async () => {
    // Each `createdAt:` that is not simply the import time is a source date,
    // and the next insert after it must be one that keeps it: the restoring
    // writer, or an activity (the activities schema has no createdAt autoValue).
    const offenders = [];
    let dated = 0;
    for (const file of fs.readdirSync(path.join(root, 'models')).filter(f => /Creator\.js$/.test(f))) {
      const lines = fs.readFileSync(path.join(root, 'models', file), 'utf8').split('\n');
      lines.forEach((line, index) => {
        const m = /^\s*createdAt: (.+?),?\s*$/.exec(line);
        if (!m || /^(this\._now\(\)|new Date\(\)|DateString|i)$/.test(m[1])) return;
        dated += 1;
        // Inside an insert call's own object literal, that call is the insert;
        // otherwise it is the next one after the document is built.
        let next;
        for (let j = index - 1; j >= Math.max(0, index - 20); j -= 1) {
          if (/^\s*\}\)?;/.test(lines[j])) break;
          if (/insertAsync\(\{|writeImportedEntity\(\w+, \{/.test(lines[j])) { next = lines[j]; break; }
        }
        next = next || lines.slice(index, index + 150).find(l => /insertAsync\(|writeImportedEntity\(/.test(l));
        if (!next || !/writeImportedEntity\(|Activities\.direct\.insertAsync\(/.test(next)) {
          offenders.push(`${file}:${index + 1} ${line.trim()} -> ${next ? next.trim() : 'no insert'}`);
        }
      });
    }
    assert.ok(dated >= 20, `found ${dated} dated inserts`);
    assert.deepStrictEqual(offenders, []);
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
