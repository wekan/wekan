import { Meteor } from 'meteor/meteor';
import { ReactiveCache, ReactiveMiniMongoIndex } from '/imports/reactiveCache';
import Boards from '/models/boards';
// import { Index, MongoDBEngine } from 'meteor/easy:search'; // Temporarily disabled due to compatibility issues
const { SimpleSchema } = require('/imports/simpleSchema');
const Users = Meteor.users;
const getUtils = () => require('/client/lib/utils').Utils;

// Public-board collapse persistence helpers (cookie-based for non-logged-in users)
if (Meteor.isClient) {
  const readCookieMap = name => {
    try {
      const stored = typeof document !== 'undefined' ? document.cookie : '';
      const cookies = stored.split(';').map(c => c.trim());
      let json = '{}';
      for (const c of cookies) {
        if (c.startsWith(name + '=')) {
          json = decodeURIComponent(c.substring(name.length + 1));
          break;
        }
      }
      return JSON.parse(json || '{}');
    } catch (e) {
      console.warn('Error parsing collapse cookie', name, e);
      return {};
    }
  };

  const writeCookieMap = (name, data) => {
    try {
      const serialized = encodeURIComponent(JSON.stringify(data || {}));
      const maxAge = 60 * 60 * 24 * 365; // 1 year
      document.cookie = `${name}=${serialized}; path=/; max-age=${maxAge}`;
    } catch (e) {
      console.warn('Error writing collapse cookie', name, e);
    }
  };

  Users.getPublicCollapsedList = (boardId, listId) => {
    if (!boardId || !listId) return null;
    const data = readCookieMap('wekan-collapsed-lists');
    if (data[boardId] && typeof data[boardId][listId] === 'boolean') {
      return data[boardId][listId];
    }
    return null;
  };

  Users.setPublicCollapsedList = (boardId, listId, collapsed) => {
    if (!boardId || !listId) return false;
    const data = readCookieMap('wekan-collapsed-lists');
    if (!data[boardId]) data[boardId] = {};
    data[boardId][listId] = !!collapsed;
    writeCookieMap('wekan-collapsed-lists', data);
    return true;
  };

  Users.getPublicCollapsedSwimlane = (boardId, swimlaneId) => {
    if (!boardId || !swimlaneId) return null;
    const data = readCookieMap('wekan-collapsed-swimlanes');
    if (data[boardId] && typeof data[boardId][swimlaneId] === 'boolean') {
      return data[boardId][swimlaneId];
    }
    return null;
  };

  Users.setPublicCollapsedSwimlane = (boardId, swimlaneId, collapsed) => {
    if (!boardId || !swimlaneId) return false;
    const data = readCookieMap('wekan-collapsed-swimlanes');
    if (!data[boardId]) data[boardId] = {};
    data[boardId][swimlaneId] = !!collapsed;
    writeCookieMap('wekan-collapsed-swimlanes', data);
    return true;
  };

  Users.getPublicCardCollapsed = () => {
    const data = readCookieMap('wekan-card-collapsed');
    return typeof data.state === 'boolean' ? data.state : null;
  };

  Users.setPublicCardCollapsed = collapsed => {
    writeCookieMap('wekan-card-collapsed', { state: !!collapsed });
    return true;
  };
}

