'use strict';

// Versioned, portable whole-instance archives. No Meteor dependency: the same
// code runs in scheduled jobs, manual jobs and the real-database restore tests.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');
// Use the same BSON implementation as the database driver, including Meteor's
// separately bundled driver. BSON objects from different major versions cannot mix.
function createBackupTools(EJSON) {
const unzipper = require('unzipper');

const FORMAT = 'wekan-instance-backup';
const VERSION = 2;
const MANIFEST = 'manifest.json';
const FILE_COLLECTIONS = ['attachments', 'avatars'];

function collectionName(name) {
  if (typeof name !== 'string' || !name || name.startsWith('system.')
      || /[\0/\\$]/.test(name) || name === '.' || name === '..') {
    throw new Error('Invalid backup collection name');
  }
  return name;
}
function idKey(id) { return EJSON.stringify(id, { relaxed: false }); }
function fileName(coll, id, version) {
  return `files/${coll}/${crypto.createHash('sha256')
    .update(`${coll}\0${idKey(id)}\0${version}`).digest('hex')}`;
}
function safeEntryPath(root, relative) {
  if (!relative || relative.includes('\\') || relative.includes('\0')
      || relative.split('/').some(p => !p || p === '.' || p === '..')
      || path.isAbsolute(relative)) throw new Error('Unsafe backup path');
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error('Unsafe backup path');
  return target;
}
// Do not follow existing destination symlinks while installing archive content.
function prepareDestination(root, relative) {
  const target = safeEntryPath(root, relative);
  fs.mkdirSync(root, { recursive: true });
  let current = path.resolve(root);
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Symlink in restore destination');
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  return target;
}

// Append and consume ONE entry before opening the next source stream. This
// bounds open files/cloud requests and surfaces both source and ZIP errors.
async function append(archive, name, input) {
  const hash = crypto.createHash('sha256');
  let size = 0;
  const meter = new Transform({ transform(chunk, encoding, callback) {
    size += chunk.length; hash.update(chunk); callback(null, chunk);
  } });
  const complete = new Promise((resolve, reject) => {
    const entry = item => { if (item.name === name) { cleanup(); resolve(); } };
    const error = err => { cleanup(); input.destroy(err); meter.destroy(err); reject(err); };
    const cleanup = () => { archive.off('entry', entry); archive.off('error', error); };
    archive.on('entry', entry); archive.on('error', error);
  });
  archive.append(meter, { name });
  const transfer = pipeline(input, meter).catch(error => {
    archive.emit('error', error); throw error;
  });
  await Promise.all([complete, transfer]);
  return { path: name, size, sha256: hash.digest('hex') };
}
function verifyFileMetadata(doc, coll, manifest, payloads) {
  if (!FILE_COLLECTIONS.includes(coll) || !manifest.options[coll]) return;
  const versions = Object.entries(doc.versions || {});
  if (!versions.length) throw new Error(`Missing ${coll} file versions`);
  for (const [version, info] of versions) {
    const payload = payloads.get(fileName(coll, doc._id, version));
    const expected = info.size === undefined ? doc.size : info.size;
    if (!payload || (expected !== undefined && Number(expected) !== Number(payload.size))) {
      throw new Error(`File metadata changed or payload missing: ${coll}/${String(doc._id)}/${version}`);
    }
  }
}
async function* documents(db, name, manifest, payloads) {
  // Keep BSON numbers, binary subtypes and ObjectIds intact; Meteor EJSON
  // doesn't serialize the raw driver's BSON types losslessly.
  const cursor = db.collection(name).find({}, { promoteLongs: false, promoteValues: false });
  try {
    for await (const doc of cursor) {
      verifyFileMetadata(doc, name, manifest, payloads);
      yield EJSON.stringify(doc, { relaxed: false }) + '\n';
    }
  } finally { await cursor.close(); }
}

async function appendInstanceBackup({ archive, db, opts, readFileVersion, progress = () => {} }) {
  const manifest = {
    format: FORMAT, version: VERSION, createdAt: new Date().toISOString(),
    options: opts, consistency: 'live-sequential', collections: [], files: [],
  };
  const collections = (await db.listCollections({}, { nameOnly: false }).toArray())
    .filter(c => !c.name.startsWith('system.'));
  if (collections.some(c => c.type === 'view')) {
    throw new Error('Database views require a database-native backup');
  }
  for (const coll of FILE_COLLECTIONS) {
    if (!opts[coll]) continue;
    const cursor = db.collection(coll).find({});
    try {
      for await (const doc of cursor) {
        const versions = Object.entries(doc.versions || {});
        if (!versions.length) throw new Error(`Cannot back up ${coll}: missing file versions`);
        for (const [version, info] of versions) {
          progress({ phase: coll, detail: `${coll}: ${String(doc._id)} / ${version}` });
          const stream = await readFileVersion(coll, doc, version);
          if (!stream) throw new Error(`Cannot read ${coll} file version`);
          const item = await append(archive, fileName(coll, doc._id, version), stream);
          const expected = info.size === undefined ? doc.size : info.size;
          if (Number.isFinite(expected) && item.size !== expected) {
            throw new Error(`Incomplete ${coll} file: expected ${expected} bytes, read ${item.size}`);
          }
          manifest.files.push({ ...item, collection: coll, id: idKey(doc._id), version });
        }
      }
    } finally { await cursor.close(); }
  }
  {
    const payloads = new Map(manifest.files.map(item => [item.path, item]));
    for (const info of collections.filter(c => opts.data || (FILE_COLLECTIONS.includes(c.name) && opts[c.name]))) {
      const name = collectionName(info.name);
      progress({ phase: 'data', detail: `data: ${name}` });
      const entry = `data/${Buffer.from(name).toString('hex')}.ndjson`;
      const item = await append(archive, entry, Readable.from(documents(db, name, manifest, payloads)));
      const indexes = await db.collection(name).listIndexes().toArray();
      manifest.collections.push({ ...item, name, indexes, options: info.options || {} });
    }
  }
  await append(archive, MANIFEST, Readable.from([EJSON.stringify(manifest, { relaxed: false })]));
  return manifest;
}

async function digest(stream) {
  const hash = crypto.createHash('sha256'); let size = 0;
  for await (const chunk of stream) { size += chunk.length; hash.update(chunk); }
  return { size, sha256: hash.digest('hex') };
}
async function readManifest(entry) {
  const parts = []; let size = 0;
  for await (const chunk of entry.stream()) {
    size += chunk.length;
    if (size > 64 * 1024 * 1024) throw new Error('Backup manifest exceeds 64 MiB');
    parts.push(chunk);
  }
  return EJSON.parse(Buffer.concat(parts).toString());
}
async function inspectInstanceBackup(zipPath) {
  const zip = await unzipper.Open.file(zipPath);
  if (!zip.files.some(entry => entry.path === MANIFEST)) return null;
  const entries = new Map();
  for (const entry of zip.files) {
    if (entry.type !== 'File') throw new Error('Unexpected backup directory entry');
    safeEntryPath('/backup', entry.path);
    if (entries.has(entry.path)) throw new Error('Duplicate archive entry');
    entries.set(entry.path, entry);
  }
  if (!entries.has(MANIFEST)) return null; // Original, unversioned archive.
  const manifest = await readManifest(entries.get(MANIFEST));
  if (manifest.format !== FORMAT || Number(manifest.version) !== VERSION
      || !Array.isArray(manifest.collections) || !Array.isArray(manifest.files)) {
    throw new Error('Unsupported backup manifest');
  }
  const expected = new Set([MANIFEST]);
  const names = new Set();
  for (const coll of manifest.collections) {
    collectionName(coll.name);
    if (names.has(coll.name) || coll.path !== `data/${Buffer.from(coll.name).toString('hex')}.ndjson`) {
      throw new Error('Duplicate or invalid backup collection');
    }
    names.add(coll.name);
  }
  for (const item of manifest.files) {
    if (!FILE_COLLECTIONS.includes(item.collection) || typeof item.version !== 'string'
        || item.path !== fileName(item.collection, EJSON.parse(item.id, { relaxed: false }), item.version)) {
      throw new Error('Invalid backup file record');
    }
  }
  for (const item of [...manifest.collections, ...manifest.files]) {
    if (expected.has(item.path) || !entries.has(item.path)) throw new Error('Missing or duplicate backup payload');
    expected.add(item.path);
    const actual = await digest(entries.get(item.path).stream());
    if (actual.size !== Number(item.size) || actual.sha256 !== item.sha256) {
      throw new Error('Backup checksum mismatch');
    }
  }
  if (expected.size !== entries.size) throw new Error('Unlisted backup payload');
  // Validate JSON, identities and selected file references before ANY mutation.
  const payloads = new Map(manifest.files.map(item => [item.path, item]));
  for (const coll of manifest.collections) {
    for await (const doc of readDocuments(entries.get(coll.path))) {
      if (!doc || !Object.hasOwn(doc, '_id')) throw new Error('Invalid backup document');
      verifyFileMetadata(doc, coll.name, manifest, payloads);
    }
  }
  return { manifest, entries };
}
async function* readDocuments(entry) {
  const input = entry.stream();
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  const failed = error => lines.close();
  input.on('error', failed);
  try {
    for await (const line of lines) {
      if (line.trim()) yield EJSON.parse(line, { relaxed: false });
    }
    if (input.errored) throw input.errored;
  } finally { lines.close(); input.destroy(); }
}
function relocate(doc, coll, files, root) {
  const versions = files.get(`${coll}\0${idKey(doc._id)}`);
  if (!versions) return doc;
  for (const item of versions) {
    const version = doc.versions && doc.versions[item.version];
    if (!version) throw new Error('File version missing from backup metadata');
    version.path = safeEntryPath(root, item.path.replace(/^files\//, ''));
    version.storage = 'fs';
    version.meta = { ...(version.meta || {}) };
    for (const key of ['gridFsFileId', 'cloudPath', 'cloudKey', 's3', 'azure', 'gcs']) delete version.meta[key];
    if (item.version === 'original') doc.path = version.path;
  }
  doc._storagePath = path.join(root, coll);
  return doc;
}
async function restoreInstanceBackup({ inspected, db, filesRoot, mode, progress = () => {} }) {
  if (!['add-missing', 'replace-all'].includes(mode)) throw new Error('Invalid restore mode');
  const { manifest, entries } = inspected;
  const files = new Map();
  const preserve = new Set();
  for (const item of manifest.files) {
    const key = `${item.collection}\0${item.id}`;
    if (!files.has(key)) {
      files.set(key, []);
      if (mode === 'add-missing' && await db.collection(item.collection).findOne({
        _id: EJSON.parse(item.id, { relaxed: false }),
      }, { projection: { _id: 1 } })) preserve.add(key);
    }
    files.get(key).push(item);
    // Retaining the existing metadata also retains its existing file content.
    if (preserve.has(key)) continue;
    const dest = prepareDestination(filesRoot, item.path.replace(/^files\//, ''));
    const temp = dest + `.restore-${crypto.randomUUID()}`;
    progress({ phase: item.collection, detail: item.path });
    try {
      await pipeline(entries.get(item.path).stream(), fs.createWriteStream(temp, { flags: 'wx', mode: 0o600 }));
      fs.renameSync(temp, dest);
    } finally { fs.rmSync(temp, { force: true }); }
  }
  for (const coll of manifest.collections) {
    progress({ phase: 'data', detail: `data: ${coll.name}` });
    const target = db.collection(coll.name);
    if (!(await db.listCollections({ name: coll.name }, { nameOnly: true }).hasNext())) {
      await db.createCollection(coll.name, coll.options || {});
    }
    if (mode === 'replace-all') await target.deleteMany({});
    for await (const original of readDocuments(entries.get(coll.path))) {
      const doc = relocate(original, coll.name, files, filesRoot);
      if (mode === 'add-missing') {
        // Only duplicate IDs mean "already present"; all other errors matter.
        if (await target.findOne({ _id: doc._id }, { projection: { _id: 1 } })) continue;
        await target.insertOne(doc);
      } else await target.replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
    for (const index of coll.indexes || []) {
      if (index.name === '_id_') continue;
      const { key, v, ns, ...options } = index;
      await target.createIndex(key, options);
    }
  }
  return { collections: manifest.collections.length, files: manifest.files.length };
}
return { appendInstanceBackup, inspectInstanceBackup, restoreInstanceBackup, collectionName };
}
module.exports = { ...createBackupTools(require('bson').EJSON), createBackupTools };
