'use strict';

// The file streams of continuous backup (docs/Backup/Continuous-Backup.md
// "Files and logs"): attachments, avatars and logs. File watching notices a
// change within a second or two; a full rescan at the scan interval catches
// what watching misses (network filesystems). A file whose size or
// modification time changed is stored once under its SHA-256 and recorded as
// a put; a file that went away is recorded as a delete. Symbolic links are
// skipped, never followed.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { SegmentLog, putBlob } = require('./store');
const { PLAIN } = require('./encryption');

// Every regular file under `root` (or `root` itself, when it is a file), as
// { relative: stat }. Relative paths always use '/'. The configured root is
// followed - an attachments directory may be a link to another disk on
// purpose - but no link below it is.
async function walk(root) {
  const files = new Map();
  let stat;
  try { stat = await fsp.stat(root); } catch (error) { if (error.code === 'ENOENT') return files; throw error; }
  if (stat.isFile()) { files.set(path.basename(root), stat); return files; }
  if (!stat.isDirectory()) return files;
  const visit = async (dir, prefix) => {
    let entries;
    try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const full = path.join(dir, entry.name);
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(full, relative);
      else if (entry.isFile()) {
        try { files.set(relative, await fsp.lstat(full)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
    }
  };
  await visit(root, '');
  return files;
}
// Where a source's relative path is on disk: a directory source joins it, a
// single-file source is the file itself.
const sourceFile = (source, relative) => (source.file ? source.path : path.join(source.path, ...relative.split('/')));

class FileEngine {
  // `sources`: [{ area, key, path, file }] - `key` names the source within
  // its area ('attachments', 'logs', 'recovery-events.jsonl', ...).
  constructor({ sources, target, generation, scanMs = 300000, sealMs = 2000, state = {}, onError = () => {}, onState = async () => {}, watch = true, cipher = PLAIN }) {
    Object.assign(this, { sources, target, generation, scanMs, sealMs, onError, onState, watchEnabled: watch, cipher });
    this.known = new Map(Object.entries(state.known || {}));
    this.stats = { puts: 0, deletes: 0, bytes: 0, lastChangeAt: null, lastScanAt: null };
    this.watchers = [];
    this.dirty = new Set();
  }
  static entryKey(source, relative) { return `${source.area}\0${source.key}\0${relative}`; }

  async start() {
    this.log = await new SegmentLog(path.join(this.generation.dir, 'files'), 'ndjson', this.cipher).open();
    await this.scan();
    this.scanTimer = setInterval(() => { this.scan().catch(this.onError); }, this.scanMs);
    this.sealTimer = setInterval(() => { this.flushDirty().catch(this.onError); }, this.sealMs);
    if (this.watchEnabled) for (const source of this.sources) this.watch(source);
    return this;
  }
  async stop() {
    clearInterval(this.scanTimer); clearInterval(this.sealTimer);
    for (const watcher of this.watchers) watcher.close();
    await this.busy?.catch(() => {});
    await this.flushDirty();
  }

  watch(source) {
    try {
      const target = source.file ? path.dirname(source.path) : source.path;
      if (!fs.existsSync(target)) return;
      const watcher = fs.watch(target, { recursive: !source.file, persistent: false }, (event, name) => {
        if (!name) { this.scan().catch(this.onError); return; }
        const relative = String(name).split(path.sep).join('/');
        if (source.file && relative !== path.basename(source.path)) return;
        this.dirty.add(JSON.stringify([this.sources.indexOf(source), source.file ? path.basename(source.path) : relative]));
      });
      watcher.on('error', this.onError);
      this.watchers.push(watcher);
    } catch (error) { this.onError(error); }
  }

  // One serial queue: a scan and a watched change never record the same
  // file twice at once.
  queue(work) {
    const run = (this.busy || Promise.resolve()).catch(() => {}).then(work);
    this.busy = run.finally(() => { if (this.busy === run) this.busy = null; });
    return run;
  }

  flushDirty() {
    return this.queue(async () => {
      const items = [...this.dirty]; this.dirty.clear();
      for (const item of items) {
        const [index, relative] = JSON.parse(item);
        const source = this.sources[index];
        let stat = null;
        try { stat = await fsp.lstat(sourceFile(source, relative)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
        // A directory's own event: rescan below it on the next scan.
        if (stat && !stat.isFile()) continue;
        await this.observe(source, relative, stat);
      }
      await this.seal();
    });
  }

  scan() {
    return this.queue(async () => {
      const seen = new Set();
      for (const source of this.sources) {
        const files = await walk(source.path);
        for (const [relative, stat] of files) {
          seen.add(FileEngine.entryKey(source, relative));
          await this.observe(source, relative, stat);
        }
      }
      for (const [key] of this.known) if (!seen.has(key)) {
        const [area, sourceKey, relative] = key.split('\0');
        const source = this.sources.find(s => s.area === area && s.key === sourceKey);
        // A source no longer configured is not a deletion of its files.
        if (source) await this.observe(source, relative, null);
      }
      this.stats.lastScanAt = Date.now();
      await this.seal();
    });
  }

  async observe(source, relative, stat) {
    const key = FileEngine.entryKey(source, relative);
    const before = this.known.get(key);
    if (!stat) {
      if (!before) return;
      this.known.delete(key); this.changed = true;
      this.log.push({ op: 'delete', area: source.area, source: source.key, path: relative }, Date.now());
      this.stats.deletes += 1; this.stats.lastChangeAt = Date.now();
      return;
    }
    if (before && before.size === stat.size && before.mtimeMs === stat.mtimeMs) return;
    let blob;
    try { blob = await putBlob(this.target, sourceFile(source, relative), this.cipher); }
    catch (error) {
      // Gone, or became a link, between the listing and the read: the next
      // scan sees what it is now.
      if (['ENOENT', 'ELOOP', 'EISDIR'].includes(error.code)) return;
      throw error;
    }
    this.changed = true;
    if (before && before.sha256 === blob.sha256) { this.known.set(key, { ...before, size: stat.size, mtimeMs: stat.mtimeMs }); return; }
    this.known.set(key, { size: stat.size, mtimeMs: stat.mtimeMs, sha256: blob.sha256 });
    this.log.push({ op: 'put', area: source.area, source: source.key, path: relative, sha256: blob.sha256,
      size: blob.size, mtimeMs: stat.mtimeMs }, Date.now());
    this.stats.puts += 1; this.stats.bytes += blob.size; this.stats.lastChangeAt = Date.now();
  }

  // Seal, then save what is known: a restart never loses a recorded change.
  async seal() {
    if (!this.changed && !this.log.size) return;
    await this.log.seal();
    await this.onState({ known: Object.fromEntries(this.known) });
    this.changed = false;
  }

  status() { return { files: this.known.size, sources: this.sources.map(s => ({ area: s.area, key: s.key })), ...this.stats }; }
}

module.exports = { FileEngine, walk };
