allowIsBoardAdmin = function(userId, board) {
  return board && board.hasAdmin(userId);
};

allowIsBoardMember = function(userId, board) {
  return board && board.hasMember(userId);
};

allowIsAnyBoardMember = function(userId, boards) {
  return _.some(boards, (board) => {
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
