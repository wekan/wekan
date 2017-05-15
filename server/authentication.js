Meteor.startup(() => {
  Authentication = {};

  Authentication.checkUserId = function (userId) {
    if (userId === undefined) {
      const error = new Meteor.Error('Unauthorized', 'Unauthorized');
      error.statusCode = 401;
      throw error;
    }
    const admin = Users.findOne({ _id: userId, isAdmin: true });

    if (admin === undefined) {
      const error = new Meteor.Error('Forbidden', 'Forbidden');
      error.statusCode = 403;
      throw error;
    }

  };

  // This will only check if the user is logged in.
  // The authorization checks for the user will have to be done inside each API endpoint
  Authentication.checkLoggedIn = function(userId) {
    if(userId === undefined) {
      const error = new Meteor.Error('Unauthorized', 'Unauthorized');
      error.statusCode = 401;
      throw error;
    }
  };

  // An admin should be authorized to access everything, so we use a separate check for admins
  // This throws an error if otherReq is false and the user is not an admin
  Authentication.checkAdminOrCondition = function(userId, otherReq) {
    if(otherReq) return;
    const admin = Users.findOne({ _id: userId, isAdmin: true });
    if (admin === undefined) {
      const error = new Meteor.Error('Forbidden', 'Forbidden');
      error.statusCode = 403;
      throw error;
    }
  }

  // Helper function. Will throw an error if the user does not have read only access to the given board
  Authentication.checkBoardAccess = function(userId, boardId) {
    Authentication.checkLoggedIn(userId);

    const board = Boards.findOne({ _id: boardId });
    const normalAccess = board.permission === 'public' || board.members.some(e => e.userId === userId);
    Authentication.checkAdminOrCondition(userId, normalAccess);
  }

});

