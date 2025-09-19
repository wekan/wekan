import { ReactiveCache, ReactiveMiniMongoIndex } from '/imports/reactiveCache';
import { SyncedCron } from 'meteor/percolate:synced-cron';
import { TAPi18n } from '/imports/i18n';
import ImpersonatedUsers from './impersonatedUsers';
import { Index, MongoDBEngine } from 'meteor/easy:search';

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
    'orgs.$.orgId': {
      /**
       * The uniq ID of the organization
       */
      type: String,
    },
    'orgs.$.orgDisplayName': {
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
    'teams.$.teamId': {
      /**
       * The uniq ID of the team
       */
      type: String,
    },
    'teams.$.teamDisplayName': {
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
    'profile.moveAndCopyDialog': {
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
    'profile.moveChecklistDialog': {
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
    'profile.copyChecklistDialog': {
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
    'profile.rescueCardDescription': {
      /**
       * show dialog for saving card description on unintentional card closing
       */
      type: Boolean,
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
    'profile.listWidths': {
      /**
       * User-specified width of each list (or nothing if default).
       * profile[boardId][listId] = width;
       */
      type: Object,
      defaultValue: {},
      blackbox: true,
    },
    'profile.listConstraints': {
      /**
       * User-specified constraint of each list (or nothing if default).
       * profile[boardId][listId] = constraint;
       */
      type: Object,
      defaultValue: {},
      blackbox: true,
    },
    'profile.autoWidthBoards': {
      /**
       * User-specified flag for enabling auto-width for boards (false is the default).
       * profile[boardId][listId] = constraint;
       */
      type: Object,
      defaultValue: {},
      blackbox: true,
    },
    'profile.swimlaneHeights': {
      /**
       * User-specified heights of each swimlane (or nothing if default).
       * profile[boardId][swimlaneId] = height;
       */
      type: Object,
      defaultValue: {},
      blackbox: true,
    },
    'profile.keyboardShortcuts': {
      /**
       * User-specified state of keyboard shortcut activation.
       */
      type: Boolean,
      defaultValue: false,
    },
    'profile.verticalScrollbars': {
      /**
       * User-specified state of vertical scrollbars visibility.
       */
      type: Boolean,
      defaultValue: true,
    },
    'profile.showWeekOfYear': {
      /**
       * User-specified state of week-of-year in date displays.
       */
      type: Boolean,
      defaultValue: true,
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
    lastConnectionDate: {
      type: Date,
      optional: true,
    },
  }),
);

Users.allow({
  update(userId, doc) {
    const user =
      ReactiveCache.getUser(userId) || ReactiveCache.getCurrentUser();
    if (user?.isAdmin) return true;
    if (!user) {
      return false;
    }
    return doc._id === userId;
  },
  remove(userId, doc) {
    const adminsNumber = ReactiveCache.getUsers({
      isAdmin: true,
    }).length;
    const isAdmin = ReactiveCache.getUser(
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

// Non-Admin users can not change to Admin
Users.deny({
  update(userId, board, fieldNames) {
    return (
      _.contains(fieldNames, 'isAdmin') &&
      !ReactiveCache.getCurrentUser().isAdmin
    );
  },
  fetch: [],
});

// Search a user in the complete server database by its name, username or emails adress. This
// is used for instance to add a new user to a board.
UserSearchIndex = new Index({
  collection: Users,
  fields: ['username', 'profile.fullname', 'profile.avatarUrl'],
  allowedFields: ['username', 'profile.fullname', 'profile.avatarUrl'],
  engine: new MongoDBEngine({
    fields: function (searchObject, options) {
      return {
        username: 1,
        'profile.fullname': 1,
        'profile.avatarUrl': 1,
      };
    },
  }),
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
  lastConnectionDate: 1,
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
        board = ReactiveCache.getBoard(boardId);
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
      return this.teams.map((team) => {
        return team.teamId;
      });
    }
    return [];
  },
  orgIds() {
    if (this.orgs) {
      // TODO: Should the Org collection be queried to determine if the organization isActive?
      return this.orgs.map((org) => {
        return org.orgId;
      });
    }
    return [];
  },
  orgsUserBelongs() {
    if (this.orgs) {
      return this.orgs
        .map(function (org) {
          return org.orgDisplayName;
        })
        .sort()
        .join(',');
    }
    return '';
  },
  orgIdsUserBelongs() {
    let ret = '';
    if (this.orgs) {
      ret = this.orgs.map((org) => org.orgId).join(',');
    }
    return ret;
  },
  teamsUserBelongs() {
    if (this.teams) {
      return this.teams
        .map(function (team) {
          return team.teamDisplayName;
        })
        .sort()
        .join(',');
    }
    return '';
  },
  teamIdsUserBelongs() {
    let ret = '';
    if (this.teams) {
      ret = this.teams.map((team) => team.teamId).join(',');
    }
    return ret;
  },
  boards() {
    return Boards.userBoards(this._id, null, {}, { sort: { sort: 1 } });
  },

  starredBoards() {
    const { starredBoards = [] } = this.profile || {};
    return Boards.userBoards(
      this._id,
      false,
      { _id: { $in: starredBoards } },
      { sort: { sort: 1 } },
    );
  },

  hasStarred(boardId) {
    const { starredBoards = [] } = this.profile || {};
    return _.contains(starredBoards, boardId);
  },

  isAutoWidth(boardId) {
    const { autoWidthBoards = {} } = this.profile || {};
    return autoWidthBoards[boardId] === true;
  },

  invitedBoards() {
    const { invitedBoards = [] } = this.profile || {};
    return Boards.userBoards(
      this._id,
      false,
      { _id: { $in: invitedBoards } },
      { sort: { sort: 1 } },
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

  getListWidths() {
    const { listWidths = {} } = this.profile || {};
    return listWidths;
  },
  getListWidth(boardId, listId) {
    const listWidths = this.getListWidths();
    if (listWidths[boardId] && listWidths[boardId][listId]) {
      return listWidths[boardId][listId];
    } else {
      return 270; //TODO(mark-i-m): default?
    }
  },
  getListConstraints() {
    const { listConstraints = {} } = this.profile || {};
    return listConstraints;
  },
  getListConstraint(boardId, listId) {
    const listConstraints = this.getListConstraints();
    if (listConstraints[boardId] && listConstraints[boardId][listId]) {
      return listConstraints[boardId][listId];
    } else {
      return 550;
    }
  },

  getSwimlaneHeights() {
    const { swimlaneHeights = {} } = this.profile || {};
    return swimlaneHeights;
  },
  getSwimlaneHeight(boardId, listId) {
    const swimlaneHeights = this.getSwimlaneHeights();
    if (swimlaneHeights[boardId] && swimlaneHeights[boardId][listId]) {
      return swimlaneHeights[boardId][listId];
    } else {
      return -1;
    }
  },

  /** returns all confirmed move and copy dialog field values
   * <li> the board, swimlane and list id is stored for each board
   */
  getMoveAndCopyDialogOptions() {
    let _ret = {};
    if (this.profile && this.profile.moveAndCopyDialog) {
      _ret = this.profile.moveAndCopyDialog;
    }
    return _ret;
  },

  /** returns all confirmed move checklist dialog field values
   * <li> the board, swimlane, list and card id is stored for each board
   */
  getMoveChecklistDialogOptions() {
    let _ret = {};
    if (this.profile && this.profile.moveChecklistDialog) {
      _ret = this.profile.moveChecklistDialog;
    }
    return _ret;
  },

  /** returns all confirmed copy checklist dialog field values
   * <li> the board, swimlane, list and card id is stored for each board
   */
  getCopyChecklistDialogOptions() {
    let _ret = {};
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
      if (
        !notification.activityObj &&
        typeof notification.activity === 'string'
      ) {
        notification.activityObj = ReactiveMiniMongoIndex.getActivityWithId(
          notification.activity,
        );
      }
    }
    // newest first. don't use reverse() because it changes the array inplace, so sometimes the array is reversed twice and oldest items at top again
    const ret = notifications.toReversed();
    return ret;
  },

  hasShowDesktopDragHandles() {
    const profile = this.profile || {};
    return profile.showDesktopDragHandles || false;
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

  hasRescuedCardDescription() {
    const profile = this.profile || {};
    return profile.rescueCardDescription || false;
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
    //return (ReactiveCache.getBoard((this.profile || {}).templatesBoardId) || {}).slug;
    return 'templates';
  },

  isKeyboardShortcuts() {
    const { keyboardShortcuts = true } = this.profile || {};
    return keyboardShortcuts;
  },

  isVerticalScrollbars() {
    const { verticalScrollbars = true } = this.profile || {};
    return verticalScrollbars;
  },

  isShowWeekOfYear() {
    const { showWeekOfYear = true } = this.profile || {};
    return showWeekOfYear;
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
  toggleAutoWidth(boardId) {
    const { autoWidthBoards = {} } = this.profile || {};
    autoWidthBoards[boardId] = !autoWidthBoards[boardId];
    return {
      $set: {
        'profile.autoWidthBoards': autoWidthBoards,
      },
    };
  },
  toggleKeyboardShortcuts() {
    const { keyboardShortcuts = true } = this.profile || {};
    return {
      $set: {
        'profile.keyboardShortcuts': !keyboardShortcuts,
      },
    };
  },
  toggleVerticalScrollbars() {
    const { verticalScrollbars = true } = this.profile || {};
    return {
      $set: {
        'profile.verticalScrollbars': !verticalScrollbars,
      },
    };
  },
  toggleShowWeekOfYear() {
    const { showWeekOfYear = true } = this.profile || {};
    return {
      $set: {
        'profile.showWeekOfYear': !showWeekOfYear,
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
  toggleRescueCardDescription(value = false) {
    return {
      $set: {
        'profile.rescueCardDescription': !value,
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

  setListWidth(boardId, listId, width) {
    let currentWidths = this.getListWidths();
    if (!currentWidths[boardId]) {
      currentWidths[boardId] = {};
    }
    currentWidths[boardId][listId] = width;
    return {
      $set: {
        'profile.listWidths': currentWidths,
      },
    };
  },

  setListConstraint(boardId, listId, constraint) {
    let currentConstraints = this.getListConstraints();
    if (!currentConstraints[boardId]) {
      currentConstraints[boardId] = {};
    }
    currentConstraints[boardId][listId] = constraint;
    return {
      $set: {
        'profile.listConstraints': currentConstraints,
      },
    };
  },

  setSwimlaneHeight(boardId, swimlaneId, height) {
    let currentHeights = this.getSwimlaneHeights();
    if (!currentHeights[boardId]) {
      currentHeights[boardId] = {};
    }
    currentHeights[boardId][swimlaneId] = height;
    return {
      $set: {
        'profile.swimlaneHeights': currentHeights,
      },
    };
  },
});

Meteor.methods({
  setListSortBy(value) {
    check(value, String);
    ReactiveCache.getCurrentUser().setListSortBy(value);
  },
  toggleDesktopDragHandles() {
    const user = ReactiveCache.getCurrentUser();
    user.toggleDesktopHandles(user.hasShowDesktopDragHandles());
  },
  toggleHideCheckedItems() {
    const user = ReactiveCache.getCurrentUser();
    user.toggleHideCheckedItems();
  },
  toggleCustomFieldsGrid() {
    const user = ReactiveCache.getCurrentUser();
    user.toggleFieldsGrid(user.hasCustomFieldsGrid());
  },
  toggleCardMaximized() {
    const user = ReactiveCache.getCurrentUser();
    user.toggleCardMaximized(user.hasCardMaximized());
  },
  toggleMinicardLabelText() {
    const user = ReactiveCache.getCurrentUser();
    user.toggleLabelText(user.hasHiddenMinicardLabelText());
  },
  toggleRescueCardDescription() {
    const user = ReactiveCache.getCurrentUser();
    user.toggleRescueCardDescription(user.hasRescuedCardDescription());
  },
  changeLimitToShowCardsCount(limit) {
    check(limit, Number);
    ReactiveCache.getCurrentUser().setShowCardsCountAt(limit);
  },
  changeStartDayOfWeek(startDay) {
    check(startDay, Number);
    ReactiveCache.getCurrentUser().setStartDayOfWeek(startDay);
  },
  applyListWidth(boardId, listId, width, constraint) {
    check(boardId, String);
    check(listId, String);
    check(width, Number);
    check(constraint, Number);
    const user = ReactiveCache.getCurrentUser();
    user.setListWidth(boardId, listId, width);
    user.setListConstraint(boardId, listId, constraint);
  },
  applySwimlaneHeight(boardId, swimlaneId, height) {
    check(boardId, String);
    check(swimlaneId, String);
    check(height, Number);
    const user = ReactiveCache.getCurrentUser();
    user.setSwimlaneHeight(boardId, swimlaneId, height);
  },
});

if (Meteor.isServer) {
  Meteor.methods({
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
      // Prevent Hyperlink Injection https://github.com/wekan/wekan/issues/5176
      // Thanks to mc-marcy and xet7 !
      if (
        fullname.includes('/') ||
        username.includes('/') ||
        email.includes('/') ||
        initials.includes('/')
      ) {
        return false;
      }
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        const nUsersWithUsername = ReactiveCache.getUsers({
          username,
        }).length;
        const nUsersWithEmail = ReactiveCache.getUsers({
          email,
        }).length;
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
            ReactiveCache.getUser(username) ||
            ReactiveCache.getUser({ username });
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
      // Prevent Hyperlink Injection https://github.com/wekan/wekan/issues/5176
      // Thanks to mc-marcy and xet7 !
      if (username.includes('/') || userId.includes('/')) {
        return false;
      }
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        const nUsersWithUsername = ReactiveCache.getUsers({
          username,
        }).length;
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
      // Prevent Hyperlink Injection https://github.com/wekan/wekan/issues/5176
      // Thanks to mc-marcy and xet7 !
      if (username.includes('/') || email.includes('/')) {
        return false;
      }
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        if (Array.isArray(email)) {
          email = email.shift();
        }
        const existingUser = ReactiveCache.getUser(
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
      // Prevent Hyperlink Injection https://github.com/wekan/wekan/issues/5176
      // Thanks to mc-marcy and xet7 !
      if (
        username.includes('/') ||
        email.includes('/') ||
        userId.includes('/')
      ) {
        return false;
      }
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
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
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        Accounts.setPassword(userId, newPassword);
      }
    },
    setEmailVerified(email, verified, userId) {
      check(email, String);
      check(verified, Boolean);
      check(userId, String);
      // Prevent Hyperlink Injection https://github.com/wekan/wekan/issues/5176
      // Thanks to mc-marcy and xet7 !
      if (email.includes('/') || userId.includes('/')) {
        return false;
      }
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
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
      // Prevent Hyperlink Injection https://github.com/wekan/wekan/issues/5176
      // Thanks to mc-marcy and xet7 !
      if (initials.includes('/') || userId.includes('/')) {
        return false;
      }
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
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
      // Prevent Hyperlink Injection https://github.com/wekan/wekan/issues/5176
      // Thanks to mc-marcy and xet7 !
      if (username.includes('/') || boardId.includes('/')) {
        return false;
      }
      const inviter = ReactiveCache.getCurrentUser();
      const board = ReactiveCache.getBoard(boardId);
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
        user = ReactiveCache.getUser({
          emails: {
            $elemMatch: {
              address: username,
            },
          },
        });
      } else {
        user =
          ReactiveCache.getUser(username) ||
          ReactiveCache.getUser({ username });
      }
      if (user) {
        if (user._id === inviter._id)
          throw new Meteor.Error('error-user-notAllowSelf');
      } else {
        if (posAt <= 0) throw new Meteor.Error('error-user-doesNotExist');
        if (ReactiveCache.getCurrentSetting().disableRegistration) {
          throw new Meteor.Error('error-user-notCreated');
        }
        // Set in lowercase email before creating account
        const email = username.toLowerCase();
        username = email.substring(0, posAt);
        // Prevent Hyperlink Injection https://github.com/wekan/wekan/issues/5176
        // Thanks to mc-marcy and xet7 !
        if (username.includes('/') || email.includes('/')) {
          return false;
        }
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
        user = ReactiveCache.getUser(newUserId);
      }

      board.addMember(user._id);
      user.addInvite(boardId);

      //Check if there is a subtasks board
      if (board.subtasksDefaultBoardId) {
        const subBoard = ReactiveCache.getBoard(board.subtasksDefaultBoardId);
        //If there is, also add user to that board
        if (subBoard) {
          subBoard.addMember(user._id);
          user.addInvite(subBoard._id);
        }
      }
      try {
        const fullName =
          inviter.profile !== undefined &&
          inviter.profile.fullname !== undefined
            ? inviter.profile.fullname
            : '';
        const userFullName =
          user.profile !== undefined && user.profile.fullname !== undefined
            ? user.profile.fullname
            : '';
        const params = {
          user:
            userFullName != ''
              ? userFullName + ' (' + user.username + ' )'
              : user.username,
          inviter:
            fullName != ''
              ? fullName + ' (' + inviter.username + ' )'
              : inviter.username,
          board: board.title,
          url: board.absoluteUrl(),
        };
        // Get the recipient user's language preference for the email
        const lang = user.getLanguage();

        // Add code to send invitation with EmailLocalization
        if (typeof EmailLocalization !== 'undefined') {
          EmailLocalization.sendEmail({
            to: user.emails[0].address,
            from: Accounts.emailTemplates.from,
            subject: 'email-invite-subject',
            text: 'email-invite-text',
            params: params,
            language: lang,
            userId: user._id,
          });
        } else {
          // Fallback if EmailLocalization is not available
          Email.send({
            to: user.emails[0].address,
            from: Accounts.emailTemplates.from,
            subject: TAPi18n.__('email-invite-subject', params, lang),
            text: TAPi18n.__('email-invite-text', params, lang),
          });
        }
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

      if (!ReactiveCache.getUser(userId))
        throw new Meteor.Error(404, 'User not found');
      if (!ReactiveCache.getCurrentUser().isAdmin)
        throw new Meteor.Error(403, 'Permission denied');

      ImpersonatedUsers.insert({
        adminId: ReactiveCache.getCurrentUser()._id,
        userId: userId,
        reason: 'clickedImpersonate',
      });
      this.setUserId(userId);
    },
    isImpersonated(userId) {
      check(userId, String);
      const isImpersonated = ReactiveCache.getImpersonatedUser({
        userId: userId,
      });
      return isImpersonated;
    },
    setUsersTeamsTeamDisplayName(teamId, teamDisplayName) {
      check(teamId, String);
      check(teamDisplayName, String);
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        ReactiveCache.getUsers({
          teams: {
            $elemMatch: { teamId: teamId },
          },
        }).forEach((user) => {
          Users.update(
            {
              _id: user._id,
              teams: {
                $elemMatch: { teamId: teamId },
              },
            },
            {
              $set: {
                'teams.$.teamDisplayName': teamDisplayName,
              },
            },
          );
        });
      }
    },
    setUsersOrgsOrgDisplayName(orgId, orgDisplayName) {
      check(orgId, String);
      check(orgDisplayName, String);
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        ReactiveCache.getUsers({
          orgs: {
            $elemMatch: { orgId: orgId },
          },
        }).forEach((user) => {
          Users.update(
            {
              _id: user._id,
              orgs: {
                $elemMatch: { orgId: orgId },
              },
            },
            {
              $set: {
                'orgs.$.orgDisplayName': orgDisplayName,
              },
            },
          );
        });
      }
    },
  });
  Accounts.onCreateUser((options, user) => {
    const userCount = ReactiveCache.getUsers({}, {}, true).count();
    user.isAdmin = userCount === 0;

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

      // Prevent Hyperlink Injection https://github.com/wekan/wekan/issues/5176
      // Thanks to mc-marcy and xet7 !
      if (user.username.includes('/') || email.includes('/')) {
        return false;
      }

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
      const existingUser = ReactiveCache.getUser({
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

    const disableRegistration = false;
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
    const invitationCode = ReactiveCache.getInvitationCode({
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
        for (const user of ReactiveCache.getUsers()) {
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
    // Avatar URLs from CollectionFS to Meteor-Files, at users collection avatarUrl field:
    Users.find({
      'profile.avatarUrl': { $regex: '/cfs/files/avatars/' },
    }).forEach(function (doc) {
      doc.profile.avatarUrl = doc.profile.avatarUrl.replace(
        '/cfs/files/avatars/',
        '/cdn/storage/avatars/',
      );
      // Try to fix Users.save is not a fuction, by commenting it out:
      //Users.save(doc);
    });
    /* TODO: Optionally, for additional complexity:
       a) Support SubURLs with parthname from ROOT_URL
       b) Remove beginning or avatar URL, replace it with pathname and new avatar URL
       c) Does all avatar and attachment URLs need to be fixed every time when starting or restarting?
       d) What if avatar URL is at some other server? In that case, links would point incorrectly to this instance, if ROOT_URL and path part is removed.
       doc.profile.avatarUrl = process.env.ROOT_URL.pathname + doc.profile.avatarUrl.replace("/cfs/files/avatars/", "/cdn/storage/avatars/").substring(str.indexOf("/cdn/storage/avatars"));
    */
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
    doc = ReactiveCache.getUser(doc._id);
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
    const disableRegistration =
      ReactiveCache.getCurrentSetting().disableRegistration;
    // If ldap, bypass the inviation code if the self registration isn't allowed.
    // TODO : pay attention if ldap field in the user model change to another content ex : ldap field to connection_type
    if (doc.authenticationMethod !== 'ldap' && disableRegistration) {
      let invitationCode = null;
      if (doc.authenticationMethod.toLowerCase() == 'oauth2') {
        // OIDC authentication mode
        invitationCode = ReactiveCache.getInvitationCode({
          email: doc.emails[0].address.toLowerCase(),
          valid: true,
        });
      } else {
        invitationCode = ReactiveCache.getInvitationCode({
          code: doc.profile.icode,
          valid: true,
        });
      }
      if (!invitationCode) {
        throw new Meteor.Error('error-invitation-code-not-exist');
      } else {
        invitationCode.boardsToBeInvited.forEach((boardId) => {
          const board = ReactiveCache.getBoard(boardId);
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
      const data = ReactiveCache.getUser({
        _id: req.userId,
      });
      delete data.services;

      // get all boards where the user is member of
      let boards = ReactiveCache.getBoards(
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
      let user = ReactiveCache.getUser({
        _id: id,
      });
      if (!user) {
        user = ReactiveCache.getUser({
          username: id,
        });
        id = user._id;
      }

      // get all boards where the user is member of
      let boards = ReactiveCache.getBoards(
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
      let data = ReactiveCache.getUser({
        _id: id,
      });
      if (data !== undefined) {
        if (action === 'takeOwnership') {
          data = ReactiveCache.getBoards(
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
          data = ReactiveCache.getUser(id);
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
   * @param {string} action the action (needs to be `add`)
   * @param {boolean} isAdmin is the user an admin of the board
   * @param {boolean} isNoComments disable comments
   * @param {boolean} isCommentOnly only enable comments
   * @param {boolean} isWorker is the user a board worker
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
        const { isAdmin, isNoComments, isCommentOnly, isWorker } = req.body;
        let data = ReactiveCache.getUser(userId);
        if (data !== undefined) {
          if (action === 'add') {
            data = ReactiveCache.getBoards({
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
                  isTrue(isWorker),
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
        JsonRoutes.sendResult(res, { code: 200, data });
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
        let data = ReactiveCache.getUser(userId);
        if (data !== undefined) {
          if (action === 'remove') {
            data = ReactiveCache.getBoards({
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
        JsonRoutes.sendResult(res, { code: 200, data });
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

  /**
   * @operation delete_user_token
   *
   * @summary Delete one or all user token.
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} userId the user ID
   * @param {string} token the user hashedToken
   * @return_type {message: string}
   */
  JsonRoutes.add('POST', '/api/deletetoken', function (req, res) {
    try {
      const { userId, token } = req.body;
      Authentication.checkUserId(req.userId);

      let data = {
        message: 'Expected a userId to be set but received none.',
      };

      if (token && userId) {
        Accounts.destroyToken(userId, token);
        data.message = 'Delete token: [' + token + '] from user: ' + userId;
      } else if (userId) {
        check(userId, String);
        Users.update(
          {
            _id: userId,
          },
          {
            $set: {
              'services.resume.loginTokens': '',
            },
          },
        );
        data.message = 'Delete all token from user: ' + userId;
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
}

export default Users;
