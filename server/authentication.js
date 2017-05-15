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

});

