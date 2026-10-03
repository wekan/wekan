'use strict';

// The pure half of continuous backup (docs/Backup/Continuous-Backup.md): what
// the settings may be, which target directories are safe, which database engine
// runs, how a segment is named and checked, which segments a restore to a
// moment reads, and how a SQLite image is compared and rebuilt page by page.
// No Meteor and no filesystem: tested by tests/continuousBackup.test.cjs and
// used by server/lib/continuousBackup/*.
const crypto = require('node:crypto');
const path = require('node:path');

const FORMAT = 'wekan-continuous-backup';
const VERSION = 1;
const ENGINES = ['auto', 'oplog', 'sqlite', 'litestream'];
const AREAS = ['attachments', 'avatars', 'logs'];
const DEFAULTS = Object.freeze({
  enabled: false, target: '', database: true, attachments: true, avatars: true, logs: true,
  engine: 'auto', sqliteIntervalSeconds: 60, fileScanSeconds: 300, baseEveryHours: 24, keepDays: 7,
  litestreamBinary: '', litestreamReplicaUrl: '',
  // Encryption at rest (decision of 2026-10-03): the key lives in a file the
  // administrator holds, never in the database the stream backs up.
  encrypt: false, encryptionKeyFile: '',
  // Cloud upload (decision of 2026-10-03): the target mirrored to a storage
  // configured in Admin Panel / Attachments, under this key prefix.
  upload: 'none', uploadPrefix: 'wekan-continuous-backup',
});
const UPLOADS = ['none', 's3', 'azure', 'gcs'];
const UPLOAD_PREFIX = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;
const RANGES = { sqliteIntervalSeconds: [5, 3600], fileScanSeconds: [30, 86400], baseEveryHours: [1, 720], keepDays: [1, 3650] };
const LITESTREAM_SCHEMES = ['file:', 's3:', 'abs:', 'gcs:', 'sftp:'];

function fail(message) { const error = new Error(message); error.code = 'continuous-backup-invalid'; throw error; }

// An absolute path with nothing that could walk out of it or end a C string.
function safeAbsolute(value, label) {
  if (typeof value !== 'string' || !value || value.length > 4096 || value.includes('\0') || !path.isAbsolute(value) ||
      value.split(/[\\/]/).includes('..')) fail(`${label} must be an absolute path`);
  return path.resolve(value);
}
const inside = (parent, child) => child === parent || child.startsWith(parent.endsWith(path.sep) ? parent : parent + path.sep);

// The stream may not be written where it reads, nor read where it writes:
// either would back up its own output without end.
function targetConflict(target, sources) {
  const resolved = path.resolve(target);
  for (const source of sources.filter(Boolean)) {
    const other = path.resolve(source);
    if (inside(other, resolved) || inside(resolved, other)) return other;
  }
  return null;
}

// Settings as saved: every field present, of its type and in its range.
// `sources` are the directories the stream reads on this server.
function validateSettings(input, { sources = [], defaultTarget = '' } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Settings must be an object');
  const unknown = Object.keys(input).filter(key => !(key in DEFAULTS));
  if (unknown.length) fail(`Unknown setting ${unknown[0]}`);
  const result = { ...DEFAULTS, target: defaultTarget, ...input };
  for (const key of ['enabled', 'database', 'encrypt', ...AREAS]) if (typeof result[key] !== 'boolean') fail(`${key} must be true or false`);
  if (!ENGINES.includes(result.engine)) fail('Unknown database engine');
  for (const [key, [min, max]] of Object.entries(RANGES)) {
    if (!Number.isInteger(result[key]) || result[key] < min || result[key] > max) fail(`${key} must be ${min}-${max}`);
  }
  if (result.enabled || result.target) {
    result.target = safeAbsolute(result.target, 'The target directory');
    const conflict = targetConflict(result.target, sources);
    if (conflict) fail('The target directory overlaps a directory the backup reads');
  }
  if (result.engine === 'litestream') {
    result.litestreamBinary = safeAbsolute(result.litestreamBinary, 'The Litestream binary');
    let url;
    try { url = new URL(result.litestreamReplicaUrl); } catch (error) { fail('The Litestream replica URL is not a URL'); }
    if (!LITESTREAM_SCHEMES.includes(url.protocol)) fail('The Litestream replica URL has an unsupported scheme');
  } else {
    for (const key of ['litestreamBinary', 'litestreamReplicaUrl']) {
      if (typeof result[key] !== 'string' || result[key].length > 4096 || result[key].includes('\0')) fail(`${key} is invalid`);
    }
  }
  if (result.encrypt) {
    // Never beside the stream it unlocks, nor where the stream would copy it.
    result.encryptionKeyFile = safeAbsolute(result.encryptionKeyFile, 'The encryption key file');
    if (targetConflict(result.encryptionKeyFile, [result.target, ...sources])) fail('The encryption key file must be outside the target and every directory the backup reads');
  } else if (typeof result.encryptionKeyFile !== 'string' || result.encryptionKeyFile.length > 4096 || result.encryptionKeyFile.includes('\0')) {
    fail('encryptionKeyFile is invalid');
  }
  if (!UPLOADS.includes(result.upload)) fail('Unknown upload storage');
  if (typeof result.uploadPrefix !== 'string' || result.uploadPrefix.length > 200 || !UPLOAD_PREFIX.test(result.uploadPrefix) ||
      result.uploadPrefix.split('/').some(part => part === '.' || part === '..')) fail('The upload prefix is invalid');
  if (result.enabled && !result.database && !AREAS.some(area => result[area])) fail('Choose something to back up');
  return result;
}

