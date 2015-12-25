Users = Meteor.users; // eslint-disable-line meteor/collections

// Search a user in the complete server database by its name or username. This
// is used for instance to add a new user to a board.
const searchInFields = ['username', 'profile.fullname'];
Users.initEasySearch(searchInFields, {
  use: 'mongo-db',
  returnFields: [...searchInFields, 'profile.avatarUrl'],
});

if (Meteor.isClient) {
  Users.helpers({
    isBoardMember() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasMember(this._id);
    },

    isBoardAdmin() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasAdmin(this._id);
    },
  });
}

Users.helpers({
  boards() {
    return Boards.find({ userId: this._id });
  },

  starredBoards() {
    const {starredBoards = []} = this.profile;
    return Boards.find({archived: false, _id: {$in: starredBoards}});
  },

  hasStarred(boardId) {
    const {starredBoards = []} = this.profile;
    return _.contains(starredBoards, boardId);
  },

  invitedBoards() {
    const {invitedBoards = []} = this.profile;
    return Boards.find({archived: false, _id: {$in: invitedBoards}});
  },

  isInvitedTo(boardId) {
    const {invitedBoards = []} = this.profile;
    return _.contains(invitedBoards, boardId);
  },

  hasTag(tag) {
    const {tags = []} = this.profile;
    return _.contains(tags, tag);
  },

  getAvatarUrl() {
    // Although we put the avatar picture URL in the `profile` object, we need
    // to support Sandstorm which put in the `picture` attribute by default.
    // XXX Should we move both cases to `picture`?
    if (this.picture) {
      return this.picture;
    } else if (this.profile && this.profile.avatarUrl) {
      return this.profile.avatarUrl;
    } else {
      return null;
    }
  },

  getInitials() {
    const profile = this.profile || {};
    if (profile.initials)
      return profile.initials;

    else if (profile.fullname) {
      return profile.fullname.split(/\s+/).reduce((memo = '', word) => {
        return memo + word[0];
      }).toUpperCase();

    } else {
      return this.username[0].toUpperCase();
    }
  },

  getName() {
    const profile = this.profile || {};
    return profile.fullname || this.username;
  },

  getLanguage() {
    const profile = this.profile || {};
    return profile.language || 'en';
  },
});

Users.mutations({
  toggleBoardStar(boardId) {
    const queryKind = this.hasStarred(boardId) ? '$pull' : '$addToSet';
    return {
      [queryKind]: {
        'profile.starredBoards': boardId,
      },
    };
  },

  addInvite(boardId) {
    return {
      $addToSet: {
        'profile.invitedBoards': boardId,
      },
    };
  },

  removeInvite(boardId) {
    return {
      $pull: {
        'profile.invitedBoards': boardId,
      },
    };
  },

  addTag(tag) {
    return {
      $addToSet: {
        'profile.tags': tag,
      },
    };
  },

  removeTag(tag) {
    return {
      $pull: {
        'profile.tags': tag,
      },
    };
  },

  toggleTag(tag) {
    if (this.hasTag(tag))
      this.removeTag(tag);
    else
      this.addTag(tag);
  },

  setAvatarUrl(avatarUrl) {
    return { $set: { 'profile.avatarUrl': avatarUrl }};
  },
});

Meteor.methods({
  setUsername(username) {
    check(username, String);
    const nUsersWithUsername = Users.find({ username }).count();
    if (nUsersWithUsername > 0) {
      throw new Meteor.Error('username-already-taken');
    } else {
      Users.update(this.userId, {$set: { username }});
    }
  },
});

