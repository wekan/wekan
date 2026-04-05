import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { ReactiveCache } from '/imports/reactiveCache';
import escapeForRegex from 'escape-string-regexp';
import CustomFields from './customFields';
import {
  TYPE_BOARD,
  TYPE_TEMPLATE_BOARD,
  TYPE_TEMPLATE_CONTAINER,
} from '/config/const';
import { BOARD_COLORS, LABEL_COLORS } from '/models/metadata/colors';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Actions from '/models/actions';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Rules from '/models/rules';
import Swimlanes from '/models/swimlanes';
import Triggers from '/models/triggers';
import getSlug from 'limax';
import { findWhere, where, groupBy } from '/imports/lib/collectionHelpers';
const { SimpleSchema } = require('/imports/simpleSchema');
const getTAPi18n = () => require('/imports/i18n').TAPi18n;

function getTranslatedString(key, fallback, options) {
  const i18n = getTAPi18n && getTAPi18n();
  if (!i18n || !i18n.i18n) {
    return fallback;
  }
  const translated = i18n.__(key, options);
  return typeof translated === 'string' ? translated : fallback;
}

function sanitizeBoardMembers(members) {
  return (members || []).map(member => ({
    userId: member.userId,
    isAdmin: !!member.isAdmin,
    isActive: member.isActive !== false,
    isNoComments: !!member.isNoComments,
    isCommentOnly: !!member.isCommentOnly,
    isWorker: !!member.isWorker,
    isNormalAssignedOnly: !!member.isNormalAssignedOnly,
    isCommentAssignedOnly: !!member.isCommentAssignedOnly,
    isReadOnly: !!member.isReadOnly,
    isReadAssignedOnly: !!member.isReadAssignedOnly,
  }));
}

// const escapeForRegex = require('escape-string-regexp');

const Boards = new Mongo.Collection('boards');

/**
 * This is a Board.
 */