// Which database engine runs, and why the others cannot. `available` says what
// this server has: an oplog, readable SQLite files, a Litestream binary.
function chooseEngine(requested, available) {
  const reasons = {
    oplog: available.oplog ? null : 'no-oplog',
    sqlite: available.sqliteFiles?.length ? (available.nodeSqlite ? null : 'no-node-sqlite') : 'no-sqlite-files',
    litestream: !available.sqliteFiles?.length ? 'no-sqlite-files' : available.litestream ? null : 'no-litestream-binary',
  };
  if (requested === 'auto') {
    // Litestream only when chosen: it is a program the administrator installs.
    const engine = ['oplog', 'sqlite'].find(name => !reasons[name]) || null;
    return { engine, reasons };
  }
  return { engine: reasons[requested] ? null : requested, reasons };
}

const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const segmentName = seq => `${String(seq).padStart(12, '0')}`;

// One index line per sealed segment, as written and as checked before a restore.
function indexLine({ seq, file, sha256: hash, bytes, first, last, count }) {
  const line = { seq, file, sha256: hash, bytes, first, last, count };
  checkIndexEntry(line);
  return JSON.stringify(line);
}
function checkIndexEntry(entry) {
  if (!entry || !Number.isInteger(entry.seq) || entry.seq < 1 || typeof entry.file !== 'string' ||
      !/^[0-9]{12}\.(ndjson|pages)$/.test(entry.file) || !entry.file.startsWith(segmentName(entry.seq)) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 || '') || !Number.isInteger(entry.bytes) || entry.bytes < 0 ||
      !Number.isInteger(entry.count) || entry.count < 0 || typeof entry.first !== 'number' || typeof entry.last !== 'number' ||
      !Number.isFinite(entry.first) || !Number.isFinite(entry.last) || entry.first > entry.last) {
    fail('Invalid backup index entry');
  }
  return entry;
}
// A whole index: entries in sequence with no gap or repeat, time never going back.
function parseIndex(text) {
  const entries = text.split('\n').filter(Boolean).map(line => {
    let entry;
    try { entry = JSON.parse(line); } catch (error) { fail('Invalid backup index line'); }
    return checkIndexEntry(entry);
  });
  entries.forEach((entry, i) => {
    if (entry.seq !== i + 1) fail('Backup index has a gap');
    if (i && entry.first < entries[i - 1].last) fail('Backup index goes back in time');
  });
  return entries;
}
// The segments a restore to `until` (milliseconds) reads: every one that
// starts at or before it. The last may hold later records, which the reader
// skips by their own time.
function segmentsUntil(entries, until) {
  return entries.filter(entry => entry.first <= until);
}

// An oplog timestamp's second, in milliseconds like every other time in the
// stream. Operations within one second keep their order by position in the
// segment, which is the oplog's own order.
const oplogMillis = ts => ts.high * 1000;

