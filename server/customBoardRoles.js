import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import CustomBoardRoles, { CUSTOM_ROLE_NAME_MAX } from '/models/customBoardRoles';
import { allowIsBoardAdminOrSiteAdmin } from '/server/lib/utils';

// Custom board roles (#3022), the server half: the copy every permission check
// reads, the publication, and the only ways to change them.
//
//   customBoardRoles.save    site admin: create or change a role
//   customBoardRoles.remove  site admin: delete one
//   boards.setMemberCustomRole  board admin: give a member a custom role
//
// A member's custom role is mirrored into the old per-role flags as the
// strongest built-in role that grants nothing more (fallbackRoleFor). Saving a
// role rewrites that mirror on every board where it is used, so the two never
// disagree; deleting one leaves members on the mirror, which is a subset.

const {
  setCustomRoleLookup,
  normalizeCustomCapabilities,
  fallbackRoleFor,
  flagsForRole,
} = require('/models/lib/boardRoleCapabilities');

// The copy permission checks read. They are synchronous (allow rules), so the
// roles are kept in memory and current from the collection.
const roles = new Map();
setCustomRoleLookup(id => roles.get(id) || null);

Meteor.startup(async () => {
  await CustomBoardRoles.find({}, { fields: { name: 1, capabilities: 1 } }).observeChangesAsync({
    added: (id, fields) => roles.set(id, { _id: id, ...fields }),
    changed: (id, fields) => roles.set(id, { ...(roles.get(id) || { _id: id }), ...fields }),
    removed: id => roles.delete(id),
  });
});

Meteor.publish('customBoardRoles', function () {
  if (!this.userId) return this.ready();
  return CustomBoardRoles.find({}, { fields: { name: 1, capabilities: 1, sort: 1 } });
});

async function requireSiteAdmin(userId) {
  const user = userId && (await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1 } }));
  if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
}

// The flags and customRoleId of one member, for a custom role (or null to
// return to a built-in role, which setMemberPermission writes).
function memberFields(index, roleId, capabilities) {
  const fields = {};
  const flags = flagsForRole(fallbackRoleFor(capabilities));
  for (const [flag, value] of Object.entries(flags)) fields[`members.${index}.${flag}`] = value;
  fields[`members.${index}.customRoleId`] = roleId;
  return fields;
}

// Rewrite the mirrored flags of every member carrying this role.
async function refreshMembersOf(roleId, capabilities) {
  const boards = await Boards.find({ 'members.customRoleId': roleId }, { fields: { members: 1 } }).fetchAsync();
  for (const board of boards) {
    const $set = {};
    board.members.forEach((member, index) => {
      if (member && member.customRoleId === roleId) Object.assign($set, memberFields(index, roleId, capabilities));
    });
    if (Object.keys($set).length) await Boards.direct.updateAsync(board._id, { $set });
  }
}

Meteor.methods({
  async 'customBoardRoles.save'(roleId, input) {
    check(roleId, Match.OneOf(String, null));
    check(input, { name: String, capabilities: Object });
    await requireSiteAdmin(this.userId);
    const name = input.name.trim();
    if (!name || name.length > CUSTOM_ROLE_NAME_MAX) throw new Meteor.Error('invalid-name');
    const capabilities = normalizeCustomCapabilities(input.capabilities);
    delete capabilities.manageBoard;
    if (roleId) {
      const existing = await CustomBoardRoles.findOneAsync(roleId);
      if (!existing) throw new Meteor.Error('not-found');
      await CustomBoardRoles.updateAsync(roleId, { $set: { name, capabilities } });
      await refreshMembersOf(roleId, capabilities);
      return roleId;
    }
    const sort = await CustomBoardRoles.find().countAsync();
    return CustomBoardRoles.insertAsync({ name, capabilities, sort });
  },

  async 'customBoardRoles.remove'(roleId) {
    check(roleId, String);
    await requireSiteAdmin(this.userId);
    // Members keep the mirrored built-in role; memberRoleOf ignores an id
    // that no longer names a role, so nothing else has to change.
    await CustomBoardRoles.removeAsync(roleId);
    return true;
  },

  async 'boards.setMemberCustomRole'(boardId, memberId, roleId) {
    check(boardId, String);
    check(memberId, String);
    check(roleId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const board = await Boards.findOneAsync(boardId);
    // The same who as every other board change: its admins, and a site admin
    // (server/permissions/boards.js).
    if (!board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) throw new Meteor.Error('not-authorized');
    const role = await CustomBoardRoles.findOneAsync(roleId);
    if (!role) throw new Meteor.Error('not-found');
    const index = board.members.findIndex(m => m && m.userId === memberId);
    if (index < 0) throw new Meteor.Error('not-a-member');
    const member = board.members[index];
    // A custom role is never a board admin. A board admin cannot take that
    // from themselves here (as with setMemberPermission), and the last
    // active admin cannot lose it, or nobody could manage the board.
    if (member.isAdmin) {
      if (memberId === this.userId) throw new Meteor.Error('cannot-demote-self');
      const admins = board.members.filter(m => m && m.isActive && m.isAdmin);
      if (admins.length <= 1) throw new Meteor.Error('last-board-admin');
    }
    await Boards.direct.updateAsync(boardId, {
      $set: memberFields(index, roleId, normalizeCustomCapabilities(role.capabilities)),
    });
    return true;
  },
});

export { refreshMembersOf, memberFields };
