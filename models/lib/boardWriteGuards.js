'use strict';

// GroupLinkBleed (GHSA-v544-rmr5-38gx): which client writes to a board skip a
// check that only a Meteor method makes. Used by the Boards.deny rules in
// server/permissions/boards.js. Pure: tests/groupLinkBleed.test.cjs.

// orgs, teams and domains are written only by setBoardOrgs, setBoardTeams and
// setBoardDomains (#5141 own groups only, #5850 domain validation).
const GROUP_LINK_FIELDS = ['orgs', 'teams', 'domains'];

function isGroupLinkField(field) {
  if (typeof field !== 'string') return false;
  return GROUP_LINK_FIELDS.some(f => field === f || field.startsWith(`${f}.`));
}

// A client board insert carrying any group link. The UI creates a board with
// none and adds them through the methods afterwards.
function groupLinksInInsert(doc) {
  return GROUP_LINK_FIELDS.some(f => doc && Array.isArray(doc[f]) && doc[f].length > 0);
}

// Members may be changed from the client (role changes, removal), never added:
// adding goes through inviteUserToBoard. Allowed shapes:
//   $set  members.<i>.<field>  for an existing index, not changing userId
//   $set  members.<i>          an entry keeping the same userId
//   $set  members              an array whose userIds were all on the board
//   $unset, $pull, $pullAll, $pop  (remove only)
// Everything else that touches members - $push, $addToSet, $setOnInsert, an
// index past the end, a positional or non-numeric index, a new userId - adds.
// So does switching a removed (inactive) member back on: removal keeps the
// entry with isActive false, and bringing it back is an invitation too.
const MEMBER_SAFE_OPS = ['$set', '$unset', '$pull', '$pullAll', '$pop'];
const isMembersPath = p => p === 'members' || p.startsWith('members.');

function addsBoardMember(doc, modifier) {
  const current = (doc && Array.isArray(doc.members)) ? doc.members : [];
  const ids = new Set(current.map(m => m && m.userId).filter(Boolean));
  const inactive = new Set(current.filter(m => m && m.userId && m.isActive !== true).map(m => m.userId));
  const reactivates = m => m && m.isActive === true && inactive.has(m.userId);
  for (const [op, args] of Object.entries(modifier || {})) {
    if (!args || typeof args !== 'object') continue;
    if (op === '$rename') {
      if (Object.keys(args).some(isMembersPath) || Object.values(args).some(v => typeof v === 'string' && isMembersPath(v))) return true;
      continue;
    }
    const paths = Object.keys(args).filter(isMembersPath);
    if (!paths.length) continue;
    if (!MEMBER_SAFE_OPS.includes(op)) return true;
    if (op !== '$set') continue;
    for (const path of paths) {
      const value = args[path];
      const parts = path.split('.');
      if (parts.length === 1) {
        if (!Array.isArray(value) || value.some(m => !m || !ids.has(m.userId) || reactivates(m))) return true;
        continue;
      }
      if (!/^\d+$/.test(parts[1])) return true;
      const i = Number(parts[1]);
      if (i >= current.length) return true;
      const existing = current[i] && current[i].userId;
      if (parts.length === 2) {
        if (!value || typeof value !== 'object' || value.userId !== existing || reactivates(value)) return true;
        continue;
      }
      if (parts[2] === 'userId') return true;
      if (parts.length === 3 && parts[2] === 'isActive' && value === true && inactive.has(existing)) return true;
    }
  }
  return false;
}

module.exports = { GROUP_LINK_FIELDS, isGroupLinkField, groupLinksInInsert, addsBoardMember };
