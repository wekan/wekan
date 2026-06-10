import Boards from '/models/boards';

export function allowIsBoardAdmin(userId, board) {
  return board && board.hasAdmin(userId);
}

export function allowIsBoardMember(userId, board) {
  return board && board.hasMember(userId);
}

export function allowIsAnyBoardMember(userId, boards) {
  return boards.some(board => {
    return board && board.hasMember(userId);
  });
}

export function allowIsBoardMemberCommentOnly(userId, board) {
  return board && board.hasMember(userId) && !board.hasReadOnly(userId) && !board.hasReadAssignedOnly(userId) && !board.hasNoComments(userId);
}

export function allowIsBoardMemberNoComments(userId, board) {
  return board && board.hasMember(userId) && !board.hasNoComments(userId);
}

// Check if user has write access to board (can create/edit cards and lists)
export function allowIsBoardMemberWithWriteAccess(userId, board) {
  return board && board.members && board.members.some(e => e.userId === userId && e.isActive && !e.isNoComments && !e.isCommentOnly && !e.isWorker && !e.isReadOnly && !e.isReadAssignedOnly);
}

// Write-access variant of allowIsAnyBoardMember: true if the user has write
// access on at least one of the boards. Used where an object (e.g. a Custom
// Field) spans several boards but read-only/comment-only/worker members must
// still be blocked from mutating it.
export function allowIsAnyBoardMemberWithWriteAccess(userId, boards) {
  return boards.some(board => allowIsBoardMemberWithWriteAccess(userId, board));
}

// Check if user has write access via a card's board
export async function allowIsBoardMemberWithWriteAccessByCard(userId, card) {
  const board = card && await Boards.findOneAsync(card.boardId);
  return allowIsBoardMemberWithWriteAccess(userId, board);
}

export async function allowIsBoardMemberByCard(userId, card) {
  const board = card && await Boards.findOneAsync(card.boardId);
  return board && board.hasMember(userId);
}

// Policy: can a user update a board's 'sort' field?
// Requirements:
//  - user must be authenticated
//  - update must include 'sort' field
//  - user must be a member of the board
export function canUpdateBoardSort(userId, board, fieldNames) {
  return !!userId && (fieldNames || []).includes('sort') && allowIsBoardMember(userId, board);
}

// Issue #5998: the REST board-member endpoints historically took eight separate
// boolean permission flags. They now also accept a single named `role`, which
// this helper maps to that flag set. Returns null for an unknown role so callers
// can return a 400. All flags default to false; 'normal'/'member' means a plain
// board member (all flags false).
export const BOARD_MEMBER_ROLE_FLAGS = [
  'isAdmin',
  'isNoComments',
  'isCommentOnly',
  'isWorker',
  'isNormalAssignedOnly',
  'isCommentAssignedOnly',
  'isReadOnly',
  'isReadAssignedOnly',
];

export function boardMemberRoleToFlags(role) {
  const flags = {};
  BOARD_MEMBER_ROLE_FLAGS.forEach(flag => {
    flags[flag] = false;
  });
  const normalized = String(role || '').trim().toLowerCase();
  const roleMap = {
    admin: 'isAdmin',
    nocomments: 'isNoComments',
    comment: 'isCommentOnly',
    commentonly: 'isCommentOnly',
    worker: 'isWorker',
    normalassignedonly: 'isNormalAssignedOnly',
    commentassignedonly: 'isCommentAssignedOnly',
    readonly: 'isReadOnly',
    readassignedonly: 'isReadAssignedOnly',
  };
  if (normalized === 'normal' || normalized === 'member') {
    return flags;
  }
  if (Object.prototype.hasOwnProperty.call(roleMap, normalized)) {
    flags[roleMap[normalized]] = true;
    return flags;
  }
  return null;
}

// Copy/Move endpoints accept a 0-based target position counted from the top
// (top-left), e.g. "place after N items". This converts that index into a
// numeric `sort` value placed between the existing siblings, so callers don't
// have to know WeKan's fractional sort scheme. `siblings` must be the
// destination items (EXCLUDING the item being moved) sorted ascending by sort.
export function computeSortForIndex(siblings, position) {
  const list = Array.isArray(siblings) ? siblings : [];
  if (list.length === 0) {
    return 0;
  }
  const sortValue = item =>
    typeof item.sort === 'number' && !Number.isNaN(item.sort) ? item.sort : 0;
  const index = Number.isFinite(position) ? Math.max(0, Math.floor(position)) : list.length;
  if (index <= 0) {
    return sortValue(list[0]) - 1;
  }
  if (index >= list.length) {
    return sortValue(list[list.length - 1]) + 1;
  }
  return (sortValue(list[index - 1]) + sortValue(list[index])) / 2;
}

// Issue #5819: merge label ids on a card — keep existing labels, drop the ones
// in removeLabelIds, add the ones in addLabelIds, de-duplicated and order-stable.
// Pure function so the bulk-labels behavior is unit-testable.
export function mergeLabelIds(currentLabelIds, addLabelIds = [], removeLabelIds = []) {
  const current = Array.isArray(currentLabelIds) ? currentLabelIds : [];
  const add = Array.isArray(addLabelIds) ? addLabelIds : [];
  const removeSet = new Set(Array.isArray(removeLabelIds) ? removeLabelIds : []);
  return Array.from(new Set([...current.filter(id => !removeSet.has(id)), ...add]));
}

// Issue #5998: a board member may only be assigned to a card (as member or
// assignee) when they are an active member of that card's board.
export function canAssignCardMember(board, userId) {
  return !!board && !!userId && board.hasMember(userId);
}

// Issue #5846: a card date (received/start/due/end) is CLEARED when the request
// supplies an empty string, null, or the literal "null"; any other value SETS
// it. Pure so the add/remove-date behavior is unit-testable.
export function isCardDateClear(value) {
  return value === '' || value === null || value === 'null';
}
