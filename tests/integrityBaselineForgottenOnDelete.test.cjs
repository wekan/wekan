'use strict';

// #6898: the daily file-integrity scan reported every file WeKan itself had
// deleted as a StorageBleed "missing" on every run, because nothing ever removed
// its baseline. On an instance that purges attachments daily one finding was
// folded 1,164 times, burying any real tamper finding.
//
// Every place WeKan deletes or moves a stored local file now forgets that
// file's baseline. A file that disappears any other way keeps its baseline, so
// the scan still reports it.
// Run: node --test tests/integrityBaselineForgottenOnDelete.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { baselineIdsFor, versionPathsOf } = require('../models/lib/fileIntegrityBaselineIds.cjs');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

function body(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unbalanced braces');
}

test('baseline ids are the recorded path and its absolute form', () => {
  assert.deepEqual(baselineIdsFor('/data/attachments/a.png'), ['/data/attachments/a.png']);
  assert.deepEqual(baselineIdsFor('rel/a.png'), ['rel/a.png', path.resolve('rel/a.png')]);
  assert.deepEqual(baselineIdsFor(['/x', '/x']), ['/x']);
});

test('no paths, empty paths and non-strings forget nothing', () => {
  assert.deepEqual(baselineIdsFor(undefined), []);
  assert.deepEqual(baselineIdsFor(['', null, 5, {}]), []);
});

test('every version path of every removed file is collected', () => {
  assert.deepEqual(versionPathsOf([
    { versions: { original: { path: '/a/1' }, thumb: { path: '/a/2' } } },
    { versions: { original: {} } },
    null,
    { versions: null },
  ]), ['/a/1', '/a/2']);
});

test('forgetIntegrityBaselines removes exactly those ids, and nothing when there are none', async () => {
  const src = read('server/lib/fileIntegrityForget.js')
    .replace(/^export /gm, '')
    .concat('\n;({ forgetIntegrityBaselines, forgetIntegrityBaselinesSoon });');
  const removed = [];
  const FileIntegrity = { async removeAsync(selector) { removed.push(selector); return 1; } };
  const api = vm.runInNewContext(src, {
    require: id => (id.endsWith('fileIntegrityBaselineIds.cjs')
      ? require('../models/lib/fileIntegrityBaselineIds.cjs')
      : { default: FileIntegrity }),
  });
  assert.equal(await api.forgetIntegrityBaselines([]), 0);
  assert.deepEqual(removed, []);
  await api.forgetIntegrityBaselines(['/data/attachments/a.png']);
  assert.deepEqual(JSON.parse(JSON.stringify(removed)), [{ _id: { $in: ['/data/attachments/a.png'] } }]);

  // A failing removal never surfaces as an error to the delete that caused it.
  FileIntegrity.removeAsync = async () => { throw new Error('db down'); };
  assert.doesNotThrow(() => api.forgetIntegrityBaselinesSoon(['/x']));
  await new Promise(r => setImmediate(r));
});

test('the filesystem strategy forgets the baseline when it deletes or renames a file', () => {
  const src = read('models/lib/fileStoreStrategy.js');
  const cls = body(src, 'export class FileStoreStrategyFilesystem');
  assert.match(body(cls, 'unlink() {'), /fs\.unlink\(filePath[\s\S]*forgetBaselines\(\[filePath/);
  assert.match(body(cls, 'rename(newFilePath) {'), /fs\.renameSync\(current, newFilePath\);\s+[\s\S]*forgetBaselines\(\[current/);
  const helper = body(src, 'function forgetBaselines(paths)');
  assert.match(helper, /if \(!Meteor\.isServer\) return;/);
  assert.match(helper, /try \{[\s\S]*\} catch \(e\)/, 'bookkeeping must never break a delete');
});

test('every delete or rename in the filesystem strategy forgets the baseline (negative)', () => {
  const cls = body(read('models/lib/fileStoreStrategy.js'), 'export class FileStoreStrategyFilesystem')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const deletes = cls.match(/fs\.(unlink|unlinkSync|rm|rmSync|renameSync|promises\.unlink|promises\.rename)\(/g) || [];
  const forgets = cls.match(/forgetBaselines\(/g) || [];
  assert.ok(deletes.length > 0);
  assert.equal(forgets.length, deletes.length, 'a delete or rename without forgetBaselines() leaves a stale baseline');
});

test('attachment and avatar removal forget the removed files and keep the default unlink', () => {
  for (const [file, sig] of [
    ['models/attachments.server.js', 'Attachments.onAfterRemove = function'],
    ['models/avatars.server.js', 'Avatars.onAfterRemove = async function'],
  ]) {
    const src = read(file);
    assert.match(src, /import \{ forgetIntegrityBaselinesOfFiles \} from '\/server\/lib\/fileIntegrityForget';/, file);
    const hook = body(src, sig);
    assert.match(hook, /forgetIntegrityBaselinesOfFiles\(files\);/, file);
    // Meteor-Files skips its own unlink of the version paths when this hook
    // returns true; the files would then never be deleted at all.
    assert.doesNotMatch(hook, /return true/, file);
  }
});

test('the scan and the baseline model still never remove a baseline themselves', () => {
  // A file that vanishes without going through WeKan - rm, disk corruption,
  // tampering - must keep its baseline and still be reported missing.
  for (const file of ['server/lib/fileIntegrityScan.js', 'models/fileIntegrity.js']) {
    assert.doesNotMatch(read(file), /FileIntegrity\.(remove|removeAsync|deleteMany|deleteOne)\(/, file);
  }
  assert.match(read('server/lib/fileIntegrityScan.js'), /expected file is missing/);
});
