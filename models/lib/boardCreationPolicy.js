// CreateBleed (GHSA-qcfm-2g4w-wqcc), #4475: who may create a board while
// Admin Panel -> Settings -> Visibility -> "Only admins can create boards"
// (tableVisibilityMode-boardCreationAdminOnly) is on.
//
// The decision, as arithmetic: no server, no database. Every path that makes a
// new WORKING board asks it through server/lib/boardCreationGuard.js -
// createBoardWithInitialSwimlanes, a client Boards.insert, POST /api/boards,
// importBoard (the UI's and both REST import routes), cloneBoard, copyBoard
// and createBoardFromCard. Only the first of them used to read the setting.
//
// A board TEMPLATE (type 'template-board') is not a working board: a member
// keeps their Templates board, and making a working board from a template is
// copyBoard with type 'board', which this refuses. Boards WeKan makes itself -
// a user's Templates container, a board's default subtasks board - are not
// "created by the user" and never ask.

const TEMPLATE_TYPES = new Set(['template-board']);

// The type a new board will have; none means a working board, as the schema
// defaults it.
function boardTypeOf(type) {
  return typeof type === 'string' && type ? type : 'board';
}

// May this user create a board of this type?
//   adminOnly: the setting's booleanValue
//   isAdmin:   the user's isAdmin (only `true` counts)
//   type:      the new board's type
function boardCreationAllowed({ adminOnly, isAdmin, type } = {}) {
  if (adminOnly !== true) return true;
  if (isAdmin === true) return true;
  return TEMPLATE_TYPES.has(boardTypeOf(type));
}

module.exports = { boardCreationAllowed, boardTypeOf, TEMPLATE_TYPES };
