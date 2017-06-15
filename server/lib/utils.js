allowIsBoardAdmin = function(userId, board) {
  return board && board.hasAdmin(userId);
};

allowIsBoardMember = function(userId, board) {
  return board && board.hasMember(userId);
};

allowIsBoardMemberByCard = function(userId, card) {
  const board = card.board();
  return board && board.hasMember(userId);
};
