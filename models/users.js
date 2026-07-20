import { Meteor } from 'meteor/meteor';
import { ReactiveCache, ReactiveMiniMongoIndex } from '/imports/reactiveCache';
import Boards from '/models/boards';
import InviteToBoardRolesSettings, {
  INVITE_TO_BOARD_ROLES_ID,
  INVITE_TO_BOARD_ROLES_DEFAULT,
} from '/models/inviteToBoardRolesSettings';
// #5659: the default/minimum list width must be the SAME on every resolution
// path (it used to be 270 here but 272 in the client and the lists schema, so
// lists could fall back to different "defaults" on public boards).
import {
  DEFAULT_LIST_WIDTH,
  MIN_LIST_WIDTH,
  normalizeListWidth,
} from '/models/lib/listWidth';
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

// #5799: sort modes for the All Boards page. 'custom' is the existing per-user
// manual drag order; the other two sort alphabetically by board title.
export const allowedAllBoardsSortValues = ['custom', 'title-asc', 'title-desc'];

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
    'profile.submitOnEnter': {
      /**
       * per-user preference: in multi-line editors (card title/description and
       * other inlined forms) submit on plain Enter (Shift+Enter for a newline)
       * instead of the default Ctrl/Cmd+Enter. Off by default. See #4236/#6480.
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
    'profile.globalThemeColor': {
      /**
       * #5778: optional per-user GLOBAL theme color override. When set to one of
       * the board color names, that color theme is applied to the WHOLE UI (All
       * Boards, Search, Admin Panel, My Cards, etc.) via a `board-color-<name>`
       * class on <body> and the header — letting a user pick e.g. a dark theme
       * everywhere. Absent = no override (default appearance). A specific board
       * still shows its own Board Settings color while you are on that board.
       */
      type: String,
      optional: true,
    },
    'profile.globalThemeCustomColors': {
      /**
       * Custom colors for the global theme when it is a flat (1 color) or clear
       * (2 colors) theme — see docs/Theme/Theme.md. Each is a validated #rrggbb hex.
       */
      type: Array,
      optional: true,
    },
    'profile.globalThemeCustomColors.$': {
      type: String,
      custom() {
        return /^#[0-9a-fA-F]{6}$/.test(this.value) ? undefined : 'notAHexColor';
      },
    },
    'profile.uiFont': {
      /**
       * Member Settings / Font (#4759): the user's chosen UI font — one of the
       * curated UI_FONTS (models/lib/uiFonts.js) detected as installed in their
       * browser. Plain text, validated on the server; absent = default font.
       */
      type: String,
      optional: true,
    },
    'profile.uiFontSize': {
      /**
       * Member Settings / Font / Size (#4759): a named preset size key (one of
       * UI_FONT_SIZES, e.g. 'large'), never a free number. Absent / 'default' =
       * the stock size. Validated on the server.
       */
      type: String,
      optional: true,
    },
    'profile.uiTextColor': {
      /**
       * Member Settings / Font / Color (#4759): custom UI text color, chosen from a
       * color wheel. A validated #rrggbb hex; absent = default text color.
       */
      type: String,
      optional: true,
      custom() {
        // Skip when unset: an optional field's custom() still runs on insert, and
        // /regex/.test(undefined) would wrongly reject every user with no color set.
        if (this.value === undefined || this.value === null || this.value === '') return undefined;
        return /^#[0-9a-fA-F]{6}$/.test(this.value) ? undefined : 'notAHexColor';
      },
    },
    'profile.uiTextBgColor': {
      /**
       * Member Settings / Font / Color (#4759): custom UI text background color.
       * A validated #rrggbb hex; absent = default (transparent) background.
       */
      type: String,
      optional: true,
      custom() {
        if (this.value === undefined || this.value === null || this.value === '') return undefined;
        return /^#[0-9a-fA-F]{6}$/.test(this.value) ? undefined : 'notAHexColor';
      },
    },
    'profile.dismissedAnnouncementVersion': {
      /**
       * version string of the global announcement the user has permanently
       * dismissed (#6051). When the admin changes the announcement text its
       * version changes, so the banner reappears for everyone.
       */
      type: String,
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
    'profile.trelloApiSaved': {
      /**
       * Has the user saved Trello API credentials (key + token) for importing?
       * The credentials themselves are stored server-side only (never published
       * to the client); this is just the published "saved" indicator.
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
    'profile.mapProvider': {
      /**
       * which map service the card "Open in map" links use, grouped by region:
       * USA: 'google', 'bing', 'apple', 'waze';
       * Europe: 'openstreetmap' (default), 'here', 'yandex', 'mapy', '2gis';
       * Asia: 'baidu', 'amap'.
       */
      type: String,
      optional: true,
      allowedValues: ['openstreetmap', 'google', 'bing', 'apple'],
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
    'profile.defaultBoardId': {
      /**
       * #2220: the board that opens automatically after logging in (the user's
       * "home" board). Empty/unset means land on the All Boards page as before.
       */
      type: String,
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
        'board-view-gantt',
        'board-view-table',
        'board-view-stats',
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
    'profile.allBoardsSortBy': {
      /**
       * How the All Boards page is sorted for this user (#5799):
       * 'custom' keeps the manual drag order (default), 'title-asc' / 'title-desc'
       * sort boards alphabetically by title.
       */
      type: String,
      optional: true,
      defaultValue: 'custom',
      allowedValues: allowedAllBoardsSortValues,
    },
    'profile.templatesBoardId': {
      /**
       * Reference to the templates board
       */
      type: String,
      // Optional: when the Template Container board is deleted these pointers are
      // cleared (boardRemover $unset). Without optional:true, SimpleSchema strips
      // the empty string and then fails the required check ("Templates board ID
      // is required"), which made deleting a Template Container board throw.
      optional: true,
      defaultValue: '',
    },
    'profile.cardTemplatesSwimlaneId': {
      /**
       * Reference to the card templates swimlane Id
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    'profile.listTemplatesSwimlaneId': {
      /**
       * Reference to the list templates swimlane Id
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    'profile.boardTemplatesSwimlaneId': {
      /**
       * Reference to the board templates swimlane Id
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    'profile.sidebarWidth': {
      /**
       * User-specified width (px) of the right board sidebar, set by dragging its
       * left edge (desktop only; mobile is always full width). Unset = CSS default.
       */
      type: Number,
      optional: true,
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
    'profile.fixedListWidthBoards': {
      /**
       * #5729 Per-user flag enabling "same width for all lists" (fixed width)
       * mode for a board (false is the default).
       * profile.fixedListWidthBoards[boardId] = true|false
       */
      type: Object,
      defaultValue: {},
      blackbox: true,
    },
    'profile.fixedListWidths': {
      /**
       * #5729 Per-user single width applied to every list of a board when fixed
       * width mode is enabled.
       * profile.fixedListWidths[boardId] = width
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
       * User-specified mobile/desktop mode toggle.
       * #6419: must be OPTIONAL with NO default. A defaultValue of false set
       * mobileMode=false on every user, so Utils.getMobileMode() always returned
       * the profile value and the viewport-based auto-detection below it never
       * ran — every user was locked to desktop-mode even on a phone. Left unset,
       * it stays undefined until the user explicitly toggles, so phones
       * auto-detect mobile mode.
       */
      type: Boolean,
      optional: true,
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

    // Whether this user may invite members to the board, mirroring the
    // server-side check in the inviteUserToBoard method: global site admins and
    // board admins always may; other board roles only if allowed by the
    // Admin Panel / People / Roles policy. Used to gate the UI add-member button.
    canInviteToBoard(boardId) {
      if (this.isAdmin) return true;
      let board;
      if (boardId) {
        board = ReactiveCache.getBoard(boardId);
      } else {
        const Utils = getUtils();
        board = Utils.getCurrentBoard();
      }
      if (!board) return false;
      if (board.hasAdmin(this._id)) return true;
      const role = board.memberRole(this._id);
      if (!role) return false;
      const doc = InviteToBoardRolesSettings.findOne(INVITE_TO_BOARD_ROLES_ID);
      const allowed = (doc && doc.allowedRoles) || INVITE_TO_BOARD_ROLES_DEFAULT;
      return allowed.includes(role);
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
  // #6116: true when this user shares at least one Organization OR one Team with
  // `otherUser`. Used to restrict who can be added to a board when the global
  // admin setting `boardMembersFromSameOrgOrTeamOnly` is enabled.
  sharesOrgOrTeamWith(otherUser) {
    if (!otherUser) {
      return false;
    }
    const myOrgs = new Set(this.orgIds());
    const myTeams = new Set(this.teamIds());
    const otherOrgs =
      typeof otherUser.orgIds === 'function'
        ? otherUser.orgIds()
        : (otherUser.orgs || []).map(org => org.orgId);
    const otherTeams =
      typeof otherUser.teamIds === 'function'
        ? otherUser.teamIds()
        : (otherUser.teams || []).map(team => team.teamId);
    return (
      otherOrgs.some(orgId => myOrgs.has(orgId)) ||
      otherTeams.some(teamId => myTeams.has(teamId))
    );
  },
  // #5850: the email-address domain(s) of this user, used for domain-based board
  // sharing (board.domains). Lower-cased; primary email's domain.
  emailDomains() {
    const domains = [];
    (this.emails || []).forEach((email) => {
      const addr = (email && email.address) || '';
      const at = addr.lastIndexOf('@');
      if (at !== -1) {
        const domain = addr.slice(at + 1).toLowerCase().trim();
        if (domain && !domains.includes(domain)) {
          domains.push(domain);
        }
      }
    });
    return domains;
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

  // #2220: the user's default "home" board opened after login.
  getDefaultBoardId() {
    return (this.profile && this.profile.defaultBoardId) || null;
  },

  isDefaultBoard(boardId) {
    return this.getDefaultBoardId() === boardId;
  },

  isAutoWidth(boardId) {
    const { autoWidthBoards = {} } = this.profile || {};
    return autoWidthBoards[boardId] === true;
  },

  // #5729 "Same width for all lists" (fixed width) mode is per-user/per-board.
  isFixedListWidth(boardId) {
    const { fixedListWidthBoards = {} } = this.profile || {};
    return fixedListWidthBoards[boardId] === true;
  },

  // #5729 The single width applied to every list when fixed width mode is on.
  getFixedListWidth(boardId) {
    const { fixedListWidths = {} } = this.profile || {};
    return normalizeListWidth(fixedListWidths[boardId]);
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
   * #5799: the user's chosen sort mode for the All Boards page.
   * One of 'custom' (manual drag order, default), 'title-asc', 'title-desc'.
   */
  getAllBoardsSortBy() {
    const value = this.profile && this.profile.allBoardsSortBy;
    return allowedAllBoardsSortValues.includes(value) ? value : 'custom';
  },
  /**
   * Sort an array of boards for this user. In 'title-asc' / 'title-desc' mode
   * (#5799) boards are ordered alphabetically by title; otherwise the per-user
   * manual drag order (profile.boardSortIndex) is used, falling back to title.
   */
  sortBoardsForUser(boardsArr) {
    const arr = (boardsArr || []).slice();
    const mode = this.getAllBoardsSortBy();
    const byTitle = (a, b) =>
      (a.title || '').localeCompare(b.title || '', undefined, {
        sensitivity: 'base',
      });
    if (mode === 'title-asc') {
      arr.sort(byTitle);
      return arr;
    }
    if (mode === 'title-desc') {
      arr.sort((a, b) => byTitle(b, a));
      return arr;
    }
    const mapping = (this.profile && this.profile.boardSortIndex) || {};
    arr.sort((a, b) => {
      const ia = typeof mapping[a._id] === 'number' ? mapping[a._id] : Number.POSITIVE_INFINITY;
      const ib = typeof mapping[b._id] === 'number' ? mapping[b._id] : Number.POSITIVE_INFINITY;
      if (ia !== ib) return ia - ib;
      return byTitle(a, b);
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
  // Right board sidebar width (px), or undefined for the CSS default. Set by
  // dragging the sidebar's left edge (desktop only).
  getSidebarWidth() {
    return (this.profile || {}).sidebarWidth;
  },
  async setSidebarWidth(width) {
    return await Users.updateAsync(this._id, { $set: { 'profile.sidebarWidth': width } });
  },
  getListWidth(boardId, listId) {
    const listWidths = this.getListWidths();
    if (listWidths[boardId] && listWidths[boardId][listId]) {
      // #5659: normalize so an out-of-range stored value can not make one
      // list's width differ from the shared default everyone else sees.
      return normalizeListWidth(listWidths[boardId][listId]);
    } else {
      return DEFAULT_LIST_WIDTH;
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
    // #5325: drop notifications whose activity no longer exists (e.g. the card or
    // board it referenced was deleted). The notifications drawer dereferences
    // activityObj (activity.user, activity._id, …), so a single orphaned entry
    // threw and broke the whole notifications popup.
    // newest first. don't use reverse() because it changes the array inplace, so sometimes the array is reversed twice and oldest items at top again
    const ret = notifications.filter(notification => notification.activityObj).toReversed();
    return ret;
  },

  hasShowDesktopDragHandles() {
    const profile = this.profile || {};
    return profile.showDesktopDragHandles || false;
  },

  hasSubmitOnEnter() {
    const profile = this.profile || {};
    return profile.submitOnEnter || false;
  },

  hasGreyIcons() {
    const profile = this.profile || {};
    return profile.GreyIcons || false;
  },

  getDismissedAnnouncementVersion() {
    const profile = this.profile || {};
    return profile.dismissedAnnouncementVersion || null;
  },

  hasDismissedAnnouncement(announcement) {
    const { announcementVersion } = require('/models/announcements');
    const version = announcementVersion(announcement);
    return !!version && this.getDismissedAnnouncementVersion() === version;
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

  getMapProvider() {
    const profile = this.profile || {};
    return profile.mapProvider || 'openstreetmap';
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
          if (validators.isValidNumber(width, MIN_LIST_WIDTH, 1000)) {
            return width;
          }
        }
      } catch (e) {
        console.warn('Error reading list widths from localStorage:', e);
      }
    }

    // #5659: same default as every other width-resolution path.
    return DEFAULT_LIST_WIDTH;
  },

  setListWidthToStorage(boardId, listId, width) {
    // For logged-in users, save to profile
    if (this._id) {
      return this.setListWidth(boardId, listId, width);
    }

    // Validate width before storing
    if (!validators.isValidNumber(width, MIN_LIST_WIDTH, 1000)) {
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

  // #2220: toggle this board as the user's default "home" board (opened after
  // login). Clicking the current default clears it (back to the All Boards page).
  async toggleDefaultBoard(boardId) {
    if (this.isDefaultBoard(boardId)) {
      return await Users.updateAsync(this._id, { $unset: { 'profile.defaultBoardId': '' } });
    }
    return await Users.updateAsync(this._id, { $set: { 'profile.defaultBoardId': boardId } });
  },

  async setBoardSortIndex(boardId, sortIndex) {
    const mapping = (this.profile && this.profile.boardSortIndex) || {};
    mapping[boardId] = sortIndex;
    return await Users.updateAsync(this._id, { $set: { 'profile.boardSortIndex': mapping } });
  },

  // #6439: persist a whole boardSortIndex mapping in one write. Used by the
  // All Boards page after a drag-reorder recomputes the manual order.
  async setBoardSortIndexes(mapping) {
    const merged = Object.assign({}, (this.profile && this.profile.boardSortIndex) || {}, mapping || {});
    return await Users.updateAsync(this._id, { $set: { 'profile.boardSortIndex': merged } });
  },

  async toggleAutoWidth(boardId) {
    const { autoWidthBoards = {} } = this.profile || {};
    autoWidthBoards[boardId] = !autoWidthBoards[boardId];
    return await Users.updateAsync(this._id, { $set: { 'profile.autoWidthBoards': autoWidthBoards } });
  },

  // #5729 Enable/disable "same width for all lists" mode for a board.
  async setFixedListWidthEnabled(boardId, enabled) {
    const { fixedListWidthBoards = {} } = this.profile || {};
    fixedListWidthBoards[boardId] = !!enabled;
    return await Users.updateAsync(this._id, { $set: { 'profile.fixedListWidthBoards': fixedListWidthBoards } });
  },

  // #5729 Set the single width used by every list in fixed width mode.
  async setFixedListWidth(boardId, width) {
    const { fixedListWidths = {} } = this.profile || {};
    fixedListWidths[boardId] = width;
    return await Users.updateAsync(this._id, { $set: { 'profile.fixedListWidths': fixedListWidths } });
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

  async setAllBoardsSortBy(value) {
    return await Users.updateAsync(this._id, { $set: { 'profile.allBoardsSortBy': value } });
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

  // #5778: the user's optional global theme color override (a board color name),
  // or null when unset.
  getGlobalThemeColor() {
    return (this.profile && this.profile.globalThemeColor) || null;
  },

  // The custom colors for a flat/clear global theme (docs/Theme/Theme.md), or [].
  getGlobalThemeCustomColors() {
    return (this.profile && this.profile.globalThemeCustomColors) || [];
  },

  // #4759: the user's chosen UI font (a curated font name), or null when unset.
  getUiFont() {
    return (this.profile && this.profile.uiFont) || null;
  },

  // #4759: the user's chosen UI font-size preset key, or null (default size).
  getUiFontSize() {
    return (this.profile && this.profile.uiFontSize) || null;
  },

  // #4759: custom UI text color / text background color (hex), or null when unset.
  getUiTextColor() {
    return (this.profile && this.profile.uiTextColor) || null;
  },
  getUiTextBgColor() {
    return (this.profile && this.profile.uiTextBgColor) || null;
  },

  // The CSS class the global override maps to, or '' when unset. Used by the header
  // template on non-board pages and by the <body> autorun.
  globalThemeColorClass() {
    const color = this.getGlobalThemeColor();
    return color ? `board-color-${color}` : '';
  },

  async setGlobalThemeColor(color) {
    if (color) {
      return await Users.updateAsync(this._id, { $set: { 'profile.globalThemeColor': color } });
    }
    return await Users.updateAsync(this._id, { $unset: { 'profile.globalThemeColor': '' } });
  },

  async setDismissedAnnouncementVersion(version) {
    return await Users.updateAsync(this._id, {
      $set: { 'profile.dismissedAnnouncementVersion': version },
    });
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

if (Meteor.isServer) {
  // #1289 ("Error after deleting a user"): deleting a user (Admin Panel
  // `removeUser` method, self-service account delete, or
  // DELETE /api/users/:userId) removed only the users document and left
  // dangling references everywhere — "ghost" board members with empty
  // avatars, stale card members/assignees and watcher entries — that
  // previously had to be cleaned up by hand or by editing the database.
  // This after.remove hook runs for every deletion path (they all go through
  // Users.removeAsync / Meteor.users.removeAsync on this same collection) and
  // prunes those references. Activities/comments are intentionally kept so
  // history stays readable; see models/lib/userDeletionCleanup.js.
  const {
    buildUserDeletionCleanupPlan,
    applyUserDeletionCleanup,
  } = require('/models/lib/userDeletionCleanup');
  Users.after.remove(async function(currentUserId, doc) {
    try {
      const plan = buildUserDeletionCleanupPlan(doc && doc._id);
      if (!plan) return;
      await applyUserDeletionCleanup(plan, {
        boards: Boards,
        // Required lazily: cards/lists/avatars are not imported at the top of
        // this shared model, and avatars.js must only resolve server-side
        // config when actually needed here.
        cards: require('/models/cards').default,
        lists: require('/models/lists').default,
        avatars: require('/models/avatars').default,
      });
    } catch (error) {
      console.error(
        '[userDeletionCleanup] Failed to prune references of deleted user',
        doc && doc._id,
        error,
      );
    }
  });

  Meteor.methods({
    // Permanently dismiss the current global announcement for the logged-in
    // user (#6051). The version is computed server-side from the current
    // announcement so the client cannot dismiss an arbitrary/future version.
    async dismissAnnouncement() {
      if (!this.userId) {
        throw new Meteor.Error('not-logged-in', 'User must be logged in');
      }
      const Announcements = require('/models/announcements').default;
      const { announcementVersion } = require('/models/announcements');
      const announcement = await Announcements.findOneAsync();
      const version = announcementVersion(announcement);
      if (!version) {
        return null;
      }
      await Users.updateAsync(this.userId, {
        $set: { 'profile.dismissedAnnouncementVersion': version },
      });
      return version;
    },
  });
}

export default Users;
