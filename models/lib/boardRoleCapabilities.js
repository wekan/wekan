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

// ── Custom roles (#3022) ─────────────────────────────────────────────────────
//
// An administrator can define named roles in Admin Panel / People / Roles, each
// a set of the capabilities below (models/customBoardRoles.js). A board member
// given one carries `customRoleId`, and its role key is `custom:<id>`.
//
// What a custom role can NOT be is a board admin: `manageBoard` stays with the
// built-in board-admin role, which has rules of its own (a board always keeps
// one). So a custom role chooses from these:
const CUSTOM_ROLE_CAPABILITIES = ['seesAllCards', 'comment', 'write', 'moveCard', 'inviteToBoard'];
const CUSTOM_ROLE_PREFIX = 'custom:';

// Where custom roles are looked up: set once by the server (an in-memory copy
// kept current from the collection) and the client (the published collection,
// so it is reactive). Until then there are none, and every custom role key is
// unknown - and an unknown role may do nothing.
let customRoleLookup = () => null;
function setCustomRoleLookup(fn) {
  customRoleLookup = typeof fn === 'function' ? fn : () => null;
}

// A custom role's capabilities, cleaned: only the known ones, only booleans,
// and `write` brings `moveCard` with it, as it does for every built-in role -
// moving a card IS writing it.
function normalizeCustomCapabilities(input) {
  const caps = {};
  for (const cap of CUSTOM_ROLE_CAPABILITIES) caps[cap] = !!(input && input[cap] === true);
  if (caps.write) caps.moveCard = true;
  caps.manageBoard = false;
  return caps;
}

function customRoleCapabilities(roleKey) {
  if (typeof roleKey !== 'string' || !roleKey.startsWith(CUSTOM_ROLE_PREFIX)) return null;
  const id = roleKey.slice(CUSTOM_ROLE_PREFIX.length);
  if (!id) return null;
  let doc = null;
  try {
    doc = customRoleLookup(id);
  } catch (e) {
    doc = null;
  }
  return doc ? normalizeCustomCapabilities(doc.capabilities) : null;
}

// The built-in role a member with this custom role ALSO carries in the old
// per-role flags: the most capable built-in role that can do nothing the custom
// role cannot. Code that still reads a flag directly therefore never grants more
// than the custom role does, and a member whose custom role is deleted keeps
// exactly that much. Ties go to the order of BOARD_ROLES.
const FALLBACK_CAPABILITIES = ['seesAllCards', 'comment', 'write', 'moveCard'];
function fallbackRoleFor(capabilities) {
  const caps = normalizeCustomCapabilities(capabilities);
  let best = 'read-assigned-only';
  let bestCount = -1;
  for (const role of BOARD_ROLES) {
    if (role === 'board-admin') continue;
    const builtIn = ROLE_CAPABILITIES[role];
    if (!FALLBACK_CAPABILITIES.every(cap => !builtIn[cap] || caps[cap])) continue;
    const count = FALLBACK_CAPABILITIES.filter(cap => builtIn[cap]).length;
    if (count > bestCount) {
      best = role;
      bestCount = count;
    }
  }
  return best;
}

// The built-in role a custom role BEHAVES like where code asks for a role by
// name (Board.hasWorker, currentUser.isCommentOnly, ...): what it may do to a
// card decides, and seeing only assigned cards picks the assigned variant.
// Unlike fallbackRoleFor this may grant what the role has - a custom role that
// moves but does not write is a Worker here, because moving is what a Worker
// may do. It never grants writing or moving the role lacks; commenting is
// never asked by role name (the comment form, reactions and the server all
// ask the `comment` capability), so a Worker's comments do not come with it.
// The one place it
// is wider is seeing cards: a role that writes without commenting and sees
// only assigned cards has no built-in twin and reads as No comments - but
// which cards a member sees is decided on the server from the fallback flags,
// which are assigned-only for it, not from this.
function uiRoleFor(capabilities) {
  const caps = normalizeCustomCapabilities(capabilities);
  if (caps.write) {
    if (caps.comment) return caps.seesAllCards ? 'normal' : 'normal-assigned-only';
    return 'no-comments';
  }
  if (caps.moveCard) return 'worker';
  if (caps.comment) return caps.seesAllCards ? 'comment-only' : 'comment-assigned-only';
  return caps.seesAllCards ? 'read-only' : 'read-assigned-only';
}

