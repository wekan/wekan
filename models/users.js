import { SyncedCron } from 'meteor/percolate:synced-cron';

// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm =
  Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;
Users = Meteor.users;

const allowedSortValues = [
  '-modifiedAt',
  'modifiedAt',
  '-title',
  'title',
  '-sort',
  'sort',
];
const defaultSortBy = allowedSortValues[0];

/**
 * A User in wekan
 */
Users.attachSchema(
  new SimpleSchema({
    username: {
      /**
       * the username of the user
       */
      type: String,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          const name = this.field('profile.fullname');
          if (name.isSet) {
            return name.value.toLowerCase().replace(/\s/g, '');
          }
        }
      },
    },
    emails: {
      /**
       * the list of emails attached to a user
       */
      type: [Object],
      optional: true,
    },
    'emails.$.address': {
      /**
       * The email address
       */
      type: String,
      regEx: SimpleSchema.RegEx.Email,
    },
    'emails.$.verified': {
      /**
       * Has the email been verified
       */
      type: Boolean,
    },
    createdAt: {
      /**
       * creation date of the user
       */
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      denyUpdate: false,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    profile: {
      /**
       * profile settings
       */
      type: Object,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return {
            boardView: 'board-view-lists',
          };
        }
      },
    },
    'profile.avatarUrl': {
      /**
       * URL of the avatar of the user
       */
      type: String,
      optional: true,
    },
    'profile.emailBuffer': {
      /**
       * list of email buffers of the user
       */
      type: [String],
      optional: true,
    },
    'profile.fullname': {
      /**
       * full name of the user
       */
      type: String,
      optional: true,
    },
    'profile.showDesktopDragHandles': {
      /**
       * does the user want to hide system messages?
       */
      type: Boolean,
      optional: true,
    },
    'profile.hiddenSystemMessages': {
      /**
       * does the user want to hide system messages?
       */
      type: Boolean,
      optional: true,
    },
    'profile.hiddenMinicardLabelText': {
      /**
       * does the user want to hide minicard label texts?
       */
      type: Boolean,
      optional: true,
    },
    'profile.initials': {
      /**
       * initials of the user
       */
      type: String,
      optional: true,
    },
    'profile.invitedBoards': {
      /**
       * board IDs the user has been invited to
       */
      type: [String],
      optional: true,
    },
    'profile.language': {
      /**
       * language of the user
       */
      type: String,
      optional: true,
    },
    'profile.notifications': {
      /**
       * enabled notifications for the user
       */
      type: [Object],
      optional: true,
    },
    'profile.notifications.$.activity': {
      /**
       * The id of the activity this notification references
       */
      type: String,
    },
    'profile.notifications.$.read': {
      /**
       * the date on which this notification was read
       */
      type: Date,
      optional: true,
    },
    'profile.showCardsCountAt': {
      /**
       * showCardCountAt field of the user
       */
      type: Number,
      optional: true,
    },
    'profile.startDayOfWeek': {
      /**
       * startDayOfWeek field of the user
       */
      type: Number,
      optional: true,
    },
    'profile.starredBoards': {
      /**
       * list of starred board IDs
       */
      type: [String],
      optional: true,
    },
    'profile.icode': {
      /**
       * icode
       */
      type: String,
      optional: true,
    },
    'profile.boardView': {
      /**
       * boardView field of the user
       */
      type: String,
      optional: true,
      allowedValues: [
        'board-view-lists',
        'board-view-swimlanes',
        'board-view-cal',
      ],
    },
    'profile.listSortBy': {
      /**
       * default sort list for user
       */
      type: String,
      optional: true,
      defaultValue: defaultSortBy,
      allowedValues: allowedSortValues,
    },
    'profile.templatesBoardId': {
      /**
       * Reference to the templates board
       */
      type: String,
      defaultValue: '',
    },
    'profile.cardTemplatesSwimlaneId': {
      /**
       * Reference to the card templates swimlane Id
       */
      type: String,
      defaultValue: '',
    },
    'profile.listTemplatesSwimlaneId': {
      /**
       * Reference to the list templates swimlane Id
       */
      type: String,
      defaultValue: '',
    },
    'profile.boardTemplatesSwimlaneId': {
      /**
       * Reference to the board templates swimlane Id
       */
      type: String,
      defaultValue: '',
    },
    services: {
      /**
       * services field of the user
       */
      type: Object,
      optional: true,
      blackbox: true,
    },
    heartbeat: {
      /**
       * last time the user has been seen
       */
      type: Date,
      optional: true,
    },
    isAdmin: {
      /**
       * is the user an admin of the board?
       */
      type: Boolean,
      optional: true,
    },
    createdThroughApi: {
      /**
       * was the user created through the API?
       */
      type: Boolean,
      optional: true,
    },
    loginDisabled: {
      /**
       * loginDisabled field of the user
       */
      type: Boolean,
      optional: true,
    },
    authenticationMethod: {
      /**
       * authentication method of the user
       */
      type: String,
      optional: false,
      defaultValue: 'password',
    },
  }),
);

