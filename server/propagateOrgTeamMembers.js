import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';
import Team from '/models/team';
import Boards from '/models/boards';

// #4737 / #5850: implement the per-org/team "Propagate Members To Boards" flag
// (orgPropagateMembersToBoards / teamPropagateMembersToBoards). Until now the
// flag was stored and displayed in the Admin Panel but never acted on. This is
// the ldap-sync.py-style propagation: for each org/team that has the flag on,
// the org/team's member users are added as members of the regular boards that
// list that org/team. The update is strictly add-only — existing board members
// (assigned manually or from another source) are never removed or modified —
// and template boards (type 'template-board'/'template-container') are
// explicitly skipped, since those are group-only and must not gain per-user
// members.
//
// Membership is read from the USER docs (user.orgs[].orgId / user.teams[].teamId),
// matching how setUserOrgsTeamsFromLdap maintains it.
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

    let boardsUpdated = 0;
    let membersAdded = 0;

    // Add the given member userIds to a single board, add-only. Returns the
    // number of members actually added (0 if all were already present).
    const addMembersToBoard = async (board, memberUserIds) => {
      const existing = new Set((board.members || []).map(m => m.userId));
      const toAdd = memberUserIds.filter(userId => !existing.has(userId));
      if (toAdd.length === 0) {
        return 0;
      }
      const newMembers = toAdd.map(userId => ({
        userId,
        isAdmin: false,
        isActive: true,
        isNoComments: false,
        isCommentOnly: false,
        isWorker: false,
      }));
      await Boards.updateAsync(
        { _id: board._id },
        { $push: { members: { $each: newMembers } } },
      );
      return toAdd.length;
    };

    // Propagate one org or team. `field` is the user-doc membership array
    // ('orgs'/'teams') and `idField` is the id within it ('orgId'/'teamId');
    // `boardField` is the board array ('orgs'/'teams').
    const propagate = async (groupId, field, idField, boardField) => {
      const memberUsers = await Meteor.users
        .find({ [`${field}.${idField}`]: groupId }, { fields: { _id: 1 } })
        .fetchAsync();
      const memberUserIds = memberUsers.map(u => u._id);
      if (memberUserIds.length === 0) {
        return;
      }

      // Regular boards only (type 'board'); template boards are group-only and
      // must never gain per-user members, so they are excluded here.
      const boards = await Boards.find({
        type: 'board',
        archived: { $ne: true },
        [boardField]: { $elemMatch: { [idField]: groupId, isActive: true } },
      }).fetchAsync();

      for (const board of boards) {
        const added = await addMembersToBoard(board, memberUserIds);
        if (added > 0) {
          boardsUpdated += 1;
          membersAdded += added;
        }
      }
    };

    const orgs = await Org.find({ orgPropagateMembersToBoards: true }).fetchAsync();
    for (const org of orgs) {
      await propagate(org._id, 'orgs', 'orgId', 'orgs');
    }

    const teams = await Team.find({ teamPropagateMembersToBoards: true }).fetchAsync();
    for (const team of teams) {
      await propagate(team._id, 'teams', 'teamId', 'teams');
    }

    return { boardsUpdated, membersAdded };
  },
});
