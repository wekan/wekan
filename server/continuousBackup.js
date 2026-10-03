// Admin Panel / Attachments / Continuous backup
// (docs/Backup/Continuous-Backup.md): its settings, the stream that runs on
// this server, its restore points and the restore. Site administrators only:
// it covers the whole instance, so a per-Organization administrator never
// reaches it (models/lib/tenantAdmin.js).
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Mongo, MongoInternals } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { ZipArchive } from 'archiver';
import path from 'path';
import fs from 'fs';
import * as tenantAdmin from '/models/lib/tenantAdmin';
import { foldEventFireAndForget } from '/server/lib/eventLogFold';

const { BSON } = MongoInternals.NpmModule;
const { appendInstanceBackup, inspectInstanceBackup, restoreInstanceBackup } =
  require('/server/lib/fullBackup').createBackupTools(BSON.EJSON);
const { filesRootFrom } = require('/models/lib/backupPaths');
const { validateSettings, DEFAULTS, chooseEngine } = require('/models/lib/continuousBackup');
const { ContinuousBackupManager, backupSources, readDirectories } = require('/server/lib/continuousBackup/manager');
const { listGenerations } = require('/server/lib/continuousBackup/store');
const { restorePoints, restoreDatabase, restoreFiles, restoreSqlite, stageSqliteRestore } = require('/server/lib/continuousBackup/restore');
const { quickCheck } = require('/server/lib/continuousBackup/sqlite');
const { adapterRemote, fetchFromCloud } = require('/server/lib/continuousBackup/cloud');
import { getCloudAdapter } from '/models/lib/cloudStorage';

// A storage configured in Admin Panel / Attachments, as the upload's remote.
function cloudRemote(provider) {
  const adapter = getCloudAdapter(provider);
  return adapter ? adapterRemote(adapter.storage, adapter.bucketName) : null;
}
const { sanitizeDetail } = require('/models/lib/securityLogFormat');

export const ContinuousBackupSettings = new Mongo.Collection('continuousBackupSettings');
ContinuousBackupSettings.deny({ insert: () => true, update: () => true, remove: () => true });

const writablePath = () => path.resolve(process.env.WRITABLE_PATH || process.cwd());
const filesRoot = () => filesRootFrom(writablePath());
// The FerretDB SQLite directory, from the environment the startup scripts
// set (server/recovery.js), else <files>/db when it exists.
function sqliteDir(env = process.env) {
  const dir = env.WEKAN_FERRETDB_SQLITE_DIR || env.FERRETDB_SQLITE_DIR || env.WEKAN_SQLITE_DIR;
  if (dir) return path.resolve(dir);
  const guess = path.join(filesRoot(), 'db');
  return fs.existsSync(guess) ? guess : null;
}
const paths = () => ({ filesRoot: filesRoot(), writablePath: writablePath(), sqliteDir: sqliteDir() });
const defaultTarget = () => path.join(writablePath(), 'continuous-backup');

// A failure of the unattended stream, as one summarised row in Admin Panel /
// Problems (server/lib/eventLogFold.js).
function reportProblem(source, error) {
  foldEventFireAndForget({ stream: 'integrity', category: 'backup', bleed: 'ContinuousBackup', action: 'failed',
    source: `continuousBackup.${source}`, severity: 'high', detail: sanitizeDetail(String(error?.message || error)) });
}

let manager = null;
function backupManager() {
  if (!manager) {
    const driver = MongoInternals.defaultRemoteCollectionDriver().mongo;
    manager = new ContinuousBackupManager({ client: driver.client, dbName: driver.db.databaseName, EJSON: BSON.EJSON,
      Timestamp: BSON.Timestamp, ZipArchive, appendInstanceBackup, ...paths(), onProblem: reportProblem, cloudRemote });
  }
  return manager;
}

async function savedSettings() {
  const saved = await ContinuousBackupSettings.findOneAsync('settings');
  const { _id, updatedAt, updatedBy, ...settings } = saved || {};
  return { ...DEFAULTS, target: defaultTarget(), ...settings };
}

async function requireSiteAdmin(userId) {
  const user = userId ? await ReactiveCache.getUser({ _id: userId }, { fields: { isAdmin: 1, orgs: 1 } }) : null;
  if (!tenantAdmin.isSiteAdmin(user)) throw new Meteor.Error('not-authorized');
  return user;
}