Users.allow({
  update(userId, doc) {
    const user = Users.findOne({ _id: userId });
    if ((user && user.isAdmin) || (Meteor.user() && Meteor.user().isAdmin))
      return true;
    if (!user) {
      return false;
    }
    return doc._id === userId;
  },
  remove(userId, doc) {
    const adminsNumber = Users.find({ isAdmin: true }).count();
    const { isAdmin } = Users.findOne(
      { _id: userId },
      { fields: { isAdmin: 1 } },
    );

    // Prevents remove of the only one administrator
    if (adminsNumber === 1 && isAdmin && userId === doc._id) {
      return false;
    }

    // If it's the user or an admin
    return userId === doc._id || isAdmin;
  },
  fetch: [],
});

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

    isNotNoComments() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return (
        board && board.hasMember(this._id) && !board.hasNoComments(this._id)
      );
    },

    isNoComments() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasNoComments(this._id);
    },

    isNotCommentOnly() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return (
        board && board.hasMember(this._id) && !board.hasCommentOnly(this._id)
      );
    },

    isCommentOnly() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasCommentOnly(this._id);
    },

    isNotWorker() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasMember(this._id) && !board.hasWorker(this._id);
    },

    isWorker() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasWorker(this._id);
    },

    isBoardAdmin(boardId = Session.get('currentBoard')) {
      const board = Boards.findOne(boardId);
      return board && board.hasAdmin(this._id);
    },
  });
}

