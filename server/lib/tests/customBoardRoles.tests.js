import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import CustomBoardRoles from '/models/customBoardRoles';

// Custom board roles (#3022) on a running server and its database: only a site
// admin builds a role; a board admin gives it to a member; the member's
// capabilities come from the role, its flags mirror it safely, a change to the
// role reaches the member, the last board admin cannot lose that role, a
// built-in role replaces the custom one, and a deleted role leaves the mirror.
const { memberCan, memberRoleOf } = require('/models/lib/boardRoleCapabilities');

describe('Custom board roles (runtime)', function () {
  this.timeout(60000);
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);
  const siteAdmin = Random.id(), owner = Random.id(), member = Random.id();
  const boardId = Random.id();
  let roleId;
  // The server keeps an in-memory copy of the roles, fed by an observer; give
  // it a moment after each write.
  const settle = () => new Promise(resolve => setTimeout(resolve, 300));
  const board = () => Boards.findOneAsync(boardId);
  const memberOf = async id => (await board()).members.find(m => m.userId === id);

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    await Meteor.users.rawCollection().insertMany([
      { _id: siteAdmin, username: `cbr-admin-${siteAdmin}`, isAdmin: true, profile: {} },
      { _id: owner, username: `cbr-owner-${owner}`, profile: {} },
      { _id: member, username: `cbr-member-${member}`, profile: {} },
    ]);
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Roles', permission: 'private', archived: false,
      members: [{ userId: owner, isAdmin: true, isActive: true }, { userId: member, isAdmin: false, isActive: true }] });
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    await Boards.rawCollection().deleteOne({ _id: boardId });
    await Meteor.users.rawCollection().deleteMany({ _id: { $in: [siteAdmin, owner, member] } });
    if (roleId) await CustomBoardRoles.rawCollection().deleteOne({ _id: roleId });
  });

  it('only a site admin builds a role (negative: a board admin is refused)', async () => {
    await assert.rejects(call(owner, 'customBoardRoles.save', null, { name: 'Mover', capabilities: { moveCard: true } }), /not-authorized/);
    roleId = await call(siteAdmin, 'customBoardRoles.save', null,
      { name: 'Mover', capabilities: { seesAllCards: true, moveCard: true, manageBoard: true } });
    const role = await CustomBoardRoles.findOneAsync(roleId);
    assert.equal(role.name, 'Mover');
    assert.equal(role.capabilities.manageBoard, undefined, 'never board settings');
    await settle();
  });

  it('a board admin gives it; the member may do what it says and its flags mirror it', async () => {
    await assert.rejects(call(member, 'boards.setMemberCustomRole', boardId, member, roleId), /not-authorized/);
    await call(owner, 'boards.setMemberCustomRole', boardId, member, roleId);
    const m = await memberOf(member);
    assert.equal(m.customRoleId, roleId);
    assert.equal(m.isReadOnly, true, 'the mirror: read-only grants nothing more');
    const members = (await board()).members;
    assert.equal(memberRoleOf(m), `custom:${roleId}`);
    assert.equal(memberCan(members, member, 'moveCard'), true);
    assert.equal(memberCan(members, member, 'write'), false);
    assert.equal((await board()).hasWorker(member), true, 'by name it is a Worker');
  });

  it('changing the role reaches the member', async () => {
    await call(siteAdmin, 'customBoardRoles.save', roleId,
      { name: 'Editor', capabilities: { seesAllCards: true, comment: true, write: true } });
    await settle();
    const m = await memberOf(member);
    assert.equal(m.isReadOnly, false);
    assert.equal(memberCan((await board()).members, member, 'write'), true);
  });

  it('the last board admin cannot be given a custom role (negative)', async () => {
    await assert.rejects(call(siteAdmin, 'boards.setMemberCustomRole', boardId, owner, roleId), /last-board-admin/);
  });

  it('a built-in role replaces it, and a deleted role leaves the mirror', async () => {
    const b = await board();
    await b.setMemberPermission(member, false, false, true, false, false, false, false, false, owner);
    let m = await memberOf(member);
    assert.equal(m.customRoleId, undefined, 'comment only now, not the custom role');
    await call(owner, 'boards.setMemberCustomRole', boardId, member, roleId);
    await call(siteAdmin, 'customBoardRoles.remove', roleId);
    roleId = null;
    await settle();
    m = await memberOf(member);
    assert.equal(memberRoleOf(m), 'normal', 'the mirror of an editor that comments and sees all: Normal');
  });
});
