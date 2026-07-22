import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';
import Team from '/models/team';
import Boards from '/models/boards';
import { membersToAddToBoard } from '/models/lib/propagateMembers';

// #4737 / #5850: implement the per-org/team "Propagate Members To Boards" flag
// (orgPropagateMembersToBoards / teamPropagateMembersToBoards). Until now the
// flag was stored and displayed in the Admin Panel but never acted on, AND the
// propagation method had no caller at all (dead code). This is the
// ldap-sync.py-style propagation: for each org/team that has the flag on, the
// org/team's member users are added as members of the regular boards that list
// that org/team. The update is strictly add-only — existing board members
// (assigned manually or from another source) are never removed or modified —
// and template boards (type 'template-board'/'template-container') are
// explicitly skipped, since those are group-only and must not gain per-user
// members.
//
// Membership is read from the USER docs (user.orgs[].orgId / user.teams[].teamId),
// matching how setUserOrgsTeamsFromLdap maintains it.

// Propagate a SINGLE org or team's members to the boards that list it. `kind` is
// 'org' or 'team'. Add-only; template boards skipped. Returns
// { boardsUpdated, membersAdded }. Exported so the flag-setters (org/team) can
// run it immediately when the flag is turned on.
export async function propagateGroupMembersToBoards(kind, groupId) {
  const field = kind === 'org' ? 'orgs' : 'teams';
  const idField = kind === 'org' ? 'orgId' : 'teamId';

  let boardsUpdated = 0;
  let membersAdded = 0;
  if (!groupId) return { boardsUpdated, membersAdded };

  const memberUsers = await Meteor.users
    .find({ [`${field}.${idField}`]: groupId }, { fields: { _id: 1 } })
    .fetchAsync();
  const memberUserIds = memberUsers.map(u => u._id);
  if (memberUserIds.length === 0) {
    return { boardsUpdated, membersAdded };
  }

  // Regular boards only (type 'board'); template boards are group-only and must
  // never gain per-user members, so they are excluded here.
  const boards = await Boards.find({
    type: 'board',
    archived: { $ne: true },
    [field]: { $elemMatch: { [idField]: groupId, isActive: true } },
  }).fetchAsync();

  for (const board of boards) {
    const newMembers = membersToAddToBoard(board.members, memberUserIds);
    if (newMembers.length === 0) continue;
    await Boards.updateAsync(
      { _id: board._id },
      { $push: { members: { $each: newMembers } } },
    );
    boardsUpdated += 1;
    membersAdded += newMembers.length;
  }
  return { boardsUpdated, membersAdded };
}

// Propagate EVERY org/team that has its flag on.
export async function propagateAllFlaggedGroupsToBoards() {
  let boardsUpdated = 0;
  let membersAdded = 0;

  const orgs = await Org.find({ orgPropagateMembersToBoards: true }).fetchAsync();
  for (const org of orgs) {
    const r = await propagateGroupMembersToBoards('org', org._id);
    boardsUpdated += r.boardsUpdated;
    membersAdded += r.membersAdded;
  }

  const teams = await Team.find({ teamPropagateMembersToBoards: true }).fetchAsync();
  for (const team of teams) {
    const r = await propagateGroupMembersToBoards('team', team._id);
    boardsUpdated += r.boardsUpdated;
    membersAdded += r.membersAdded;
  }

  return { boardsUpdated, membersAdded };
}

Meteor.methods({
  async propagateOrgTeamMembersToBoards() {
    // Allow server-to-server calls (connection === null, used by the LDAP sync)
    // and admins; reject any other client-originated call. Mirrors the guard in
    // server/ldapGroupSync.js setUserOrgsTeamsFromLdap.
    if (this.connection !== null) {
      const caller = this.userId ? await ReactiveCache.getUser(this.userId) : null;
      if (!caller || caller.isAdmin !== true) {
        throw new Meteor.Error('not-authorized', 'Not authorized');
      }
    }
    return await propagateAllFlaggedGroupsToBoards();
  },
});