export const allowedSortValues = [
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
      type: Array,
      optional: true,
    },
    'orgs.$': {
      type: Object,
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
      type: Array,
      optional: true,
    },
    'teams.$': {
      type: Object,
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
      type: Array,
      optional: true,
    },
    'emails.$': {
      type: Object,
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
      type: Array,
      optional: true,
    },
    'profile.emailBuffer.$': {
      type: String,
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
    'profile.GreyIcons': {
      /**
       * per-user preference to render unicode icons in grey
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
    'profile.cardCollapsed': {
      /**
       * has user collapsed the card details?
       */
      type: Boolean,
      optional: true,
    },
    'profile.showActivities': {
      /**
       * does the user want to show activities in card details?
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
    'profile.boardWorkspacesTree': {
      /**
       * Per-user spaces tree for All Boards page
       */
      type: Array,
      optional: true,
    },
    'profile.boardWorkspacesTree.$': {
      /**
       * Space node: { id: String, name: String, children: Array<node> }
       */
      type: Object,
      blackbox: true,
      optional: true,
    },
    'profile.boardWorkspaceAssignments': {
      /**
       * Per-user map of boardId -> spaceId
       */
      type: Object,
      optional: true,
      blackbox: true,
    },
    'profile.invitedBoards': {
      /**
       * board IDs the user has been invited to
       */
      type: Array,
      optional: true,
    },
    'profile.invitedBoards.$': {
      type: String,
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
    'profile.moveChecklistDialog': {
      /**
       * move checklist dialog
       */
      type: Object,
      optional: true,
      blackbox: true,
    },
    'profile.copyChecklistDialog': {
      /**
       * copy checklist dialog
       */
      type: Object,
      optional: true,
      blackbox: true,
    },
    'profile.notifications': {
      /**
       * enabled notifications for the user
       */
      type: Array,
      optional: true,
    },
    'profile.notifications.$': {
      type: Object,
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
      type: Array,
      optional: true,
    },
    'profile.starredBoards.$': {
      type: String,
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
        'board-view-gantt',
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
    'profile.collapsedLists': {
      /**
       * Per-user collapsed state for lists.
       * profile[boardId][listId] = true|false
       */
      type: Object,
      defaultValue: {},
      blackbox: true,
    },
    'profile.collapsedSwimlanes': {
      /**
       * Per-user collapsed state for swimlanes.
       * profile[boardId][swimlaneId] = true|false
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
    'profile.dateFormat': {
      /**
       * User-specified date format for displaying dates (includes time HH:MM).
       */
      type: String,
      optional: true,
      allowedValues: ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'],
      defaultValue: 'YYYY-MM-DD',
    },
    'profile.zoomLevel': {
      /**
       * User-specified zoom level for board view (1.0 = 100%, 1.5 = 150%, etc.)
       */
      type: Number,
      defaultValue: 1.0,
      min: 0.5,
      max: 3.0,
    },
    'profile.mobileMode': {
      /**
       * User-specified mobile/desktop mode toggle
       */
      type: Boolean,
      defaultValue: false,
    },
    'profile.cardZoom': {
      /**
       * User-specified zoom level for card details (1.0 = 100%, 1.5 = 150%, etc.)
       */
      type: Number,
      defaultValue: 1.0,
      min: 0.5,
      max: 3.0,
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
      type: Array,
      optional: true,
    },
    'importUsernames.$': {
      type: String,
    },
    lastConnectionDate: {
      type: Date,
      optional: true,
    },
  }),
);

// Security helpers for user updates
export const USER_UPDATE_ALLOWED_EXACT = ['username', 'profile', 'modifiedAt'];
export const USER_UPDATE_ALLOWED_PREFIXES = ['profile.'];
export const USER_UPDATE_FORBIDDEN_PREFIXES = [
  'services',
  'emails',
  'roles',
  'isAdmin',
  'createdThroughApi',
  'orgs',
  'teams',
  'loginDisabled',
  'authenticationMethod',
  'sessionData',
];

export function isUserUpdateAllowed(fields) {
  const result = fields.every((f) =>
    USER_UPDATE_ALLOWED_EXACT.includes(f) || USER_UPDATE_ALLOWED_PREFIXES.some((p) => f.startsWith(p))
  );
  return result;
}

export function hasForbiddenUserUpdateField(fields) {
  const result = fields.some((f) => USER_UPDATE_FORBIDDEN_PREFIXES.some((p) => f === p || f.startsWith(p + '.')));
  return result;
}

// Custom MongoDB engine that enforces field restrictions
// TODO: Re-enable when easy:search compatibility is fixed
// class SecureMongoDBEngine extends MongoDBEngine {
//   getSearchCursor(searchObject, options) {
//     // Always enforce field projection to prevent data leakage
//     const secureProjection = {
//       _id: 1,
//       username: 1,
//       'profile.fullname': 1,
//       'profile.avatarUrl': 1,
//     };

//     // Override any projection passed in options
//     const secureOptions = {
//       ...options,
//       projection: secureProjection,
//     };

//     return super.getSearchCursor(searchObject, secureOptions);
//   }
// }