// The eight per-role flags of a board member for one BUILT-IN role: that
// role's flag set, every other one cleared ('normal' clears them all).
function flagsForRole(role) {
  const flags = {};
  for (const flag of Object.values(ROLE_FLAGS)) flags[flag] = false;
  if (ROLE_FLAGS[role]) flags[ROLE_FLAGS[role]] = true;
  return flags;
}

// The role of ONE member document. The order matters and matches
// Board.memberRole(): a member carries a single flag in practice
// (setMemberPermission writes all of them at once), but the REST API can set
// several, and then the strongest wins — `isAdmin` above all, which is why every
// other flag on an admin is ignored here just as it is in Board.hasCommentOnly()
// and the rest of the has*() helpers.
function memberRoleOf(member) {
  if (!member || member.isActive !== true) return null;
  if (member.isAdmin) return 'board-admin';
  // A custom role that still exists; a deleted one leaves the fallback flags.
  if (member.customRoleId) {
    const key = CUSTOM_ROLE_PREFIX + member.customRoleId;
    if (customRoleCapabilities(key)) return key;
  }
  for (const role of BOARD_ROLES) {
    const flag = ROLE_FLAGS[role];
    if (flag && flag !== 'isAdmin' && member[flag]) return role;
  }
  return 'normal';
}

// May a member with this role do this? An unknown role or capability is `false`:
// a permission question with no answer is a no.
function roleCan(role, capability) {
  const custom = customRoleCapabilities(role);
  if (custom) return custom[capability] === true;
  const caps = ROLE_CAPABILITIES[role];
  if (!caps) return false;
  return caps[capability] === true;
}

// ── Boards every signed-in user may edit (#4575) ─────────────────────────────
//
// A board admin can let every signed-in user edit an open board ('instance' or
// 'public') - but only where Admin Panel / Settings / Visibility allows it
// (tableVisibilityMode-allowInstanceEditing). Such a user may then write,
// comment and move cards like a Normal member, never manage the board; and
// their first edit makes them one (server/instanceEditingJoin.js), so what they
// changed is attributed to a member. The allowance is looked up like the
// custom roles: the server keeps it current, the client reads the setting.
const INSTANCE_EDITING_CAPABILITIES = ['comment', 'write', 'moveCard'];
let instanceEditingLookup = () => false;
function setInstanceEditingLookup(fn) {
  instanceEditingLookup = typeof fn === 'function' ? fn : () => false;
}

function instanceEditable(board) {
  if (!board || Array.isArray(board) || board.allowsInstanceEditing !== true || board.archived === true) return false;
  if (board.permission !== 'instance' && board.permission !== 'public') return false;
  try {
    return instanceEditingLookup() === true;
  } catch (e) {
    return false;
  }
}

// May THIS user do it on THIS board? The first argument is the board, or -
// as callers have long passed - only its members, which then knows nothing
// of the board's own settings. A member is judged by their role; a signed-in
// non-member only by the board letting everybody edit it.
function memberCan(boardOrMembers, userId, capability) {
  if (!userId || !boardOrMembers) return false;
  const members = Array.isArray(boardOrMembers) ? boardOrMembers : boardOrMembers.members;
  if (!Array.isArray(members)) return false;
  const member = members.find(m => m && m.userId === userId && m.isActive === true);
  if (member) return roleCan(memberRoleOf(member), capability);
  // An inactive entry is somebody a board admin removed: that decision stands.
  if (members.some(m => m && m.userId === userId)) return false;
  return instanceEditable(boardOrMembers) && INSTANCE_EDITING_CAPABILITIES.includes(capability);
}

module.exports = {
  BOARD_ROLES,
  ROLE_FLAGS,
  CAPABILITIES,
  ROLE_CAPABILITIES,
  memberRoleOf,
  roleCan,
  memberCan,
  CUSTOM_ROLE_CAPABILITIES,
  CUSTOM_ROLE_PREFIX,
  setCustomRoleLookup,
  normalizeCustomCapabilities,
  customRoleCapabilities,
  fallbackRoleFor,
  flagsForRole,
  uiRoleFor,
  INSTANCE_EDITING_CAPABILITIES,
  setInstanceEditingLookup,
  instanceEditable,
};