Boards.attachSchema(
  new SimpleSchema({
    title: {
      /**
       * The title of the board
       */
      type: String,
    },
    slug: {
      /**
       * The title slugified.
       */
      type: String,
      // eslint-disable-next-line consistent-return
      autoValue() {
        // In some cases (Chinese and Japanese for instance) the `getSlug` function
        // return an empty string. This is causes bugs in our application so we set
        // a default slug in this case.
        // Improvment would be to change client URL after slug is changed
        const title = this.field('title');
        if (title.isSet && !this.isSet) {
          let slug = 'board';
          slug = getSlug(title.value) || slug;
          return slug;
        }
      },
    },
    archived: {
      /**
       * Is the board archived?
       */
      type: Boolean,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return false;
        }
      },
    },
    archivedAt: {
      /**
       * Latest archiving time of the board
       */
      type: Date,
      optional: true,
    },
    createdAt: {
      /**
       * Creation time of the board
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
    // XXX Inconsistent field naming
    modifiedAt: {
      /**
       * Last modification time of the board
       */
      type: Date,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    // De-normalized number of users that have starred this board
    stars: {
      /**
       * How many stars the board has
       */
      type: Number,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return 0;
        }
      },
    },
    // De-normalized label system
    labels: {
      /**
       * List of labels attached to a board
       */
      type: Array,
      optional: true,
      /* Commented out, so does not create labels to new boards.
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          const colors = Boards.simpleSchema()._schema['labels.$.color']
            .allowedValues;
          const defaultLabelsColors = [...colors].splice(0, 6);
          return defaultLabelsColors.map(color => ({
            color,
            _id: Random.id(6),
            name: '',
          }));
        }
      },
      */
    },
    'labels.$': {
      type: Object,
    },
    'labels.$._id': {
      /**
       * Unique id of a label
       */
      // We don't specify that this field must be unique in the board because that
      // will cause performance penalties and is not necessary since this field is
      // always set on the server.
      // XXX Actually if we create a new label, the `_id` is set on the client
      // without being overwritten by the server, could it be a problem?
      type: String,
    },
    'labels.$.name': {
      /**
       * Name of a label
       */
      type: String,
      optional: true,
    },
    'labels.$.color': {
      /**
       * color of a label.
       *
       * Can be amongst `green`, `yellow`, `orange`, `red`, `purple`,
       * `blue`, `sky`, `lime`, `pink`, `black`,
       * `silver`, `peachpuff`, `crimson`, `plum`, `darkgreen`,
       * `slateblue`, `magenta`, `gold`, `navy`, `gray`,
       * `saddlebrown`, `paleturquoise`, `mistyrose`, `indigo`
       */
      type: String,
      allowedValues: LABEL_COLORS,
    },
    // XXX We might want to maintain more informations under the member sub-
    // documents like de-normalized meta-data (the date the member joined the
    // board, the number of contributions, etc.).
    members: {
      /**
       * List of members of a board
       */
      type: Array,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return [
            {
              userId: this.userId,
              isAdmin: true,
              isActive: true,
              isNoComments: false,
              isCommentOnly: false,
              isWorker: false,
            },
          ];
        }
      },
    },
    'members.$': {
      type: Object,
    },
    'members.$.userId': {
      /**
       * The uniq ID of the member
       */
      type: String,
    },
    'members.$.isAdmin': {
      /**
       * Is the member an admin of the board?
       */
      type: Boolean,
    },
    'members.$.isActive': {
      /**
       * Is the member active?
       */
      type: Boolean,
    },
    'members.$.isNoComments': {
      /**
       * Is the member not allowed to make comments
       */
      type: Boolean,
      optional: true,
    },
    'members.$.isCommentOnly': {
      /**
       * Is the member only allowed to comment on the board
       */
      type: Boolean,
      optional: true,
    },
    'members.$.isWorker': {
      /**
       * Is the member only allowed to move card, assign himself to card and comment
       */
      type: Boolean,
      optional: true,
    },
    'members.$.isNormalAssignedOnly': {
      /**
       * Is the member only allowed to see assigned cards (Normal permission)
       */
      type: Boolean,
      optional: true,
    },
    'members.$.isCommentAssignedOnly': {
      /**
       * Is the member only allowed to comment on assigned cards
       */
      type: Boolean,
      optional: true,
    },
    'members.$.isReadOnly': {
      /**
       * Is the member only allowed to read the board (no comments, no editing)
       */
      type: Boolean,
      optional: true,
    },
    'members.$.isReadAssignedOnly': {
      /**
       * Is the member only allowed to read assigned cards (no comments, no editing)
       */
      type: Boolean,
      optional: true,
    },
    permission: {
      /**
       * visibility of the board
       */
      type: String,
      allowedValues: ['public', 'private'],
    },
    orgs: {
      /**
       * the list of organizations that a board belongs to
       */
       type: Array,
       optional: true,
    },
    'orgs.$': {
      type: Object,
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
    'orgs.$.isActive': {
      /**
       * Is the organization active?
       */
      type: Boolean,
    },
    teams: {
      /**
       * the list of teams that a board belongs to
       */
       type: Array,
       optional: true,
    },
    'teams.$': {
      type: Object,
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
    'teams.$.isActive': {
      /**
       * Is the team active?
       */
      type: Boolean,
    },
    color: {
      /**
       * The color of the board.
       */
      type: String,
      allowedValues: BOARD_COLORS,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return BOARD_COLORS[0];
        }
      },
    },
    backgroundImageURL: {
      /**
       * The background image URL of the board.
       */
      type: String,
      optional: true,
    },
    allowsCardCounterList: {
      /**
       * Show card counter per list
       */
      type: Boolean,
      defaultValue: false,
    },
    allowsBoardMemberList: {
      /**
       * Show board member list
       */
      type: Boolean,
      defaultValue: false,
    },
    description: {
      /**
       * The description of the board
       */
      type: String,
      optional: true,
    },
    subtasksDefaultBoardId: {
      /**
       * The default board ID assigned to subtasks.
       */
      type: String,
      optional: true,
      defaultValue: null,
    },
    migrationVersion: {
      /**
       * The migration version of the board structure.
       * New boards are created with the latest version and don't need migration.
       */
      type: Number,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return 1; // Latest migration version for new boards
        }
      },
    },

    subtasksDefaultListId: {
      /**
       * The default List ID assigned to subtasks.
       */
      type: String,
      optional: true,
      defaultValue: null,
    },

    dateSettingsDefaultBoardId: {
      type: String,
      optional: true,
      defaultValue: null,
    },

    dateSettingsDefaultListId: {
      type: String,
      optional: true,
      defaultValue: null,
    },

    allowsSubtasks: {
      /**
       * Does the board allows subtasks?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsAttachments: {
      /**
       * Does the board allows attachments?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsChecklists: {
      /**
       * Does the board allows checklists?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsComments: {
      /**
       * Does the board allows comments?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsDescriptionTitle: {
      /**
       * Does the board allows description title?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsDescriptionText: {
      /**
       * Does the board allows description text?
       */
      type: Boolean,
      defaultValue: true,
    },
    allowsDescriptionTextOnMinicard: {
      /**
       * Does the board allows description text on minicard?
       */
      type: Boolean,
      defaultValue: false,
    },

    allowsCoverAttachmentOnMinicard: {
      /**
       * Does the board allows cover attachment on minicard?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsBadgeAttachmentOnMinicard: {
      /**
       * Does the board allows badge attachment on minicard?
       */
      type: Boolean,
      defaultValue: false,
    },

    allowsCardSortingByNumberOnMinicard: {
      /**
       * Does the board allows card sorting by number on minicard?
       */
      type: Boolean,
      defaultValue: false,
    },

    allowsCardNumber: {
      /**
       * Does the board allows card numbers?
       */
      type: Boolean,
      defaultValue: false,
    },

    allowsActivities: {
      /**
       * Does the board allows comments?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsLabels: {
      /**
       * Does the board allows labels?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsCreator: {
      /**
       * Does the board allow creator?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsCreatorOnMinicard: {
      /**
       * Does the board allow creator?
       */
      type: Boolean,
      defaultValue: false,
    },

    allowsAssignee: {
      /**
       * Does the board allows assignee?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsMembers: {
      /**
       * Does the board allows members?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsRequestedBy: {
      /**
       * Does the board allows requested by?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsCardSortingByNumber: {
      /**
       * Does the board allows card sorting by number?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsShowLists: {
      /**
       * Does the board allows show lists on the card?
       */
      type: Boolean,
      defaultValue: true,
    },


    allowsAssignedBy: {
      /**
       * Does the board allows requested by?
       */
      type: Boolean,
      defaultValue: true,
    },
    allowsShowListsOnMinicard: {
      /**
       * Does the board allow showing list names on all minicards?
       */
      type: Boolean,
      defaultValue: false,
    },

    allowsChecklistAtMinicard: {
      /**
       * Does the board allow showing checklists on all minicards?
       */
      type: Boolean,
      defaultValue: false,
    },

    allowsReceivedDate: {
      /**
       * Does the board allows received date?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsStartDate: {
      /**
       * Does the board allows start date?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsEndDate: {
      /**
       * Does the board allows end date?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsDueDate: {
      /**
       * Does the board allows due date?
       */
      type: Boolean,
      defaultValue: true,
    },

    presentParentTask: {
      /**
       * Controls how to present the parent task:
       *
       * - `prefix-with-full-path`: add a prefix with the full path
       * - `prefix-with-parent`: add a prefisx with the parent name
       * - `subtext-with-full-path`: add a subtext with the full path
       * - `subtext-with-parent`: add a subtext with the parent name
       * - `no-parent`: does not show the parent at all
       */
      type: String,
      allowedValues: [
        'prefix-with-full-path',
        'prefix-with-parent',
        'subtext-with-full-path',
        'subtext-with-parent',
        'no-parent',
      ],
      optional: true,
      defaultValue: 'no-parent',
    },
    receivedAt: {
      /**
       * Date the card was received
       */
      type: Date,
      optional: true,
    },
    startAt: {
      /**
       * Starting date of the board.
       */
      type: Date,
      optional: true,
    },
    dueAt: {
      /**
       * Due date of the board.
       */
      type: Date,
      optional: true,
    },
    endAt: {
      /**
       * End date of the board.
       */
      type: Date,
      optional: true,
    },
    spentTime: {
      /**
       * Time spent in the board.
       */
      type: Number,
      optional: true,
    },
    isOvertime: {
      /**
       * Is the board overtimed?
       */
      type: Boolean,
      defaultValue: false,
      optional: true,
    },
    type: {
      /**
       * The type of board
       * possible values: board, template-board, template-container
       */
      type: String,
      defaultValue: TYPE_BOARD,
      allowedValues: [TYPE_BOARD, TYPE_TEMPLATE_BOARD, TYPE_TEMPLATE_CONTAINER],
    },
    sort: {
      /**
       * Sort value
       */
      type: Number,
      defaultValue: -1,
    },
    showActivities: {
      type: Boolean,
      defaultValue: false,
    },
  }),
);