Users.helpers({
  boards() {
    return Boards.find(
      { 'members.userId': this._id },
      { sort: { sort: 1 /* boards default sorting */ } },
    );
  },

  starredBoards() {
    const { starredBoards = [] } = this.profile || {};
    return Boards.find(
      { archived: false, _id: { $in: starredBoards } },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
  },

  hasStarred(boardId) {
    const { starredBoards = [] } = this.profile || {};
    return _.contains(starredBoards, boardId);
  },

  invitedBoards() {
    const { invitedBoards = [] } = this.profile || {};
    return Boards.find(
      { archived: false, _id: { $in: invitedBoards } },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
  },

  isInvitedTo(boardId) {
    const { invitedBoards = [] } = this.profile || {};
    return _.contains(invitedBoards, boardId);
  },

  _getListSortBy() {
    const profile = this.profile || {};
    const sortBy = profile.listSortBy || defaultSortBy;
    const keyPattern = /^(-{0,1})(.*$)/;
    const ret = [];
    if (keyPattern.exec(sortBy)) {
      ret[0] = RegExp.$2;
      ret[1] = RegExp.$1 ? -1 : 1;
    }
    return ret;
  },
  hasSortBy() {
    // if use doesn't have dragHandle, then we can let user to choose sort list by different order
    return !this.hasShowDesktopDragHandles();
  },
  getListSortBy() {
    return this._getListSortBy()[0];
  },
  getListSortTypes() {
    return allowedSortValues;
  },
  getListSortByDirection() {
    return this._getListSortBy()[1];
  },

  hasTag(tag) {
    const { tags = [] } = this.profile || {};
    return _.contains(tags, tag);
  },

  hasNotification(activityId) {
    const { notifications = [] } = this.profile || {};
    return _.contains(notifications, activityId);
  },

  notifications() {
    const { notifications = [] } = this.profile || {};
    for (const index in notifications) {
      if (!notifications.hasOwnProperty(index)) continue;
      const notification = notifications[index];
      // this preserves their db sort order for editing
      notification.dbIndex = index;
      notification.activity = Activities.findOne(notification.activity);
    }
    // this sorts them newest to oldest to match Trello's behavior
    notifications.reverse();
    return notifications;
  },

  hasShowDesktopDragHandles() {
    const profile = this.profile || {};
    return profile.showDesktopDragHandles || false;
  },

  hasHiddenSystemMessages() {
    const profile = this.profile || {};
    return profile.hiddenSystemMessages || false;
  },

  hasHiddenMinicardLabelText() {
    const profile = this.profile || {};
    return profile.hiddenMinicardLabelText || false;
  },

  getEmailBuffer() {
    const { emailBuffer = [] } = this.profile || {};
    return emailBuffer;
  },

  getInitials() {
    const profile = this.profile || {};
    if (profile.initials) return profile.initials;
    else if (profile.fullname) {
      return profile.fullname
        .split(/\s+/)
        .reduce((memo, word) => {
          return memo + word[0];
        }, '')
        .toUpperCase();
    } else {
      return this.username[0].toUpperCase();
    }
  },

  getLimitToShowCardsCount() {
    const profile = this.profile || {};
    return profile.showCardsCountAt;
  },

  getName() {
    const profile = this.profile || {};
    return profile.fullname || this.username;
  },

  getLanguage() {
    const profile = this.profile || {};
    return profile.language || 'en';
  },

  getStartDayOfWeek() {
    const profile = this.profile || {};
    if (typeof profile.startDayOfWeek === 'undefined') {
      // default is 'Monday' (1)
      return 1;
    }
    return profile.startDayOfWeek;
  },

  getTemplatesBoardId() {
    return (this.profile || {}).templatesBoardId;
  },

  getTemplatesBoardSlug() {
    return (Boards.findOne((this.profile || {}).templatesBoardId) || {}).slug;
  },

  remove() {
    User.remove({ _id: this._id });
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
    if (this.hasTag(tag)) this.removeTag(tag);
    else this.addTag(tag);
  },

  setListSortBy(value) {
    return {
      $set: {
        'profile.listSortBy': value,
      },
    };
  },
  toggleDesktopHandles(value = false) {
    return {
      $set: {
        'profile.showDesktopDragHandles': !value,
      },
    };
  },

  toggleSystem(value = false) {
    return {
      $set: {
        'profile.hiddenSystemMessages': !value,
      },
    };
  },

  toggleLabelText(value = false) {
    return {
      $set: {
        'profile.hiddenMinicardLabelText': !value,
      },
    };
  },

  addNotification(activityId) {
    return {
      $addToSet: {
        'profile.notifications': { activity: activityId },
      },
    };
  },

  removeNotification(activityId) {
    return {
      $pull: {
        'profile.notifications': { activity: activityId },
      },
    };
  },

  addEmailBuffer(text) {
    return {
      $addToSet: {
        'profile.emailBuffer': text,
      },
    };
  },

  clearEmailBuffer() {
    return {
      $set: {
        'profile.emailBuffer': [],
      },
    };
  },

  setAvatarUrl(avatarUrl) {
    return { $set: { 'profile.avatarUrl': avatarUrl } };
  },

  setShowCardsCountAt(limit) {
    return { $set: { 'profile.showCardsCountAt': limit } };
  },

  setStartDayOfWeek(startDay) {
    return { $set: { 'profile.startDayOfWeek': startDay } };
  },

  setBoardView(view) {
    return {
      $set: {
        'profile.boardView': view,
      },
    };
  },
});

Meteor.methods({
  setListSortBy(value) {
    check(value, String);
    Meteor.user().setListSortBy(value);
  },
  toggleDesktopDragHandles() {
    const user = Meteor.user();
    user.toggleDesktopHandles(user.hasShowDesktopDragHandles());
  },
  toggleSystemMessages() {
    const user = Meteor.user();
    user.toggleSystem(user.hasHiddenSystemMessages());
  },
  toggleMinicardLabelText() {
    const user = Meteor.user();
    user.toggleLabelText(user.hasHiddenMinicardLabelText());
  },
  changeLimitToShowCardsCount(limit) {
    check(limit, Number);
    Meteor.user().setShowCardsCountAt(limit);
  },
  changeStartDayOfWeek(startDay) {
    check(startDay, Number);
    Meteor.user().setStartDayOfWeek(startDay);
  },
});

if (Meteor.isServer) {
  Meteor.methods({
    setCreateUser(fullname, username, password, isAdmin, isActive, email) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(fullname, String);
        check(username, String);
        check(password, String);
        check(isAdmin, String);
        check(isActive, String);
        check(email, String);

        const nUsersWithUsername = Users.find({ username }).count();
        const nUsersWithEmail = Users.find({ email }).count();
        if (nUsersWithUsername > 0) {
          throw new Meteor.Error('username-already-taken');
        } else if (nUsersWithEmail > 0) {
          throw new Meteor.Error('email-already-taken');
        } else {
          Accounts.createUser({
            fullname,
            username,
            password,
            isAdmin,
            isActive,
            email: email.toLowerCase(),
            from: 'admin',
          });
        }
      }
    },
    setUsername(username, userId) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(username, String);
        check(userId, String);
        const nUsersWithUsername = Users.find({ username }).count();
        if (nUsersWithUsername > 0) {
          throw new Meteor.Error('username-already-taken');
        } else {
          Users.update(userId, { $set: { username } });
        }
      }
    },
    setEmail(email, userId) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        if (Array.isArray(email)) {
          email = email.shift();
        }
        check(email, String);
        const existingUser = Users.findOne(
          { 'emails.address': email },
          { fields: { _id: 1 } },
        );
        if (existingUser) {
          throw new Meteor.Error('email-already-taken');
        } else {
          Users.update(userId, {
            $set: {
              emails: [
                {
                  address: email,
                  verified: false,
                },
              ],
            },
          });
        }
      }
    },
    setUsernameAndEmail(username, email, userId) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(username, String);
        if (Array.isArray(email)) {
          email = email.shift();
        }
        check(email, String);
        check(userId, String);
        Meteor.call('setUsername', username, userId);
        Meteor.call('setEmail', email, userId);
      }
    },
    setPassword(newPassword, userId) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(userId, String);
        check(newPassword, String);
        if (Meteor.user().isAdmin) {
          Accounts.setPassword(userId, newPassword);
        }
      }
    },
    // we accept userId, username, email
    inviteUserToBoard(username, boardId) {
      check(username, String);
      check(boardId, String);

      const inviter = Meteor.user();
      const board = Boards.findOne(boardId);
      const allowInvite =
        inviter &&
        board &&
        board.members &&
        _.contains(_.pluck(board.members, 'userId'), inviter._id) &&
        _.where(board.members, { userId: inviter._id })[0].isActive;
      // GitHub issue 2060
      //_.where(board.members, { userId: inviter._id })[0].isAdmin;
      if (!allowInvite) throw new Meteor.Error('error-board-notAMember');

      this.unblock();

      const posAt = username.indexOf('@');
      let user = null;
      if (posAt >= 0) {
        user = Users.findOne({ emails: { $elemMatch: { address: username } } });
      } else {
        user = Users.findOne(username) || Users.findOne({ username });
      }
      if (user) {
        if (user._id === inviter._id)
          throw new Meteor.Error('error-user-notAllowSelf');
      } else {
        if (posAt <= 0) throw new Meteor.Error('error-user-doesNotExist');
        if (Settings.findOne({ disableRegistration: true })) {
          throw new Meteor.Error('error-user-notCreated');
        }
        // Set in lowercase email before creating account
        const email = username.toLowerCase();
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

      //Check if there is a subtasks board
      if (board.subtasksDefaultBoardId) {
        const subBoard = Boards.findOne(board.subtasksDefaultBoardId);
        //If there is, also add user to that board
        if (subBoard) {
          subBoard.addMember(user._id);
          user.addInvite(subBoard._id);
        }
      }

      try {
        const params = {
          user: user.username,
          inviter: inviter.username,
          board: board.title,
          url: board.absoluteUrl(),
        };
        const lang = user.getLanguage();
        Email.send({
          to: user.emails[0].address.toLowerCase(),
          from: Accounts.emailTemplates.from,
          subject: TAPi18n.__('email-invite-subject', params, lang),
          text: TAPi18n.__('email-invite-text', params, lang),
        });
      } catch (e) {
        throw new Meteor.Error('email-fail', e.message);
      }
      return { username: user.username, email: user.emails[0].address };
    },
  });
  Accounts.onCreateUser((options, user) => {
    const userCount = Users.find().count();
    if (userCount === 0) {
      user.isAdmin = true;
      return user;
    }

    if (user.services.oidc) {
      let email = user.services.oidc.email;
      if (Array.isArray(email)) {
        email = email.shift();
      }
      email = email.toLowerCase();
      user.username = user.services.oidc.username;
      user.emails = [{ address: email, verified: true }];
      const initials = user.services.oidc.fullname
        .match(/\b[a-zA-Z]/g)
        .join('')
        .toUpperCase();
      user.profile = {
        initials,
        fullname: user.services.oidc.fullname,
        boardView: 'board-view-lists',
      };
      user.authenticationMethod = 'oauth2';

      // see if any existing user has this email address or username, otherwise create new
      const existingUser = Meteor.users.findOne({
        $or: [{ 'emails.address': email }, { username: user.username }],
      });
      if (!existingUser) return user;

      // copy across new service info
      const service = _.keys(user.services)[0];
      existingUser.services[service] = user.services[service];
      existingUser.emails = user.emails;
      existingUser.username = user.username;
      existingUser.profile = user.profile;
      existingUser.authenticationMethod = user.authenticationMethod;

      Meteor.users.remove({ _id: existingUser._id }); // remove existing record
      return existingUser;
    }

    if (options.from === 'admin') {
      user.createdThroughApi = true;
      return user;
    }

    const disableRegistration = Settings.findOne().disableRegistration;
    // If this is the first Authentication by the ldap and self registration disabled
    if (disableRegistration && options && options.ldap) {
      user.authenticationMethod = 'ldap';
      return user;
    }

    // If self registration enabled
    if (!disableRegistration) {
      return user;
    }

    if (!options || !options.profile) {
      throw new Meteor.Error(
        'error-invitation-code-blank',
        'The invitation code is required',
      );
    }
    const invitationCode = InvitationCodes.findOne({
      code: options.profile.invitationcode,
      email: options.email,
      valid: true,
    });
    if (!invitationCode) {
      throw new Meteor.Error(
        'error-invitation-code-not-exist',
        // eslint-disable-next-line quotes
        "The invitation code doesn't exist",
      );
    } else {
      user.profile = { icode: options.profile.invitationcode };
      user.profile.boardView = 'board-view-lists';

      // Deletes the invitation code after the user was created successfully.
      setTimeout(
        Meteor.bindEnvironment(() => {
          InvitationCodes.remove({ _id: invitationCode._id });
        }),
        200,
      );
      return user;
    }
  });
}

