'use strict';

// Verification and point-in-time restore of continuous backup
// (docs/Backup/Continuous-Backup.md "Restore"). Everything a restore will read
// is checked first - the generation, every index line, every segment's and
// every blob's SHA-256 - and a missing or changed byte stops it before any
// write. No Meteor: the methods and tests/integration/continuousBackup.test.cjs
// share it.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream/promises');
const { parseIndex, segmentsUntil, sha256, applyDelta } = require('../../../models/lib/continuousBackup');
const { safeEntryPath, symlinkOnRestorePath, safeCollectionName } = require('../../../models/lib/backupPaths');
const { readGeneration, blobPath, generationCipher } = require('./store');
const { PLAIN } = require('./encryption');

function refuse(message) { const error = new Error(message); error.code = 'continuous-backup-restore-refused'; throw error; }
// The generation and the cipher its files were written with; an encrypted
// one without its key, or with a wrong one, is refused before any read.
async function openGeneration(target, name, cipher) {
  const generation = await readGeneration(target, name);
  try { return { generation, cipher: generationCipher(generation, cipher) }; }
  catch (error) { refuse(error.message); }
}
// A stored file as plain bytes: a changed byte or a wrong key is refused.
function plain(cipher, data) {
  try { return cipher.decrypt(data); } catch (error) { refuse(error.message); }
}