Boards.helpers({
  async copy() {
    const oldId = this._id;
    const oldWatchers = this.watchers ? this.watchers.slice() : [];
    delete this._id;
    delete this.slug;
    this.title = await this.copyTitle();
    const _id = await Boards.insertAsync(this);

    // Temporary remove watchers to disable notifications
      await Boards.updateAsync(_id, {
        $set: {
          watchers: []
        },
    });

    // Copy all swimlanes in board
    const swimlanes = await ReactiveCache.getSwimlanes({
      boardId: oldId,
      archived: false,
    });
    for (const swimlane of swimlanes) {
      swimlane.type = 'swimlane';
      await swimlane.copy(_id);
    }

    // copy custom field definitions
    const cfMap = {};
    const customFields = await ReactiveCache.getCustomFields({ boardIds: oldId });
    for (const cf of customFields) {
      const id = cf._id;
      delete cf._id;
      cf.boardIds = [_id];
      cfMap[id] = await CustomFields.insertAsync(cf);
    }
    const cards = await ReactiveCache.getCards({ boardId: _id });
    for (const card of cards) {
      await Cards.updateAsync(card._id, {
        $set: {
          customFields: card.customFields.map(cf => {
            cf._id = cfMap[cf._id];
            return cf;
          }),
        },
      });
    }

    // copy rules, actions, and triggers
    const actionsMap = {};
    const actions = await ReactiveCache.getActions({ boardId: oldId });
    for (const action of actions) {
      const id = action._id;
      delete action._id;
      action.boardId = _id;
      actionsMap[id] = await Actions.insertAsync(action);
    }
    const triggersMap = {};
    const triggers = await ReactiveCache.getTriggers({ boardId: oldId });
    for (const trigger of triggers) {
      const id = trigger._id;
      delete trigger._id;
      trigger.boardId = _id;
      triggersMap[id] = await Triggers.insertAsync(trigger);
    }
    const rules = await ReactiveCache.getRules({ boardId: oldId });
    for (const rule of rules) {
      delete rule._id;
      rule.boardId = _id;
      rule.actionId = actionsMap[rule.actionId];
      rule.triggerId = triggersMap[rule.triggerId];
      await Rules.insertAsync(rule);
    }

    // Re-set Watchers to reenable notification
    await Boards.updateAsync(_id, {
      $set: { watchers: oldWatchers }
    });

    return _id;
  },
  /**
   * Return a unique title based on the current title
   *
   * @returns {string|null}
   */
  async copyTitle() {
    return await Boards.uniqueTitle(this.title);
  },

  /**
   * Is supplied user authorized to view this board?
   */
  isVisibleBy(user) {
    if (this.isPublic()) {
      // public boards are visible to everyone
      return true;
    } else {
      // otherwise you have to be logged-in and active member
      return user && this.isActiveMember(user._id);
    }
  },

  /**
   * Is the user one of the active members of the board?
   *
   * @param userId
   * @returns {boolean} the member that matches, or undefined/false
   */
  isActiveMember(userId) {
    if (userId) {
      return this.members.find(
        member => member.userId === userId && member.isActive,
      );
    } else {
      return false;
    }
  },

  isPublic() {
    return this.permission === 'public';
  },

  hasSharedListsConverted() {
    return this.hasSharedListsConverted === true;
  },


  cards() {
    const ret = ReactiveCache.getCards(
      { boardId: this._id, archived: false },
      { sort: { title: 1 } },
    );
    return ret;
  },

  lists() {
    return this.draggableLists();
  },

  newestLists() {
    // sorted lists from newest to the oldest, by its creation date or its cards' last modification date
    const user = ReactiveCache.getCurrentUser();
    const value = user._getListSortBy();
    const sortKey = { starred: -1, [value[0]]: value[1] }; // [["starred",-1],value];
    return ReactiveCache.getLists(
      {
        boardId: this._id,
        archived: false,
      },
      { sort: sortKey },
    );
  },

  draggableLists() {
    return ReactiveCache.getLists(
      {
        boardId: this._id,
      },
      { sort: { sort: 1 } }
    );
  },

  /** returns the last list
   * @returns Document the last list
   */
  getLastList() {
    const ret = ReactiveCache.getList({ boardId: this._id }, { sort: { sort: 'desc' } });
    return ret;
  },

  nullSortLists() {
    return ReactiveCache.getLists({
      boardId: this._id,
      archived: false,
      sort: { $eq: null },
    });
  },

  swimlanes() {
    return ReactiveCache.getSwimlanes(
      { boardId: this._id, archived: false },
      { sort: { sort: 1 } },
    );
  },

  nextSwimlane(swimlane) {
    return ReactiveCache.getSwimlane(
      {
        boardId: this._id,
        archived: false,
        sort: { $gte: swimlane.sort },
        _id: { $ne: swimlane._id },
      },
      {
        sort: { sort: 1 },
      },
    );
  },

  nullSortSwimlanes() {
    return ReactiveCache.getSwimlanes({
      boardId: this._id,
      archived: false,
      sort: { $eq: null },
    });
  },

  hasOvertimeCards() {
    const card = ReactiveCache.getCard({
      isOvertime: true,
      boardId: this._id,
      archived: false,
    });
    return card !== undefined;
  },

  hasSpentTimeCards() {
    const card = ReactiveCache.getCard({
      spentTime: { $gt: 0 },
      boardId: this._id,
      archived: false,
    });
    return card !== undefined;
  },

  activities() {
    let linkedBoardId = [this._id];
    ReactiveCache.getCards({
      "type": "cardType-linkedBoard",
      "boardId": this._id
    }).forEach(card => {
      linkedBoardId.push(card.linkedId);
    });
    const ret = ReactiveCache.getActivities({ boardId: { $in: linkedBoardId } }, { sort: { createdAt: -1 } });
    return ret;
  },

  activeMembers(){
    // Depend on the users collection for reactivity when users are loaded
    const memberUserIds = this.members.map(x => x.userId);
    // Use findOne with limit for reactivity trigger instead of count() which loads all users
    if (Meteor.isClient) {
      Meteor.users.findOne({ _id: { $in: memberUserIds } }, { fields: { _id: 1 }, limit: 1 });
    }
    const members = (this.members || []).filter(m => m.isActive === true);
    // Group by userId to handle duplicates
    const grouped = groupBy(members, 'userId');
    const uniqueMembers = Object.values(grouped).map(group => {
      // Prefer admin member if exists, otherwise take the first
      const selected = group.find(m => m.isAdmin) || group[0];
      return selected;
    });
    // Filter out members where user is not loaded
    const filteredMembers = uniqueMembers.filter(member => {
      const user = ReactiveCache.getUser(member.userId);
      return user !== undefined;
    });

    // Sort by role priority first (admin, normal, normal-assigned, no-comments, comment-only, comment-assigned, worker, read-only, read-assigned), then by fullname
    const sortKey = member => {
      const user = ReactiveCache.getUser(member.userId);
      let rolePriority = 8; // Default for normal

      if (member.isAdmin) rolePriority = 0;
      else if (member.isReadAssignedOnly) rolePriority = 8;
      else if (member.isReadOnly) rolePriority = 7;
      else if (member.isWorker) rolePriority = 6;
      else if (member.isCommentAssignedOnly) rolePriority = 5;
      else if (member.isCommentOnly) rolePriority = 4;
      else if (member.isNoComments) rolePriority = 3;
      else if (member.isNormalAssignedOnly) rolePriority = 2;
      else rolePriority = 1; // Normal

      const fullname = user ? user.profile.fullname : '';
      return rolePriority + '-' + fullname;
    };
    return [...filteredMembers].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  },

  activeOrgs() {
    return where(this.orgs, { isActive: true });
  },

  // hasNotAnyOrg(){
  //   return this.orgs === undefined || this.orgs.length <= 0;
  // },

  activeTeams() {
    return where(this.teams, { isActive: true });
  },

  // hasNotAnyTeam(){
  //   return this.teams === undefined || this.teams.length <= 0;
  // },

  activeAdmins() {
    return where(this.members, { isActive: true, isAdmin: true });
  },

  memberUsers() {
    return ReactiveCache.getUsers({ _id: { $in: this.members.map(x => x.userId) } });
  },

  getLabel(name, color) {
    return findWhere(this.labels, { name, color });
  },

  getLabelById(labelId) {
    return findWhere(this.labels, { _id: labelId });
  },

  labelIndex(labelId) {
    return this.labels.map(x => x._id).indexOf(labelId);
  },

  memberIndex(memberId) {
    return this.members.map(x => x.userId).indexOf(memberId);
  },

  hasMember(memberId) {
    return !!findWhere(this.members, { userId: memberId, isActive: true });
  },

  hasAdmin(memberId) {
    return !!findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: true,
    });
  },

  hasNoComments(memberId) {
    return !!findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isNoComments: true,
      isWorker: false,
    });
  },

  hasCommentOnly(memberId) {
    return !!findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isCommentOnly: true,
      isWorker: false,
    });
  },

  hasWorker(memberId) {
    return !!findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isCommentOnly: false,
      isWorker: true,
    });
  },

  hasNormalAssignedOnly(memberId) {
    return !!findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isNormalAssignedOnly: true,
      isCommentAssignedOnly: false,
    });
  },

  hasCommentAssignedOnly(memberId) {
    return !!findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isNormalAssignedOnly: false,
      isCommentAssignedOnly: true,
    });
  },

  hasReadOnly(memberId) {
    return !!findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isReadOnly: true,
    });
  },

  hasReadAssignedOnly(memberId) {
    return !!findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isReadAssignedOnly: true,
    });
  },

  hasAnyAllowsDate() {
    const ret = this.allowsReceivedDate || this.allowsStartDate || this.allowsDueDate || this.allowsEndDate;
    return ret;
  },

  hasAnyAllowsUser() {
    const ret = this.allowsCreator || this.allowsMembers || this.allowsAssignee || this.allowsRequestedBy || this.allowsAssignedBy;
    return ret;
  },

  absoluteUrl() {
    return FlowRouter.url('board', { id: this._id, slug: this.slug || 'board' });
  },
  originRelativeUrl() {
    return FlowRouter.path('board', { id: this._id, slug: this.slug || 'board' });
  },

  colorClass() {
    return `board-color-${this.color}`;
  },

  customFields() {
    const ret = ReactiveCache.getCustomFields(
      { boardIds: { $in: [this._id] } },
      { sort: { name: 1 } },
    );
    return ret;
  },

  // XXX currently mutations return no value so we have an issue when using addLabel in import
  // XXX waiting on https://github.com/mquandalle/meteor-collection-mutations/issues/1 to remove...
  pushLabel(name, color) {
    const _id = Random.id(6);
    Boards.direct.update(this._id, { $push: { labels: { _id, name, color } } });
    return _id;
  },

  /** sets the new label order
   * @param newLabelOrderOnlyIds new order array of _id, e.g. Array(4) [ "FvtD34", "PAEgDP", "LjRBxH", "YJ8sZz" ]
   */
  setNewLabelOrder(newLabelOrderOnlyIds) {
    if (this.labels.length == newLabelOrderOnlyIds.length) {
      if (this.labels.every(_label => newLabelOrderOnlyIds.indexOf(_label._id) >= 0)) {
        const newLabels = [...this.labels].sort((a, b) => newLabelOrderOnlyIds.indexOf(a._id) - newLabelOrderOnlyIds.indexOf(b._id));
        if (this.labels.length == newLabels.length) {
          Boards.direct.update(this._id, {$set: {labels: newLabels}});
        }
      }
    }
  },

  searchBoards(term) {
    check(term, Match.OneOf(String, null, undefined));

    const query = { boardId: this._id };
    query.type = 'cardType-linkedBoard';
    query.archived = false;

    const projection = { limit: 10, sort: { createdAt: -1 } };

    if (term) {
      const regex = new RegExp(term, 'i');

      query.$or = [{ title: regex }, { description: regex }];
    }

    const ret = ReactiveCache.getCards(query, projection);
    return ret;
  },

  searchSwimlanes(term) {
    check(term, Match.OneOf(String, null, undefined));

    const query = { boardId: this._id };
    if (this.isTemplatesBoard()) {
      query.type = 'template-swimlane';
      query.archived = false;
    } else {
      query.type = { $nin: ['template-swimlane'] };
    }
    const projection = { limit: 10, sort: { createdAt: -1 } };

    if (term) {
      const regex = new RegExp(term, 'i');

      query.$or = [{ title: regex }, { description: regex }];
    }

    return ReactiveCache.getSwimlanes(query, projection);
  },

  searchLists(term) {
    let ret = null;
    if (term) {
      check(term, Match.OneOf(String));
      term = term.trim();
    }
    if (term) {
      const query = { boardId: this._id };
      if (this.isTemplatesBoard()) {
        query.type = 'template-list';
        query.archived = false;
      } else {
        query.type = { $nin: ['template-list'] };
      }
      const projection = { sort: { createdAt: -1 } };

      if (term) {
        const regex = new RegExp(term, 'i');

        query.$or = [{ title: regex }, { description: regex }];
      }

      ret = ReactiveCache.getLists(query, projection);
    }
    return ret;
  },

  searchCards(term, excludeLinked) {
    let ret = null;
    if (term) {
      check(term, Match.OneOf(String));
      term = term.trim();
    }
    if (term) {
      const query = { boardId: this._id };
      if (excludeLinked) {
        query.linkedId = null;
      }
      if (this.isTemplatesBoard()) {
        query.type = 'template-card';
        query.archived = false;
      } else {
        query.type = { $nin: ['template-card'] };
      }
      const projection = { sort: { createdAt: -1 } };

      const regex = new RegExp(term, 'i');

      query.$or = [
        { title: regex },
        { description: regex },
        { customFields: { $elemMatch: { value: regex } } },
      ];
      ret = ReactiveCache.getCards(query, projection);
    }
    return ret;
  },
  // A board alwasy has another board where it deposits subtasks of thasks
  // that belong to itself.
  getDefaultSubtasksBoardId() {
    if (
      this.subtasksDefaultBoardId === null ||
      this.subtasksDefaultBoardId === undefined
    ) {
      this.subtasksDefaultBoardId = Boards.insert({
        title: `^${this.title}^`,
        permission: this.permission,
        members: sanitizeBoardMembers(this.members),
        color: this.color,
        description: getTranslatedString(
          'default-subtasks-board',
          `Default subtasks board for ${this.title}`,
          { board: this.title },
        ),
      });

      Swimlanes.insert({
        title: getTranslatedString('default', 'Default'),
        boardId: this.subtasksDefaultBoardId,
      });
      Boards.update(this._id, {
        $set: {
          subtasksDefaultBoardId: this.subtasksDefaultBoardId,
        },
      });
    }
    return this.subtasksDefaultBoardId;
  },

  getDefaultSubtasksBoard() {
    return ReactiveCache.getBoard(this.getDefaultSubtasksBoardId());
  },

  async getDefaultSubtasksBoardAsync() {
    const boardId = this.getDefaultSubtasksBoardId();
    if (!boardId) {
      return null;
    }

    let board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      board = await Boards.findOneAsync(boardId);
    }
    return board;
  },

  //Date Settings option such as received date, start date and so on.
  getDefaultDateSettingsBoardId() {
    if (
      this.dateSettingsDefaultBoardId === null ||
      this.dateSettingsDefaultBoardId === undefined
    ) {
      this.dateSettingsDefaultBoardId = Boards.insert({
        title: `^${this.title}^`,
        permission: this.permission,
        members: sanitizeBoardMembers(this.members),
        color: this.color,
        description: getTranslatedString(
          'default-dates-board',
          `Default dates board for ${this.title}`,
          { board: this.title },
        ),
      });

      Swimlanes.insert({
        title: getTranslatedString('default', 'Default'),
        boardId: this.dateSettingsDefaultBoardId,
      });
      Boards.update(this._id, {
        $set: {
          dateSettingsDefaultBoardId: this.dateSettingsDefaultBoardId,
        },
      });
    }
    return this.dateSettingsDefaultBoardId;
  },

  getDefaultDateSettingsBoard() {
    return ReactiveCache.getBoard(this.getDefaultDateSettingsBoardId());
  },

  getDefaultSubtasksListId() {
    if (
      this.subtasksDefaultListId === null ||
      this.subtasksDefaultListId === undefined
    ) {
      this.subtasksDefaultListId = Lists.insert({
        title: getTranslatedString('queue', 'Queue'),
        boardId: this._id,
        swimlaneId: this.getDefaultSwimline()._id, // Set default swimlane for subtasks list
      });
      this.setSubtasksDefaultListId(this.subtasksDefaultListId);
    }
    return this.subtasksDefaultListId;
  },

  getDefaultSubtasksList() {
    return ReactiveCache.getList(this.getDefaultSubtasksListId());
  },

  async getDefaultSubtasksListAsync() {
    const listId = this.getDefaultSubtasksListId();
    if (!listId) {
      return null;
    }

    let list = await ReactiveCache.getList(listId);
    if (!list) {
      list = await Lists.findOneAsync(listId);
    }
    return list;
  },

  getDefaultDateSettingsListId() {
    if (
      this.dateSettingsDefaultListId === null ||
      this.dateSettingsDefaultListId === undefined
    ) {
      this.dateSettingsDefaultListId = Lists.insert({
        title: getTranslatedString('queue', 'Queue'),
        boardId: this._id,
        swimlaneId: this.getDefaultSwimline()._id, // Set default swimlane for date settings list
      });
      this.setDateSettingsDefaultListId(this.dateSettingsDefaultListId);
    }
    return this.dateSettingsDefaultListId;
  },

  getDefaultDateSettingsList() {
    return ReactiveCache.getList(this.getDefaultDateSettingsListId());
  },

  getDefaultSwimline() {
    let result = ReactiveCache.getSwimlane({ boardId: this._id });
    if (result === undefined) {
      // Check if any swimlane exists for this board to avoid duplicates
      const existingSwimlanes = ReactiveCache.getSwimlanes({ boardId: this._id });
      if (existingSwimlanes.length > 0) {
        // Use the first existing swimlane
        result = existingSwimlanes[0];
      } else {
        // Use fallback title if i18n is not available (e.g., during migration)
        const title = getTranslatedString('default', 'Default');
        Swimlanes.insert({
          title: title,
          boardId: this._id,
        });
        result = ReactiveCache.getSwimlane({ boardId: this._id });
      }
    }
    return result;
  },

  async getDefaultSwimlineAsync() {
    let result = await ReactiveCache.getSwimlane({ boardId: this._id });
    if (result === undefined) {
      const existingSwimlanes = await ReactiveCache.getSwimlanes({ boardId: this._id });
      if (existingSwimlanes.length > 0) {
        result = existingSwimlanes[0];
      } else {
        const title = getTranslatedString('default', 'Default');
        await Swimlanes.insertAsync({
          title,
          boardId: this._id,
        });
        result = await ReactiveCache.getSwimlane({ boardId: this._id });
      }
    }
    return result;
  },

  async getNextCardNumber() {
    const boardCards = await ReactiveCache.getCard(
      {
        boardId: this._id
      },
      {
        sort: { cardNumber: -1 },
        limit: 1
      }
    , true);

    // If no card is assigned to the board, return 1
    if (!boardCards) {
      return 1;
    }

    const maxCardNr = !!boardCards.cardNumber ? boardCards.cardNumber : 0;
    return maxCardNr + 1;
  },

  cardsDueInBetween(start, end) {
    const ret = ReactiveCache.getCards({
      boardId: this._id,
      dueAt: { $gte: start, $lte: end },
    });
    return ret;
  },

  cardsInInterval(start, end) {
    const ret = ReactiveCache.getCards({
      boardId: this._id,
      $or: [
        {
          startAt: {
            $lte: start,
          },
          endAt: {
            $gte: start,
          },
        },
        {
          startAt: {
            $lte: end,
          },
          endAt: {
            $gte: end,
          },
        },
        {
          startAt: {
            $gte: start,
          },
          endAt: {
            $lte: end,
          },
        },
      ],
    });
    return ret;
  },

  isTemplateBoard() {
    return this.type === 'template-board';
  },

  isTemplatesBoard() {
    return this.type === 'template-container';
  },

  async archive() {
    return await Boards.updateAsync(this._id, { $set: { archived: true, archivedAt: new Date() } });
  },

  async restore() {
    return await Boards.updateAsync(this._id, { $set: { archived: false } });
  },

  async rename(title) {
    return await Boards.updateAsync(this._id, { $set: { title } });
  },

  async setDescription(description) {
    return await Boards.updateAsync(this._id, { $set: { description } });
  },

  async setColor(color) {
    return await Boards.updateAsync(this._id, { $set: { color } });
  },

  async setBackgroundImageURL(backgroundImageURL) {
    const currentUser = await ReactiveCache.getCurrentUser();
    if (currentUser.isBoardAdmin() || currentUser.isAdmin()) {
      return await Boards.updateAsync(this._id, { $set: { backgroundImageURL } });
    }
    return false;
  },

  async setVisibility(visibility) {
    return await Boards.updateAsync(this._id, { $set: { permission: visibility } });
  },

  async addLabel(name, color) {
    if (!this.getLabel(name, color)) {
      const _id = Random.id(6);
      return await Boards.updateAsync(this._id, { $push: { labels: { _id, name, color } } });
    }
    return null;
  },

  async editLabel(labelId, name, color) {
    if (!this.getLabel(name, color)) {
      const labelIndex = this.labelIndex(labelId);
      return await Boards.updateAsync(this._id, {
        $set: {
          [`labels.${labelIndex}.name`]: name,
          [`labels.${labelIndex}.color`]: color,
        },
      });
    }
    return null;
  },

  async removeLabel(labelId) {
    return await Boards.updateAsync(this._id, { $pull: { labels: { _id: labelId } } });
  },

  async changeOwnership(fromId, toId) {
    const memberIndex = this.memberIndex(fromId);
    return await Boards.updateAsync(this._id, {
      $set: { [`members.${memberIndex}.userId`]: toId },
    });
  },

  async addMember(memberId) {
    const memberIndex = this.memberIndex(memberId);
    if (memberIndex >= 0) {
      return await Boards.updateAsync(this._id, {
        $set: { [`members.${memberIndex}.isActive`]: true },
      });
    }

    return await Boards.updateAsync(this._id, {
      $push: {
        members: {
          userId: memberId,
          isAdmin: false,
          isActive: true,
          isNoComments: false,
          isCommentOnly: false,
          isWorker: false,
          isNormalAssignedOnly: false,
          isCommentAssignedOnly: false,
          isReadOnly: false,
          isReadAssignedOnly: false,
        },
      },
    });
  },

  async removeMember(memberId) {
    const memberIndex = this.memberIndex(memberId);
    const allowRemove =
      !this.members[memberIndex].isAdmin || this.activeAdmins().length > 1;
    if (!allowRemove) {
      return await Boards.updateAsync(this._id, {
        $set: { [`members.${memberIndex}.isActive`]: true },
      });
    }

    return await Boards.updateAsync(this._id, {
      $set: {
        [`members.${memberIndex}.isActive`]: false,
        [`members.${memberIndex}.isAdmin`]: false,
      },
    });
  },

  async setMemberPermission(
    memberId,
    isAdmin,
    isNoComments,
    isCommentOnly,
    isWorker,
    isNormalAssignedOnly = false,
    isCommentAssignedOnly = false,
    isReadOnly = false,
    isReadAssignedOnly = false,
    currentUserId = Meteor.userId(),
  ) {
    const memberIndex = this.memberIndex(memberId);
    if (memberId === currentUserId) {
      isAdmin = this.members[memberIndex].isAdmin;
    }

    return await Boards.updateAsync(this._id, {
      $set: {
        [`members.${memberIndex}.isAdmin`]: isAdmin,
        [`members.${memberIndex}.isNoComments`]: isNoComments,
        [`members.${memberIndex}.isCommentOnly`]: isCommentOnly,
        [`members.${memberIndex}.isWorker`]: isWorker,
        [`members.${memberIndex}.isNormalAssignedOnly`]: isNormalAssignedOnly,
        [`members.${memberIndex}.isCommentAssignedOnly`]: isCommentAssignedOnly,
        [`members.${memberIndex}.isReadOnly`]: isReadOnly,
        [`members.${memberIndex}.isReadAssignedOnly`]: isReadAssignedOnly,
      },
    });
  },

  async setAllowsSubtasks(allowsSubtasks) {
    return await Boards.updateAsync(this._id, { $set: { allowsSubtasks } });
  },

  async setAllowsCreator(allowsCreator) {
    return await Boards.updateAsync(this._id, { $set: { allowsCreator } });
  },

  async setAllowsCreatorOnMinicard(allowsCreatorOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsCreatorOnMinicard } });
  },

  async setAllowsMembers(allowsMembers) {
    return await Boards.updateAsync(this._id, { $set: { allowsMembers } });
  },

  async setAllowsChecklists(allowsChecklists) {
    return await Boards.updateAsync(this._id, { $set: { allowsChecklists } });
  },

  async setAllowsAssignee(allowsAssignee) {
    return await Boards.updateAsync(this._id, { $set: { allowsAssignee } });
  },

  async setAllowsAssignedBy(allowsAssignedBy) {
    return await Boards.updateAsync(this._id, { $set: { allowsAssignedBy } });
  },

  async setAllowsShowListsOnMinicard(allowsShowListsOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsShowListsOnMinicard } });
  },

  async setAllowsChecklistAtMinicard(allowsChecklistAtMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsChecklistAtMinicard } });
  },

  async setAllowsRequestedBy(allowsRequestedBy) {
    return await Boards.updateAsync(this._id, { $set: { allowsRequestedBy } });
  },

  async setAllowsCardSortingByNumber(allowsCardSortingByNumber) {
    return await Boards.updateAsync(this._id, { $set: { allowsCardSortingByNumber } });
  },

  async setAllowsShowLists(allowsShowLists) {
    return await Boards.updateAsync(this._id, { $set: { allowsShowLists } });
  },

  async setAllowsAttachments(allowsAttachments) {
    return await Boards.updateAsync(this._id, { $set: { allowsAttachments } });
  },

  async setAllowsLabels(allowsLabels) {
    return await Boards.updateAsync(this._id, { $set: { allowsLabels } });
  },

  async setAllowsComments(allowsComments) {
    return await Boards.updateAsync(this._id, { $set: { allowsComments } });
  },

  async setAllowsDescriptionTitle(allowsDescriptionTitle) {
    return await Boards.updateAsync(this._id, { $set: { allowsDescriptionTitle } });
  },

  async setAllowsCardNumber(allowsCardNumber) {
    return await Boards.updateAsync(this._id, { $set: { allowsCardNumber } });
  },

  async setAllowsDescriptionText(allowsDescriptionText) {
    return await Boards.updateAsync(this._id, { $set: { allowsDescriptionText } });
  },

  async setallowsDescriptionTextOnMinicard(allowsDescriptionTextOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsDescriptionTextOnMinicard } });
  },

  async setallowsCoverAttachmentOnMinicard(allowsCoverAttachmentOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsCoverAttachmentOnMinicard } });
  },

  async setallowsBadgeAttachmentOnMinicard(allowsBadgeAttachmentOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsBadgeAttachmentOnMinicard } });
  },

  async setallowsCardSortingByNumberOnMinicard(allowsCardSortingByNumberOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsCardSortingByNumberOnMinicard } });
  },

  async setAllowsActivities(allowsActivities) {
    return await Boards.updateAsync(this._id, { $set: { allowsActivities } });
  },

  async setAllowsReceivedDate(allowsReceivedDate) {
    return await Boards.updateAsync(this._id, { $set: { allowsReceivedDate } });
  },

  async setAllowsCardCounterList(allowsCardCounterList) {
    return await Boards.updateAsync(this._id, { $set: { allowsCardCounterList } });
  },

  async setAllowsBoardMemberList(allowsBoardMemberList) {
    return await Boards.updateAsync(this._id, { $set: { allowsBoardMemberList } });
  },

  async setAllowsStartDate(allowsStartDate) {
    return await Boards.updateAsync(this._id, { $set: { allowsStartDate } });
  },

  async setAllowsEndDate(allowsEndDate) {
    return await Boards.updateAsync(this._id, { $set: { allowsEndDate } });
  },

  async setAllowsDueDate(allowsDueDate) {
    return await Boards.updateAsync(this._id, { $set: { allowsDueDate } });
  },

  async setSubtasksDefaultBoardId(subtasksDefaultBoardId) {
    return await Boards.updateAsync(this._id, { $set: { subtasksDefaultBoardId } });
  },

  async setSubtasksDefaultListId(subtasksDefaultListId) {
    return await Boards.updateAsync(this._id, { $set: { subtasksDefaultListId } });
  },

  async setPresentParentTask(presentParentTask) {
    return await Boards.updateAsync(this._id, { $set: { presentParentTask } });
  },

  async move(sortIndex) {
    return await Boards.updateAsync(this._id, { $set: { sort: sortIndex } });
  },

  async toggleShowActivities() {
    return await Boards.updateAsync(this._id, { $set: { showActivities: !this.showActivities } });
  },
});

