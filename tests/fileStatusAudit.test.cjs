'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { auditFiles } = require('../server/lib/fileStatusAudit');
const root = fs.mkdtempSync(path.join(__dirname, '../.tools/tmp/file-audit-'));
function matches(row, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === 'object' && '$exists' in value) return (row[key] !== undefined) === value.$exists;
    if (value && typeof value === 'object' && '$in' in value) return value.$in.includes(row[key]);
    return String(row[key]) === String(value);
  });
}
function database(data) {
  return { collection(name) { return {
    find(filter) {
      const rows = (data[name] || []).filter(row => matches(row, filter));
      return { async *[Symbol.asyncIterator]() { yield* rows; }, async close() {} };
    },
    async findOne(filter) { return (data[name] || []).find(row => matches(row, filter)); },
  }; } };
}
(async () => {
 try {
  const roots = { attachments: path.join(root, 'files/attachments'), avatars: path.join(root, 'files/avatars') };
  for (const directory of Object.values(roots)) fs.mkdirSync(directory, { recursive: true });
  const good = path.join(roots.attachments, 'good.png');
  const orphan = path.join(roots.attachments, 'lost-original-photo.png');
  const renamed = path.join(roots.attachments, 'old-photo.png');
  const incomplete = path.join(roots.attachments, 'partial.png');
  for (const filename of [good, orphan, renamed, incomplete]) fs.writeFileSync(filename, 'PNG fixture');
  fs.symlinkSync(__filename, path.join(roots.attachments, 'outside-symlink'));
  const data = {
    attachments: [
      { _id: 'good', name: 'good.png', extension: 'png', type: 'image/png', size: 11, meta: { boardId: 'b', cardId: 'c' }, versions: { original: { storage: 'fs', path: good, size: 11, type: 'IMAGE/X-PNG; charset=binary', extension: 'png' } } },
      { _id: 'lost', name: 'new-name.txt', versions: { original: { path: '/old/location/missing', size: 11 } } },
      { _id: 'partial', name: 'unfinished.xlsx' },
      { _id: 'bad', name: 'bad.txt', versions: { original: { storage: 'fs', path: good, size: 50, type: 'text/plain', extension: 'txt', sha256: 'wrong' } } },
      { _id: 'remote', name: 'remote', versions: { original: { storage: 'gridfs', meta: { gridFsFileId: 'grid-one' } } } },
    ], boards: [{ _id: 'b' }], cards: [{ _id: 'c' }],
    fileIntegrity: [{ _id: good, path: good, size: 1, digests: { sha256: 'old-hash' } }],
    changeHistory: [{ entityType: 'attachment', entityId: 'lost', changeType: 'edited', previousContent: { field: 'name', value: 'old-photo.png' }, newContent: { name: 'new-name.txt' }, undone: true }],
    'attachments.files': [{ _id: 'grid-one', length: 10, chunkSize: 5 }, { _id: 'grid-orphan', length: 0, chunkSize: 5 }],
    'attachments.chunks': [{ files_id: 'grid-one', n: 0 }, { files_id: 'no-file', n: 0 }],
  };
  const before = JSON.stringify(data);
  const options = { db: database(data), roots, writablePath: root, detect: async () => ({ mime: 'image/png', ext: 'png' }) };
  const result = await auditFiles(options);
  assert.equal(result.state, 'completed');
  assert.equal(result.filesystemScanned, true);
  for (const kind of ['incomplete-metadata', 'detected-metadata-for-incomplete-record', 'missing-versions', 'incomplete-version', 'missing-owner-metadata', 'missing-or-unverified-file', 'possible-moved-or-renamed-file', 'file-without-live-reference', 'size-mismatch', 'mime-mismatch', 'extension-mismatch', 'checksum-mismatch', 'duplicate-file-reference', 'duplicate-content', 'integrity-baseline-differs', 'symlink-not-followed', 'gridfs-without-live-reference', 'gridfs-chunk-count-mismatch', 'gridfs-chunks-without-file-record']) assert.ok(result.totals[kind], kind);
  assert.ok(result.findings.some(row => row.kind === 'possible-moved-or-renamed-file' && row.id === 'lost' && row.path === renamed));
  assert.ok(result.findings.some(row => row.kind === 'possible-moved-or-renamed-file' && row.id === 'partial' && row.path === incomplete));
  assert.ok(!result.findings.some(row => row.kind === 'content-read-failed' && row.path.endsWith('outside-symlink')));
  assert.ok(!result.findings.some(row => row.id === 'good' && row.kind === 'mime-mismatch'), 'equivalent MIME aliases and parameters are accepted');
  assert.equal(JSON.stringify(data), before, 'audit cannot write to the database');
  assert.equal(fs.readFileSync(good, 'utf8'), 'PNG fixture');
  const partial = await auditFiles({ ...options, limits: { entries: 1 } });
  assert.equal(partial.state, 'partial');
  const manyVersions = await auditFiles({ ...options, limits: { versions: 1 } });
  assert.equal(manyVersions.state, 'partial');
  assert.ok(manyVersions.limitations.includes('Version limit reached'));
  const tooManyRecords = await auditFiles({ ...options, limits: { records: 1 } });
  assert.equal(tooManyRecords.state, 'partial');
  assert.equal(tooManyRecords.counts.diskFiles, 0, 'a truncated record set must not produce false orphan-file findings');
  assert.equal(tooManyRecords.filesystemScanned, false);
  assert.ok(!tooManyRecords.totals['file-without-live-reference']);
  assert.ok(require('../server/lib/fileStatusAudit').LIMITS.versions > require('../server/lib/fileStatusAudit').LIMITS.records,
    'version cap must allow multiple versions per record');
  const bounded = await auditFiles({ ...options, limits: { findings: 1, bytes: 1 } });
  assert.equal(bounded.findings.length, 1); assert.ok(bounded.omittedFindings > 0); assert.equal(bounded.state, 'partial');
  const cancelled = await auditFiles({ ...options, cancelled: () => true });
  assert.equal(cancelled.state, 'cancelled');
  const inventory = await auditFiles({ ...options, mode: 'inventory', detect: () => { throw Error('inventory must not sniff'); } });
  assert.equal(inventory.counts.bytesRead, 0);
  const missingRoot = await auditFiles({ ...options, roots: { ...roots, avatars: path.join(root, 'unmounted') } });
  assert.ok(missingRoot.totals['storage-root-unavailable']);
  const remoteFailure = await auditFiles({ ...options, remoteRead: async () => { throw Object.assign(new Error(), { code: 'ACCESS_DENIED' }); } });
  assert.ok(remoteFailure.findings.some(row => row.kind === 'remote-read-unverified' && row.detail === 'ACCESS_DENIED'));
  const large = path.join(roots.attachments, 'large-file.bin');
  fs.writeFileSync(large, Buffer.alloc(96000, 1));
  const sampledLengths = [];
  const headersFirst = await auditFiles({ ...options, limits: { fileBytes: 1000 }, detect: async buffer => { sampledLengths.push(buffer.length); return { mime: 'application/octet-stream' }; } });
  assert.ok(sampledLengths.includes(65536), 'large files still get header detection');
  assert.ok(!sampledLengths.includes(96000), 'full checksum size limit is respected');
  assert.ok(headersFirst.totals['checksum-not-checked']);
  assert.ok(headersFirst.totals['type-unknown']);
  console.log('File audit: metadata gaps, rename/history candidates, filesystem/GridFS inconsistencies, read-only behavior and scan limits pass.');
 } finally { fs.rmSync(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
