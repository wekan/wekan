allowIsBoardAdmin = function(userId, board) {
  return board && board.hasAdmin(userId);
};

allowIsBoardMember = function(userId, board) {
  return board && board.hasMember(userId);
};

allowIsAnyBoardMember = function(userId, boards) {
  return _.some(boards, board => {
    return board && board.hasMember(userId);
  });
};

allowIsBoardMemberCommentOnly = function(userId, board) {
  return board && board.hasMember(userId) && !board.hasReadOnly(userId) && !board.hasReadAssignedOnly(userId) && !board.hasNoComments(userId);
};

allowIsBoardMemberNoComments = function(userId, board) {
  return board && board.hasMember(userId) && !board.hasNoComments(userId);
};

// Check if user has write access to board (can create/edit cards and lists)
allowIsBoardMemberWithWriteAccess = function(userId, board) {
  return board && board.members && board.members.some(e => e.userId === userId && e.isActive && !e.isNoComments && !e.isCommentOnly && !e.isWorker && !e.isReadOnly && !e.isReadAssignedOnly);
};

// Check if user has write access via a card's board
allowIsBoardMemberWithWriteAccessByCard = function(userId, card) {
  const board = card && Boards.findOne(card.boardId);
  return allowIsBoardMemberWithWriteAccess(userId, board);
};

allowIsBoardMemberByCard = function(userId, card) {
  const board = card && Boards.findOne(card.boardId);
  return board && board.hasMember(userId);
};

// Policy: can a user update a board's 'sort' field?
// Requirements:
//  - user must be authenticated
//  - update must include 'sort' field
//  - user must be a member of the board
canUpdateBoardSort = function(userId, board, fieldNames) {
  return !!userId && _.contains(fieldNames || [], 'sort') && allowIsBoardMember(userId, board);
};