// Search a user in the complete server database by its name, username or emails adress. This
// is used for instance to add a new user to a board.
// TODO: Fix easy:search compatibility issue - temporarily disabled
// UserSearchIndex = new Index({
//   collection: Users,
//   fields: ['username', 'profile.fullname', 'profile.avatarUrl'],
//   engine: new MongoDBEngine(),
// });

// Temporary fallback - create a simple search index object
export const UserSearchIndex = {
  search: function(query, options) {
    // Simple fallback search using MongoDB find
    const searchRegex = new RegExp(query, 'i');
    return Users.find({
      $or: [
        { username: searchRegex },
        { 'profile.fullname': searchRegex }
      ]
    }, {
      fields: {
        _id: 1,
        username: 1,
        'profile.fullname': 1,
        'profile.avatarUrl': 1
      },
      limit: options?.limit || 20
    });
  }
};

Users.safeFields = {
  _id: 1,
  username: 1,
  'profile.fullname': 1,
  'profile.avatarUrl': 1,
  'profile.initials': 1,
  'profile.zoomLevel': 1,
  'profile.mobileMode': 1,
  'profile.GreyIcons': 1,
  orgs: 1,
  teams: 1,
  authenticationMethod: 1,
  lastConnectionDate: 1,
};

if (Meteor.isClient) {
  Users.helpers({
    isBoardMember() {
      const Utils = getUtils();
      const board = Utils.getCurrentBoard();
      return board && board.hasMember(this._id);
    },

    isNotNoComments() {
      const Utils = getUtils();
      const board = Utils.getCurrentBoard();
      return (
        board && board.hasMember(this._id) && !board.hasNoComments(this._id)
      );
    },

    isNoComments() {
      const Utils = getUtils();
      const board = Utils.getCurrentBoard();
      return board && board.hasNoComments(this._id);
    },

    isNotCommentOnly() {
      const Utils = getUtils();
      const board = Utils.getCurrentBoard();
      return (
        board && board.hasMember(this._id) && !board.hasCommentOnly(this._id)
      );
    },

    isCommentOnly() {
      const Utils = getUtils();
      const board = Utils.getCurrentBoard();
      return board && board.hasCommentOnly(this._id);
    },

    isReadOnly() {
      const Utils = getUtils();
      const board = Utils.getCurrentBoard();
      return board && board.hasReadOnly(this._id);
    },

    isReadAssignedOnly() {
      const Utils = getUtils();
      const board = Utils.getCurrentBoard();
      return board && board.hasReadAssignedOnly(this._id);
    },

    isNotWorker() {
      const Utils = getUtils();
      const board = Utils.getCurrentBoard();
      return board && board.hasMember(this._id) && !board.hasWorker(this._id);
    },

    isWorker() {
      const Utils = getUtils();
      const board = Utils.getCurrentBoard();
      return board && board.hasWorker(this._id);
    },

    isBoardAdmin(boardId) {
      let board;
      if (boardId) {
        board = ReactiveCache.getBoard(boardId);
      } else {
        const Utils = getUtils();
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
      ret = this.orgs.map(org => org.orgId).join(',');
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
      ret = this.teams.map(team => team.teamId).join(',');
    }
    return ret;
  },
  boards() {
    // Fetch unsorted; sorting is per-user via profile.boardSortIndex
    return Boards.userBoards(this._id, null, {}, {});
  },

  starredBoards() {
    const { starredBoards = [] } = this.profile || {};
    return Boards.userBoards(this._id, false, { _id: { $in: starredBoards } }, {});
  },

  hasStarred(boardId) {
    const { starredBoards = [] } = this.profile || {};
    return starredBoards.includes(boardId);
  },

  isAutoWidth(boardId) {
    const { autoWidthBoards = {} } = this.profile || {};
    return autoWidthBoards[boardId] === true;
  },

  invitedBoards() {
    const { invitedBoards = [] } = this.profile || {};
    return Boards.userBoards(this._id, false, { _id: { $in: invitedBoards } }, {});
  },

  isInvitedTo(boardId) {
    const { invitedBoards = [] } = this.profile || {};
    return invitedBoards.includes(boardId);
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
  /**
   * Get per-user board sort index for a board, or null when not set
   */
  getBoardSortIndex(boardId) {
    const mapping = (this.profile && this.profile.boardSortIndex) || {};
    const v = mapping[boardId];
    return typeof v === 'number' ? v : null;
  },
  /**
   * Sort an array of boards by per-user mapping; fallback to title asc
   */
  sortBoardsForUser(boardsArr) {
    const mapping = (this.profile && this.profile.boardSortIndex) || {};
    const arr = (boardsArr || []).slice();
    arr.sort((a, b) => {
      const ia = typeof mapping[a._id] === 'number' ? mapping[a._id] : Number.POSITIVE_INFINITY;
      const ib = typeof mapping[b._id] === 'number' ? mapping[b._id] : Number.POSITIVE_INFINITY;
      if (ia !== ib) return ia - ib;
      const ta = (a.title || '').toLowerCase();
      const tb = (b.title || '').toLowerCase();
      if (ta < tb) return -1;
      if (ta > tb) return 1;
      return 0;
    });
    return arr;
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
    const { listWidths = {}, } = this.profile || {};
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

  getSwimlaneHeightFromStorage(boardId, swimlaneId) {
    // For logged-in users, get from profile
    if (this._id) {
      return this.getSwimlaneHeight(boardId, swimlaneId);
    }

    // For non-logged-in users, get from localStorage
    try {
      const stored = localStorage.getItem('wekan-swimlane-heights');
      if (stored) {
        const heights = JSON.parse(stored);
        if (heights[boardId] && heights[boardId][swimlaneId]) {
          return heights[boardId][swimlaneId];
        }
      }
    } catch (e) {
      console.warn('Error reading swimlane heights from localStorage:', e);
    }

    return -1;
  },

  setSwimlaneHeightToStorage(boardId, swimlaneId, height) {
    // For logged-in users, save to profile
    if (this._id) {
      return this.setSwimlaneHeight(boardId, swimlaneId, height);
    }

    // For non-logged-in users, save to localStorage
    try {
      const stored = localStorage.getItem('wekan-swimlane-heights');
      let heights = stored ? JSON.parse(stored) : {};

      if (!heights[boardId]) {
        heights[boardId] = {};
      }
      heights[boardId][swimlaneId] = height;

      localStorage.setItem('wekan-swimlane-heights', JSON.stringify(heights));
      return true;
    } catch (e) {
      console.warn('Error saving swimlane height to localStorage:', e);
      return false;
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
    return tags.includes(tag);
  },

  hasNotification(activityId) {
    const { notifications = [] } = this.profile || {};
    return notifications.includes(activityId);
  },

  notifications() {
    const { notifications = [] } = this.profile || {};
    for (const index in notifications) {
      if (!notifications.hasOwnProperty(index)) continue;
      const notification = notifications[index];
      // this preserves their db sort order for editing
      notification.dbIndex = index;
      if (!notification.activityObj && typeof(notification.activity) === 'string') {
        notification.activityObj = ReactiveMiniMongoIndex.getActivityWithId(notification.activity);
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

  hasGreyIcons() {
    const profile = this.profile || {};
    return profile.GreyIcons || false;
  },

  hasCustomFieldsGrid() {
    const profile = this.profile || {};
    return profile.customFieldsGrid || false;
  },

  hasCardMaximized() {
    const profile = this.profile || {};
    return profile.cardMaximized || false;
  },

  hasShowActivities() {
    const profile = this.profile || {};
    return profile.showActivities || false;
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

  getDateFormat() {
    const profile = this.profile || {};
    return profile.dateFormat || 'YYYY-MM-DD';
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
    return User.removeAsync({
      _id: this._id,
    });
  },

  getListWidthFromStorage(boardId, listId) {
    // For logged-in users, get from profile
    if (this._id) {
      return this.getListWidth(boardId, listId);
    }

    // For non-logged-in users, get from validated localStorage
    if (typeof localStorage !== 'undefined' && typeof getValidatedLocalStorageData === 'function') {
      try {
        const widths = getValidatedLocalStorageData('wekan-list-widths', validators.listWidths);
        if (widths[boardId] && widths[boardId][listId]) {
          const width = widths[boardId][listId];
          // Validate it's a valid number
          if (validators.isValidNumber(width, 270, 1000)) {
            return width;
          }
        }
      } catch (e) {
        console.warn('Error reading list widths from localStorage:', e);
      }
    }

    return 270; // Return default width
  },

  setListWidthToStorage(boardId, listId, width) {
    // For logged-in users, save to profile
    if (this._id) {
      return this.setListWidth(boardId, listId, width);
    }

    // Validate width before storing
    if (!validators.isValidNumber(width, 270, 1000)) {
      console.warn('Invalid list width:', width);
      return false;
    }

    // For non-logged-in users, save to validated localStorage
    if (typeof localStorage !== 'undefined' && typeof setValidatedLocalStorageData === 'function') {
      try {
        const widths = getValidatedLocalStorageData('wekan-list-widths', validators.listWidths);

        if (!widths[boardId]) {
          widths[boardId] = {};
        }
        widths[boardId][listId] = width;

        return setValidatedLocalStorageData('wekan-list-widths', widths, validators.listWidths);
      } catch (e) {
        console.warn('Error saving list width to localStorage:', e);
        return false;
      }
    }
    return false;
  },

  getListConstraintFromStorage(boardId, listId) {
    // For logged-in users, get from profile
    if (this._id) {
      return this.getListConstraint(boardId, listId);
    }

    // For non-logged-in users, get from localStorage
    try {
      const stored = localStorage.getItem('wekan-list-constraints');
      if (stored) {
        const constraints = JSON.parse(stored);
        if (constraints[boardId] && constraints[boardId][listId]) {
          return constraints[boardId][listId];
        }
      }
    } catch (e) {
      console.warn('Error reading list constraints from localStorage:', e);
    }

    return 550; // Return default constraint instead of -1
  },

  setListConstraintToStorage(boardId, listId, constraint) {
    // For logged-in users, save to profile
    if (this._id) {
      return this.setListConstraint(boardId, listId, constraint);
    }

    // For non-logged-in users, save to localStorage
    try {
      const stored = localStorage.getItem('wekan-list-constraints');
      let constraints = stored ? JSON.parse(stored) : {};

      if (!constraints[boardId]) {
        constraints[boardId] = {};
      }
      constraints[boardId][listId] = constraint;

      localStorage.setItem('wekan-list-constraints', JSON.stringify(constraints));
      return true;
    } catch (e) {
      console.warn('Error saving list constraint to localStorage:', e);
      return false;
    }
  },

  getSwimlaneHeightFromStorage(boardId, swimlaneId) {
    // For logged-in users, get from profile
    if (this._id) {
      return this.getSwimlaneHeight(boardId, swimlaneId);
    }

    // For non-logged-in users, get from localStorage
    try {
      const stored = localStorage.getItem('wekan-swimlane-heights');
      if (stored) {
        const heights = JSON.parse(stored);
        if (heights[boardId] && heights[boardId][swimlaneId]) {
          return heights[boardId][swimlaneId];
        }
      }
    } catch (e) {
      console.warn('Error reading swimlane heights from localStorage:', e);
    }

    return -1; // Return -1 if not found
  },

  setSwimlaneHeightToStorage(boardId, swimlaneId, height) {
    // For logged-in users, save to profile
    if (this._id) {
      return this.setSwimlaneHeight(boardId, swimlaneId, height);
    }

    // For non-logged-in users, save to localStorage
    try {
      const stored = localStorage.getItem('wekan-swimlane-heights');
      let heights = stored ? JSON.parse(stored) : {};

      if (!heights[boardId]) {
        heights[boardId] = {};
      }
      heights[boardId][swimlaneId] = height;

      localStorage.setItem('wekan-swimlane-heights', JSON.stringify(heights));
      return true;
    } catch (e) {
      console.warn('Error saving swimlane height to localStorage:', e);
      return false;
    }
  },
  // Per-user collapsed state helpers for lists/swimlanes
  getCollapsedList(boardId, listId) {
    const { collapsedLists = {} } = this.profile || {};
    if (collapsedLists[boardId] && typeof collapsedLists[boardId][listId] === 'boolean') {
      return collapsedLists[boardId][listId];
    }
    return null;
  },
  getCollapsedSwimlane(boardId, swimlaneId) {
    const { collapsedSwimlanes = {} } = this.profile || {};
    if (collapsedSwimlanes[boardId] && typeof collapsedSwimlanes[boardId][swimlaneId] === 'boolean') {
      return collapsedSwimlanes[boardId][swimlaneId];
    }
    return null;
  },
  setCollapsedListToStorage(boardId, listId, collapsed) {
    // Logged-in users: save to profile
    if (this._id) {
      return this.setCollapsedList(boardId, listId, collapsed);
    }
    // Public users: save to cookie
    try {
      const name = 'wekan-collapsed-lists';
      const stored = (typeof document !== 'undefined') ? document.cookie : '';
      const cookies = stored.split(';').map(c => c.trim());
      let json = '{}';
      for (const c of cookies) {
        if (c.startsWith(name + '=')) {
          json = decodeURIComponent(c.substring(name.length + 1));
          break;
        }
      }
      let data = {};
      try { data = JSON.parse(json || '{}'); } catch (e) { data = {}; }
      if (!data[boardId]) data[boardId] = {};
      data[boardId][listId] = !!collapsed;
      const serialized = encodeURIComponent(JSON.stringify(data));
      const maxAge = 60 * 60 * 24 * 365; // 1 year
      document.cookie = `${name}=${serialized}; path=/; max-age=${maxAge}`;
      return true;
    } catch (e) {
      console.warn('Error saving collapsed list to cookie:', e);
      return false;
    }
  },
  getCollapsedListFromStorage(boardId, listId) {
    // Logged-in users: read from profile
    if (this._id) {
      const v = this.getCollapsedList(boardId, listId);
      return v;
    }
    // Public users: read from cookie
    try {
      const name = 'wekan-collapsed-lists';
      const stored = (typeof document !== 'undefined') ? document.cookie : '';
      const cookies = stored.split(';').map(c => c.trim());
      let json = '{}';
      for (const c of cookies) {
        if (c.startsWith(name + '=')) {
          json = decodeURIComponent(c.substring(name.length + 1));
          break;
        }
      }
      const data = JSON.parse(json || '{}');
      if (data[boardId] && typeof data[boardId][listId] === 'boolean') {
        return data[boardId][listId];
      }
    } catch (e) {
      console.warn('Error reading collapsed list from cookie:', e);
    }
    return null;
  },
  setCollapsedSwimlaneToStorage(boardId, swimlaneId, collapsed) {
    // Logged-in users: save to profile
    if (this._id) {
      return this.setCollapsedSwimlane(boardId, swimlaneId, collapsed);
    }
    // Public users: save to cookie
    try {
      const name = 'wekan-collapsed-swimlanes';
      const stored = (typeof document !== 'undefined') ? document.cookie : '';
      const cookies = stored.split(';').map(c => c.trim());
      let json = '{}';
      for (const c of cookies) {
        if (c.startsWith(name + '=')) {
          json = decodeURIComponent(c.substring(name.length + 1));
          break;
        }
      }
      let data = {};
      try { data = JSON.parse(json || '{}'); } catch (e) { data = {}; }
      if (!data[boardId]) data[boardId] = {};
      data[boardId][swimlaneId] = !!collapsed;
      const serialized = encodeURIComponent(JSON.stringify(data));
      const maxAge = 60 * 60 * 24 * 365; // 1 year
      document.cookie = `${name}=${serialized}; path=/; max-age=${maxAge}`;
      return true;
    } catch (e) {
      console.warn('Error saving collapsed swimlane to cookie:', e);
      return false;
    }
  },
  getCollapsedSwimlaneFromStorage(boardId, swimlaneId) {
    // Logged-in users: read from profile
    if (this._id) {
      const v = this.getCollapsedSwimlane(boardId, swimlaneId);
      return v;
    }
    // Public users: read from cookie
    try {
      const name = 'wekan-collapsed-swimlanes';
      const stored = (typeof document !== 'undefined') ? document.cookie : '';
      const cookies = stored.split(';').map(c => c.trim());
      let json = '{}';
      for (const c of cookies) {
        if (c.startsWith(name + '=')) {
          json = decodeURIComponent(c.substring(name.length + 1));
          break;
        }
      }
      const data = JSON.parse(json || '{}');
      if (data[boardId] && typeof data[boardId][swimlaneId] === 'boolean') {
        return data[boardId][swimlaneId];
      }
    } catch (e) {
      console.warn('Error reading collapsed swimlane from cookie:', e);
    }
    return null;
  },

  async setMoveAndCopyDialogOption(boardId, options) {
    let currentOptions = this.getMoveAndCopyDialogOptions();
    currentOptions[boardId] = options;
    return await Users.updateAsync(this._id, { $set: { 'profile.moveAndCopyDialog': currentOptions } });
  },

  async setMoveChecklistDialogOption(boardId, options) {
    let currentOptions = this.getMoveChecklistDialogOptions();
    currentOptions[boardId] = options;
    return await Users.updateAsync(this._id, { $set: { 'profile.moveChecklistDialog': currentOptions } });
  },

  async setCopyChecklistDialogOption(boardId, options) {
    let currentOptions = this.getCopyChecklistDialogOptions();
    currentOptions[boardId] = options;
    return await Users.updateAsync(this._id, { $set: { 'profile.copyChecklistDialog': currentOptions } });
  },

  async toggleBoardStar(boardId) {
    const queryKind = this.hasStarred(boardId) ? '$pull' : '$addToSet';
    return await Users.updateAsync(this._id, { [queryKind]: { 'profile.starredBoards': boardId } });
  },

  async setBoardSortIndex(boardId, sortIndex) {
    const mapping = (this.profile && this.profile.boardSortIndex) || {};
    mapping[boardId] = sortIndex;
    return await Users.updateAsync(this._id, { $set: { 'profile.boardSortIndex': mapping } });
  },

  async toggleAutoWidth(boardId) {
    const { autoWidthBoards = {} } = this.profile || {};
    autoWidthBoards[boardId] = !autoWidthBoards[boardId];
    return await Users.updateAsync(this._id, { $set: { 'profile.autoWidthBoards': autoWidthBoards } });
  },

  async toggleKeyboardShortcuts() {
    const { keyboardShortcuts = true } = this.profile || {};
    return await Users.updateAsync(this._id, { $set: { 'profile.keyboardShortcuts': !keyboardShortcuts } });
  },

  async toggleVerticalScrollbars() {
    const { verticalScrollbars = true } = this.profile || {};
    return await Users.updateAsync(this._id, { $set: { 'profile.verticalScrollbars': !verticalScrollbars } });
  },

  async toggleShowWeekOfYear() {
    const { showWeekOfYear = true } = this.profile || {};
    return await Users.updateAsync(this._id, { $set: { 'profile.showWeekOfYear': !showWeekOfYear } });
  },

  async addInvite(boardId) {
    return await Users.updateAsync(this._id, { $addToSet: { 'profile.invitedBoards': boardId } });
  },

  async removeInvite(boardId) {
    return await Users.updateAsync(this._id, { $pull: { 'profile.invitedBoards': boardId } });
  },

  async addTag(tag) {
    return await Users.updateAsync(this._id, { $addToSet: { 'profile.tags': tag } });
  },

  async removeTag(tag) {
    return await Users.updateAsync(this._id, { $pull: { 'profile.tags': tag } });
  },

  async toggleTag(tag) {
    if (this.hasTag(tag)) {
      return await this.removeTag(tag);
    } else {
      return await this.addTag(tag);
    }
  },

  async setListSortBy(value) {
    return await Users.updateAsync(this._id, { $set: { 'profile.listSortBy': value } });
  },

  async setName(value) {
    return await Users.updateAsync(this._id, { $set: { 'profile.fullname': value } });
  },

  async toggleDesktopHandles(value = false) {
    return await Users.updateAsync(this._id, { $set: { 'profile.showDesktopDragHandles': !value } });
  },

  async toggleFieldsGrid(value = false) {
    return await Users.updateAsync(this._id, { $set: { 'profile.customFieldsGrid': !value } });
  },

  async toggleCardMaximized(value = false) {
    return await Users.updateAsync(this._id, { $set: { 'profile.cardMaximized': !value } });
  },

  async toggleCardCollapsed(value = false) {
    return await Users.updateAsync(this._id, { $set: { 'profile.cardCollapsed': !value } });
  },

  async toggleShowActivities(value = false) {
    return await Users.updateAsync(this._id, { $set: { 'profile.showActivities': !value } });
  },

  async toggleLabelText(value = false) {
    return await Users.updateAsync(this._id, { $set: { 'profile.hiddenMinicardLabelText': !value } });
  },

  async toggleRescueCardDescription(value = false) {
    return await Users.updateAsync(this._id, { $set: { 'profile.rescueCardDescription': !value } });
  },

  async toggleGreyIcons(value = false) {
    return await Users.updateAsync(this._id, { $set: { 'profile.GreyIcons': !value } });
  },

  async addNotification(activityId) {
    return await Users.updateAsync(this._id, {
      $addToSet: { 'profile.notifications': { activity: activityId, read: null } },
    });
  },

  async removeNotification(activityId) {
    return await Users.updateAsync(this._id, {
      $pull: { 'profile.notifications': { activity: activityId } },
    });
  },

  async addEmailBuffer(text) {
    return await Users.updateAsync(this._id, { $addToSet: { 'profile.emailBuffer': text } });
  },

  async clearEmailBuffer() {
    return await Users.updateAsync(this._id, { $set: { 'profile.emailBuffer': [] } });
  },

  async setAvatarUrl(avatarUrl) {
    return await Users.updateAsync(this._id, { $set: { 'profile.avatarUrl': avatarUrl } });
  },

  async setShowCardsCountAt(limit) {
    return await Users.updateAsync(this._id, { $set: { 'profile.showCardsCountAt': limit } });
  },

  async setStartDayOfWeek(startDay) {
    return await Users.updateAsync(this._id, { $set: { 'profile.startDayOfWeek': startDay } });
  },

  async setDateFormat(dateFormat) {
    return await Users.updateAsync(this._id, { $set: { 'profile.dateFormat': dateFormat } });
  },

  async setBoardView(view) {
    return await Users.updateAsync(this._id, { $set: { 'profile.boardView': view } });
  },

  async setListWidth(boardId, listId, width) {
    let currentWidths = this.getListWidths();
    if (!currentWidths[boardId]) currentWidths[boardId] = {};
    currentWidths[boardId][listId] = width;
    return await Users.updateAsync(this._id, { $set: { 'profile.listWidths': currentWidths } });
  },

  async setListConstraint(boardId, listId, constraint) {
    let currentConstraints = this.getListConstraints();
    if (!currentConstraints[boardId]) currentConstraints[boardId] = {};
    currentConstraints[boardId][listId] = constraint;
    return await Users.updateAsync(this._id, { $set: { 'profile.listConstraints': currentConstraints } });
  },

  async setSwimlaneHeight(boardId, swimlaneId, height) {
    let currentHeights = this.getSwimlaneHeights();
    if (!currentHeights[boardId]) currentHeights[boardId] = {};
    currentHeights[boardId][swimlaneId] = height;
    return await Users.updateAsync(this._id, { $set: { 'profile.swimlaneHeights': currentHeights } });
  },

  async setCollapsedList(boardId, listId, collapsed) {
    const current = (this.profile && this.profile.collapsedLists) || {};
    if (!current[boardId]) current[boardId] = {};
    current[boardId][listId] = !!collapsed;
    return await Users.updateAsync(this._id, { $set: { 'profile.collapsedLists': current } });
  },

  async setCollapsedSwimlane(boardId, swimlaneId, collapsed) {
    const current = (this.profile && this.profile.collapsedSwimlanes) || {};
    if (!current[boardId]) current[boardId] = {};
    current[boardId][swimlaneId] = !!collapsed;
    return await Users.updateAsync(this._id, { $set: { 'profile.collapsedSwimlanes': current } });
  },

  async setZoomLevel(level) {
    return await Users.updateAsync(this._id, { $set: { 'profile.zoomLevel': level } });
  },

  async setMobileMode(enabled) {
    return await Users.updateAsync(this._id, { $set: { 'profile.mobileMode': enabled } });
  },

  async setCardZoom(level) {
    return await Users.updateAsync(this._id, { $set: { 'profile.cardZoom': level } });
  },
});

export default Users;
