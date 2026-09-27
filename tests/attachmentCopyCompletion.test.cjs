const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../models/lib/fileStoreStrategy.js'), 'utf8');
const code = source.slice(source.indexOf('export const copyFile = async function') + 'export const copyFile = '.length, source.indexOf('\nexport const rename'));

for (const failure of [false, true]) test(`attachment copy waits for flushed bytes and handles stream failure: ${failure}`, async () => {
  const tempRoot = path.join(__dirname, '../.tools/tmp');
  fs.mkdirSync(tempRoot, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tempRoot, 'attachment-copy-'));
  const bytes = 'Copy payload '.repeat(100000);
  let stored = false, updated = false;
  const collection = {
    async addFile(filename, options, proceedAfterUpload) {
      assert.equal(fs.readFileSync(filename, 'utf8'), bytes, 'addFile must read a completely written file');
      assert.equal(options.meta.cardId, 'new-card');
      assert.equal(options.meta.boardId, 'new-board');
      stored = true;
      assert.equal(proceedAfterUpload, true);
      await new Promise(resolve => setImmediate(resolve));
      return { _id: 'copied-file' };
    },
    async updateAsync() { await new Promise(resolve => setImmediate(resolve)); updated = true; },
  };
  const factory = { storagePath: dir, collection, getFileStrategy() { return {
    getReadStream() { return failure ? new Readable({ read() { this.destroy(new Error('read failed')); } }) : Readable.from([bytes]); },
    getWriteStream(filename) { return fs.createWriteStream(filename); },
    getStorageName() { return 'fs'; },
  }; } };
  const copy = new Function('ReactiveCache', 'Random', 'Attachments', 'fs', 'path', 'ObjectId', 'sanitizeFilename', 'STORAGE_NAME_FILESYSTEM', 'require', `return (${code.replace(/;\s*$/, '')});`)(
    { async getCard() { return { boardId: 'new-board', listId: 'list', swimlaneId: 'lane' }; } },
    { id: () => 'temp-id' }, collection, fs, path, class { toString() { return 'id'; } }, x => x, 'fs', () => { throw new Error('optional sanitizer unavailable'); });
  try {
    const promise = copy({ _id: 'old-file', name: 'test.txt', type: 'text/plain', userId: 'user', versions: { original: {} } }, 'new-card', factory);
    if (failure) {
      await assert.rejects(promise, /read failed/);
      assert.equal(stored, false);
      assert.equal(updated, false);
    } else {
      assert.deepEqual(await promise, ['copied-file']);
      assert.equal(stored, true);
      assert.equal(updated, true);
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
