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