Boards.uniqueTitle = async title => {
  const m = title.match(
    new RegExp('^(?<title>.*?)\\s*(\\[(?<num>\\d+)]\\s*$|\\s*$)'),
  );
  const base = escapeForRegex(m.groups.title);
  const baseTitle = m.groups.title;
  const boards = await ReactiveCache.getBoards({ title: new RegExp(`^${base}\\s*(\\[(?<num>\\d+)]\\s*$|\\s*$)`) });
  if (boards.length > 0) {
    let num = 0;
    const numberedBoards = await ReactiveCache.getBoards({ title: new RegExp(`^${base}\\s*\\[\\d+]\\s*$`) });
    for (const board of numberedBoards) {
      const m = board.title.match(
        new RegExp('^(?<title>.*?)\\s*\\[(?<num>\\d+)]\\s*$'),
      );
      if (m) {
        const n = parseInt(m.groups.num, 10);
        num = num < n ? n : num;
      }
    }
    return `${baseTitle} [${num + 1}]`;
  }
  return title;
};

// Non-async: returns data on client, Promise on server.
// Server callers must await.
Boards.userSearch = (
  userId,
  selector = {},
  projection = {},
  // includeArchived = false,
) => {
  // if (!includeArchived) {
  //   selector.archived = false;
  // }
  selector.$or = [{ permission: 'public' }];

  if (userId) {
    selector.$or.push({ members: { $elemMatch: { userId, isActive: true } } });
  }
  return ReactiveCache.getBoards(selector, projection);
};

