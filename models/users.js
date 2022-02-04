//var nodemailer = require('nodemailer');
import { SyncedCron } from 'meteor/percolate:synced-cron';
import ImpersonatedUsers from './impersonatedUsers';

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
    orgs: {
      /**
       * the list of organizations that a user belongs to
       */
       type: [Object],
       optional: true,
    },
    'orgs.$.orgId':{
      /**
       * The uniq ID of the organization
       */
       type: String,
    },
    'orgs.$.orgDisplayName':{
      /**
       * The display name of the organization
       */
       type: String,
    },
    teams: {
      /**
       * the list of teams that a user belongs to
       */
       type: [Object],
       optional: true,
    },
    'teams.$.teamId':{
      /**
       * The uniq ID of the team
       */
       type: String,
    },
    'teams.$.teamDisplayName':{
      /**
       * The display name of the team
       */
       type: String,
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
          return {
            $setOnInsert: new Date(),
          };
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
            boardView: 'board-view-swimlanes',
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
       * does the user want to show desktop drag handles?
       */
      type: Boolean,
      optional: true,
    },
    'profile.hideCheckedItems': {
      /**
       * does the user want to hide checked checklist items?
       */
      type: Boolean,
      optional: true,
    },
    'profile.cardMaximized': {
      /**
       * has user clicked maximize card?
       */
      type: Boolean,
      optional: true,
    },
    'profile.customFieldsGrid': {
      /**
       * has user at card Custom Fields have Grid (false) or one per row (true) layout?
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
    'profile.moveAndCopyDialog' : {
      /**
       * move and copy card dialog
       */
      type: Object,
      optional: true,
      blackbox: true,
    },
    'profile.moveAndCopyDialog.$.boardId': {
      /**
       * last selected board id
       */
      type: String,
    },
    'profile.moveAndCopyDialog.$.swimlaneId': {
      /**
       * last selected swimlane id
       */
      type: String,
    },
    'profile.moveAndCopyDialog.$.listId': {
      /**
       * last selected list id
       */
      type: String,
    },
    'profile.moveChecklistDialog' : {
      /**
       * move checklist dialog
       */
      type: Object,
      optional: true,
      blackbox: true,
    },
    'profile.moveChecklistDialog.$.boardId': {
      /**
       * last selected board id
       */
      type: String,
    },
    'profile.moveChecklistDialog.$.swimlaneId': {
      /**
       * last selected swimlane id
       */
      type: String,
    },
    'profile.moveChecklistDialog.$.listId': {
      /**
       * last selected list id
       */
      type: String,
    },
    'profile.moveChecklistDialog.$.cardId': {
      /**
       * last selected card id
       */
      type: String,
    },
    'profile.copyChecklistDialog' : {
      /**
       * copy checklist dialog
       */
      type: Object,
      optional: true,
      blackbox: true,
    },
    'profile.copyChecklistDialog.$.boardId': {
      /**
       * last selected board id
       */
      type: String,
    },
    'profile.copyChecklistDialog.$.swimlaneId': {
      /**
       * last selected swimlane id
       */
      type: String,
    },
    'profile.copyChecklistDialog.$.listId': {
      /**
       * last selected list id
       */
      type: String,
    },
    'profile.copyChecklistDialog.$.cardId': {
      /**
       * last selected card id
       */
      type: String,
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
        'board-view-swimlanes',
        'board-view-lists',
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
    sessionData: {
      /**
       * profile settings
       */
      type: Object,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return {};
        }
      },
    },
    'sessionData.totalHits': {
      /**
       * Total hits from last searchquery['members.userId'] = Meteor.userId();
       * last hit that was returned
       */
      type: Number,
      optional: true,
    },
    importUsernames: {
      /**
       * username for imported
       */
      type: [String],
      optional: true,
    },
  }),
);

