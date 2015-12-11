/* global JsonRoutes */
if(Meteor.isServer) {
  console.log(`userId is ${this.userId}`);
  JsonRoutes.add('get', '/api/b/:id', function (req, res) {
    const id = req.params.id;
    const board = Boards.findOne(id);
    //if(Meteor.userId() && allowIsBoardMember(Meteor.userId(), board)) {
    const exporter = new Exporter(id);
    JsonRoutes.sendResult(res, 200, exporter.build());
    //} else {
    //  // 403 = forbidden
    //  JsonRoutes.sendError(res, 403);
    //}
  });
}

Meteor.methods({
  exportBoard(boardId) {
    const board = Boards.findOne(boardId);
//    //if(Meteor.userId() && allowIsBoardMember(Meteor.userId(), board)) {
    const exporter = new Exporter(boardId);
    return exporter.build();
  }
});

class Exporter {
  constructor(boardId) {
    this._boardId = boardId;
  }

  build() {
    const byBoard = {boardId: this._boardId};
    const fields = {fields: {boardId: 0}};
    const result = Boards.findOne(this._boardId);
    result.lists = Lists.find(byBoard, fields).fetch();
    result.cards = Cards.find(byBoard, fields).fetch();
    result.comments = CardComments.find(byBoard, fields).fetch();
    result.activities = Activities.find(byBoard, fields).fetch();

    // we also have to export some user data - as the other elements only include id
    // but we have to be careful:
    // 1- only exports users that are linked somehow to that board
    // 2- do not export any sensitive information
    const users = {};
    result.members.forEach((member) => {users[member.userId] = true;});
    result.lists.forEach((list) => {users[list.userId] = true;});
    result.cards.forEach((card) => {
      users[card.userId] = true;
      if (card.members) {
        card.members.forEach((memberId) => {users[memberId] = true;});
      }
    });
    result.comments.forEach((comment) => {users[comment.userId] = true;});
    result.activities.forEach((activity) => {users[activity.userId] = true;});
    const byUserIds = {_id: {$in: Object.getOwnPropertyNames(users)}};
    // we use whitelist to be sure we do not expose inadvertently
    // some secret fields that gets added to User later.
    const userFields = {fields: {
      _id: 1,
      username: 1,
      'profile.fullname': 1,
      'profile.initials': 1,
      'profile.avatarUrl': 1,
    }};
    result.users = Users.find(byUserIds, userFields).fetch();
    //return JSON.stringify(result);
    return result;
  }
}