// Non-async: returns data on client (for Blaze templates), Promise on server.
// Server callers must await.
Boards.userBoards = (
  userId,
  archived = false,
  selector = {},
  projection = {},
) => {
  const _buildSelector = (user) => {
    if (!user) return null;
    if (typeof archived === 'boolean') {
      selector.archived = archived;
    }
    if (!selector.type) {
      selector.type = 'board';
    }
    selector.$or = [
      { permission: 'public' },
      { members: { $elemMatch: { userId, isActive: true } } },
      { orgs: { $elemMatch: { orgId: { $in: user.orgIds() }, isActive: true } } },
      { teams: { $elemMatch: { teamId: { $in: user.teamIds() }, isActive: true } } },
    ];
    return selector;
  };

  if (Meteor.isServer) {
    return (async () => {
      const user = await ReactiveCache.getUser(userId);
      if (!_buildSelector(user)) return [];
      return await ReactiveCache.getBoards(selector, projection);
    })();
  }
  const user = ReactiveCache.getUser(userId);
  if (!_buildSelector(user)) return [];
  return ReactiveCache.getBoards(selector, projection);
};

Boards.userBoardIds = async (userId, archived = false, selector = {}) => {
  const boards = await Boards.userBoards(userId, archived, selector, {
    fields: { _id: 1 },
  });
  return boards.map(board => {
    return board._id;
  });
};

Boards.colorMap = () => {
  const colors = {};
  try {
    const TAPi18n = getTAPi18n();
    for (const color of Boards.labelColors()) {
      colors[TAPi18n.__(`color-${color}`)] = color;
    }
  } catch (e) {
    // i18n not ready yet, return empty map
    // The colorMap will be regenerated when i18n is ready
  }
  return colors;
};

Boards.labelColors = () => {
  return LABEL_COLORS;
};

export default Boards;
