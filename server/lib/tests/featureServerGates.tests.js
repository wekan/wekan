/* eslint-env mocha */
// Admin Panel / Settings / Features: with a feature unticked, the server paths
// of that feature refuse the call (models/lib/featureServerGates.js), and
// with it ticked they answer as before.
import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Settings from '/models/settings';

describe('Admin Panel features are refused on the server while off', function () {
  this.timeout(30000);
  let setting;
  let savedStates;
  let savedPreview;
  const userId = Random.id();
  const adminId = Random.id();

  const call = (uid, name, ...args) => {
    const context = { userId: uid, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    return DDP._CurrentMethodInvocation.withValue(context, () =>
      Meteor.server.method_handlers[name].apply(context, args));
  };
  const turn = (key, on) => Settings.updateAsync(setting._id, { $set: { [`featureStates.${key}`]: on } });

  before(async function () {
    setting = await Settings.findOneAsync({});
    if (!setting) this.skip();
    savedStates = setting.featureStates;
    savedPreview = setting.featurePreviewAdmins;
    // Site admins preview off features only when Admin Panel says so; here it does not.
    await Settings.updateAsync(setting._id, { $set: { featurePreviewAdmins: false } });
    await Meteor.users.rawCollection().insertMany([
      { _id: userId, username: `gate-${userId}`, profile: {} },
      // A site admin, without the preview: an off feature is off for them too.
      { _id: adminId, username: `gate-admin-${adminId}`, isAdmin: true, profile: {} },
    ]);
  });
  after(async function () {
    if (setting) {
      await Settings.updateAsync(setting._id, savedStates === undefined
        ? { $unset: { featureStates: '' } } : { $set: { featureStates: savedStates } });
      await Settings.updateAsync(setting._id, savedPreview === undefined
        ? { $unset: { featurePreviewAdmins: '' } } : { $set: { featurePreviewAdmins: savedPreview } });
    }
    await Meteor.users.removeAsync({ _id: { $in: [userId, adminId] } });
  });

  const refused = async promise => assert.rejects(promise, err => err && err.error === 'feature-disabled');
  const notRefusedForTheFeature = async promise => {
    try { await promise; } catch (err) { assert.notEqual(err && err.error, 'feature-disabled'); }
  };

  it('refuses the Table view, Chat view and Scrum view methods while their features are off', async function () {
    await turn('views-table', false);
    await turn('views-chat', false);
    await turn('views-scrum', false);
    await refused(call(userId, 'tableViewAddCard', { boardId: 'b', listId: 'l', swimlaneId: 's', title: 'x' }));
    await refused(call(userId, 'chatViewChannels'));
    await refused(call(adminId, 'chatViewChannels'));
    // Negative: with the preview on, the site admin keeps it, as they see it.
    await Settings.updateAsync(setting._id, { $set: { featurePreviewAdmins: true } });
    await notRefusedForTheFeature(call(adminId, 'chatViewChannels'));
    await Settings.updateAsync(setting._id, { $set: { featurePreviewAdmins: false } });
    await refused(call(userId, 'scrum.startSprint', 'b', 's', 0));
  });

  it('keeps the Scrum methods the card details and recovery use (negative)', async function () {
    await turn('views-scrum', false);
    await notRefusedForTheFeature(call(userId, 'scrum.getBoardData', 'no-such-board'));
  });

  it('refuses choosing a board view whose feature is off, and allows Swimlanes', async function () {
    await turn('views-table', false);
    await refused(call(userId, 'setBoardView', 'board-view-table', null));
    const before = await Meteor.users.findOneAsync(userId);
    assert.notEqual(before.profile && before.profile.boardView, 'board-view-table');
    await notRefusedForTheFeature(call(userId, 'setBoardView', 'board-view-swimlanes', null));
  });

  it('answers as before while the features are on (negative)', async function () {
    await turn('views-table', true);
    await turn('views-chat', true);
    await turn('views-scrum', true);
    await notRefusedForTheFeature(call(userId, 'tableViewAddCard', { boardId: 'b', listId: 'l', swimlaneId: 's', title: 'x' }));
    await notRefusedForTheFeature(call(userId, 'chatViewChannels'));
    await notRefusedForTheFeature(call(userId, 'scrum.startSprint', 'b', 's', 0));
    await notRefusedForTheFeature(call(userId, 'setBoardView', 'board-view-table', null));
  });

  it('leaves a logged-out call to the method\'s own login check (negative)', async function () {
    await turn('views-table', false);
    await assert.rejects(call(null, 'tableViewAddCard', { boardId: 'b', listId: 'l', swimlaneId: 's', title: 'x' }),
      err => err && err.error === 'not-authorized');
  });
});
