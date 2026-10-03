'use strict';

// The target directory of continuous backup (docs/Backup/Continuous-Backup.md
// "Layout of the target directory"): generations, sealed segments listed in
// append-only indexes, and content-addressed blobs. No Meteor: the engines,
// the restore and tests/integration/continuousBackup.test.cjs share it.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream/promises');
const { FORMAT, VERSION, segmentName, indexLine, parseIndex, sha256, generationName, GENERATION_NAME } =
  require('../../../models/lib/continuousBackup');
const { deriveKey, keyCheck, newEncryptionHeader, cipherFor, PLAIN, MAGIC } = require('./encryption');

async function fsyncPath(file) {
  const handle = await fsp.open(file, 'r');
  try { await handle.sync(); } finally { await handle.close(); }
}
// Write, flush, rename, and flush the directory, so a crash leaves either the
// old file or the new one.
async function writeAtomic(file, data) {
  const partial = `${file}.partial`;
  const handle = await fsp.open(partial, 'w', 0o600);
  try { await handle.writeFile(data); await handle.sync(); } finally { await handle.close(); }
  await fsp.rename(partial, file);
  await fsyncPath(path.dirname(file)).catch(() => {});
}
async function appendLine(file, line) {
  const handle = await fsp.open(file, 'a', 0o600);
  try { await handle.write(`${line}\n`); await handle.sync(); } finally { await handle.close(); }
}
// Refuse a directory on the way that is a symbolic link: the stream never
// writes through one.
async function realDirectory(dir) {
  await fsp.mkdir(dir, { recursive: true, mode: 0o700 });
  const stat = await fsp.lstat(dir);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('A backup directory is not a plain directory');
  return dir;
}

// Open the target and say how its files are stored. `secret` is the
// content of the administrator's key file, or null. A stream that has a key
// is never opened without it, and a wrong key is refused by the check value
// before anything is decrypted. A key given to a stream that had none starts
// encrypting from its next generation; earlier ones stay as they were.
async function openStream(target, secret = null) {
  await realDirectory(target);
  const file = path.join(target, 'stream.json');
  let stream;
  try {
    stream = JSON.parse(await fsp.readFile(file, 'utf8'));
    if (stream.format !== FORMAT || stream.version !== VERSION) throw new Error('The target holds another kind of backup');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    stream = { format: FORMAT, version: VERSION, created: Date.now() };
    await writeAtomic(file, JSON.stringify(stream));
  }
  let cipher = PLAIN;
  if (secret !== null && secret !== undefined) {
    if (!stream.encryption) {
      stream.encryption = newEncryptionHeader();
      stream.encryption.check = keyCheck(deriveKey(secret, stream.encryption.salt));
      await writeAtomic(file, JSON.stringify(stream));
    }
    const key = deriveKey(secret, stream.encryption.salt);
    if (keyCheck(key) !== stream.encryption.check) {
      const error = new Error('The encryption key is not the key of this backup'); error.code = 'continuous-backup-key'; throw error;
    }
    cipher = cipherFor(key);
  }
  await realDirectory(path.join(target, 'generations'));
  await realDirectory(path.join(target, 'blobs'));
  return { target, cipher, encryptedStream: !!stream.encryption };
}
async function openTarget(target) { return (await openStream(target)).target; }

// The cipher a generation was written with: the stream's when it is
// encrypted, none otherwise. An encrypted generation needs the key.
function generationCipher(generation, cipher) {
  if (!generation.encrypted) return PLAIN;
  if (!cipher?.encrypted) { const error = new Error('This generation is encrypted; its key is needed'); error.code = 'continuous-backup-key'; throw error; }
  return cipher;
}

