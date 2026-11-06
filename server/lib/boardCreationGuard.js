import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
const { boardCreationAllowed, boardTypeOf } = require('/models/lib/boardCreationPolicy');

// CreateBleed (GHSA-qcfm-2g4w-wqcc), #4475: "Only admins can create boards"
// was enforced only in createBoardWithInitialSwimlanes. A non-admin still
// created boards by a client Boards.insert, POST /api/boards, both board
// import routes and importBoard, cloneBoard, copyBoard and
// createBoardFromCard. Every one of them now asks here, before it writes;
// the decision itself is models/lib/boardCreationPolicy.js.

const SETTING_ID = 'tableVisibilityMode-boardCreationAdminOnly';

async function decide(userId, type) {
  const setting = await TableVisibilityModeSettings.findOneAsync(SETTING_ID);
  const adminOnly = setting?.booleanValue === true;
  if (!adminOnly) return true;
  const user = userId ? await ReactiveCache.getUser(userId) : null;
  return boardCreationAllowed({ adminOnly, isAdmin: user?.isAdmin, type });
}

function record(userId, source, type) {
  // Only refused attempts reach here: the Add Board buttons, Import, Clone,
  // Duplicate and "Create board from card" are hidden for a non-admin while
  // the setting is on (client/lib/boardCreationAllowed.js).
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.board-creation', action: 'blocked', source, userId,
      detail: `Board creation refused: only admins may create boards (type ${boardTypeOf(type)}).`,
    });
  } catch (e) { /* logging must never break the guard */ }
}

// For a method or a REST route: throws not-authorized when refused.
export async function assertMayCreateBoard(userId, { source, type } = {}) {
  if (await decide(userId, type)) return;
  record(userId, source, type);
  const error = new Meteor.Error('not-authorized', 'Board creation is restricted to admins.');
  // A REST route answers it as 403 (server/lib/apiResponseHelpers.js
  // httpStatusForError), not as the 500 an unknown Meteor.Error becomes.
  error.statusCode = 403;
  throw error;
}

// For an allow/deny rule, which answers rather than throws: true when allowed.
export async function mayCreateBoard(userId, { source, type } = {}) {
  if (await decide(userId, type)) return true;
  record(userId, source, type);
  return false;
}