async function readIndex(dir) {
  try { return parseIndex(await fsp.readFile(path.join(dir, 'index.ndjson'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; if (error.code === 'continuous-backup-invalid') refuse(error.message); throw error; }
}
// The listed segments up to `until`, each read, checked as stored, and
// decrypted when the generation is encrypted.
async function verifiedSegments(dir, until, cipher = PLAIN) {
  const result = [];
  for (const entry of segmentsUntil(await readIndex(dir), until)) {
    let data;
    try { data = await fsp.readFile(path.join(dir, entry.file)); } catch (error) { refuse(`Segment ${entry.file} is missing`); }
    if (data.length !== entry.bytes || sha256(data) !== entry.sha256) refuse(`Segment ${entry.file} has changed`);
    result.push({ entry, data: plain(cipher, data) });
  }
  return result;
}
function* records(segments, until) {
  for (const { data } of segments) {
    for (const line of data.toString('utf8').split('\n')) {
      if (!line) continue;
      const record = JSON.parse(line);
      if (record.t <= until) yield record;
    }
  }
}
async function blobDigest(file) {
  const hash = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(file), hash);
  return hash.digest('hex');
}

// What a generation offers: the period it covers and what it holds.
async function restorePoints(target, name) {
  const generation = await readGeneration(target, name);
  const ranges = [];
  for (const dir of [path.join(generation.dir, 'db'), path.join(generation.dir, 'files')]) {
    const entries = await readIndex(dir);
    if (entries.length) ranges.push([entries[0].first, entries[entries.length - 1].last]);
  }
  let sqlite = [];
  try { sqlite = await fsp.readdir(path.join(generation.dir, 'sqlite')); } catch (error) { /* none */ }
  for (const db of sqlite) {
    const entries = await readIndex(path.join(generation.dir, 'sqlite', db));
    if (entries.length) ranges.push([entries[0].first, entries[entries.length - 1].last]);
  }
  return { name, started: generation.started, engine: generation.engine || null, base: generation.base || null,
    encrypted: !!generation.encrypted,
    from: generation.started, until: Math.max(generation.started, ...ranges.map(range => range[1])), sqlite };
}

// The database as it was at `until`: the base archive, then every record up
// to then. add-missing never overwrites nor deletes; replace-all replays all.
async function restoreDatabase({ target, name, until, db, filesRoot, mode, EJSON, inspectInstanceBackup, restoreInstanceBackup, cipher: streamCipher = PLAIN }) {
  if (!['add-missing', 'replace-all'].includes(mode)) refuse('Invalid restore mode');
  const { generation, cipher } = await openGeneration(target, name, streamCipher);
  if (generation.base !== 'complete') refuse('This generation has no complete base');
  const segments = await verifiedSegments(path.join(generation.dir, 'db'), until, cipher);
  // Parse everything before writing anything.
  const replay = [...records(segments, until)].map(record => {
    if (!['put', 'del', 'drop', 'dropDatabase'].includes(record.op)) refuse('Unknown database record');
    if (record.op !== 'dropDatabase' && !safeCollectionName(record.c)) refuse('Unsafe collection name');
    return { ...record, d: record.d && EJSON.deserialize(record.d, { relaxed: false }),
      id: record.id !== undefined ? EJSON.deserialize({ v: record.id }, { relaxed: false }).v : undefined };
  });
  // An encrypted base is decrypted beside the stream for as long as the
  // restore reads it; GCM refuses it whole if one byte changed.
  let base = path.join(generation.dir, 'base.zip'), clear = null;
  if (cipher.encrypted) {
    await fsp.mkdir(path.join(target, 'restore'), { recursive: true, mode: 0o700 });
    clear = path.join(target, 'restore', `.base-${crypto.randomUUID()}.zip`);
    try { await cipher.decryptFile(base, clear); } catch (error) { refuse(error.message); }
    base = clear;
  }
  let inspected;
  try {
    inspected = await inspectInstanceBackup(base);
    await restoreInstanceBackup({ inspected, db, filesRoot, mode });
  } finally { if (clear) await fsp.rm(clear, { force: true }); }
  let applied = 0;
  for (const record of replay) {
    if (record.op === 'put') {
      if (mode === 'add-missing') {
        if (await db.collection(record.c).findOne({ _id: record.d._id }, { projection: { _id: 1 } })) continue;
        await db.collection(record.c).insertOne(record.d);
      } else await db.collection(record.c).replaceOne({ _id: record.d._id }, record.d, { upsert: true });
    } else if (mode === 'add-missing') continue;
    else if (record.op === 'del') await db.collection(record.c).deleteOne({ _id: record.id });
    else if (record.op === 'drop') await db.collection(record.c).drop().catch(error => { if (error.codeName !== 'NamespaceNotFound') throw error; });
    else if (record.op === 'dropDatabase') {
      for (const info of await db.listCollections({}, { nameOnly: true }).toArray()) {
        if (!info.name.startsWith('system.')) await db.collection(info.name).deleteMany({});
      }
    }
    applied += 1;
  }
  return { collections: inspected.manifest.collections.length, records: applied };
}

// The files as they were at `until`, written back to `roots`
// ({ '<area>\0<source>': { path, file } }). add-missing writes only files that
// do not exist; replace-all also overwrites, and removes files created since.
async function restoreFiles({ target, name, until, roots, mode, cipher: streamCipher = PLAIN }) {
  if (!['add-missing', 'replace-all'].includes(mode)) refuse('Invalid restore mode');
  const { generation, cipher } = await openGeneration(target, name, streamCipher);
  const segments = await verifiedSegments(path.join(generation.dir, 'files'), until, cipher);
  const state = new Map();
  for (const record of records(segments, until)) {
    const key = `${record.area}\0${record.source}`;
    if (!roots[key]) continue;
    const id = `${key}\0${record.path}`;
    if (record.op === 'put') state.set(id, record); else if (record.op === 'delete') state.delete(id); else refuse('Unknown file record');
  }
  // A configured root may itself be a link (attachments on another disk);
  // it is resolved once, and no link below it is followed.
  const resolved = Object.fromEntries(Object.entries(roots).map(([key, root]) => {
    const dir = root.file ? path.dirname(root.path) : root.path;
    const real = fs.existsSync(dir) ? fs.realpathSync(dir) : dir;
    return [key, { ...root, path: root.file ? path.join(real, path.basename(root.path)) : real }];
  }));
  const plan = [];
  // Encrypted contents are decrypted into a staging directory and checked
  // there, all of them before the first write.
  const staging = cipher.encrypted ? path.join(target, 'restore', `.files-${crypto.randomUUID()}`) : null;
  if (staging) await fsp.mkdir(staging, { recursive: true, mode: 0o700 });
  try {
    for (const [id, record] of state) {
      const root = resolved[`${record.area}\0${record.source}`];
      const parts = record.path.split('/');
      if (parts.some(part => !part || part === '.' || part === '..') || record.path.includes('\\') || record.path.includes('\0')) refuse('Unsafe file path');
      const dest = root.file ? root.path : safeEntryPath(root.path, parts);
      if (!dest) refuse('Unsafe file path');
      if (symlinkOnRestorePath(root.file ? path.dirname(root.path) : root.path, dest)) refuse('A restore path goes through a symbolic link');
      const stored = blobPath(target, record.sha256, cipher);
      if (!fs.existsSync(stored)) refuse(`File contents ${record.sha256} are missing or changed`);
      let blob = stored;
      if (staging) {
        blob = path.join(staging, record.sha256);
        if (!fs.existsSync(blob)) {
          try { await cipher.decryptFile(stored, blob); } catch (error) { refuse(`File contents ${record.sha256} are missing or changed`); }
        }
      }
      if (await blobDigest(blob) !== record.sha256) refuse(`File contents ${record.sha256} are missing or changed`);
      plan.push({ id, dest, blob, record });
    }
    let written = 0, removed = 0;
    for (const { dest, blob, record } of plan) {
      if (mode === 'add-missing' && fs.existsSync(dest)) continue;
      await fsp.mkdir(path.dirname(dest), { recursive: true });
      const temp = `${dest}.restore-${crypto.randomUUID()}`;
      try {
        await pipeline(fs.createReadStream(blob), fs.createWriteStream(temp, { flags: 'wx', mode: 0o600 }));
        await fsp.rename(temp, dest);
        const time = new Date(record.mtimeMs);
        await fsp.utimes(dest, time, time).catch(() => {});
      } finally { await fsp.rm(temp, { force: true }); }
      written += 1;
    }
    if (mode === 'replace-all') {
      const { walk } = require('./files');
      const wanted = new Set(plan.map(item => item.dest));
      for (const root of Object.values(resolved)) {
        if (root.file) { if (!wanted.has(root.path) && fs.existsSync(root.path)) { await fsp.rm(root.path); removed += 1; } continue; }
        for (const [relative] of await walk(root.path)) {
          const file = path.join(root.path, ...relative.split('/'));
          if (!wanted.has(file)) { await fsp.rm(file); removed += 1; }
        }
      }
    }
    return { files: plan.length, written, removed };
  } finally { if (staging) await fsp.rm(staging, { recursive: true, force: true }); }
}

// A SQLite file as it was at `until`, built at `out` and checked. FerretDB
// holds the live file open, so this never writes over it.
async function restoreSqlite({ target, name, database, until, out, quickCheck, cipher: streamCipher = PLAIN }) {
  if (!/^[A-Za-z0-9_-]+$/.test(database)) refuse('Invalid database name');
  const { generation, cipher } = await openGeneration(target, name, streamCipher);
  const dir = path.join(generation.dir, 'sqlite', database);
  let image;
  try { image = await fsp.readFile(path.join(dir, 'base.sqlite')); } catch (error) { refuse('This generation has no SQLite base'); }
  image = plain(cipher, image);
  for (const { data } of await verifiedSegments(dir, until, cipher)) image = applyDelta(image, data);
  if (fs.existsSync(out)) refuse('The restore file already exists');
  await fsp.mkdir(path.dirname(out), { recursive: true });
  await fsp.writeFile(out, image, { flag: 'wx', mode: 0o600 });
  const check = quickCheck(out);
  if (check.length !== 1 || check[0] !== 'ok') { await fsp.rm(out, { force: true }); refuse('The rebuilt database fails its check'); }
  return { file: out, bytes: image.length };
}

// Put a rebuilt, checked wekan.sqlite where the startup scripts look for a
// continuous-backup restore, and ask for it with their RESTORE_REQUESTED
// marker (mode "continuous"): the next restart, before FerretDB opens its
// files, keeps the live database in continuous-restore/replaced and copies
// this one in (releases/ferretdb/wekan-entrypoint.sh, start-wekan.sh,
// snap-src/bin/ferretdb-control). Only wekan.sqlite: the scripts restore no
// other database. A pending request of any kind is never overwritten.
async function stageSqliteRestore({ file, database, sqliteDir }) {
  if (database !== 'wekan') refuse('Only the wekan database can be restored on restart');
  if (!sqliteDir || !path.isAbsolute(sqliteDir) || !fs.existsSync(sqliteDir)) refuse('The SQLite directory of this server is unknown');
  const marker = path.join(sqliteDir, 'RESTORE_REQUESTED');
  if (fs.existsSync(marker)) refuse('A restore is already requested for the next restart');
  const dir = path.join(sqliteDir, 'continuous-restore');
  await fsp.mkdir(dir, { recursive: true, mode: 0o700 });
  if ((await fsp.lstat(dir)).isSymbolicLink()) refuse('The staging directory is a symbolic link');
  const staged = path.join(dir, 'wekan.sqlite');
  const temp = `${staged}.partial-${crypto.randomUUID()}`;
  try {
    await fsp.copyFile(file, temp);
    const handle = await fsp.open(temp, 'r');
    try { await handle.sync(); } finally { await handle.close(); }
    await fsp.rename(temp, staged);
  } finally { await fsp.rm(temp, { force: true }); }
  await fsp.writeFile(marker, 'continuous\n', { flag: 'wx', mode: 0o600 });
  return { staged, marker };
}

module.exports = { restorePoints, restoreDatabase, restoreFiles, restoreSqlite, stageSqliteRestore, verifiedSegments };