const addCronJob = _.debounce(
  Meteor.bindEnvironment(function notificationCleanupDebounced() {
    // passed in the removeAge has to be a number standing for the number of days after a notification is read before we remove it
    const envRemoveAge =
      process.env.NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE;
    // default notifications will be removed 2 days after they are read
    const defaultRemoveAge = 2;
    const removeAge = parseInt(envRemoveAge, 10) || defaultRemoveAge;

    SyncedCron.add({
      name: 'notification_cleanup',
      schedule: parser => parser.text('every 1 days'),
      job: () => {
        for (const user of Users.find()) {
          if (!user.profile || !user.profile.notifications) continue;
          for (const notification of user.profile.notifications) {
            if (notification.read) {
              const removeDate = new Date(notification.read);
              removeDate.setDate(removeDate.getDate() + removeAge);
              if (removeDate <= new Date()) {
                user.removeNotification(notification.activity);
              }
            }
          }
        }
      },
    });

    SyncedCron.start();
  }),
  500,
);

if (Meteor.isServer) {
  // Let mongoDB ensure username unicity
  Meteor.startup(() => {
    allowedSortValues.forEach(value => {
      Lists._collection._ensureIndex(value);
    });
    Users._collection._ensureIndex({ modifiedAt: -1 });
    Users._collection._ensureIndex(
      {
        username: 1,
      },
      { unique: true },
    );
    Meteor.defer(() => {
      addCronJob();
    });
  });

  // OLD WAY THIS CODE DID WORK: When user is last admin of board,
  // if admin is removed, board is removed.
  // NOW THIS IS COMMENTED OUT, because other board users still need to be able
  // to use that board, and not have board deleted.
  // Someone can be later changed to be admin of board, by making change to database.
  // TODO: Add UI for changing someone as board admin.
  //Users.before.remove((userId, doc) => {
  //  Boards
  //    .find({members: {$elemMatch: {userId: doc._id, isAdmin: true}}})
  //    .forEach((board) => {
  //      // If only one admin for the board
  //      if (board.members.filter((e) => e.isAdmin).length === 1) {
  //        Boards.remove(board._id);
  //      }
  //    });
  //});

  // Each board document contains the de-normalized number of users that have
  // starred it. If the user star or unstar a board, we need to update this
  // counter.
  // We need to run this code on the server only, otherwise the incrementation
  // will be done twice.
  Users.after.update(function(userId, user, fieldNames) {
    // The `starredBoards` list is hosted on the `profile` field. If this
    // field hasn't been modificated we don't need to run this hook.
    if (!_.contains(fieldNames, 'profile')) return;

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
      boardsIds.forEach(boardId => {
        Boards.update(boardId, { $inc: { stars: inc } });
      });
    }

    incrementBoards(_.difference(oldIds, newIds), -1);
    incrementBoards(_.difference(newIds, oldIds), +1);
  });

  // Override getUserId so that we can TODO get the current userId
  const fakeUserId = new Meteor.EnvironmentVariable();
  const getUserId = CollectionHooks.getUserId;
  CollectionHooks.getUserId = () => {
    return fakeUserId.get() || getUserId();
  };
  if (!isSandstorm) {
    Users.after.insert((userId, doc) => {
      const fakeUser = {
        extendAutoValueContext: {
          userId: doc._id,
        },
      };

      fakeUserId.withValue(doc._id, () => {
        /*
        // Insert the Welcome Board
        Boards.insert({
          title: TAPi18n.__('welcome-board'),
          permission: 'private',
        }, fakeUser, (err, boardId) => {

          Swimlanes.insert({
            title: TAPi18n.__('welcome-swimlane'),
            boardId,
            sort: 1,
          }, fakeUser);

          ['welcome-list1', 'welcome-list2'].forEach((title, titleIndex) => {
            Lists.insert({title: TAPi18n.__(title), boardId, sort: titleIndex}, fakeUser);
          });
        });
        */

          const Future = require('fibers/future');
          let future1 = new Future();
          let future2 = new Future();
          let future3 = new Future();
        Boards.insert(
          {
            title: TAPi18n.__('templates'),
            permission: 'private',
            type: 'template-container',
          },
          fakeUser,
          (err, boardId) => {
            // Insert the reference to our templates board
            Users.update(fakeUserId.get(), {
              $set: { 'profile.templatesBoardId': boardId },
            });

            // Insert the card templates swimlane
            Swimlanes.insert(
              {
                title: TAPi18n.__('card-templates-swimlane'),
                boardId,
                sort: 1,
                type: 'template-container',
              },
              fakeUser,
              (err, swimlaneId) => {
                // Insert the reference to out card templates swimlane
                Users.update(fakeUserId.get(), {
                  $set: { 'profile.cardTemplatesSwimlaneId': swimlaneId },
                });
                  future1.return();
              },
            );

            // Insert the list templates swimlane
            Swimlanes.insert(
              {
                title: TAPi18n.__('list-templates-swimlane'),
                boardId,
                sort: 2,
                type: 'template-container',
              },
              fakeUser,
              (err, swimlaneId) => {
                // Insert the reference to out list templates swimlane
                Users.update(fakeUserId.get(), {
                  $set: { 'profile.listTemplatesSwimlaneId': swimlaneId },
                });
                  future2.return();
              },
            );

            // Insert the board templates swimlane
            Swimlanes.insert(
              {
                title: TAPi18n.__('board-templates-swimlane'),
                boardId,
                sort: 3,
                type: 'template-container',
              },
              fakeUser,
              (err, swimlaneId) => {
                // Insert the reference to out board templates swimlane
                Users.update(fakeUserId.get(), {
                  $set: { 'profile.boardTemplatesSwimlaneId': swimlaneId },
                });
                  future3.return();
              },
            );
          },
        );
          // HACK
          future1.wait();
          future2.wait();
          future3.wait();
      });
    });
  }

    Users.after.insert((userId, doc) => {
        // HACK
      doc = Users.findOne({_id: doc._id});
    if (doc.createdThroughApi) {
      // The admin user should be able to create a user despite disabling registration because
      // it is two different things (registration and creation).
      // So, when a new user is created via the api (only admin user can do that) one must avoid
      // the disableRegistration check.
      // Issue : https://github.com/wekan/wekan/issues/1232
      // PR    : https://github.com/wekan/wekan/pull/1251
      Users.update(doc._id, { $set: { createdThroughApi: '' } });
      return;
    }

    //invite user to corresponding boards
    const disableRegistration = Settings.findOne().disableRegistration;
    // If ldap, bypass the inviation code if the self registration isn't allowed.
    // TODO : pay attention if ldap field in the user model change to another content ex : ldap field to connection_type
    if (doc.authenticationMethod !== 'ldap' && disableRegistration) {
      const invitationCode = InvitationCodes.findOne({
        code: doc.profile.icode,
        valid: true,
      });
      if (!invitationCode) {
        throw new Meteor.Error('error-invitation-code-not-exist');
      } else {
        invitationCode.boardsToBeInvited.forEach(boardId => {
          const board = Boards.findOne(boardId);
          board.addMember(doc._id);
        });
        if (!doc.profile) {
          doc.profile = {};
        }
        doc.profile.invitedBoards = invitationCode.boardsToBeInvited;
        Users.update(doc._id, { $set: { profile: doc.profile } });
        InvitationCodes.update(invitationCode._id, { $set: { valid: false } });
      }
    }
  });
}