async function readState(target, cipher = PLAIN) {
  let data;
  try { data = await fsp.readFile(path.join(target, 'state.json')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
  if (data.subarray(0, MAGIC.length).equals(MAGIC)) {
    // A state written under a key cannot be read without it: start afresh
    // rather than guess, which begins a new generation.
    if (!cipher.encrypted) return {};
    data = cipher.decrypt(data);
  }
  return JSON.parse(data.toString('utf8'));
}
const writeState = (target, state, cipher = PLAIN) => writeAtomic(path.join(target, 'state.json'), cipher.encrypt(Buffer.from(JSON.stringify(state))));

async function createGeneration(target, meta) {
  const name = generationName(new Date(), crypto.randomBytes(6).toString('hex'));
  const dir = await realDirectory(path.join(target, 'generations', name));
  await writeAtomic(path.join(dir, 'generation.json'), JSON.stringify({ name, started: Date.now(), ...meta }));
  return { name, dir };
}
function generationDir(target, name) {
  if (!GENERATION_NAME.test(name)) throw new Error('Invalid generation');
  return path.join(target, 'generations', name);
}
async function readGeneration(target, name) {
  const dir = generationDir(target, name);
  const meta = JSON.parse(await fsp.readFile(path.join(dir, 'generation.json'), 'utf8'));
  if (meta.name !== name) throw new Error('Generation file does not match its directory');
  return { ...meta, dir };
}
async function updateGeneration(target, name, changes) {
  const meta = await readGeneration(target, name);
  const { dir, ...rest } = meta;
  await writeAtomic(path.join(dir, 'generation.json'), JSON.stringify({ ...rest, ...changes }));
}
async function listGenerations(target) {
  let names = [];
  try { names = await fsp.readdir(path.join(target, 'generations')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const result = [];
  for (const name of names.filter(n => GENERATION_NAME.test(n)).sort()) {
    try { result.push(await readGeneration(target, name)); } catch (error) { /* an unreadable generation is not a restore point */ }
  }
  return result;
}

// A stream of records cut into sealed segments under `dir` (db/, files/,
// sqlite/<name>/). Records wait in memory until seal(); a segment is written
// whole, flushed, renamed and only then listed, so a reader sees complete
// segments only. `times` gives each record's time in milliseconds.
class SegmentLog {
  constructor(dir, extension = 'ndjson', cipher = PLAIN) { this.dir = dir; this.extension = extension; this.cipher = cipher; this.pending = []; this.next = null; }
  async open() {
    await realDirectory(this.dir);
    for (const name of await fsp.readdir(this.dir)) if (name.endsWith('.partial')) await fsp.rm(path.join(this.dir, name), { force: true });
    this.next = (await this.entries()).length + 1;
    return this;
  }
  async entries() {
    try { return parseIndex(await fsp.readFile(path.join(this.dir, 'index.ndjson'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }
  push(record, time) { this.pending.push({ record, time }); }
  get size() { return this.pending.length; }
  // Seal the waiting records as one NDJSON segment.
  async seal() {
    if (!this.pending.length) return null;
    const rows = this.pending; this.pending = [];
    const data = Buffer.from(rows.map(row => `${JSON.stringify({ t: row.time, ...row.record })}\n`).join(''));
    const times = rows.map(row => row.time);
    return this.write(data, Math.min(...times), Math.max(...times), rows.length);
  }
  // Seal one binary segment (a page delta) seen at `time`.
  async writeBinary(data, time, count) { return this.write(data, time, time, count); }
  // The index checksums the bytes as stored, so a changed byte is found
  // before anything is decrypted.
  async write(plain, first, last, count) {
    const data = this.cipher.encrypt(plain);
    const seq = this.next;
    const file = `${segmentName(seq)}.${this.extension}`;
    await writeAtomic(path.join(this.dir, file), data);
    await appendLine(path.join(this.dir, 'index.ndjson'), indexLine({ seq, file, sha256: sha256(data), bytes: data.length, first, last, count }));
    this.next = seq + 1;
    return { seq, file };
  }
}

// File contents, once, under their SHA-256. Returns the hash and size of what
// was read; a file that changed while it was read is stored as read.
async function putBlob(target, source, cipher = PLAIN) {
  const temp = path.join(target, 'blobs', `.incoming-${crypto.randomBytes(8).toString('hex')}`);
  const hash = crypto.createHash('sha256');
  let size = 0;
  const input = fs.createReadStream(source, { flags: fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0) });
  input.on('data', chunk => { hash.update(chunk); size += chunk.length; });
  try {
    await pipeline(input, ...(cipher.encrypted ? [cipher.encryptStream()] : []), fs.createWriteStream(temp, { mode: 0o600 }));
    const digest = hash.digest('hex');
    const name = cipher.blobName(digest);
    const dir = await realDirectory(path.join(target, 'blobs', name.slice(0, 2)));
    const file = path.join(dir, name);
    if (fs.existsSync(file)) await fsp.rm(temp, { force: true });
    else { await fsyncPath(temp); await fsp.rename(temp, file); }
    return { sha256: digest, size };
  } catch (error) {
    await fsp.rm(temp, { force: true });
    throw error;
  }
}
const blobPath = (target, digest, cipher = PLAIN) => {
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error('Invalid blob');
  const name = cipher.blobName(digest);
  return path.join(target, 'blobs', name.slice(0, 2), name);
};

module.exports = { openTarget, openStream, generationCipher, readState, writeState, createGeneration, readGeneration, updateGeneration,
  listGenerations, generationDir, SegmentLog, putBlob, blobPath, writeAtomic, realDirectory };
