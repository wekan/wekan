'use strict';

// The SQLite page engine of continuous backup (docs/Backup/Continuous-Backup.md):
// at every interval a consistent image of each database file through SQLite's
// online backup API (node:sqlite, safe while FerretDB writes in WAL mode),
// compared page by page with the previous image; only the changed pages are
// stored. Restore applies the base and the deltas up to a moment, and checks
// the result with PRAGMA quick_check.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { SegmentLog, writeAtomic, realDirectory } = require('./store');
const { PLAIN } = require('./encryption');
const { sqlitePageSize, diffImage } = require('../../../models/lib/continuousBackup');

function nodeSqlite() {
  try {
    const sqlite = require('node:sqlite');
    return typeof sqlite.backup === 'function' ? sqlite : null;
  } catch (error) { return null; }
}

// The database files of a FerretDB SQLite directory: one <db>.sqlite per
// database, without the oplog's local.sqlite, which a restore must not bring
// back (snap-src/bin/ferretdb-control resets it on purpose).
async function sqliteFiles(dir) {
  if (!dir) return [];
  let names;
  try { names = await fsp.readdir(dir); } catch (error) { return []; }
  const files = [];
  for (const name of names.filter(n => /^[A-Za-z0-9_-]+\.sqlite$/.test(n) && n !== 'local.sqlite').sort()) {
    const stat = await fsp.lstat(path.join(dir, name));
    if (stat.isFile()) files.push(path.join(dir, name));
  }
  return files;
}

// A consistent copy of `file` at `out`, while it is being written.
async function consistentImage(file, out) {
  const sqlite = nodeSqlite();
  if (!sqlite) throw new Error('node:sqlite with backup() is not available');
  const source = new sqlite.DatabaseSync(file, { readOnly: true });
  try { await sqlite.backup(source, out); } finally { source.close(); }
  return fsp.readFile(out);
}

class SqliteEngine {
  constructor({ files, target, generation, intervalMs = 60000, onError = () => {}, onState = async () => {}, state = {}, cipher = PLAIN }) {
    Object.assign(this, { files, target, generation, intervalMs, onError, onState, cipher });
    this.hashes = state.hashes || {};
    this.stats = { deltas: 0, pages: 0, lastChangeAt: null, lastRunAt: null };
  }
  static available() { return !!nodeSqlite(); }

  async start() {
    this.logs = {};
    for (const file of this.files) {
      const name = path.basename(file, '.sqlite');
      const dir = await realDirectory(path.join(this.generation.dir, 'sqlite', name));
      this.logs[name] = await new SegmentLog(dir, 'pages', this.cipher).open();
    }
    await this.run();
    this.timer = setInterval(() => { this.run().catch(this.onError); }, this.intervalMs);
    return this;
  }
  async stop() { clearInterval(this.timer); await this.running?.catch(() => {}); }

  run() {
    if (this.running) return this.running;
    this.running = (async () => {
      for (const file of this.files) await this.capture(file);
      this.stats.lastRunAt = Date.now();
      await this.onState({ hashes: this.hashes });
    })().finally(() => { this.running = null; });
    return this.running;
  }

  async capture(file) {
    const name = path.basename(file, '.sqlite');
    const dir = path.join(this.generation.dir, 'sqlite', name);
    const temp = path.join(dir, `.image-${crypto.randomBytes(6).toString('hex')}`);
    try {
      const image = await consistentImage(file, temp);
      const pageSize = sqlitePageSize(image);
      const base = path.join(dir, 'base.sqlite');
      if (!fs.existsSync(base)) {
        // The first image is the base; its hashes are the comparison point.
        await writeAtomic(base, this.cipher.encrypt(image));
        this.hashes[name] = diffImage([], image, pageSize).hashes;
        return;
      }
      const { hashes, pages, delta } = diffImage(this.hashes[name] || [], image, pageSize);
      const shrank = hashes.length !== (this.hashes[name] || []).length;
      if (!pages.length && !shrank) return;
      await this.logs[name].writeBinary(delta, Date.now(), pages.length);
      this.hashes[name] = hashes;
      this.stats.deltas += 1; this.stats.pages += pages.length; this.stats.lastChangeAt = Date.now();
    } finally { await fsp.rm(temp, { force: true }); }
  }

  status() { return { engine: 'sqlite', files: this.files.map(f => path.basename(f)), ...this.stats }; }
}

// Check a rebuilt image the way FerretDB's check-sqlite does.
function quickCheck(file) {
  const sqlite = nodeSqlite();
  if (!sqlite) throw new Error('node:sqlite is not available');
  const db = new sqlite.DatabaseSync(file, { readOnly: true });
  try { return db.prepare('PRAGMA quick_check').all().map(row => Object.values(row)[0]); } finally { db.close(); }
}

module.exports = { SqliteEngine, sqliteFiles, consistentImage, quickCheck, nodeSqlite };