// USERS REST API
if (Meteor.isServer) {
  // Middleware which checks that API is enabled.
  JsonRoutes.Middleware.use(function(req, res, next) {
    const api = req.url.startsWith('/api');
    if ((api === true && process.env.WITH_API === 'true') || api === false) {
      return next();
    } else {
      res.writeHead(301, { Location: '/' });
      return res.end();
    }
  });

  /**
   * @operation get_current_user
   *
   * @summary returns the current user
   * @return_type Users
   */
  JsonRoutes.add('GET', '/api/user', function(req, res) {
    try {
      Authentication.checkLoggedIn(req.userId);
      const data = Meteor.users.findOne({ _id: req.userId });
      delete data.services;

      // get all boards where the user is member of
      let boards = Boards.find(
        {
          type: 'board',
          'members.userId': req.userId,
        },
        {
          fields: { _id: 1, members: 1 },
        },
      );
      boards = boards.map(b => {
        const u = b.members.find(m => m.userId === req.userId);
        delete u.userId;
        u.boardId = b._id;
        return u;
      });

      data.boards = boards;
      JsonRoutes.sendResult(res, {
        code: 200,
        data,
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation get_all_users
   *
   * @summary return all the users
   *
   * @description Only the admin user (the first user) can call the REST API.
   * @return_type [{ _id: string,
   *                 username: string}]
   */
  JsonRoutes.add('GET', '/api/users', function(req, res) {
    try {
      Authentication.checkUserId(req.userId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Meteor.users.find({}).map(function(doc) {
          return { _id: doc._id, username: doc.username };
        }),
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation get_user
   *
   * @summary get a given user
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} userId the user ID
   * @return_type Users
   */
  JsonRoutes.add('GET', '/api/users/:userId', function(req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.userId;

      // get all boards where the user is member of
      let boards = Boards.find(
        {
          type: 'board',
          'members.userId': id,
        },
        {
          fields: { _id: 1, members: 1 },
        },
      );
      boards = boards.map(b => {
        const u = b.members.find(m => m.userId === id);
        delete u.userId;
        u.boardId = b._id;
        return u;
      });

      const user = Meteor.users.findOne({ _id: id });
      user.boards = boards;
      JsonRoutes.sendResult(res, {
        code: 200,
        data: user,
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation edit_user
   *
   * @summary edit a given user
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * Possible values for *action*:
   * - `takeOwnership`: The admin takes the ownership of ALL boards of the user (archived and not archived) where the user is admin on.
   * - `disableLogin`: Disable a user (the user is not allowed to login and his login tokens are purged)
   * - `enableLogin`: Enable a user
   *
   * @param {string} userId the user ID
   * @param {string} action the action
   * @return_type {_id: string,
   *               title: string}
   */
  JsonRoutes.add('PUT', '/api/users/:userId', function(req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.userId;
      const action = req.body.action;
      let data = Meteor.users.findOne({ _id: id });
      if (data !== undefined) {
        if (action === 'takeOwnership') {
          data = Boards.find(
            {
              'members.userId': id,
              'members.isAdmin': true,
            },
            { sort: { sort: 1 /* boards default sorting */ } },
          ).map(function(board) {
            if (board.hasMember(req.userId)) {
              board.removeMember(req.userId);
            }
            board.changeOwnership(id, req.userId);
            return {
              _id: board._id,
              title: board.title,
            };
          });
        } else {
          if (action === 'disableLogin' && id !== req.userId) {
            Users.update(
              { _id: id },
              {
                $set: {
                  loginDisabled: true,
                  'services.resume.loginTokens': '',
                },
              },
            );
          } else if (action === 'enableLogin') {
            Users.update({ _id: id }, { $set: { loginDisabled: '' } });
          }
          data = Meteor.users.findOne({ _id: id });
        }
      }
      JsonRoutes.sendResult(res, {
        code: 200,
        data,
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation add_board_member
   * @tag Boards
   *
   * @summary Add New Board Member with Role
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * **Note**: see [Boards.set_board_member_permission](#set_board_member_permission)
   * to later change the permissions.
   *
   * @param {string} boardId the board ID
   * @param {string} userId the user ID
   * @param {boolean} isAdmin is the user an admin of the board
   * @param {boolean} isNoComments disable comments
   * @param {boolean} isCommentOnly only enable comments
   * @return_type {_id: string,
   *               title: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/members/:userId/add', function(
    req,
    res,
  ) {
    try {
      Authentication.checkUserId(req.userId);
      const userId = req.params.userId;
      const boardId = req.params.boardId;
      const action = req.body.action;
      const { isAdmin, isNoComments, isCommentOnly } = req.body;
      let data = Meteor.users.findOne({ _id: userId });
      if (data !== undefined) {
        if (action === 'add') {
          data = Boards.find({
            _id: boardId,
          }).map(function(board) {
            if (!board.hasMember(userId)) {
              board.addMember(userId);
              function isTrue(data) {
                return data.toLowerCase() === 'true';
              }
              board.setMemberPermission(
                userId,
                isTrue(isAdmin),
                isTrue(isNoComments),
                isTrue(isCommentOnly),
                userId,
              );
            }
            return {
              _id: board._id,
              title: board.title,
            };
          });
        }
      }
      JsonRoutes.sendResult(res, {
        code: 200,
        data: query,
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation remove_board_member
   * @tag Boards
   *
   * @summary Remove Member from Board
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} boardId the board ID
   * @param {string} userId the user ID
   * @param {string} action the action (needs to be `remove`)
   * @return_type {_id: string,
   *               title: string}
   */
  JsonRoutes.add(
    'POST',
    '/api/boards/:boardId/members/:userId/remove',
    function(req, res) {
      try {
        Authentication.checkUserId(req.userId);
        const userId = req.params.userId;
        const boardId = req.params.boardId;
        const action = req.body.action;
        let data = Meteor.users.findOne({ _id: userId });
        if (data !== undefined) {
          if (action === 'remove') {
            data = Boards.find({
              _id: boardId,
            }).map(function(board) {
              if (board.hasMember(userId)) {
                board.removeMember(userId);
              }
              return {
                _id: board._id,
                title: board.title,
              };
            });
          }
        }
        JsonRoutes.sendResult(res, {
          code: 200,
          data: query,
        });
      } catch (error) {
        JsonRoutes.sendResult(res, {
          code: 200,
          data: error,
        });
      }
    },
  );

  /**
   * @operation new_user
   *
   * @summary Create a new user
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} username the new username
   * @param {string} email the email of the new user
   * @param {string} password the password of the new user
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/users/', function(req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = Accounts.createUser({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        from: 'admin',
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation delete_user
   *
   * @summary Delete a user
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} userId the ID of the user to delete
   * @return_type {_id: string}
   */
  JsonRoutes.add('DELETE', '/api/users/:userId', function(req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.userId;
      Meteor.users.remove({ _id: id });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });
}

export default Users;
