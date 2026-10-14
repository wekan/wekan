import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';

// #4178 on a running server: an Admin Panel admin adds a user to a team, and
// the user becomes a member of the team's board; removing them from the team
// takes that membership away - but not a direct member's, and not a board
// admin's.
describe('Team memberships come and go with the team (runtime)', function () {
  this.timeout(60000);
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);
  const admin = Random.id(), owner = Random.id(), joiner = Random.id(), direct = Random.id();
  const boardId = Random.id(), teamId = Random.id();
  const team = [{ teamId, teamDisplayName: 'Ops' }];
  const memberOf = async id => (await Boards.findOneAsync(boardId)).members.find(m => m.userId === id);

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    await Meteor.users.rawCollection().insertMany([
      { _id: admin, username: `gbm-admin-${admin}`, isAdmin: true, profile: {} },
      { _id: owner, username: `gbm-owner-${owner}`, profile: {} },
      { _id: joiner, username: `gbm-joiner-${joiner}`, profile: {}, teams: [] },
      { _id: direct, username: `gbm-direct-${direct}`, profile: {}, teams: [] },
    ]);
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Team board', type: 'board', permission: 'private', archived: false,
      teams: [{ teamId, teamDisplayName: 'Ops', isActive: true }],
      members: [{ userId: owner, isAdmin: true, isActive: true }, { userId: direct, isAdmin: false, isActive: true }] });
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    await Boards.rawCollection().deleteOne({ _id: boardId });
    await Meteor.users.rawCollection().deleteMany({ _id: { $in: [admin, owner, joiner, direct] } });
  });

  it('joining the team adds the board, recording the team', async () => {
    await call(admin, 'editUser', joiner, { teams: team });
    const m = await memberOf(joiner);
    assert.equal(m.isActive, true);
    assert.deepEqual(m.grantedBy, [`team:${teamId}`]);
  });

  it('a direct member who joins the team stays direct', async () => {
    await call(admin, 'editUser', direct, { teams: team });
    assert.equal((await memberOf(direct)).grantedBy, undefined);
  });

  it('leaving the team takes away what it gave, and only that', async () => {
    await call(admin, 'editUser', joiner, { teams: [] });
    await call(admin, 'editUser', direct, { teams: [] });
    assert.equal((await memberOf(joiner)).isActive, false, 'the team member is gone');
    assert.equal((await memberOf(direct)).isActive, true, 'the direct member stays');
  });

  it('rejoining brings the member back; a board admin\'s removal is final', async () => {
    await call(admin, 'editUser', joiner, { teams: team });
    assert.equal((await memberOf(joiner)).isActive, true);
    const board = await Boards.findOneAsync(boardId);
    await board.removeMember(joiner);
    await call(admin, 'editUser', joiner, { teams: [] });
    await call(admin, 'editUser', joiner, { teams: team });
    assert.equal((await memberOf(joiner)).isActive, false, 'removed by the board admin, not re-added by the team');
  });
});
