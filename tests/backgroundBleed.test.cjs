'use strict';

// Guard: BackgroundBleed (2026-10-02). The background download APIs returned
// whatever attachment board.backgroundImageId named, checking only board
// membership, and a board admin could set that field to any attachment id - so
// anyone could create a board, point its background at an attachment on a
// private board, and download it.
// Run: node tests/backgroundBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { isOwnBoardBackground } = require('../models/lib/boardBackgroundOwnership');

test('the reported attack: another board\'s attachment is not this board\'s background', () => {
  const mine = { _id: 'mine' };
  assert.equal(isOwnBoardBackground(mine, { _id: 'a', meta: { boardId: 'victim', cardId: 'c' } }), false);
  assert.equal(isOwnBoardBackground(mine, { _id: 'a', meta: { boardId: 'mine', source: 'board-background' }, deletedAt: new Date() }), false, 'a deleted one');
  assert.equal(isOwnBoardBackground(mine, { _id: 'a' }), false);
  assert.equal(isOwnBoardBackground(mine, null), false);
  // The board's own background still is (negative).
  assert.equal(isOwnBoardBackground(mine, { _id: 'a', meta: { boardId: 'mine', source: 'board-background' } }), true);
});

test('both download paths check it, and setting the field checks it, recording an attempt', () => {
  for (const [file, source] of [['server/routes/attachmentApi.js', 'rest:download-background'], ['server/attachmentApi.js', 'api.board.downloadBackground']]) {
    const src = read(file);
    const at = src.indexOf('board.backgroundImageId');
    const guard = src.indexOf("isOwnBoardBackground(board, attachment)", at);
    assert.ok(guard > at && guard < src.indexOf('getFileStrategy(attachment', at), `${file} checks before reading the file`);
    assert.ok(src.includes(`key: 'authz.background', action: 'blocked', source: '${source}'`), file);
  }
  const perms = read('server/permissions/boards.js');
  assert.match(perms, /Boards\.deny\(\{\s*async update\(userId, doc, fields, modifier\) \{\s*const renamed = modifier\.\$rename && Object\.values\(modifier\.\$rename\)\.includes\('backgroundImageId'\);/);
  assert.match(perms, /isOwnBoardBackground\(doc, attachment\)\) return false;/);
  assert.match(read('models/lib/securityCategories.js'), /'authz\.background':\s*\{[^}]*bleed: 'BackgroundBleed'/);
});

test('negative: nothing in the server serves a backgroundImageId without checking it', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'tests' || e.name.startsWith('_build') || e.name === 'node_modules') return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (rel.endsWith('.js') ? [rel] : []);
  });
  const offenders = ['server', 'models'].flatMap(walk).filter(file => {
    const src = read(file);
    return /=\s*board\.backgroundImageId/.test(src) && /getReadStream\(/.test(src) && !/isOwnBoardBackground\(/.test(src);
  });
  assert.deepEqual(offenders, []);
});
