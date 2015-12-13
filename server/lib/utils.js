allowIsBoardAdmin = function(userId, board) {
  return board && board.hasAdmin(userId);
};

allowIsBoardMember = function(userId, board) {
  return board && board.hasMember(userId);
};
