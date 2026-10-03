'use strict';

// The oplog engine of continuous backup (docs/Backup/Continuous-Backup.md):
// a base archive, then every change to WeKan's database as a whole document
// or a deletion, read from `local.oplog.rs` - the same source Meteor's oplog
// driver reads - and sealed into segments every few seconds. No Meteor: the
// manager passes the driver's client, its EJSON and the ZIP writer.
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { SegmentLog, writeAtomic, updateGeneration } = require('./store');
const { PLAIN } = require('./encryption');
const { oplogMillis } = require('../../../models/lib/continuousBackup');

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SEAL_RECORDS = 5000;

class OplogEngine {
  // `Timestamp` and `EJSON` come from the BSON the driver itself uses: BSON
  // values of two versions do not mix. A position is saved as { t, i }.
  constructor({ client, dbName, target, generation, EJSON, Timestamp, ZipArchive, appendInstanceBackup, sealMs = 2000,
    onError = () => {}, onPosition = async () => {}, cipher = PLAIN }) {
    Object.assign(this, { client, dbName, target, generation, EJSON, Timestamp, ZipArchive, appendInstanceBackup, sealMs, onError, onPosition, cipher });
    this.db = client.db(dbName);
    this.oplog = client.db('local').collection('oplog.rs');
    this.stopped = false;
    this.position = null;
    this.stats = { records: 0, segments: 0, lastChangeAt: null, lastSealAt: null };
  }

  // Whether this server keeps an oplog WeKan can read.
  static async available(client) {
    try { return !!await client.db('local').collection('oplog.rs').findOne({}, { projection: { ts: 1 } }); }
    catch (error) { return false; }
  }

  async newestPosition() {
    const newest = await this.oplog.find({}, { projection: { ts: 1 } }).sort({ $natural: -1 }).limit(1).next();
    if (!newest) throw new Error('The oplog is empty');
    return newest.ts;
  }

  // Is `ts` still in the oplog? If the oldest entry is newer, changes were
  // lost and the generation cannot continue.
  async stillAvailable(position) {
    const oldest = await this.oplog.find({}, { projection: { ts: 1 } }).sort({ $natural: 1 }).limit(1).next();
    return !!oldest && oldest.ts.compare(this.timestamp(position)) <= 0;
  }
  timestamp(position) { return new this.Timestamp({ t: position.t, i: position.i }); }
  static saved(ts) { return { t: ts.high, i: ts.low }; }

  // The base: the oplog's end noted FIRST, then the live-sequential archive.
  // Every change from that point on is replayed after it, so the restored
  // state converges however long the archive took.
  async writeBase() {
    const start = await this.newestPosition();
    const file = path.join(this.generation.dir, 'base.zip');
    const partial = `${file}.partial`;
    const archive = new this.ZipArchive({ zlib: { level: 6 } });
    const out = fs.createWriteStream(partial, { flags: 'w', mode: 0o600 });
    // Encrypted on its way to the file when the stream has a key.
    const done = pipeline(archive, ...(this.cipher.encrypted ? [this.cipher.encryptStream()] : []), out);
    done.catch(() => {});
    // Database only: the file streams carry the bytes of filesystem files.
    await this.appendInstanceBackup({ archive, db: this.db, opts: { data: true, attachments: false, avatars: false },
      readFileVersion: async () => null });
    await archive.finalize();
    await done;
    const handle = await fs.promises.open(partial, 'r');
    try { await handle.sync(); } finally { await handle.close(); }
    await fs.promises.rename(partial, file);
    await updateGeneration(this.target, this.generation.name, { base: 'complete', baseFrom: OplogEngine.saved(start) });
    return start;
  }

  async start(position) {
    this.log = await new SegmentLog(path.join(this.generation.dir, 'db'), 'ndjson', this.cipher).open();
    this.position = position ? this.timestamp(position) : await this.writeBase();
    await this.onPosition(OplogEngine.saved(this.position));
    this.timer = setInterval(() => { this.seal().catch(this.onError); }, this.sealMs);
    this.loop = this.tail();
    return this;
  }

  async stop() {
    this.stopped = true;
    clearInterval(this.timer);
    try { await this.cursor?.close(); } catch (error) { /* closing a dead cursor */ }
    await this.loop?.catch(() => {});
    await this.seal();
  }

  // Seal what is waiting, then remember the position, so a restart never
  // skips a change that is not yet in a segment.
  async seal() {
    if (this.sealing) return this.sealing;
    this.sealing = (async () => {
      const position = this.pendingPosition;
      const sealed = await this.log.seal();
      if (sealed) { this.stats.segments += 1; this.stats.lastSealAt = Date.now(); }
      if (position) { this.position = position; await this.onPosition(OplogEngine.saved(position)); }
    })().finally(() => { this.sealing = null; });
    return this.sealing;
  }

  serialize(value) { return this.EJSON.serialize({ v: value }, { relaxed: false }).v; }

  async record(entry) {
    const [db, ...rest] = (entry.ns || '').split('.');
    const collection = rest.join('.');
    if (entry.op === 'c' && entry.o?.applyOps) {
      // A transaction: its operations, each in its own namespace.
      for (const inner of entry.o.applyOps) await this.record({ ...inner, ts: entry.ts });
      return;
    }
    if (db !== this.dbName || !collection || collection.startsWith('system.')) return;
    const time = oplogMillis(entry.ts);
    if (entry.op === 'i') this.log.push({ op: 'put', c: collection, d: this.serialize(entry.o) }, time);
    else if (entry.op === 'd') this.log.push({ op: 'del', c: collection, id: this.serialize(entry.o._id) }, time);
    else if (entry.op === 'u') {
      // The whole document as it is now: a restore never interprets an update.
      const id = entry.o2?._id;
      const doc = await this.db.collection(collection).findOne({ _id: id });
      this.log.push(doc ? { op: 'put', c: collection, d: this.serialize(doc) } : { op: 'del', c: collection, id: this.serialize(id) }, time);
    } else if (entry.op === 'c' && entry.o?.drop) {
      this.log.push({ op: 'drop', c: entry.o.drop }, time);
    } else if (entry.op === 'c' && entry.o?.dropDatabase) {
      this.log.push({ op: 'dropDatabase' }, time);
    } else return;
    this.stats.records += 1; this.stats.lastChangeAt = Date.now();
    if (this.log.size >= SEAL_RECORDS) await this.seal();
  }

  async tail() {
    let backoff = 500;
    while (!this.stopped) {
      try {
        const from = this.pendingPosition || this.position;
        // No noCursorTimeout: FerretDB refuses it, and a tail that asks again
        // every second never idles out; one that does is reopened below.
        this.cursor = this.oplog.find({ ts: { $gt: from },
          $or: [{ ns: { $regex: `^${escapeRegExp(this.dbName)}\\.` } }, { ns: 'admin.$cmd' }] },
        { tailable: true, awaitData: true, maxAwaitTimeMS: 1000 });
        for await (const entry of this.cursor) {
          if (this.stopped) break;
          await this.record(entry);
          this.pendingPosition = entry.ts;
          backoff = 500;
        }
      } catch (error) {
        if (this.stopped) break;
        this.onError(error);
      }
      if (!this.stopped) await new Promise(resolve => setTimeout(resolve, backoff));
      backoff = Math.min(backoff * 2, 30000);
    }
  }

  status() { return { engine: 'oplog', position: this.position ? OplogEngine.saved(this.position) : null, pending: this.log?.size || 0, ...this.stats }; }
}

module.exports = { OplogEngine, writeAtomic };
