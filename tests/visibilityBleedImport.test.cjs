'use strict';

// Guard: VisibilityBleed's import sibling (2026-10-02). Admin Panel -> "private
// boards only" was enforced in Boards.before.insert, but a board import writes
// through Boards.direct, which skips collection hooks. A Trello export marked
// public, or a WeKan export with permission 'public'/'instance', therefore
// created an open board on an instance that allows none.
// Run: node tests/visibilityBleedImport.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function loadPolicy(privateOnly) {
  const src = read('server/lib/boardVisibilityPolicy.js')
    .replace(/^import [^\n]*\n/gm, '').replace(/^const \{ isOpenPermission \} = require[^\n]*\n/m, '')
    .replace(/^export /gm, '');
  const lib = {};
  const settings = { findOneAsync: async () => ({ booleanValue: privateOnly }) };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'TableVisibilityModeSettings', 'isOpenPermission',
    `${src}\nexports.boardPermissionUnderPolicy = boardPermissionUnderPolicy;`)(
    lib, settings, require('../models/lib/boardPermission').isOpenPermission);
  return lib.boardPermissionUnderPolicy;
}

test('the reported shape: an open imported board becomes private under the policy', async () => {
  const policy = loadPolicy(true);
  assert.equal(await policy('public'), 'private');
  assert.equal(await policy('instance'), 'private');
  assert.equal(await policy('private'), 'private');
  // Without the policy an open board stays open (negative).
  const open = loadPolicy(false);
  assert.equal(await open('public'), 'public');
  assert.equal(await open('instance'), 'instance');
});

test('both importers that can carry an open permission ask the policy before writing', () => {
  for (const file of ['models/trelloCreator.js', 'models/wekanCreator.js']) {
    const src = read(file);
    assert.match(src, /boardToCreate\.permission = await boardPermissionUnderPolicy\(boardToCreate\.permission\);\n\s*const boardId = await writeImportedEntity\(Boards, boardToCreate\);/, file);
  }
  // The hook, for every insert that does not skip it, applies the same rule
  // (pinned by tests/boardPrivateOnlyMethod.test.cjs).
  assert.match(read('server/models/boards.js'), /Boards\.before\.insert\([\s\S]{0,400}'tableVisibilityMode-allowPrivateOnly'/);
});

test('negative: every hook-skipping board insert either asks the policy or is always private', () => {
  const dirs = ['models', 'server'];
  const files = [];
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach(e => {
    if (e.name === 'node_modules' || e.name.startsWith('_build') || e.name.startsWith('.')) return;
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel); else if (/\.js$/.test(e.name)) files.push(rel);
  });
  dirs.forEach(walk);
  const offenders = [];
  for (const file of files) {
    const src = read(file);
    if (!/Boards\.direct\.insertAsync\(|writeImportedEntity\(Boards,/.test(src)) continue;
    const asks = /boardPermissionUnderPolicy\(/.test(src);
    const permissions = [...src.matchAll(/^\s*permission: ([^\n]+?),?$/gm)].map(m => m[1]);
    const alwaysPrivate = permissions.length > 0 && permissions.every(p => p === "'private'");
    if (!asks && !alwaysPrivate) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});
