allowIsBoardAdmin = function(userId, board) {
  const admins = _.pluck(_.where(board.members, {isAdmin: true}), 'userId');
  return _.contains(admins, userId);
};

allowIsBoardMember = function(userId, board) {
  return _.contains(_.pluck(board.members, 'userId'), userId);
};

allowIsOrgAdmin = function(userId, org) {
  let admins = _.pluck(_.where(org.members, {isAdmin: true}), 'userId');
  return _.contains(admins, userId);
};

allowIsOrgMember = function(userId, org) {
  return _.contains(_.pluck(org.members, 'userId'), userId);
};

