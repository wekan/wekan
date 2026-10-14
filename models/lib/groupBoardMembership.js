'use strict';

// Where a board membership came from, so that leaving a team or an
// organization removes what it gave and nothing else (#4178, maintainer
// decision 2026-10-14). Pure: tested in tests/groupBoardMembership.test.cjs.
//
// A member entry that a team or an organization created carries
// `grantedBy: ['team:<id>', 'org:<id>', ...]`. An entry WITHOUT grantedBy is a
// direct membership - an invitation, a board admin's choice, or any entry from
// before this existed - and a group never touches it.
//
//   gaining a group    not a member yet         -> new entry, grantedBy [group]
//                      member through groups    -> group added (and active)
//                      direct member            -> untouched
//   losing a group     member through it        -> group removed; with no
//                                                  group left, deactivated
//                      ...but a board admin     -> kept, now direct: a board
//                                                  must not lose its admin
//                                                  to a team change
//                      direct member            -> untouched
//
// A board admin's own decisions make an entry direct: adding a member who is
// there through a team, or removing one (models/boards.js addMember and
// removeMember drop grantedBy), so a later team change does not undo them.

const ROLE_FLAGS_OFF = {
  isAdmin: false,
  isNoComments: false,
  isCommentOnly: false,
  isWorker: false,
  isNormalAssignedOnly: false,
  isCommentAssignedOnly: false,
  isReadOnly: false,
  isReadAssignedOnly: false,
};

function grantOf(kind, id) {
  return `${kind}:${id}`;
}

function isGroupDerived(member) {
  return !!member && Array.isArray(member.grantedBy);
}

/**
 * What gaining `grant` does to this user's entry in `members`.
 * @return {{action: 'push', entry: object} | {action: 'addGrant', index: number}
 *   | {action: 'none'}}
 */
function planGain(members, userId, grant) {
  const list = Array.isArray(members) ? members : [];
  const index = list.findIndex(m => m && m.userId === userId);
  if (index < 0) {
    return { action: 'push', entry: { userId, isActive: true, ...ROLE_FLAGS_OFF, grantedBy: [grant] } };
  }
  const member = list[index];
  if (!isGroupDerived(member)) return { action: 'none' };
  if (member.isActive === true && member.grantedBy.includes(grant)) return { action: 'none' };
  return { action: 'addGrant', index };
}

/**
 * What losing `grant` does to this user's entry in `members`.
 * @return {{action: 'pullGrant', index: number} | {action: 'deactivate', index: number}
 *   | {action: 'makeDirect', index: number} | {action: 'none'}}
 */
function planLoss(members, userId, grant) {
  const list = Array.isArray(members) ? members : [];
  const index = list.findIndex(m => m && m.userId === userId);
  if (index < 0) return { action: 'none' };
  const member = list[index];
  if (!isGroupDerived(member) || !member.grantedBy.includes(grant)) return { action: 'none' };
  const remaining = member.grantedBy.filter(g => g !== grant);
  if (remaining.length) return { action: 'pullGrant', index };
  if (member.isAdmin === true) return { action: 'makeDirect', index };
  return { action: 'deactivate', index };
}

/** The Mongo update that carries out a plan on one board. */
function updateFor(plan, grant) {
  switch (plan.action) {
    case 'push':
      return { $push: { members: plan.entry } };
    case 'addGrant':
      return {
        $set: { [`members.${plan.index}.isActive`]: true },
        $addToSet: { [`members.${plan.index}.grantedBy`]: grant },
      };
    case 'pullGrant':
      return { $pull: { [`members.${plan.index}.grantedBy`]: grant } };
    case 'deactivate':
      // Kept, with an empty list: still group-derived, so gaining a group
      // again brings the member back, while a board admin's removal (which
      // drops grantedBy) is final.
      return { $set: { [`members.${plan.index}.isActive`]: false, [`members.${plan.index}.grantedBy`]: [] } };
    case 'makeDirect':
      return { $unset: { [`members.${plan.index}.grantedBy`]: '' } };
    default:
      return null;
  }
}

function groupIdsOf(list, idField) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(g => g && g[idField]).filter(id => typeof id === 'string' && id))];
}

/** The group ids gained and lost between two user.teams / user.orgs lists. */
function groupChanges(oldList, newList, idField) {
  const before = new Set(groupIdsOf(oldList, idField));
  const after = new Set(groupIdsOf(newList, idField));
  return {
    gained: [...after].filter(id => !before.has(id)),
    lost: [...before].filter(id => !after.has(id)),
  };
}

module.exports = { grantOf, isGroupDerived, planGain, planLoss, updateFor, groupChanges, ROLE_FLAGS_OFF };
