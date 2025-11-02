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
  return board && board.hasMember(userId) && !board.hasCommentOnly(userId);
};

allowIsBoardMemberNoComments = function(userId, board) {
  return board && board.hasMember(userId) && !board.hasNoComments(userId);
};

allowIsBoardMemberByCard = function(userId, card) {
  const board = card.board();
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
