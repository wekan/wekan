Meteor.publish('boardLists', (board) => {
  check(board, String);
  return Lists.find({boardId: board, archived: false});
})