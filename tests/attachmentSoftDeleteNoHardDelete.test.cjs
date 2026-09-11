'use strict';

// History.md §12.3-12.4: there is no per-attachment hard delete ANYWHERE, and
// the one removal of attachment records and files is the board purge. This
// suite reads the whole tree for the SHAPE of a hard delete - a source-reading
// test, so "and nowhere else" is checkable at all.
// Run: node tests/attachmentSoftDeleteNoHardDelete.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('attachmentSoftDeleteNoHardDelete:');

// Every source file that could touch the collection. _build/, .tools/, node_modules
// and the tests are skipped: _build holds a bundled second copy of every file.
function walk(dir, out) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '_build') continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(js|mjs|cjs|jade)$/.test(entry.name) && !/\.tests?\.js$/.test(entry.name)) out.push(rel);
  }
  return out;
}
const files = ['client', 'server', 'models', 'imports'].flatMap(d => walk(d, []));

// The calls that MAY remain, and why (History.md §12.3). Anything else fails.
const ALLOWED = {
  // §12.4 THE hard delete: the board goes, its attachments and files go with it.
  'server/models/boards.js': ["Attachments.removeAsync({ 'meta.boardId': doc._id })"],
  // Upload rejections: bytes that never became an attachment.
  'models/attachments.server.js': [
    'await Attachments.removeAsync(fileObj._id);',   // exploit-looking filename
    'await Attachments.removeAsync(fileObjId);',     // failed size/MIME validation (x2)
  ],
  // A hard card purge cascades to its attachments' legacy top-level cardId rows.
  'models/cards.js': ['await Attachments.removeAsync({ cardId: doc._id });'],
  // Storage-format conversion to CollectionFS: the file survives, the record moves.
  'server/attachmentBulkMove.js': ['await cfg.Collection.collection.removeAsync({ _id: doc._id });'],
};

test('no Attachments.removeAsync / .remove( outside the allow-list', () => {
  const offenders = [];
  for (const file of files) {
    const src = read(file);
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (!/Attachments(\.collection)?\.remove(Async)?\(|cfg\.Collection\.collection\.removeAsync\(/.test(line)) return;
      if (/^\s*\/\//.test(line)) return;               // a comment about it
      const allowed = (ALLOWED[file] || []).some(fragment => line.includes(fragment));
      if (!allowed) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], 'a hard delete of an attachment outside the allowed places');
});

test('the allow-list is exact: every allowed fragment is still there (a moved line must move here too)', () => {
  for (const [file, fragments] of Object.entries(ALLOWED)) {
    const src = read(file);
    for (const fragment of fragments) {
      assert.ok(src.includes(fragment), `${file} no longer contains: ${fragment}`);
    }
  }
});

test('the paths that used to hard-delete now soft-delete', () => {
  const api = read('server/attachmentApi.js');
  const routes = read('server/routes/attachmentApi.js');
  const backgrounds = read('server/boardBackgrounds.js');
  for (const [name, src] of [['attachmentApi.js', api], ['routes/attachmentApi.js', routes], ['boardBackgrounds.js', backgrounds]]) {
    assert.ok(/softDeleteAttachment\(\{ userId[^}]*attachment \}\)/.test(src), `${name} calls softDeleteAttachment`);
    assert.ok(!/Attachments\.removeAsync/.test(src), `${name} has no Attachments.removeAsync`);
  }
  assert.ok(!/permanentlyDeleteAttachmentFromFilesReport/.test(api.replace(/\/\/.*$/gm, '')),
    'the Files-report permanent delete method is gone (only a comment may mention it)');
});

test('the client cannot remove: allow.remove refuses and the DDP remove hook refuses', () => {
  const perms = read('server/permissions/attachments.js');
  const allowAt = perms.indexOf('  remove() {');
  assert.ok(allowAt > 0, 'the allow rule takes no arguments - it needs none to say no');
  const allowBody = perms.slice(allowAt, perms.indexOf('  },', allowAt));
  assert.ok(/return false;/.test(allowBody) && !/return true/.test(allowBody));
  const hookAt = perms.indexOf('Attachments.onBeforeRemove = function');
  const hookBody = perms.slice(hookAt, perms.indexOf('\n};', hookAt));
  assert.ok(/\n  return false;$/.test(hookBody), 'the hook ends by refusing');
  assert.ok(!/return true/.test(hookBody), 'negative: no allowing path');
  assert.ok(/key: 'authz\.file-remove'/.test(hookBody), 'the attempt is logged to Admin Panel / Problems');
});

test('the client-side delete is the soft-delete method, and no client file removes an attachment', () => {
  const clientFiles = files.filter(f => f.startsWith('client/'));
  for (const file of clientFiles) {
    assert.ok(!/Attachments(\.collection)?\.remove(Async)?\(/.test(read(file)), `${file} removes an attachment`);
    assert.ok(!/permanentlyDeleteAttachmentFromFilesReport/.test(read(file)), `${file} still calls the removed method`);
  }
  assert.ok(/Meteor\.call\('attachments\.softDelete', this\._id\)/.test(read('client/components/cards/attachments.js')));
  assert.ok(!/js-table-page-attachment-delete/.test(read('client/components/settings/tablePage.jade')),
    'the Files report has no delete button');
});

test('the soft delete keeps the file: the method never touches storage or removes the record', () => {
  const server = read('server/attachmentSoftDelete.js');
  const code = server.replace(/^\s*\/\/.*$/gm, '');   // the comments say what is NOT here
  assert.ok(!/removeAsync|unlink|fileStoreStrategy/.test(code));
  assert.ok(/Attachments\.collection\.updateAsync\(\{ _id: attachment\._id \}, \{ \$set: plan\.set \}\)/.test(server),
    'the delete is a $set of the bookkeeping fields');
  assert.ok(/Attachments\.collection\.updateAsync\(\{ _id: attachment\._id \}, plan\.modifier\)/.test(server),
    'the restore is the $unset modifier');
  assert.ok(/\$unset: \{ coverId: '' \}/.test(server), 'the cover is unset on delete');
  assert.ok(!/restoreAttachment[\s\S]*coverId/.test(server.slice(server.indexOf('export async function restoreAttachment'))),
    'negative: restore never writes coverId');
});

test('§12.4: the archived-board purge is gated, and the board removal takes the attachments with it', () => {
  const boards = read('server/models/boards.js');
  const purge = boards.slice(boards.indexOf('async permanentlyDeleteArchivedBoards('));
  assert.ok(/user\?\.isAdmin !== true \|\| !getFeatureFlags\(\)\.enablePermanentDelete/.test(purge));
  assert.ok(/foundBoards\.some\(board => !board\.archived\)/.test(purge));
  assert.ok(/await Boards\.removeAsync\(board\._id\)/.test(purge));
  const remover = boards.slice(boards.indexOf('async function boardRemover('), boards.indexOf('Boards.before.remove('));
  assert.ok(remover.includes("Attachments.removeAsync({ 'meta.boardId': doc._id })"),
    'boardRemover removes every attachment of the board - live and soft-deleted, by meta.boardId');
  assert.ok(!/deletedAt/.test(remover), 'negative: the purge does not filter to live ones - soft-deleted go too');
});

console.log(`\nattachmentSoftDeleteNoHardDelete: ${passed} tests passed`);
