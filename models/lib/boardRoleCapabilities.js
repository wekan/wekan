'use strict';

// What each board role may do — the ONE table, in code.
//
// It used to be spelled out three times: once in the server allow helpers
// (server/lib/utils.js), once in the client's canModify* helpers
// (client/lib/utils.js), and once in prose in the docs. The three had drifted, and
// each place they disagreed was a role that did not do what its name says. So the
// matrix lives here, everything else reads it, and there is nowhere for a fourth
// opinion to appear.
//
// Read by: server/lib/utils.js (the authority), client/lib/utils.js (what the UI
// offers), Admin Panel / People / Roles (the Roles Status table), and
// docs/Features/Members/Roles.md through tests/boardRoles.test.cjs.
//
// Pure: no Meteor, no DOM, no database.

// The roles, in the order they are shown to a person: most power first.
const BOARD_ROLES = [
  'board-admin',
  'normal',
  'normal-assigned-only',
  'no-comments',
  'comment-only',
  'comment-assigned-only',
  'worker',
  'read-only',
  'read-assigned-only',
];

// The member flag that names each role. 'normal' is the absence of all of them.
const ROLE_FLAGS = {
  'board-admin': 'isAdmin',
  'normal-assigned-only': 'isNormalAssignedOnly',
  'no-comments': 'isNoComments',
  'comment-only': 'isCommentOnly',
  'comment-assigned-only': 'isCommentAssignedOnly',
  'worker': 'isWorker',
  'read-only': 'isReadOnly',
  'read-assigned-only': 'isReadAssignedOnly',
};

// The capabilities, one column each.
//
//   seesAllCards  false = only the cards the member is assigned to. Enforced by
//                 the card publications, not by an allow rule.
//   comment       add a card comment or a comment reaction.
//   write         create and edit cards, lists, swimlanes, checklists — and MOVE
//                 a card, because a move is a card update and goes through the
//                 same rule.
//   manageBoard   the board's settings, its members and their roles.
//   moveCard      move a card between lists/swimlanes, and put your OWN name in
//                 or out of its assignees. It is a subset of `write` for every
//                 role that has `write` - and it is the whole of what a Worker
//                 may do to a card (#3189, models/lib/workerCardWrite.js).
const CAPABILITIES = ['seesAllCards', 'comment', 'write', 'manageBoard', 'moveCard'];

const ROLE_CAPABILITIES = {
  'board-admin':           { seesAllCards: true,  comment: true,  write: true,  manageBoard: true,  moveCard: true },
  'normal':                { seesAllCards: true,  comment: true,  write: true,  manageBoard: false, moveCard: true },
  'normal-assigned-only':  { seesAllCards: false, comment: true,  write: true,  manageBoard: false, moveCard: true },
  // "No comments" is the one that blocks COMMENTING. It used to block writing as
  // well, which made it a second read-only role under a name that says otherwise.
  'no-comments':           { seesAllCards: true,  comment: false, write: true,  manageBoard: false, moveCard: true },
  'comment-only':          { seesAllCards: true,  comment: true,  write: false, manageBoard: false, moveCard: false },
  // ...and this is "comment only" plus the assigned-cards restriction. It used to
  // have full write access, because nothing outside the card publications read
  // its flag — so it was really "normal, assigned only" under another name.
  'comment-assigned-only': { seesAllCards: false, comment: true,  write: false, manageBoard: false, moveCard: false },
  // A Worker is meant to "move card, assign himself to card and comment" (the
  // board schema's own words). `write` stays false - the role is not "can edit
  // cards" - and the two writes it IS for are now their own capability, enforced
  // field by field on the server by models/lib/workerCardWrite.js (#3189). That
  // is the field-level policy this line used to say was missing.
  'worker':                { seesAllCards: true,  comment: true,  write: false, manageBoard: false, moveCard: true },
  'read-only':             { seesAllCards: true,  comment: false, write: false, manageBoard: false, moveCard: false },
  'read-assigned-only':    { seesAllCards: false, comment: false, write: false, manageBoard: false, moveCard: false },
};

// The role of ONE member document. The order matters and matches
// Board.memberRole(): a member carries a single flag in practice
// (setMemberPermission writes all of them at once), but the REST API can set
// several, and then the strongest wins — `isAdmin` above all, which is why every
// other flag on an admin is ignored here just as it is in Board.hasCommentOnly()
// and the rest of the has*() helpers.
function memberRoleOf(member) {
  if (!member || member.isActive !== true) return null;
  if (member.isAdmin) return 'board-admin';
  for (const role of BOARD_ROLES) {
    const flag = ROLE_FLAGS[role];
    if (flag && flag !== 'isAdmin' && member[flag]) return role;
  }
  return 'normal';
}

// May a member with this role do this? An unknown role or capability is `false`:
// a permission question with no answer is a no.
function roleCan(role, capability) {
  const caps = ROLE_CAPABILITIES[role];
  if (!caps) return false;
  return caps[capability] === true;
}

// May THIS member of THIS board do it? `members` is board.members.
function memberCan(members, userId, capability) {
  if (!userId || !Array.isArray(members)) return false;
  const member = members.find(m => m && m.userId === userId && m.isActive === true);
  return roleCan(memberRoleOf(member), capability);
}

module.exports = {
  BOARD_ROLES,
  ROLE_FLAGS,
  CAPABILITIES,
  ROLE_CAPABILITIES,
  memberRoleOf,
  roleCan,
  memberCan,
};
