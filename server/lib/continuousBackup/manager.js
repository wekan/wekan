'use strict';

// Runs continuous backup (docs/Backup/Continuous-Backup.md): chooses the
// database engine this server can run, keeps one generation going with its
// engines, starts a new generation when the current one is old enough or its
// oplog position was lost, removes generations past the retention, and keeps
// the status the Admin Panel pane shows. No Meteor: server/continuousBackup.js
// passes the database client and the backup tools.
const fs = require('node:fs');
const path = require('node:path');
const { chooseEngine, generationsToRemove } = require('../../../models/lib/continuousBackup');
const store = require('./store');
const { OplogEngine } = require('./oplog');
const { SqliteEngine, sqliteFiles } = require('./sqlite');
const { FileEngine } = require('./files');
const { LitestreamEngine } = require('./litestream');
const { readKeyFile, PLAIN } = require('./encryption');
const { CloudMirror } = require('./cloud');

const ROTATE_CHECK_MS = 10 * 60 * 1000;

// What this server can stream: the file sources, and the SQLite directory.
function backupSources({ filesRoot, writablePath, sqliteDir, settings }) {
  const sources = [];
  if (settings.attachments) sources.push({ area: 'attachments', key: 'attachments', path: path.join(filesRoot, 'attachments') });
  if (settings.avatars) sources.push({ area: 'avatars', key: 'avatars', path: path.join(filesRoot, 'avatars') });
  if (settings.logs) {
    for (const name of ['logs', 'log']) sources.push({ area: 'logs', key: name, path: path.join(writablePath, name) });
    if (sqliteDir) sources.push({ area: 'logs', key: 'recovery-events.jsonl', path: path.join(sqliteDir, 'recovery-events.jsonl'), file: true });
  }
  return sources;
}
// Every directory the stream may read, whatever is selected: the target may
// overlap none of them.
function readDirectories({ filesRoot, writablePath, sqliteDir }) {
  return [path.join(filesRoot, 'attachments'), path.join(filesRoot, 'avatars'), path.join(writablePath, 'logs'),
    path.join(writablePath, 'log'), sqliteDir].filter(Boolean);
}

class ContinuousBackupManager {
  constructor(deps) {
    // deps: client, dbName, EJSON, Timestamp, ZipArchive, appendInstanceBackup,
    // filesRoot, writablePath, sqliteDir, onProblem(key, error)
    this.deps = deps;
    this.engines = {};
    this.errors = [];
    this.running = false;
    this.queue = Promise.resolve();
  }

  // One change at a time: saving settings twice quickly never runs two streams.
  serial(work) {
    const run = this.queue.catch(() => {}).then(work);
    this.queue = run.catch(() => {});
    return run;
  }

  error(source, error) {
    const entry = { source, message: String(error?.message || error).slice(0, 500), at: Date.now() };
    this.errors.push(entry); this.errors.splice(0, Math.max(0, this.errors.length - 20));
    try { this.deps.onProblem?.(source, error); } catch (e) { /* reporting must never stop the stream */ }
  }

  async availability(settings) {
    const sqlite = await sqliteFiles(this.deps.sqliteDir);
    return { oplog: await OplogEngine.available(this.deps.client), sqliteFiles: sqlite, nodeSqlite: SqliteEngine.available(),
      litestream: LitestreamEngine.available(settings.litestreamBinary) };
  }

  apply(settings) { return this.serial(async () => { await this.stopEngines(); if (settings.enabled) await this.startEngines(settings); }); }
  stop() { return this.serial(() => this.stopEngines()); }

  // The stream's cipher for these settings: its key read from the key file
  // when encryption is on (the restore needs it too).
  async openStream(settings) {
    const secret = settings.encrypt ? await readKeyFile(settings.encryptionKeyFile) : null;
    return store.openStream(settings.target, secret);
  }

  async startEngines(settings) {
    this.settings = settings;
    const { target, cipher } = await this.openStream(settings);
    this.cipher = cipher;
    this.state = await store.readState(target, cipher);
    const available = await this.availability(settings);
    const chosen = settings.database ? chooseEngine(settings.engine, available) : { engine: null, reasons: {} };
    this.choice = chosen;
    if (settings.database && !chosen.engine) this.error('database', new Error(`No database engine can run: ${JSON.stringify(chosen.reasons)}`));
    const generation = await this.currentGeneration(target, settings, chosen.engine);
    this.generation = generation;
    const saveState = changes => this.saveState(changes);
    const dbEngine = chosen.engine;
    if (dbEngine === 'oplog') {
      this.engines.db = await new OplogEngine({ ...this.deps, target, generation, cipher, onError: e => this.error('oplog', e),
        onPosition: position => saveState({ oplog: position }) }).start(this.state.generation === generation.name ? this.state.oplog : null);
    } else if (dbEngine === 'sqlite') {
      this.engines.db = await new SqliteEngine({ files: available.sqliteFiles, target, generation, cipher, intervalMs: settings.sqliteIntervalSeconds * 1000,
        state: this.state.generation === generation.name ? this.state.sqlite || {} : {},
        onError: e => this.error('sqlite', e), onState: sqlite => saveState({ sqlite }) }).start();
    } else if (dbEngine === 'litestream') {
      this.engines.db = await new LitestreamEngine({ binary: settings.litestreamBinary, files: available.sqliteFiles,
        replicaUrl: settings.litestreamReplicaUrl, target, onError: e => this.error('litestream', e) }).start();
    }
    const sources = backupSources({ ...this.deps, settings });
    if (sources.length) {
      this.engines.files = await new FileEngine({ sources, target, generation, cipher, scanMs: settings.fileScanSeconds * 1000,
        state: this.state.generation === generation.name ? this.state.files || {} : {},
        onError: e => this.error('files', e), onState: files => saveState({ files }) }).start();
    }
    // Last, so it stops last: what the engines sealed is uploaded.
    if (settings.upload && settings.upload !== 'none') {
      const remote = this.deps.cloudRemote?.(settings.upload);
      if (!remote) this.error('upload', new Error(`The ${settings.upload} storage is not configured in Admin Panel / Attachments`));
      else {
        this.engines.cloud = await new CloudMirror({ target, remote, prefix: settings.uploadPrefix,
          onError: e => this.error('upload', e) }).start();
      }
    }
    await store.updateGeneration(target, generation.name, { complete: true });
    await this.saveState({ generation: generation.name });
    this.running = true;
    this.rotateTimer = setInterval(() => { this.maintain().catch(e => this.error('maintenance', e)); }, ROTATE_CHECK_MS);
    await this.prune();
  }