if (Meteor.isServer) {
  Meteor.methods({
    // we accept userId, username, email
    inviteUserToBoard(username, boardId) {
      check(username, String);
      check(boardId, String);

      const inviter = Meteor.user();
      const board = Boards.findOne(boardId);
      const allowInvite = inviter &&
          board &&
          board.members &&
          _.contains(_.pluck(board.members, 'userId'), inviter._id) &&
          _.where(board.members, {userId: inviter._id})[0].isActive &&
          _.where(board.members, {userId: inviter._id})[0].isAdmin;
      if (!allowInvite) throw new Meteor.Error('error-board-notAMember');

      this.unblock();

      const posAt = username.indexOf('@');
      let user = null;
      if (posAt>=0) {
        user = Users.findOne({emails: {$elemMatch: {address: username}}});
      } else {
        user = Users.findOne(username) || Users.findOne({ username });
      }
      if (user) {
        if (user._id === inviter._id) throw new Meteor.Error('error-user-notAllowSelf');
      } else {
        if (posAt <= 0) throw new Meteor.Error('error-user-doesNotExist');

        const email = username;
        username = email.substring(0, posAt);
        const newUserId = Accounts.createUser({ username, email });
        if (!newUserId) throw new Meteor.Error('error-user-notCreated');
        // assume new user speak same language with inviter
        if (inviter.profile && inviter.profile.language) {
          Users.update(newUserId, {
            $set: {
              'profile.language': inviter.profile.language,
            },
          });
        }
        Accounts.sendEnrollmentEmail(newUserId);
        user = Users.findOne(newUserId);
      }

      board.addMember(user._id);
      user.addInvite(boardId);

      if (!process.env.MAIL_URL || (!Email)) return { username: user.username };

      try {
        const vars = {
          user: user.username,
          inviter: inviter.username,
          board: board.title,
          url: board.rootUrl(),
        };
        const lang = user.getLanguage();
        Email.send({
          to: user.emails[0].address,
          from: Accounts.emailTemplates.from,
          subject: TAPi18n.__('email-invite-subject', vars, lang),
          text: TAPi18n.__('email-invite-text', vars, lang),
        });
      } catch (e) {
        throw new Meteor.Error('email-fail', e.message);
      }

      return { username: user.username, email: user.emails[0].address };
    },
  });
}

Users.before.insert((userId, doc) => {
  doc.profile = doc.profile || {};

  if (!doc.username && doc.profile.name) {
    doc.username = doc.profile.name.toLowerCase().replace(/\s/g, '');
  }
});

if (Meteor.isServer) {
  // Let mongoDB ensure username unicity
  Meteor.startup(() => {
    Users._collection._ensureIndex({
      username: 1,
    }, { unique: true });
  });

  // Each board document contains the de-normalized number of users that have
  // starred it. If the user star or unstar a board, we need to update this
  // counter.
  // We need to run this code on the server only, otherwise the incrementation
  // will be done twice.
  Users.after.update(function(userId, user, fieldNames) {
    // The `starredBoards` list is hosted on the `profile` field. If this
    // field hasn't been modificated we don't need to run this hook.
    if (!_.contains(fieldNames, 'profile'))
      return;

    // To calculate a diff of board starred ids, we get both the previous
    // and the newly board ids list
    function getStarredBoardsIds(doc) {
      return doc.profile && doc.profile.starredBoards;
    }
    const oldIds = getStarredBoardsIds(this.previous);
    const newIds = getStarredBoardsIds(user);

    // The _.difference(a, b) method returns the values from a that are not in
    // b. We use it to find deleted and newly inserted ids by using it in one
    // direction and then in the other.
    function incrementBoards(boardsIds, inc) {
      boardsIds.forEach((boardId) => {
        Boards.update(boardId, {$inc: {stars: inc}});
      });
    }
    incrementBoards(_.difference(oldIds, newIds), -1);
    incrementBoards(_.difference(newIds, oldIds), +1);
  });

  // XXX i18n
  Users.after.insert((userId, doc) => {
    const ExampleBoard = {
      title: 'Welcome Board',
      userId: doc._id,
      permission: 'private',
    };

    // Insert the Welcome Board
    Boards.insert(ExampleBoard, (err, boardId) => {

      ['Basics', 'Advanced'].forEach((title) => {
        const list = {
          title,
          boardId,
          userId: ExampleBoard.userId,

          // XXX Not certain this is a bug, but we except these fields get
          // inserted by the Lists.before.insert collection-hook. Since this
          // hook is not called in this case, we have to dublicate the logic and
          // set them here.
          archived: false,
          createdAt: new Date(),
        };

        Lists.insert(list);
      });
    });
  });
}
