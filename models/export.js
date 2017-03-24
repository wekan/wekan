/* global JsonRoutes */
if(Meteor.isServer) {
  // todo XXX once we have a real API in place, move that route there
  // todo XXX also  share the route definition between the client and the server
  // so that we could use something like
  // `ApiRoutes.path('boards/export', boardId)``
  // on the client instead of copy/pasting the route path manually between the
  // client and the server.
  /*
   * This route is used to export the board FROM THE APPLICATION.
   * If user is already logged-in, pass loginToken as param "authToken":
   * '/api/boards/:boardId?authToken=:token'
   *
   * See https://blog.kayla.com.au/server-side-route-authentication-in-meteor/
   * for detailed explanations
   */
  JsonRoutes.add('get', '/api/boards/:boardId', function (req, res) {
    const boardId = req.params.boardId;
    let user = null;
    // todo XXX for real API, first look for token in Authentication: header
    // then fallback to parameter
    const loginToken = req.query.authToken;
    if (loginToken) {
      const hashToken = Accounts._hashLoginToken(loginToken);
      user = Meteor.users.findOne({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
    }

    const exporter = new Exporter(boardId);
    if(exporter.canExport(user)) {
      JsonRoutes.sendResult(res, 200, exporter.build());
    } else {
      // we could send an explicit error message, but on the other hand the only
      // way to get there is by hacking the UI so let's keep it raw.
      JsonRoutes.sendResult(res, 403);
    }
  });
}

class Exporter {
  constructor(boardId) {
    this._boardId = boardId;
  }

  build() {
    const byBoard = {boardId: this._boardId};
    // we do not want to retrieve boardId in related elements
    const noBoardId = {fields: {boardId: 0}};
    const result = {
      _format: 'wekan-board-1.0.0',
    };
    _.extend(result, Boards.findOne(this._boardId, {fields: {stars: 0}}));
    result.lists = Lists.find(byBoard, noBoardId).fetch();
    result.cards = Cards.find(byBoard, noBoardId).fetch();
    result.comments = CardComments.find(byBoard, noBoardId).fetch();
    result.activities = Activities.find(byBoard, noBoardId).fetch();
    // for attachments we only export IDs and absolute url to original doc
    result.attachments = Attachments.find(byBoard).fetch().map((attachment) => {
      return {
        _id: attachment._id,
        cardId: attachment.cardId,
        url: FlowRouter.url(attachment.url()),
      };
    });

    // we also have to export some user data - as the other elements only
    // include id but we have to be careful:
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
    result.users = Users.find(byUserIds, userFields).fetch().map((user) => {
      // user avatar is stored as a relative url, we export absolute
      if(user.profile.avatarUrl) {
        user.profile.avatarUrl = FlowRouter.url(user.profile.avatarUrl);
      }
      return user;
    });
    return result;
  }

  canExport(user) {
    const board = Boards.findOne(this._boardId);
    return board && board.isVisibleBy(user);
  }
}
