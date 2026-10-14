import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { joinOnEdit } from '/server/instanceEditing';

// #4575 on a running server: with Admin Panel allowing it and the board turned
// on, a signed-in non-member may write, and their first edit makes them a
// Normal member; with Admin Panel not allowing it, they may not.
describe('Boards every signed-in user may edit (runtime)', function () {
  this.timeout(60000);
  const owner = Random.id(), stranger = Random.id(), boardId = Random.id();
  const SETTING = 'tableVisibilityMode-allowInstanceEditing';
  let savedSetting;
  const settle = () => new Promise(resolve => setTimeout(resolve, 300));

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    savedSetting = await TableVisibilityModeSettings.findOneAsync(SETTING);
    await Meteor.users.rawCollection().insertMany([
      { _id: owner, username: `ie-owner-${owner}`, profile: {} },
      { _id: stranger, username: `ie-stranger-${stranger}`, profile: {} },
    ]);
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Open', type: 'board', permission: 'instance', archived: false,
      allowsInstanceEditing: true, members: [{ userId: owner, isAdmin: true, isActive: true }] });
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    await TableVisibilityModeSettings.rawCollection().updateOne({ _id: SETTING }, { $set: { booleanValue: savedSetting ? savedSetting.booleanValue : false } }, { upsert: true });
    await Boards.rawCollection().deleteOne({ _id: boardId });
    await Meteor.users.rawCollection().deleteMany({ _id: { $in: [owner, stranger] } });
  });

  it('not allowed in the Admin Panel: a non-member may not write (negative)', async () => {
    await TableVisibilityModeSettings.rawCollection().updateOne({ _id: SETTING }, { $set: { booleanValue: false } }, { upsert: true });
    await settle();
    assert.equal(allowIsBoardMemberWithWriteAccess(stranger, await Boards.findOneAsync(boardId)), false);
  });

  it('allowed: a non-member may write, and the first edit makes them a Normal member', async () => {
    await TableVisibilityModeSettings.rawCollection().updateOne({ _id: SETTING }, { $set: { booleanValue: true } });
    await settle();
    assert.equal(allowIsBoardMemberWithWriteAccess(stranger, await Boards.findOneAsync(boardId)), true);
    await joinOnEdit(stranger, boardId);
    const m = (await Boards.findOneAsync(boardId)).members.find(x => x.userId === stranger);
    assert.equal(m.isActive, true);
    assert.equal(m.isAdmin, false);
    assert.equal(m.isReadOnly, false);
  });
});