let restoring = false;
Meteor.methods({
  async 'continuousBackup.getSettings'() {
    await requireSiteAdmin(this.userId);
    const settings = await savedSettings();
    const available = await backupManager().availability(settings);
    return { settings, defaults: { ...DEFAULTS, target: defaultTarget() }, paths: paths(),
      available: { oplog: available.oplog, sqliteFiles: available.sqliteFiles.map(f => path.basename(f)),
        nodeSqlite: available.nodeSqlite, litestream: available.litestream },
      choice: chooseEngine(settings.engine, available) };
  },
  async 'continuousBackup.saveSettings'(input) {
    check(input, Object);
    await requireSiteAdmin(this.userId);
    let settings;
    try { settings = validateSettings(input, { sources: readDirectories(paths()), defaultTarget: defaultTarget() }); }
    catch (error) { throw new Meteor.Error('invalid-continuous-backup-settings', error.message); }
    // A key that cannot be read, or is not this stream's, is refused before
    // anything is saved.
    if (settings.enabled && settings.encrypt) {
      try { await backupManager().openStream(settings); }
      catch (error) {
        if (error.code === 'continuous-backup-key') throw new Meteor.Error('continuous-backup-key', error.message);
        throw error;
      }
    }
    await ContinuousBackupSettings.upsertAsync('settings', { $set: { ...settings, updatedAt: new Date(), updatedBy: this.userId } });
    await backupManager().apply(settings);
    return backupManager().status();
  },
  async 'continuousBackup.status'() {
    await requireSiteAdmin(this.userId);
    return { ...backupManager().status(), restoring };
  },
  // A lost or empty target filled again from the cloud copy, so its restore
  // points can be restored. Files already here are kept.
  async 'continuousBackup.fetchFromCloud'() {
    await requireSiteAdmin(this.userId);
    if (restoring) throw new Meteor.Error('already-running');
    const settings = await savedSettings();
    if (!settings.upload || settings.upload === 'none') throw new Meteor.Error('continuous-backup-no-upload', 'No cloud upload is configured');
    const remote = cloudRemote(settings.upload);
    if (!remote) throw new Meteor.Error('continuous-backup-no-upload', `The ${settings.upload} storage is not configured`);
    restoring = true;
    await backupManager().stop();
    try {
      fs.mkdirSync(settings.target, { recursive: true, mode: 0o700 });
      return await fetchFromCloud({ target: settings.target, remote, prefix: settings.uploadPrefix });
    } finally {
      restoring = false;
      if (settings.enabled) await backupManager().apply(settings).catch(error => reportProblem('restart', error));
    }
  },
  async 'continuousBackup.restorePoints'() {
    await requireSiteAdmin(this.userId);
    const { target } = await savedSettings();
    const points = [];
    for (const generation of await listGenerations(target)) points.push(await restorePoints(target, generation.name));
    return points.reverse();
  },
  // `what`: 'database' (oplog generations), 'files', or 'sqlite' (builds a
  // checked file beside the stream, never over the live one).
  async 'continuousBackup.restore'(request) {
    check(request, { generation: String, until: Number, what: Match.OneOf('database', 'files', 'sqlite'),
      mode: Match.Optional(Match.OneOf('add-missing', 'replace-all')), database: Match.Optional(String),
      applyOnRestart: Match.Optional(Boolean) });
    await requireSiteAdmin(this.userId);
    if (restoring) throw new Meteor.Error('already-running');
    const settings = await savedSettings();
    const { target } = settings;
    restoring = true;
    try {
      // The stream's key, read from the administrator's key file when
      // encryption is on; an encrypted generation is refused without it.
      const { cipher } = await backupManager().openStream(settings);
      if (request.what === 'sqlite') {
        const out = path.join(target, 'restore', `${new Date().toISOString().replace(/[:.]/g, '-')}`, `${request.database}.sqlite`);
        const built = await restoreSqlite({ target, name: request.generation, database: request.database || '', until: request.until, out, quickCheck, cipher });
        // Applied by the startup scripts on the next restart, never over the
        // file FerretDB holds open (decision of 2026-10-03).
        if (request.applyOnRestart) return { ...built, ...await stageSqliteRestore({ file: built.file, database: request.database, sqliteDir: sqliteDir() }) };
        return built;
      }
      if (!request.mode) throw new Meteor.Error('bad-mode');
      // The stream pauses while the restore reads its target, and resumes
      // from its saved position after it: the restore's writes are changes
      // like any other, and are recorded then.
      await backupManager().stop();
      try {
        if (request.what === 'database') {
          const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
          return await restoreDatabase({ target, name: request.generation, until: request.until, db, filesRoot: filesRoot(),
            mode: request.mode, EJSON: BSON.EJSON, inspectInstanceBackup, restoreInstanceBackup, cipher });
        }
        const roots = Object.fromEntries(backupSources({ ...paths(), settings: { ...settings, attachments: true, avatars: true, logs: true } })
          .map(source => [`${source.area}\0${source.key}`, { path: source.path, file: !!source.file }]));
        return await restoreFiles({ target, name: request.generation, until: request.until, roots, mode: request.mode, cipher });
      } finally {
        if (settings.enabled) await backupManager().apply(settings).catch(error => reportProblem('restart', error));
      }
    } catch (error) {
      if (error.code === 'continuous-backup-restore-refused' || error.code === 'continuous-backup-key') {
        reportProblem('restore', error);
        throw new Meteor.Error('continuous-backup-restore-refused', error.message);
      }
      throw error;
    } finally { restoring = false; }
  },
});

Meteor.startup(async () => {
  try {
    const settings = await savedSettings();
    if (settings.enabled) await backupManager().apply(settings);
  } catch (error) { reportProblem('startup', error); }
});
