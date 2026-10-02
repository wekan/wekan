import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Settings from '/models/settings';
const { FEATURE_KEYS } = require('/models/lib/instanceFeatures');

// #6736: Admin Panel / Settings / Visibility / Features saves through one
// site-admin method that also names the pilot users.
describe('Instance features', function () {
  this.timeout(30000);
  it('saves decisions and pilot users for a site admin only', async function () {
    if (!Meteor.isAppTest) this.skip();
    const adminId = Random.id(), memberId = Random.id(), pilotId = Random.id(), formerId = Random.id();
    const call = (userId, name, ...args) => {
      const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      return DDP._CurrentMethodInvocation.withValue(context, () =>
        Meteor.server.method_handlers[name].apply(context, args));
    };
    const setting = await Settings.findOneAsync({});
    const saved = setting && Object.fromEntries(['featureStates', 'featureApprovalRequired', 'featureKnownKeys',
      'featurePreviewAdmins'].map(key => [key, setting[key]]));
    const states = Object.fromEntries(FEATURE_KEYS.map(key => [key, key !== 'views-gantt']));
    try {
      await Meteor.users.rawCollection().insertMany([
        { _id: adminId, username: `admin-${adminId}`, isAdmin: true, profile: {} },
        { _id: memberId, username: `member-${memberId}`, profile: {} },
        { _id: pilotId, username: `pilot-${pilotId}`, profile: {} },
        { _id: formerId, username: `former-${formerId}`, profile: {}, featurePreview: true },
      ]);
      if (!setting) this.skip();
      // Negative: an ordinary member can neither save nor list the pilots.
      await assert.rejects(call(memberId, 'saveInstanceFeatures', { states, approvalRequired: false, previewAdmins: false }),
        /error-notAuthorized/);
      await assert.rejects(call(memberId, 'getFeaturePilotUsernames'), /error-notAuthorized/);
      await assert.rejects(call(adminId, 'saveInstanceFeatures', { states: { ...states, bogus: true },
        approvalRequired: false, previewAdmins: false }), /invalid-features/);

      const result = await call(adminId, 'saveInstanceFeatures', { states, approvalRequired: true, previewAdmins: true,
        pilotUsernames: `pilot-${pilotId}, nobody-${pilotId}` });
      assert.deepEqual(result, { saved: true, unknownUsernames: [`nobody-${pilotId}`] });
      const after = await Settings.findOneAsync({});
      assert.equal(after.featureStates['views-gantt'], false);
      assert.equal(after.featureApprovalRequired, true);
      assert.equal(after.featurePreviewAdmins, true);
      assert.deepEqual(after.featureKnownKeys, FEATURE_KEYS);
      assert.equal((await Meteor.users.findOneAsync(pilotId)).featurePreview, true);
      assert.equal((await Meteor.users.findOneAsync(formerId)).featurePreview, undefined, 'a pilot not listed any more is removed');
      assert.equal((await Meteor.users.findOneAsync(memberId)).featurePreview, undefined);
      const names = await call(adminId, 'getFeaturePilotUsernames');
      assert.ok(names.includes(`pilot-${pilotId}`) && !names.includes(`former-${formerId}`));
    } finally {
      if (setting) await Settings.rawCollection().updateOne({ _id: setting._id }, { $set: saved });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [adminId, memberId, pilotId, formerId] } });
    }
  });
});