// SQLite page comparison. A page's SHA-256, the pages that differ from the
// previous image, and a delta that rebuilds the new image from the old one.
const MAGIC = Buffer.from('WKPAGES1\n');
function sqlitePageSize(header) {
  if (header.length < 100 || header.toString('latin1', 0, 16) !== 'SQLite format 3\0') fail('Not a SQLite database');
  const size = header.readUInt16BE(16);
  const pageSize = size === 1 ? 65536 : size;
  if (pageSize < 512 || pageSize > 65536 || (pageSize & (pageSize - 1))) fail('Invalid SQLite page size');
  return pageSize;
}
function pageHashes(image, pageSize) {
  if (image.length % pageSize) fail('A SQLite image is not a whole number of pages');
  const hashes = [];
  for (let offset = 0; offset < image.length; offset += pageSize) hashes.push(sha256(image.subarray(offset, offset + pageSize)));
  return hashes;
}
function encodeDelta({ pageSize, pageCount, pages }) {
  const header = Buffer.from(`${JSON.stringify({ pageSize, pageCount, pages: pages.map(page => page.n) })}\n`);
  return Buffer.concat([MAGIC, header, ...pages.map(page => page.data)]);
}
// Pages of `image` that differ from `previous` hashes, as a delta.
function diffImage(previous, image, pageSize) {
  const hashes = pageHashes(image, pageSize);
  const pages = [];
  hashes.forEach((hash, n) => { if (previous[n] !== hash) pages.push({ n, data: image.subarray(n * pageSize, (n + 1) * pageSize) }); });
  return { hashes, pages, delta: encodeDelta({ pageSize, pageCount: hashes.length, pages }) };
}
function decodeDelta(buffer) {
  if (!buffer.subarray(0, MAGIC.length).equals(MAGIC)) fail('Not a page delta');
  const end = buffer.indexOf(10, MAGIC.length);
  if (end < 0) fail('Page delta has no header');
  let header;
  try { header = JSON.parse(buffer.toString('utf8', MAGIC.length, end)); } catch (error) { fail('Page delta header is invalid'); }
  const { pageSize, pageCount, pages } = header;
  if (!Number.isInteger(pageSize) || pageSize < 512 || pageSize > 65536 || !Number.isInteger(pageCount) || pageCount < 0 ||
      !Array.isArray(pages) || pages.some((n, i) => !Number.isInteger(n) || n < 0 || n >= pageCount || (i && n <= pages[i - 1])) ||
      buffer.length !== end + 1 + pages.length * pageSize) fail('Page delta is inconsistent');
  return { pageSize, pageCount, pages: pages.map((n, i) => ({ n, data: buffer.subarray(end + 1 + i * pageSize, end + 1 + (i + 1) * pageSize) })) };
}
// The image after a delta: same pages, changed ones replaced, cut or grown to
// the new page count. A page the delta adds past the old end must be in it.
function applyDelta(image, delta) {
  const { pageSize, pageCount, pages } = decodeDelta(delta);
  const result = Buffer.alloc(pageCount * pageSize);
  image.copy(result, 0, 0, Math.min(image.length, result.length));
  const written = new Set();
  for (const page of pages) { page.data.copy(result, page.n * pageSize); written.add(page.n); }
  for (let n = Math.floor(image.length / pageSize); n < pageCount; n += 1) if (!written.has(n)) fail('Page delta leaves a page undefined');
  return result;
}

// Generations older than `keepDays`, newest complete one always kept.
function generationsToRemove(generations, now, keepDays) {
  const complete = generations.filter(g => g.complete).sort((a, b) => b.started - a.started);
  const keep = new Set(complete.slice(0, 1).map(g => g.name));
  return generations.filter(g => !keep.has(g.name) && (g.ended ?? g.started) < now - keepDays * 86400000).map(g => g.name);
}
const generationName = (date, id) => `${date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)}-${id}`;
const GENERATION_NAME = /^[0-9]{8}-[0-9]{6}-[A-Za-z0-9]{6,32}$/;

module.exports = {
  FORMAT, VERSION, ENGINES, AREAS, DEFAULTS, LITESTREAM_SCHEMES, UPLOADS,
  validateSettings, targetConflict, chooseEngine, sha256, segmentName, indexLine, checkIndexEntry, parseIndex,
  segmentsUntil, oplogMillis, sqlitePageSize, pageHashes, diffImage, encodeDelta, decodeDelta, applyDelta,
  generationsToRemove, generationName, GENERATION_NAME,
};