  // The generation to continue, or a new one: when there is none, when it is
  // older than the base interval, when the engine changed, or when the oplog
  // no longer holds its position.
  async currentGeneration(target, settings, engine) {
    const name = this.state.generation;
    if (name) {
      try {
        const generation = await store.readGeneration(target, name);
        const young = Date.now() - generation.started < settings.baseEveryHours * 3600000;
        let continuable = young && (generation.engine || null) === engine && !!generation.encrypted === this.cipher.encrypted;
        if (continuable && engine === 'oplog') {
          continuable = !!this.state.oplog && await new OplogEngine({ ...this.deps, target, generation }).stillAvailable(this.state.oplog);
          if (!continuable) this.error('oplog', new Error('The oplog no longer holds the saved position; a new generation starts'));
        }
        if (continuable) return generation;
        await store.updateGeneration(target, name, { ended: Date.now() });
      } catch (error) { if (error.code !== 'ENOENT') this.error('generation', error); }
    }
    this.state = {};
    return store.createGeneration(target, { engine, database: this.deps.dbName, encrypted: this.cipher.encrypted });
  }

  saveState(changes) {
    Object.assign(this.state, changes);
    this.stateWrite = (this.stateWrite || Promise.resolve()).catch(() => {})
      .then(() => store.writeState(this.settings.target, this.state, this.cipher || PLAIN));
    return this.stateWrite;
  }

  async stopEngines() {
    clearInterval(this.rotateTimer);
    for (const engine of Object.values(this.engines)) {
      try { await engine.stop(); } catch (error) { this.error('stop', error); }
    }
    this.engines = {};
    await this.stateWrite?.catch(() => {});
    this.running = false;
  }

  // A new generation when the current one is old enough, and retention.
  maintain() {
    return this.serial(async () => {
      if (!this.running) return;
      if (Date.now() - this.generation.started >= this.settings.baseEveryHours * 3600000) {
        const settings = this.settings;
        await this.stopEngines();
        await store.updateGeneration(settings.target, this.generation.name, { ended: Date.now() });
        await store.writeState(settings.target, {});
        await this.startEngines(settings);
      } else await this.prune();
    });
  }

  async prune() {
    const target = this.settings.target;
    const generations = await store.listGenerations(target);
    const remove = generationsToRemove(generations.filter(g => g.name !== this.generation?.name), Date.now(), this.settings.keepDays);
    for (const name of remove) await fs.promises.rm(store.generationDir(target, name), { recursive: true, force: true });
    // Blobs no generation still names are removed with the last one that did.
    if (remove.length) await this.pruneBlobs(target);
  }

  async pruneBlobs(target) {
    // Blobs are named by their content hash, or by its HMAC under the key in
    // an encrypted generation. A generation that cannot be read without a
    // key that is not here keeps every blob.
    const used = new Set();
    for (const generation of await store.listGenerations(target)) {
      let cipher;
      try { cipher = store.generationCipher(generation, this.cipher); } catch (error) { return; }
      const dir = path.join(generation.dir, 'files');
      let names = [];
      try { names = await fs.promises.readdir(dir); } catch (error) { continue; }
      for (const name of names.filter(n => /^[0-9]{12}\.ndjson$/.test(n))) {
        const data = cipher.decrypt(await fs.promises.readFile(path.join(dir, name)));
        for (const line of data.toString('utf8').split('\n')) {
          if (line) { const record = JSON.parse(line); if (record.sha256) used.add(cipher.blobName(record.sha256)); }
        }
      }
    }
    // The running file engine's known files are not all sealed in this
    // generation's segments yet: keep them too.
    for (const entry of Object.values(this.state.files?.known || {})) used.add(this.cipher.blobName(entry.sha256));
    const blobs = path.join(target, 'blobs');
    for (const prefix of await fs.promises.readdir(blobs)) {
      if (!/^[a-f0-9]{2}$/.test(prefix)) continue;
      for (const name of await fs.promises.readdir(path.join(blobs, prefix))) {
        if (/^[a-f0-9]{64}$/.test(name) && !used.has(name)) await fs.promises.rm(path.join(blobs, prefix, name), { force: true });
      }
    }
  }

  status() {
    return { running: this.running, generation: this.generation?.name || null, engine: this.choice?.engine || null,
      reasons: this.choice?.reasons || {}, engines: Object.fromEntries(Object.entries(this.engines).map(([key, engine]) => [key, engine.status()])),
      errors: this.errors.slice(-10) };
  }
}

module.exports = { ContinuousBackupManager, backupSources, readDirectories };