Users.allow({
  update(userId, doc) {
    const user = Users.findOne({
      _id: userId,
    });
    if ((user && user.isAdmin) || (Meteor.user() && Meteor.user().isAdmin))
      return true;
    if (!user) {
      return false;
    }
    return doc._id === userId;
  },
  remove(userId, doc) {
    const adminsNumber = Users.find({
      isAdmin: true,
    }).count();
    const { isAdmin } = Users.findOne(
      {
        _id: userId,
      },
      {
        fields: {
          isAdmin: 1,
        },
      },
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

// Search a user in the complete server database by its name, username or emails adress. This
// is used for instance to add a new user to a board.
const searchInFields = ['username', 'profile.fullname', 'emails.address'];
Users.initEasySearch(searchInFields, {
  use: 'mongo-db',
  returnFields: [...searchInFields, 'profile.avatarUrl'],
});

Users.safeFields = {
  _id: 1,
  username: 1,
  'profile.fullname': 1,
  'profile.avatarUrl': 1,
  'profile.initials': 1,
  orgs: 1,
  teams: 1,
  authenticationMethod: 1,
};

if (Meteor.isClient) {
  Users.helpers({
    isBoardMember() {
      const board = Utils.getCurrentBoard();
      return board && board.hasMember(this._id);
    },

    isNotNoComments() {
      const board = Utils.getCurrentBoard();
      return (
        board && board.hasMember(this._id) && !board.hasNoComments(this._id)
      );
    },

    isNoComments() {
      const board = Utils.getCurrentBoard();
      return board && board.hasNoComments(this._id);
    },

    isNotCommentOnly() {
      const board = Utils.getCurrentBoard();
      return (
        board && board.hasMember(this._id) && !board.hasCommentOnly(this._id)
      );
    },

    isCommentOnly() {
      const board = Utils.getCurrentBoard();
      return board && board.hasCommentOnly(this._id);
    },

    isNotWorker() {
      const board = Utils.getCurrentBoard();
      return board && board.hasMember(this._id) && !board.hasWorker(this._id);
    },

    isWorker() {
      const board = Utils.getCurrentBoard();
      return board && board.hasWorker(this._id);
    },

    isBoardAdmin(boardId) {
      let board;
      if (boardId) {
        board = Boards.findOne(boardId);
      } else {
        board = Utils.getCurrentBoard();
      }
      return board && board.hasAdmin(this._id);
    },
  });
}

Users.parseImportUsernames = (usernamesString) => {
  return usernamesString.trim().split(new RegExp('\\s*[,;]\\s*'));
};

Users.helpers({
  importUsernamesString() {
    if (this.importUsernames) {
      return this.importUsernames.join(', ');
    }
    return '';
  },
  teamIds() {
    if (this.teams) {
      // TODO: Should the Team collection be queried to determine if the team isActive?
      return this.teams.map(team => { return team.teamId });
    }
    return [];
  },
  orgIds() {
    if (this.orgs) {
      // TODO: Should the Org collection be queried to determine if the organization isActive?
      return this.orgs.map(org => { return org.orgId });
    }
    return [];
  },
  orgsUserBelongs() {
    if (this.orgs) {
      return this.orgs.map(function(org){return org.orgDisplayName}).sort().join(',');
    }
    return '';
  },
  orgIdsUserBelongs() {
    if (this.orgs) {
      return this.orgs.map(function(org){return org.orgId}).join(',');
    }
    return '';
  },
  teamsUserBelongs() {
    if (this.teams) {
      return this.teams.map(function(team){ return team.teamDisplayName}).sort().join(',');
    }
    return '';
  },
  teamIdsUserBelongs() {
    if (this.teams) {
      return this.teams.map(function(team){ return team.teamId}).join(',');
    }
    return '';
  },
  boards() {
    return Boards.userBoards(this._id, null, {}, { sort: { sort: 1 } })
  },

  starredBoards() {
    const { starredBoards = [] } = this.profile || {};
    return Boards.userBoards(
      this._id,
      false,
      { _id: { $in: starredBoards } },
      { sort: { sort: 1 } }
    );
  },

  hasStarred(boardId) {
    const { starredBoards = [] } = this.profile || {};
    return _.contains(starredBoards, boardId);
  },

  invitedBoards() {
    const { invitedBoards = [] } = this.profile || {};
    return Boards.userBoards(
      this._id,
      false,
      { _id: { $in: invitedBoards } },
      { sort: { sort: 1 } }
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

  /** returns all confirmed move and copy dialog field values
   * <li> the board, swimlane and list id is stored for each board
   */
  getMoveAndCopyDialogOptions() {
    let _ret = {}
    if (this.profile && this.profile.moveAndCopyDialog) {
      _ret = this.profile.moveAndCopyDialog;
    }
    return _ret;
  },

  /** returns all confirmed move checklist dialog field values
   * <li> the board, swimlane, list and card id is stored for each board
   */
  getMoveChecklistDialogOptions() {
    let _ret = {}
    if (this.profile && this.profile.moveChecklistDialog) {
      _ret = this.profile.moveChecklistDialog;
    }
    return _ret;
  },

  /** returns all confirmed copy checklist dialog field values
   * <li> the board, swimlane, list and card id is stored for each board
   */
  getCopyChecklistDialogOptions() {
    let _ret = {}
    if (this.profile && this.profile.copyChecklistDialog) {
      _ret = this.profile.copyChecklistDialog;
    }
    return _ret;
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

  hasHideCheckedItems() {
    const profile = this.profile || {};
    return profile.hideCheckedItems || false;
  },

  hasHiddenSystemMessages() {
    const profile = this.profile || {};
    return profile.hiddenSystemMessages || false;
  },

  hasCustomFieldsGrid() {
    const profile = this.profile || {};
    return profile.customFieldsGrid || false;
  },

  hasCardMaximized() {
    const profile = this.profile || {};
    return profile.cardMaximized || false;
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
    //return (Boards.findOne((this.profile || {}).templatesBoardId) || {}).slug;
    return 'templates';
  },

  remove() {
    User.remove({
      _id: this._id,
    });
  },
});

Users.mutations({
  /** set the confirmed board id/swimlane id/list id of a board
   * @param boardId the current board id
   * @param options an object with the confirmed field values
   */
  setMoveAndCopyDialogOption(boardId, options) {
    let currentOptions = this.getMoveAndCopyDialogOptions();
    currentOptions[boardId] = options;
    return {
      $set: {
        'profile.moveAndCopyDialog': currentOptions,
      },
    };
  },
  /** set the confirmed board id/swimlane id/list id/card id of a board (move checklist)
   * @param boardId the current board id
   * @param options an object with the confirmed field values
   */
  setMoveChecklistDialogOption(boardId, options) {
    let currentOptions = this.getMoveChecklistDialogOptions();
    currentOptions[boardId] = options;
    return {
      $set: {
        'profile.moveChecklistDialog': currentOptions,
      },
    };
  },
  /** set the confirmed board id/swimlane id/list id/card id of a board (copy checklist)
   * @param boardId the current board id
   * @param options an object with the confirmed field values
   */
  setCopyChecklistDialogOption(boardId, options) {
    let currentOptions = this.getCopyChecklistDialogOptions();
    currentOptions[boardId] = options;
    return {
      $set: {
        'profile.copyChecklistDialog': currentOptions,
      },
    };
  },
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

  setName(value) {
    return {
      $set: {
        'profile.fullname': value,
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

  toggleHideCheckedItems() {
    const value = this.hasHideCheckedItems();
    return {
      $set: {
        'profile.hideCheckedItems': !value,
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

  toggleFieldsGrid(value = false) {
    return {
      $set: {
        'profile.customFieldsGrid': !value,
      },
    };
  },

  toggleCardMaximized(value = false) {
    return {
      $set: {
        'profile.cardMaximized': !value,
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
        'profile.notifications': {
          activity: activityId,
        },
      },
    };
  },

  removeNotification(activityId) {
    return {
      $pull: {
        'profile.notifications': {
          activity: activityId,
        },
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
    return {
      $set: {
        'profile.avatarUrl': avatarUrl,
      },
    };
  },

  setShowCardsCountAt(limit) {
    return {
      $set: {
        'profile.showCardsCountAt': limit,
      },
    };
  },

  setStartDayOfWeek(startDay) {
    return {
      $set: {
        'profile.startDayOfWeek': startDay,
      },
    };
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
  toggleHideCheckedItems() {
    const user = Meteor.user();
    user.toggleHideCheckedItems();
  },
  toggleSystemMessages() {
    const user = Meteor.user();
    user.toggleSystem(user.hasHiddenSystemMessages());
  },
  toggleCustomFieldsGrid() {
    const user = Meteor.user();
    user.toggleFieldsGrid(user.hasCustomFieldsGrid());
  },
  toggleCardMaximized() {
    const user = Meteor.user();
    user.toggleCardMaximized(user.hasCardMaximized());
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
    setAllUsersHideSystemMessages() {
      if (Meteor.user() && Meteor.user().isAdmin) {
        // If setting is missing, add it
        Users.update(
          {
            'profile.hiddenSystemMessages': {
              $exists: false,
            },
          },
          {
            $set: {
              'profile.hiddenSystemMessages': true,
            },
          },
          {
            multi: true,
          },
        );
        // If setting is false, set it to true
        Users.update(
          {
            'profile.hiddenSystemMessages': false,
          },
          {
            $set: {
              'profile.hiddenSystemMessages': true,
            },
          },
          {
            multi: true,
          },
        );
        return true;
      } else {
        return false;
      }
    },
    setCreateUser(
      fullname,
      username,
      initials,
      password,
      isAdmin,
      isActive,
      email,
      importUsernames,
      userOrgsArray,
      userTeamsArray,
    ) {
      check(fullname, String);
      check(username, String);
      check(initials, String);
      check(password, String);
      check(isAdmin, String);
      check(isActive, String);
      check(email, String);
      check(importUsernames, Array);
      check(userOrgsArray, Array);
      check(userTeamsArray, Array);
      if (Meteor.user() && Meteor.user().isAdmin) {
        const nUsersWithUsername = Users.find({
          username,
        }).count();
        const nUsersWithEmail = Users.find({
          email,
        }).count();
        if (nUsersWithUsername > 0) {
          throw new Meteor.Error('username-already-taken');
        } else if (nUsersWithEmail > 0) {
          throw new Meteor.Error('email-already-taken');
        } else {
          Accounts.createUser({
            username,
            password,
            isAdmin,
            isActive,
            email: email.toLowerCase(),
            from: 'admin',
          });
          const user =
            Users.findOne(username) ||
            Users.findOne({
              username,
            });
          if (user) {
            Users.update(user._id, {
              $set: {
                'profile.fullname': fullname,
                importUsernames,
                'profile.initials': initials,
                orgs: userOrgsArray,
                teams: userTeamsArray,
              },
            });
          }
        }
      }
    },
    setUsername(username, userId) {
      check(username, String);
      check(userId, String);
      if (Meteor.user() && Meteor.user().isAdmin) {
        const nUsersWithUsername = Users.find({
          username,
        }).count();
        if (nUsersWithUsername > 0) {
          throw new Meteor.Error('username-already-taken');
        } else {
          Users.update(userId, {
            $set: {
              username,
            },
          });
        }
      }
    },
    setEmail(email, userId) {
      check(email, String);
      check(username, String);
      if (Meteor.user() && Meteor.user().isAdmin) {
        if (Array.isArray(email)) {
          email = email.shift();
        }
        const existingUser = Users.findOne(
          {
            'emails.address': email,
          },
          {
            fields: {
              _id: 1,
            },
          },
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
      check(username, String);
      check(email, String);
      check(userId, String);
      if (Meteor.user() && Meteor.user().isAdmin) {
        if (Array.isArray(email)) {
          email = email.shift();
        }
        Meteor.call('setUsername', username, userId);
        Meteor.call('setEmail', email, userId);
      }
    },
    setPassword(newPassword, userId) {
      check(userId, String);
      check(newPassword, String);
      if (Meteor.user() && Meteor.user().isAdmin) {
        if (Meteor.user().isAdmin) {
          Accounts.setPassword(userId, newPassword);
        }
      }
    },
    setEmailVerified(email, verified, userId) {
      check(email, String);
      check(verified, Boolean);
      check(userId, String);
      if (Meteor.user() && Meteor.user().isAdmin) {
        Users.update(userId, {
          $set: {
            emails: [
              {
                address: email,
                verified,
              },
            ],
          },
        });
      }
    },
    setInitials(initials, userId) {
      check(initials, String);
      check(userId, String);
      if (Meteor.user() && Meteor.user().isAdmin) {
        Users.update(userId, {
          $set: {
            'profile.initials': initials,
          },
        });
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
        _.where(board.members, {
          userId: inviter._id,
        })[0].isActive;
      // GitHub issue 2060
      //_.where(board.members, { userId: inviter._id })[0].isAdmin;
      if (!allowInvite) throw new Meteor.Error('error-board-notAMember');

      this.unblock();

      const posAt = username.indexOf('@');
      let user = null;
      if (posAt >= 0) {
        user = Users.findOne({
          emails: {
            $elemMatch: {
              address: username,
            },
          },
        });
      } else {
        user =
          Users.findOne(username) ||
          Users.findOne({
            username,
          });
      }
      if (user) {
        if (user._id === inviter._id)
          throw new Meteor.Error('error-user-notAllowSelf');
      } else {
        if (posAt <= 0) throw new Meteor.Error('error-user-doesNotExist');
        if (
          Settings.findOne({
            disableRegistration: true,
          })
        ) {
          throw new Meteor.Error('error-user-notCreated');
        }
        // Set in lowercase email before creating account
        const email = username.toLowerCase();
        username = email.substring(0, posAt);
        const newUserId = Accounts.createUser({
          username,
          email,
        });
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
        const fullName = inviter.profile !== undefined && inviter.profile.fullname !== undefined ?  inviter.profile.fullname : "";
        const userFullName = user.profile !== undefined && user.profile.fullname !== undefined ?  user.profile.fullname : "";
        const params = {
          user: userFullName != "" ? userFullName + " (" + user.username + " )" : user.username,
          inviter: fullName != "" ? fullName + " (" + inviter.username + " )" : inviter.username,
          board: board.title,
          url: board.absoluteUrl(),
        };
        const lang = user.getLanguage();

/*
        if (process.env.MAIL_SERVICE !== '') {
          let transporter = nodemailer.createTransport({
            service: process.env.MAIL_SERVICE,
            auth: {
              user: process.env.MAIL_SERVICE_USER,
              pass: process.env.MAIL_SERVICE_PASSWORD
            },
          })
          let info = transporter.sendMail({
            to: user.emails[0].address.toLowerCase(),
            from: Accounts.emailTemplates.from,
            subject: TAPi18n.__('email-invite-subject', params, lang),
            text: TAPi18n.__('email-invite-text', params, lang),
          })
        } else {
          Email.send({
            to: user.emails[0].address.toLowerCase(),
            from: Accounts.emailTemplates.from,
            subject: TAPi18n.__('email-invite-subject', params, lang),
            text: TAPi18n.__('email-invite-text', params, lang),
          });
        }
*/
        Email.send({
          to: user.emails[0].address.toLowerCase(),
          from: Accounts.emailTemplates.from,
          subject: TAPi18n.__('email-invite-subject', params, lang),
          text: TAPi18n.__('email-invite-text', params, lang),
        });
      } catch (e) {
        throw new Meteor.Error('email-fail', e.message);
      }
      return {
        username: user.username,
        email: user.emails[0].address,
      };
    },
    impersonate(userId) {
      check(userId, String);

      if (!Meteor.users.findOne(userId))
        throw new Meteor.Error(404, 'User not found');
      if (!Meteor.user().isAdmin)
        throw new Meteor.Error(403, 'Permission denied');

      ImpersonatedUsers.insert({ adminId: Meteor.user()._id, userId: userId, reason: 'clickedImpersonate' });
      this.setUserId(userId);
    },
    isImpersonated(userId) {
      check(userId, String);
      const isImpersonated = ImpersonatedUsers.findOne({
        userId: userId,
      });
      return isImpersonated;
    },
    setUsersTeamsTeamDisplayName(teamId, teamDisplayName) {
      check(teamId, String);
      check(teamDisplayName, String);
      if (Meteor.user() && Meteor.user().isAdmin) {
        Users.find({
          teams: {
              $elemMatch: {teamId: teamId}
          }
        }).forEach(user => {
          Users.update({
            _id: user._id,
            teams: {
              $elemMatch: {teamId: teamId}
            }
          }, {
            $set: {
              'teams.$.teamDisplayName': teamDisplayName
            }
          });
        });
      }
    },
    setUsersOrgsOrgDisplayName(orgId, orgDisplayName) {
      check(orgId, String);
      check(orgDisplayName, String);
      if (Meteor.user() && Meteor.user().isAdmin) {
        Users.find({
          orgs: {
              $elemMatch: {orgId: orgId}
          }
        }).forEach(user => {
          Users.update({
            _id: user._id,
            orgs: {
              $elemMatch: {orgId: orgId}
            }
          }, {
            $set: {
              'orgs.$.orgDisplayName': orgDisplayName
            }
          });
        });
      }
    },
  });
  Accounts.onCreateUser((options, user) => {
    const userCount = Users.find().count();
    if (userCount === 0) {
      user.isAdmin = true;
    }

    if (user.services.oidc) {
      let email = user.services.oidc.email;
      if (Array.isArray(email)) {
        email = email.shift();
      }
      email = email.toLowerCase();
      user.username = user.services.oidc.username;
      user.emails = [
        {
          address: email,
          verified: true,
        },
      ];
      const initials = user.services.oidc.fullname
        .split(/\s+/)
        .reduce((memo, word) => {
          return memo + word[0];
        }, '')
        .toUpperCase();
      user.profile = {
        initials,
        fullname: user.services.oidc.fullname,
        boardView: 'board-view-swimlanes',
      };
      user.authenticationMethod = 'oauth2';

      // see if any existing user has this email address or username, otherwise create new
      const existingUser = Meteor.users.findOne({
        $or: [
          {
            'emails.address': email,
          },
          {
            username: user.username,
          },
        ],
      });
      if (!existingUser) return user;

      // copy across new service info
      const service = _.keys(user.services)[0];
      existingUser.services[service] = user.services[service];
      existingUser.emails = user.emails;
      existingUser.username = user.username;
      existingUser.profile = user.profile;
      existingUser.authenticationMethod = user.authenticationMethod;

      Meteor.users.remove({
        _id: user._id,
      });
      Meteor.users.remove({
        _id: existingUser._id,
      }); // is going to be created again
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
      user.profile = {
        icode: options.profile.invitationcode,
      };
      user.profile.boardView = 'board-view-swimlanes';

      // Deletes the invitation code after the user was created successfully.
      setTimeout(
        Meteor.bindEnvironment(() => {
          InvitationCodes.remove({
            _id: invitationCode._id,
          });
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
      schedule: (parser) => parser.text('every 1 days'),
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
    allowedSortValues.forEach((value) => {
      Lists._collection.createIndex(value);
    });
    Users._collection.createIndex({
      modifiedAt: -1,
    });
/* Commented out extra index because of IndexOptionsConflict.
    Users._collection.createIndex(
      {
        username: 1,
      },
      {
        unique: true,
      },
    );
*/
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
  Users.after.update(function (userId, user, fieldNames) {
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
      boardsIds.forEach((boardId) => {
        Boards.update(boardId, {
          $inc: {
            stars: inc,
          },
        });
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

        // Insert Template Container
        const Future = require('fibers/future');
        const future1 = new Future();
        const future2 = new Future();
        const future3 = new Future();
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
              $set: {
                'profile.templatesBoardId': boardId,
              },
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
                  $set: {
                    'profile.cardTemplatesSwimlaneId': swimlaneId,
                  },
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
                  $set: {
                    'profile.listTemplatesSwimlaneId': swimlaneId,
                  },
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
                  $set: {
                    'profile.boardTemplatesSwimlaneId': swimlaneId,
                  },
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
        // End of Insert Template Container
      });
    });
  }

  Users.after.insert((userId, doc) => {
    // HACK
    doc = Users.findOne({
      _id: doc._id,
    });
    if (doc.createdThroughApi) {
      // The admin user should be able to create a user despite disabling registration because
      // it is two different things (registration and creation).
      // So, when a new user is created via the api (only admin user can do that) one must avoid
      // the disableRegistration check.
      // Issue : https://github.com/wekan/wekan/issues/1232
      // PR    : https://github.com/wekan/wekan/pull/1251
      Users.update(doc._id, {
        $set: {
          createdThroughApi: '',
        },
      });
      return;
    }

    //invite user to corresponding boards
    const disableRegistration = Settings.findOne().disableRegistration;
    // If ldap, bypass the inviation code if the self registration isn't allowed.
    // TODO : pay attention if ldap field in the user model change to another content ex : ldap field to connection_type
    if (doc.authenticationMethod !== 'ldap' && disableRegistration) {
      let invitationCode = null;
      if(doc.authenticationMethod.toLowerCase() == 'oauth2')
      { // OIDC authentication mode
        invitationCode = InvitationCodes.findOne({
          email: doc.emails[0].address.toLowerCase(),
          valid: true,
        });
      }
      else{
        invitationCode = InvitationCodes.findOne({
          code: doc.profile.icode,
          valid: true,
        });
      }
      if (!invitationCode) {
        throw new Meteor.Error('error-invitation-code-not-exist');
      } else {
        invitationCode.boardsToBeInvited.forEach((boardId) => {
          const board = Boards.findOne(boardId);
          board.addMember(doc._id);
        });
        if (!doc.profile) {
          doc.profile = {};
        }
        doc.profile.invitedBoards = invitationCode.boardsToBeInvited;
        Users.update(doc._id, {
          $set: {
            profile: doc.profile,
          },
        });
        InvitationCodes.update(invitationCode._id, {
          $set: {
            valid: false,
          },
        });
      }
    }
  });
}

// USERS REST API
if (Meteor.isServer) {
  // Middleware which checks that API is enabled.
  JsonRoutes.Middleware.use(function (req, res, next) {
    const api = req.url.startsWith('/api');
    if ((api === true && process.env.WITH_API === 'true') || api === false) {
      return next();
    } else {
      res.writeHead(301, {
        Location: '/',
      });
      return res.end();
    }
  });

  /**
   * @operation get_current_user
   *
   * @summary returns the current user
   * @return_type Users
   */
  JsonRoutes.add('GET', '/api/user', function (req, res) {
    try {
      Authentication.checkLoggedIn(req.userId);
      const data = Meteor.users.findOne({
        _id: req.userId,
      });
      delete data.services;

      // get all boards where the user is member of
      let boards = Boards.find(
        {
          type: 'board',
          'members.userId': req.userId,
        },
        {
          fields: {
            _id: 1,
            members: 1,
          },
        },
      );
      boards = boards.map((b) => {
        const u = b.members.find((m) => m.userId === req.userId);
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
  JsonRoutes.add('GET', '/api/users', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Meteor.users.find({}).map(function (doc) {
          return {
            _id: doc._id,
            username: doc.username,
          };
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
   * @param {string} userId the user ID or username
   * @return_type Users
   */
  JsonRoutes.add('GET', '/api/users/:userId', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      let id = req.params.userId;
      let user = Meteor.users.findOne({
        _id: id,
      });
      if (!user) {
        user = Meteor.users.findOne({
          username: id,
        });
        id = user._id;
      }

      // get all boards where the user is member of
      let boards = Boards.find(
        {
          type: 'board',
          'members.userId': id,
        },
        {
          fields: {
            _id: 1,
            members: 1,
          },
        },
      );
      boards = boards.map((b) => {
        const u = b.members.find((m) => m.userId === id);
        delete u.userId;
        u.boardId = b._id;
        return u;
      });

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
  JsonRoutes.add('PUT', '/api/users/:userId', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.userId;
      const action = req.body.action;
      let data = Meteor.users.findOne({
        _id: id,
      });
      if (data !== undefined) {
        if (action === 'takeOwnership') {
          data = Boards.find(
            {
              'members.userId': id,
              'members.isAdmin': true,
            },
            {
              sort: {
                sort: 1 /* boards default sorting */,
              },
            },
          ).map(function (board) {
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
              {
                _id: id,
              },
              {
                $set: {
                  loginDisabled: true,
                  'services.resume.loginTokens': '',
                },
              },
            );
          } else if (action === 'enableLogin') {
            Users.update(
              {
                _id: id,
              },
              {
                $set: {
                  loginDisabled: '',
                },
              },
            );
          }
          data = Meteor.users.findOne({
            _id: id,
          });
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
  JsonRoutes.add(
    'POST',
    '/api/boards/:boardId/members/:userId/add',
    function (req, res) {
      try {
        Authentication.checkUserId(req.userId);
        const userId = req.params.userId;
        const boardId = req.params.boardId;
        const action = req.body.action;
        const { isAdmin, isNoComments, isCommentOnly } = req.body;
        let data = Meteor.users.findOne({
          _id: userId,
        });
        if (data !== undefined) {
          if (action === 'add') {
            data = Boards.find({
              _id: boardId,
            }).map(function (board) {
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
    },
  );

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
    function (req, res) {
      try {
        Authentication.checkUserId(req.userId);
        const userId = req.params.userId;
        const boardId = req.params.boardId;
        const action = req.body.action;
        let data = Meteor.users.findOne({
          _id: userId,
        });
        if (data !== undefined) {
          if (action === 'remove') {
            data = Boards.find({
              _id: boardId,
            }).map(function (board) {
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
  JsonRoutes.add('POST', '/api/users/', function (req, res) {
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
  JsonRoutes.add('DELETE', '/api/users/:userId', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.userId;
      // Delete user is enabled, but is still has bug of leaving empty user avatars
      // to boards: boards members, card members and assignees have
      // empty users. So it would be better to delete user from all boards before
      // deleting user.
      // See:
      // - wekan/client/components/settings/peopleBody.jade deleteButton
      // - wekan/client/components/settings/peopleBody.js deleteButton
      // - wekan/client/components/sidebar/sidebar.js Popup.afterConfirm('removeMember'
      //   that does now remove member from board, card members and assignees correctly,
      //   but that should be used to remove user from all boards similarly
      // - wekan/models/users.js Delete is not enabled
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

  /**
   * @operation create_user_token
   *
   * @summary Create a user token
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} userId the ID of the user to create token for.
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/createtoken/:userId', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.userId;
      const token = Accounts._generateStampedLoginToken();
      Accounts._insertLoginToken(id, token);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
          authToken: token.token,
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
