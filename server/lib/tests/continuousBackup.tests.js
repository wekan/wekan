import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import { ContinuousBackupSettings } from '/server/continuousBackup';

// Admin Panel / Attachments / Continuous backup through its real methods
// (docs/Backup/Continuous-Backup.md): only a site administrator reaches them,
// settings are validated on the server, an enabled stream runs and offers a
// restore point, and a file removed after it was streamed comes back.
describe('Continuous backup methods', function () {
  this.timeout(120000);
  const call = (userId, name, ...args) => {
    const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    return DDP._CurrentMethodInvocation.withValue(context, () => Meteor.server.method_handlers[name].apply(context, args));
  };
  const methods = [['continuousBackup.getSettings'], ['continuousBackup.saveSettings', {}], ['continuousBackup.status'],
    ['continuousBackup.restorePoints'], ['continuousBackup.fetchFromCloud'], ['continuousBackup.restore', { generation: 'x', until: 1, what: 'files', mode: 'add-missing' }]];

  it('refuses everyone but a site administrator', async function () {
    if (!Meteor.isAppTest) this.skip();
    const member = Random.id(), orgAdmin = Random.id();
    try {
      await Meteor.users.rawCollection().insertMany([{ _id: member, username: `m-${member}` },
        { _id: orgAdmin, username: `o-${orgAdmin}`, orgs: [{ orgId: Random.id(), orgDisplayName: 'Org', isAdmin: true }] }]);
      for (const [name, ...args] of methods) {
        for (const userId of [null, member, orgAdmin]) {
          await assert.rejects(call(userId, name, ...args), /not-authorized/, `${name} as ${userId}`);
        }
      }
    } finally { await Meteor.users.rawCollection().deleteMany({ _id: { $in: [member, orgAdmin] } }); }
  });

  it('validates, runs, lists a restore point and restores a streamed file', async function () {
    if (!Meteor.isAppTest) this.skip();
    const admin = Random.id();
    const writable = path.resolve(process.env.WRITABLE_PATH || process.cwd());
    const { filesRootFrom } = require('/models/lib/backupPaths');
    const attachments = path.join(filesRootFrom(writable), 'attachments');
    const target = path.join(writable, `continuous-backup-test-${admin}`);
    const file = path.join(attachments, `continuous-${admin}.txt`);
    const base = { enabled: true, target, database: false, attachments: true, avatars: false, logs: false, fileScanSeconds: 30 };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: admin, username: `a-${admin}`, isAdmin: true });
      const config = await call(admin, 'continuousBackup.getSettings');
      assert.equal(config.settings.enabled, false);
      assert.equal(config.defaults.target, path.join(writable, 'continuous-backup'));
      assert.ok('oplog' in config.available && 'nodeSqlite' in config.available);
      // NEGATIVE: the server validates again whatever the form sent.
      for (const bad of [{ ...base, target: attachments }, { ...base, target: 'relative' }, { ...base, keepDays: 0 },
        { ...base, isAdmin: true }, { ...base, engine: 'shell' }]) {
        await assert.rejects(call(admin, 'continuousBackup.saveSettings', bad), /invalid-continuous-backup-settings/, JSON.stringify(bad));
      }
      assert.equal(await ContinuousBackupSettings.findOneAsync('settings'), undefined, 'nothing invalid was saved');

      fs.mkdirSync(attachments, { recursive: true });
      fs.writeFileSync(file, 'streamed bytes');
      const status = await call(admin, 'continuousBackup.saveSettings', base);
      assert.equal(status.running, true);
      assert.ok(status.generation);
      assert.ok(status.engines.files.files >= 1);
      assert.equal((await call(admin, 'continuousBackup.status')).running, true);
      const points = await call(admin, 'continuousBackup.restorePoints');
      assert.equal(points[0].name, status.generation);

      // The file is lost after it was streamed; a restore brings it back.
      const until = Date.now();
      fs.rmSync(file);
      const restored = await call(admin, 'continuousBackup.restore', { generation: status.generation, until, what: 'files', mode: 'add-missing' });
      assert.ok(restored.written >= 1);
      assert.equal(fs.readFileSync(file, 'utf8'), 'streamed bytes');
      assert.equal((await call(admin, 'continuousBackup.status')).running, true, 'the stream resumes after a restore');
      // NEGATIVE: a generation that is not one is refused and recorded.
      await assert.rejects(call(admin, 'continuousBackup.restore', { generation: '../../etc', until, what: 'files', mode: 'add-missing' }));
      await assert.rejects(call(admin, 'continuousBackup.restore', { generation: status.generation, until, what: 'files' }), /bad-mode/);

      const stopped = await call(admin, 'continuousBackup.saveSettings', { ...base, enabled: false });
      assert.equal(stopped.running, false);
    } finally {
      await call(admin, 'continuousBackup.saveSettings', { ...base, enabled: false }).catch(() => {});
      await ContinuousBackupSettings.rawCollection().deleteMany({});
      await Meteor.users.rawCollection().deleteMany({ _id: admin });
      fs.rmSync(target, { recursive: true, force: true });
      fs.rmSync(file, { force: true });
    }
  });
});
