'use strict';

// Cloud upload of continuous backup (maintainer decision of 2026-10-03,
// docs/Backup/Continuous-Backup.md "Cloud upload"): the target directory
// mirrored to S3/MinIO, Azure or GCS with the credentials of the Admin Panel /
// Attachments storage panes. Sealed segments, bases and blobs never change,
// so each is uploaded once; an index or a generation file that grew is
// uploaded again, always AFTER the files it names, so the remote copy never
// lists a segment it does not hold. What retention removed here is removed
// there. An encrypted stream uploads only encrypted bytes. No Meteor: the
// remote is passed in, so tests use a directory and the server an adapter.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { writeAtomic } = require('./store');

// Local files that are never uploaded: temporary ones, restores in
// progress, the per-server state and the upload record itself.
const SKIP = /(^|\/)(restore|state\.json|upload\.json|litestream\.yml)(\/|$)|\.partial(-|$)|(^|\/)\.incoming-|(^|\/)\.image-/;
// Rewritten in place, so uploaded last and again when they change.
const MUTABLE = /(^|\/)(index\.ndjson|generation\.json|stream\.json)$/;

async function listLocal(target) {
  const files = new Map();
  const visit = async (dir, prefix) => {
    let entries;
    try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (SKIP.test(relative) || entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await visit(path.join(dir, entry.name), relative);
      else if (entry.isFile()) {
        const stat = await fsp.stat(path.join(dir, entry.name));
        files.set(relative, { size: stat.size, mtimeMs: stat.mtimeMs });
      }
    }
  };
  await visit(target, '');
  return files;
}
// A remote key is the prefix and the relative path, nothing that walks out.
function remoteKey(prefix, relative) {
  if (relative.split('/').some(part => !part || part === '.' || part === '..') || relative.includes('\\') || relative.includes('\0')) {
    throw new Error('Unsafe backup path');
  }
  return `${prefix}/${relative}`;
}
function checkPrefix(prefix) {
  if (typeof prefix !== 'string' || !/^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(prefix) || prefix.split('/').some(p => p === '.' || p === '..')) {
    throw new Error('Invalid upload prefix');
  }
  return prefix;
}

class CloudMirror {
  // remote: { put(key, file), get(key, file), remove(key), list(prefix) -> [key] }
  constructor({ target, remote, prefix, intervalMs = 10000, onError = () => {} }) {
    Object.assign(this, { target, remote, prefix: checkPrefix(prefix), intervalMs, onError });
    this.stats = { uploads: 0, bytes: 0, removals: 0, lastUploadAt: null, lastRunAt: null, pending: 0 };
  }
  async loadRecord() {
    try { this.uploaded = new Map(Object.entries(JSON.parse(await fsp.readFile(path.join(this.target, 'upload.json'), 'utf8')))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; this.uploaded = new Map(); }
  }
  saveRecord() { return writeAtomic(path.join(this.target, 'upload.json'), JSON.stringify(Object.fromEntries(this.uploaded))); }

  async start() {
    await this.loadRecord();
    this.timer = setInterval(() => { this.run().catch(this.onError); }, this.intervalMs);
    this.run().catch(this.onError);
    return this;
  }
  async stop() { clearInterval(this.timer); await this.running?.catch(() => {}); }

  run() {
    if (this.running) return this.running;
    this.running = this.sync().finally(() => { this.running = null; this.stats.lastRunAt = Date.now(); });
    return this.running;
  }

  async sync() {
    if (!this.uploaded) await this.loadRecord();
    const local = await listLocal(this.target);
    const changed = [...local].filter(([relative, info]) => {
      const done = this.uploaded.get(relative);
      return !done || done.size !== info.size || done.mtimeMs !== info.mtimeMs;
    });
    // Contents first, then the files that name them.
    changed.sort(([a], [b]) => Number(MUTABLE.test(a)) - Number(MUTABLE.test(b)) || a.localeCompare(b));
    this.stats.pending = changed.length;
    for (const [relative, info] of changed) {
      await this.remote.put(remoteKey(this.prefix, relative), path.join(this.target, ...relative.split('/')));
      this.uploaded.set(relative, info);
      this.stats.uploads += 1; this.stats.bytes += info.size; this.stats.lastUploadAt = Date.now();
      this.stats.pending -= 1;
      // Record as it goes: a restart never uploads a sealed file twice.
      if (this.stats.uploads % 50 === 0) await this.saveRecord();
    }
    // Gone here (retention), so gone there: the files that name others
    // first, so no remote index names a file already removed.
    const gone = [...this.uploaded.keys()].filter(relative => !local.has(relative))
      .sort((a, b) => Number(MUTABLE.test(b)) - Number(MUTABLE.test(a)) || a.localeCompare(b));
    for (const relative of gone) {
      await this.remote.remove(remoteKey(this.prefix, relative));
      this.uploaded.delete(relative);
      this.stats.removals += 1;
    }
    if (changed.length || gone.length) await this.saveRecord();
  }

  status() { return { prefix: this.prefix, files: this.uploaded?.size || 0, ...this.stats }; }
}

// Bring the stream back from the cloud into an empty or partial target, so
// a lost disk can still be restored. Files already here are kept.
async function fetchFromCloud({ target, remote, prefix }) {
  checkPrefix(prefix);
  let fetched = 0;
  for (const key of await remote.list(`${prefix}/`)) {
    if (!key.startsWith(`${prefix}/`)) continue;
    const relative = key.slice(prefix.length + 1);
    remoteKey(prefix, relative);
    if (SKIP.test(relative)) continue;
    const file = path.join(target, ...relative.split('/'));
    if (fs.existsSync(file)) continue;
    await fsp.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const temp = `${file}.partial-fetch`;
    try { await remote.get(key, temp); await fsp.rename(temp, file); } finally { await fsp.rm(temp, { force: true }); }
    fetched += 1;
  }
  return { fetched };
}

// The remote interface over a storage-abstraction adapter (the
// @tweedegolf/sab-adapter-* packages the attachment storages use), whose
// calls answer { value, error } instead of throwing.
function adapterRemote(storage, bucketName) {
  const ok = result => { if (!result || result.error) throw new Error(result?.error || 'Cloud storage did not answer'); return result.value; };
  return {
    put: async (key, file) => ok(await storage.addFileFromStream({ bucketName, targetPath: key, stream: fs.createReadStream(file) })),
    get: async (key, file) => {
      const stream = ok(await storage.getFileAsStream(bucketName, key));
      await pipeline(stream, fs.createWriteStream(file, { flags: 'wx', mode: 0o600 }));
    },
    remove: async key => ok(await storage.removeFile(bucketName, key)),
    // The adapters list the whole bucket (10,000 names unless told more).
    list: async prefix => (ok(await storage.listFiles(bucketName, 10000000)) || []).map(entry => (Array.isArray(entry) ? entry[0] : entry?.name || entry))
      .filter(name => typeof name === 'string' && name.startsWith(prefix)),
  };
}

module.exports = { CloudMirror, fetchFromCloud, adapterRemote, listLocal, remoteKey, checkPrefix };
