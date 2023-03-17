import { ReactiveCache } from '/imports/reactiveCache';
import escapeForRegex from 'escape-string-regexp';
import { TAPi18n } from '/imports/i18n';
import {
  ALLOWED_BOARD_COLORS,
  ALLOWED_COLORS,
  TYPE_BOARD,
  TYPE_TEMPLATE_BOARD,
  TYPE_TEMPLATE_CONTAINER,
} from '/config/const';
import Users from "./users";

// const escapeForRegex = require('escape-string-regexp');

Boards = new Mongo.Collection('boards');

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
      type: [Object],
      optional: true,
      /* Commented out, so does not create labels to new boards.
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          const colors = Boards.simpleSchema()._schema['labels.$.color']
            .allowedValues;
          const defaultLabelsColors = _.clone(colors).splice(0, 6);
          return defaultLabelsColors.map(color => ({
            color,
            _id: Random.id(6),
            name: '',
          }));
        }
      },
      */
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
      allowedValues: ALLOWED_COLORS,
    },
    // XXX We might want to maintain more informations under the member sub-
    // documents like de-normalized meta-data (the date the member joined the
    // board, the number of contributions, etc.).
    members: {
      /**
       * List of members of a board
       */
      type: [Object],
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
      allowedValues: ALLOWED_BOARD_COLORS,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return ALLOWED_BOARD_COLORS[0];
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
      defaultValue: false,
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
      decimal: true,
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
      decimal: true,
      defaultValue: -1,
    },
    showActivities: {
      type: Boolean,
      defaultValue: false,
    },
  }),
);

Boards.helpers({
  copy() {
    const oldId = this._id;
    const oldWatchers = this.watchers ? this.watchers.slice() : [];
    delete this._id;
    delete this.slug;
    this.title = this.copyTitle();
    const _id = Boards.insert(this);

    // Temporary remove watchers to disable notifications
      Boards.update(_id, {
        $set: {
          watchers: []
        },
    });

    // Copy all swimlanes in board
    ReactiveCache.getSwimlanes({
      boardId: oldId,
      archived: false,
    }).forEach(swimlane => {
      swimlane.type = 'swimlane';
      swimlane.copy(_id);
    });

    // copy custom field definitions
    const cfMap = {};
    ReactiveCache.getCustomFields({ boardIds: oldId }).forEach(cf => {
      const id = cf._id;
      delete cf._id;
      cf.boardIds = [_id];
      cfMap[id] = CustomFields.insert(cf);
    });
    ReactiveCache.getCards({ boardId: _id }).forEach(card => {
      Cards.update(card._id, {
        $set: {
          customFields: card.customFields.map(cf => {
            cf._id = cfMap[cf._id];
            return cf;
          }),
        },
      });
    });

    // copy rules, actions, and triggers
    const actionsMap = {};
    ReactiveCache.getActions({ boardId: oldId }).forEach(action => {
      const id = action._id;
      delete action._id;
      action.boardId = _id;
      actionsMap[id] = Actions.insert(action);
    });
    const triggersMap = {};
    ReactiveCache.getTriggers({ boardId: oldId }).forEach(trigger => {
      const id = trigger._id;
      delete trigger._id;
      trigger.boardId = _id;
      triggersMap[id] = Triggers.insert(trigger);
    });
    ReactiveCache.getRules({ boardId: oldId }).forEach(rule => {
      delete rule._id;
      rule.boardId = _id;
      rule.actionId = actionsMap[rule.actionId];
      rule.triggerId = triggersMap[rule.triggerId];
      Rules.insert(rule);
    });

    // Re-set Watchers to reenable notification
    Boards.update(_id, {
      $set: { watchers: oldWatchers }
    });

    return _id;
  },
  /**
   * Return a unique title based on the current title
   *
   * @returns {string|null}
   */
  copyTitle() {
    return Boards.uniqueTitle(this.title);
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
    const value = ReactiveCache.getCurrentUser()._getListSortBy();
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
    return ReactiveCache.getLists({ boardId: this._id }, { sort: { sort: 1 } });
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
      "boardId": this._id}
      ).forEach(card => {
        linkedBoardId.push(card.linkedId);
    });
    const ret = ReactiveCache.getActivities({ boardId: { $in: linkedBoardId } }, { sort: { createdAt: -1 } });
    return ret;
  },

  activeMembers(){
    const members = _.where(this.members, { isActive: true });
    return _.sortBy(members, 'username');
  },

  activeOrgs() {
    return _.where(this.orgs, { isActive: true });
  },

  // hasNotAnyOrg(){
  //   return this.orgs === undefined || this.orgs.length <= 0;
  // },

  activeTeams() {
    return _.where(this.teams, { isActive: true });
  },

  // hasNotAnyTeam(){
  //   return this.teams === undefined || this.teams.length <= 0;
  // },

  activeAdmins() {
    return _.where(this.members, { isActive: true, isAdmin: true });
  },

  memberUsers() {
    return ReactiveCache.getUsers({ _id: { $in: _.pluck(this.members, 'userId') } });
  },

  getLabel(name, color) {
    return _.findWhere(this.labels, { name, color });
  },

  getLabelById(labelId) {
    return _.findWhere(this.labels, { _id: labelId });
  },

  labelIndex(labelId) {
    return _.pluck(this.labels, '_id').indexOf(labelId);
  },

  memberIndex(memberId) {
    return _.pluck(this.members, 'userId').indexOf(memberId);
  },

  hasMember(memberId) {
    return !!_.findWhere(this.members, { userId: memberId, isActive: true });
  },

  hasAdmin(memberId) {
    return !!_.findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: true,
    });
  },

  hasNoComments(memberId) {
    return !!_.findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isNoComments: true,
      isWorker: false,
    });
  },

  hasCommentOnly(memberId) {
    return !!_.findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isCommentOnly: true,
      isWorker: false,
    });
  },

  hasWorker(memberId) {
    return !!_.findWhere(this.members, {
      userId: memberId,
      isActive: true,
      isAdmin: false,
      isCommentOnly: false,
      isWorker: true,
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
    return FlowRouter.url('board', { id: this._id, slug: this.slug });
  },
  originRelativeUrl() {
    return FlowRouter.path('board', { id: this._id, slug: this.slug });
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
        const newLabels = _.sortBy(this.labels, _label => newLabelOrderOnlyIds.indexOf(_label._id));
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
        members: this.members,
        color: this.color,
        description: TAPi18n.__('default-subtasks-board', {
          board: this.title,
        }),
      });

      Swimlanes.insert({
        title: TAPi18n.__('default'),
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

  //Date Settings option such as received date, start date and so on.
  getDefaultDateSettingsBoardId() {
    if (
      this.dateSettingsDefaultBoardId === null ||
      this.dateSettingsDefaultBoardId === undefined
    ) {
      this.dateSettingsDefaultBoardId = Boards.insert({
        title: `^${this.title}^`,
        permission: this.permission,
        members: this.members,
        color: this.color,
        description: TAPi18n.__('default-dates-board', {
          board: this.title,
        }),
      });

      Swimlanes.insert({
        title: TAPi18n.__('default'),
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
        title: TAPi18n.__('queue'),
        boardId: this._id,
      });
      this.setSubtasksDefaultListId(this.subtasksDefaultListId);
    }
    return this.subtasksDefaultListId;
  },

  getDefaultSubtasksList() {
    return ReactiveCache.getList(this.getDefaultSubtasksListId());
  },

  getDefaultDateSettingsListId() {
    if (
      this.dateSettingsDefaultListId === null ||
      this.dateSettingsDefaultListId === undefined
    ) {
      this.dateSettingsDefaultListId = Lists.insert({
        title: TAPi18n.__('queue'),
        boardId: this._id,
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
      Swimlanes.insert({
        title: TAPi18n.__('default'),
        boardId: this._id,
      });
      result = ReactiveCache.getSwimlane({ boardId: this._id });
    }
    return result;
  },

  getNextCardNumber() {
    const boardCards = ReactiveCache.getCard(
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
});

Boards.mutations({
  archive() {
    return { $set: { archived: true, archivedAt: new Date() } };
  },

  restore() {
    return { $set: { archived: false } };
  },

  rename(title) {
    return { $set: { title } };
  },

  setDescription(description) {
    return { $set: { description } };
  },

  setColor(color) {
    return { $set: { color } };
  },

  setBackgroundImageURL(backgroundImageURL) {
    const currentUser = ReactiveCache.getCurrentUser();
    if(currentUser.isBoardAdmin()) {
      return { $set: { backgroundImageURL } };
    } else if (currentUser.isAdmin()) {
      return { $set: { backgroundImageURL } };
    } else {
      return false;
    }
  },

  setVisibility(visibility) {
    return { $set: { permission: visibility } };
  },

  addLabel(name, color) {
    // If label with the same name and color already exists we don't want to
    // create another one because they would be indistinguishable in the UI
    // (they would still have different `_id` but that is not exposed to the
    // user).
    if (!this.getLabel(name, color)) {
      const _id = Random.id(6);
      return { $push: { labels: { _id, name, color } } };
    }
    return {};
  },

  editLabel(labelId, name, color) {
    if (!this.getLabel(name, color)) {
      const labelIndex = this.labelIndex(labelId);
      return {
        $set: {
          [`labels.${labelIndex}.name`]: name,
          [`labels.${labelIndex}.color`]: color,
        },
      };
    }
    return {};
  },

  removeLabel(labelId) {
    return { $pull: { labels: { _id: labelId } } };
  },

  changeOwnership(fromId, toId) {
    const memberIndex = this.memberIndex(fromId);
    return {
      $set: {
        [`members.${memberIndex}.userId`]: toId,
      },
    };
  },

  addMember(memberId) {
    const memberIndex = this.memberIndex(memberId);
    if (memberIndex >= 0) {
      return {
        $set: {
          [`members.${memberIndex}.isActive`]: true,
        },
      };
    }

    return {
      $push: {
        members: {
          userId: memberId,
          isAdmin: false,
          isActive: true,
          isNoComments: false,
          isCommentOnly: false,
          isWorker: false,
        },
      },
    };
  },

  removeMember(memberId) {
    const memberIndex = this.memberIndex(memberId);

    // we do not allow the only one admin to be removed
    const allowRemove =
      !this.members[memberIndex].isAdmin || this.activeAdmins().length > 1;
    if (!allowRemove) {
      return {
        $set: {
          [`members.${memberIndex}.isActive`]: true,
        },
      };
    }

    return {
      $set: {
        [`members.${memberIndex}.isActive`]: false,
        [`members.${memberIndex}.isAdmin`]: false,
      },
    };
  },

  setMemberPermission(
    memberId,
    isAdmin,
    isNoComments,
    isCommentOnly,
    isWorker,
    currentUserId = Meteor.userId(),
  ) {
    const memberIndex = this.memberIndex(memberId);
    // do not allow change permission of self
    if (memberId === currentUserId) {
      isAdmin = this.members[memberIndex].isAdmin;
    }

    return {
      $set: {
        [`members.${memberIndex}.isAdmin`]: isAdmin,
        [`members.${memberIndex}.isNoComments`]: isNoComments,
        [`members.${memberIndex}.isCommentOnly`]: isCommentOnly,
        [`members.${memberIndex}.isWorker`]: isWorker,
      },
    };
  },

  setAllowsSubtasks(allowsSubtasks) {
    return { $set: { allowsSubtasks } };
  },

  setAllowsCreator(allowsCreator) {
    return { $set: { allowsCreator } };
  },

  setAllowsCreatorOnMinicard(allowsCreatorOnMinicard) {
    return { $set: { allowsCreatorOnMinicard } };
  },

  setAllowsMembers(allowsMembers) {
    return { $set: { allowsMembers } };
  },

  setAllowsChecklists(allowsChecklists) {
    return { $set: { allowsChecklists } };
  },

  setAllowsAssignee(allowsAssignee) {
    return { $set: { allowsAssignee } };
  },

  setAllowsAssignedBy(allowsAssignedBy) {
    return { $set: { allowsAssignedBy } };
  },

  setAllowsRequestedBy(allowsRequestedBy) {
    return { $set: { allowsRequestedBy } };
  },

  setAllowsCardSortingByNumber(allowsCardSortingByNumber) {
    return { $set: { allowsCardSortingByNumber } };
  },

  setAllowsShowLists(allowsShowLists) {
    return { $set: { allowsShowLists } };
  },

  setAllowsAttachments(allowsAttachments) {
    return { $set: { allowsAttachments } };
  },

  setAllowsLabels(allowsLabels) {
    return { $set: { allowsLabels } };
  },

  setAllowsComments(allowsComments) {
    return { $set: { allowsComments } };
  },

  setAllowsDescriptionTitle(allowsDescriptionTitle) {
    return { $set: { allowsDescriptionTitle } };
  },

  setAllowsCardNumber(allowsCardNumber) {
    return { $set: { allowsCardNumber } };
  },

  setAllowsDescriptionText(allowsDescriptionText) {
    return { $set: { allowsDescriptionText } };
  },

  setallowsDescriptionTextOnMinicard(allowsDescriptionTextOnMinicard) {
    return { $set: { allowsDescriptionTextOnMinicard } };
  },

  setallowsCoverAttachmentOnMinicard(allowsCoverAttachmentOnMinicard) {
    return { $set: { allowsCoverAttachmentOnMinicard } };
  },

  setallowsBadgeAttachmentOnMinicard(allowsBadgeAttachmentOnMinicard) {
    return { $set: { allowsBadgeAttachmentOnMinicard } };
  },

  setallowsCardSortingByNumberOnMinicard(allowsCardSortingByNumberOnMinicard) {
    return { $set: { allowsCardSortingByNumberOnMinicard } };
  },

  setAllowsActivities(allowsActivities) {
    return { $set: { allowsActivities } };
  },

  setAllowsReceivedDate(allowsReceivedDate) {
    return { $set: { allowsReceivedDate } };
  },

  setAllowsCardCounterList(allowsCardCounterList) {
    return { $set: { allowsCardCounterList } };
  },

  setAllowsBoardMemberList(allowsBoardMemberList) {
    return { $set: { allowsBoardMemberList } };
  },

  setAllowsStartDate(allowsStartDate) {
    return { $set: { allowsStartDate } };
  },

  setAllowsEndDate(allowsEndDate) {
    return { $set: { allowsEndDate } };
  },

  setAllowsDueDate(allowsDueDate) {
    return { $set: { allowsDueDate } };
  },

  setSubtasksDefaultBoardId(subtasksDefaultBoardId) {
    return { $set: { subtasksDefaultBoardId } };
  },

  setSubtasksDefaultListId(subtasksDefaultListId) {
    return { $set: { subtasksDefaultListId } };
  },

  setPresentParentTask(presentParentTask) {
    return { $set: { presentParentTask } };
  },

  move(sortIndex) {
    return { $set: { sort: sortIndex } };
  },

  toggleShowActivities() {
    return { $set: { showActivities: !this.showActivities } };
  },
});

function boardRemover(userId, doc) {
  [Cards, Lists, Swimlanes, Integrations, Rules, Activities].forEach(
    element => {
      element.remove({ boardId: doc._id });
    },
  );
}

Boards.uniqueTitle = title => {
  const m = title.match(
    new RegExp('^(?<title>.*?)\\s*(\\[(?<num>\\d+)]\\s*$|\\s*$)'),
  );
  const base = escapeForRegex(m.groups.title);
  const baseTitle = m.groups.title;
  boards = ReactiveCache.getBoards({ title: new RegExp(`^${base}\\s*(\\[(?<num>\\d+)]\\s*$|\\s*$)`) });
  if (boards.length > 0) {
    let num = 0;
    ReactiveCache.getBoards({ title: new RegExp(`^${base}\\s*\\[\\d+]\\s*$`) }).forEach(
      board => {
        const m = board.title.match(
          new RegExp('^(?<title>.*?)\\s*\\[(?<num>\\d+)]\\s*$'),
        );
        if (m) {
          const n = parseInt(m.groups.num, 10);
          num = num < n ? n : num;
        }
      },
    );
    return `${baseTitle} [${num + 1}]`;
  }
  return title;
};

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
  const ret = ReactiveCache.getBoards(selector, projection);
  return ret;
};

Boards.userBoards = (
  userId,
  archived = false,
  selector = {},
  projection = {},
) => {
  const user = ReactiveCache.getUser(userId);
  if (!user) {
    return [];
  }

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

  return ReactiveCache.getBoards(selector, projection);
};

Boards.userBoardIds = (userId, archived = false, selector = {}) => {
  return Boards.userBoards(userId, archived, selector, {
    fields: { _id: 1 },
  }).map(board => {
    return board._id;
  });
};

Boards.colorMap = () => {
  const colors = {};
  for (const color of Boards.labelColors()) {
    colors[TAPi18n.__(`color-${color}`)] = color;
  }
  return colors;
};

Boards.labelColors = () => {
  return ALLOWED_COLORS;
};

if (Meteor.isServer) {
  Boards.allow({
    insert: Meteor.userId,
    update: allowIsBoardAdmin,
    remove: allowIsBoardAdmin,
    fetch: ['members'],
  });

  // All logged in users are allowed to reorder boards by dragging at All Boards page and Public Boards page.
  Boards.allow({
    update(userId, board, fieldNames) {
      return _.contains(fieldNames, 'sort');
    },
    fetch: [],
  });

  // The number of users that have starred this board is managed by trusted code
  // and the user is not allowed to update it
  Boards.deny({
    update(userId, board, fieldNames) {
      return _.contains(fieldNames, 'stars');
    },
    fetch: [],
  });

  // We can't remove a member if it is the last administrator
  Boards.deny({
    update(userId, doc, fieldNames, modifier) {
      if (!_.contains(fieldNames, 'members')) return false;

      // We only care in case of a $pull operation, ie remove a member
      if (!_.isObject(modifier.$pull && modifier.$pull.members)) return false;

      // If there is more than one admin, it's ok to remove anyone
      const nbAdmins = _.where(doc.members, { isActive: true, isAdmin: true })
        .length;
      if (nbAdmins > 1) return false;

      // If all the previous conditions were verified, we can't remove
      // a user if it's an admin
      const removedMemberId = modifier.$pull.members.userId;
      return Boolean(
        _.findWhere(doc.members, {
          userId: removedMemberId,
          isAdmin: true,
        }),
      );
    },
    fetch: ['members'],
  });

  Meteor.methods({
    getBackgroundImageURL(boardId) {
      check(boardId, String);
      return ReactiveCache.getBoard(boardId, {}, { backgroundImageUrl: 1 });
    },
    quitBoard(boardId) {
      check(boardId, String);
      const board = ReactiveCache.getBoard(boardId);
      if (board) {
        const userId = Meteor.userId();
        const index = board.memberIndex(userId);
        if (index >= 0) {
          board.removeMember(userId);
          return true;
        } else throw new Meteor.Error('error-board-notAMember');
      } else throw new Meteor.Error('error-board-doesNotExist');
    },
    acceptInvite(boardId) {
      check(boardId, String);
      const board = ReactiveCache.getBoard(boardId);
      if (!board) {
        throw new Meteor.Error('error-board-doesNotExist');
      }

      Meteor.users.update(Meteor.userId(), {
        $pull: {
          'profile.invitedBoards': boardId,
        },
      });
    },
    myLabelNames() {
      let names = [];
      Boards.userBoards(Meteor.userId()).forEach(board => {
        // Only return labels when they exist.
        if (board.labels !== undefined) {
          names = names.concat(
            board.labels
              .filter(label => !!label.name)
              .map(label => {
                return label.name;
              }),
          );
        } else {
          return [];
        }
      });
      return _.uniq(names).sort();
    },
    myBoardNames() {
      return _.uniq(
        Boards.userBoards(Meteor.userId()).map(board => {
          return board.title;
        }),
      ).sort();
    },
    setAllBoardsHideActivities() {
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        Boards.update(
          {
            showActivities: true
          },
          {
            $set: {
              showActivities: false,
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
  });

  Meteor.methods({
    archiveBoard(boardId) {
      check(boardId, String);
      const board = ReactiveCache.getBoard(boardId);
      if (board) {
        const userId = Meteor.userId();
        const index = board.memberIndex(userId);
        if (index >= 0) {
          board.archive();
          return true;
        } else throw new Meteor.Error('error-board-notAMember');
      } else throw new Meteor.Error('error-board-doesNotExist');
    },
    setBoardOrgs(boardOrgsArray, currBoardId){
      check(boardOrgsArray, Array);
      check(currBoardId, String);
      Boards.update(currBoardId, {
        $set: {
          orgs: boardOrgsArray,
        },
      });
    },
    setBoardTeams(boardTeamsArray, membersArray, currBoardId){
      check(boardTeamsArray, Array);
      check(membersArray, Array);
      check(currBoardId, String);
      Boards.update(currBoardId, {
        $set: {
          members: membersArray,
          teams: boardTeamsArray,
        },
      });
    },
  });
}

// Insert new board at last position in sort order.
Boards.before.insert((userId, doc) => {
  const lastBoard = ReactiveCache.getBoard(
    { sort: { $exists: true } },
    { sort: { sort: -1 } },
  );
  if (lastBoard && typeof lastBoard.sort !== 'undefined') {
    doc.sort = lastBoard.sort + 1;
  }
});

if (Meteor.isServer) {
  // Let MongoDB ensure that a member is not included twice in the same board
  Meteor.startup(() => {
    Boards._collection.createIndex({ modifiedAt: -1 });
    Boards._collection.createIndex(
      {
        _id: 1,
        'members.userId': 1,
      },
      { unique: true },
    );
    Boards._collection.createIndex({ 'members.userId': 1 });
  });

  // Genesis: the first activity of the newly created board
  Boards.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      type: 'board',
      activityTypeId: doc._id,
      activityType: 'createBoard',
      boardId: doc._id,
    });
  });

  // If the user remove one label from a board, we cant to remove reference of
  // this label in any card of this board.
  Boards.after.update((userId, doc, fieldNames, modifier) => {
    if (
      !_.contains(fieldNames, 'labels') ||
      !modifier.$pull ||
      !modifier.$pull.labels ||
      !modifier.$pull.labels._id
    ) {
      return;
    }

    const removedLabelId = modifier.$pull.labels._id;
    Cards.update(
      { boardId: doc._id },
      {
        $pull: {
          labelIds: removedLabelId,
        },
      },
      { multi: true },
    );
  });

  const foreachRemovedMember = (doc, modifier, callback) => {
    Object.keys(modifier).forEach(set => {
      if (modifier[set] !== false) {
        return;
      }

      const parts = set.split('.');
      if (
        parts.length === 3 &&
        parts[0] === 'members' &&
        parts[2] === 'isActive'
      ) {
        callback(doc.members[parts[1]].userId);
      }
    });
  };

  // Remove a member from all objects of the board before leaving the board
  Boards.before.update((userId, doc, fieldNames, modifier) => {
    if (!_.contains(fieldNames, 'members')) {
      return;
    }
    if (modifier.$set) {
      const boardId = doc._id;
      foreachRemovedMember(doc, modifier.$set, memberId => {
        Cards.update(
          { boardId },
          {
            $pull: {
              members: memberId,
              watchers: memberId,
            },
          },
          { multi: true },
        );

        Lists.update(
          { boardId },
          {
            $pull: {
              watchers: memberId,
            },
          },
          { multi: true },
        );

        const board = Boards._transform(doc);
        board.setWatcher(memberId, false);

        // Remove board from users starred list
        if (!board.isPublic()) {
          Users.update(memberId, {
            $pull: {
              'profile.starredBoards': boardId,
            },
          });
        }
      });
    }
  });

  Boards.before.remove((userId, doc) => {
    boardRemover(userId, doc);
    // Add removeBoard activity to keep it
    Activities.insert({
      userId,
      type: 'board',
      activityTypeId: doc._id,
      activityType: 'removeBoard',
      boardId: doc._id,
    });
  });

  // Add a new activity if we add or remove a member to the board
  Boards.after.update((userId, doc, fieldNames, modifier) => {
    if (fieldNames.includes('title')) {
      Activities.insert({
        userId,
        type: 'board',
        activityType: 'changedBoardTitle',
        boardId: doc._id,
        // this preserves the name so that the activity can be useful after the
        // list is deleted
        title: doc.title,
      });
    }
    if (!_.contains(fieldNames, 'members')) {
      return;
    }
    // Say hello to the new member
    if (modifier.$push && modifier.$push.members) {
      const memberId = modifier.$push.members.userId;
      Activities.insert({
        userId,
        memberId,
        type: 'member',
        activityType: 'addBoardMember',
        boardId: doc._id,
      });
    }

    // Say goodbye to the former member
    if (modifier.$set) {
      foreachRemovedMember(doc, modifier.$set, memberId => {
        Activities.insert({
          userId,
          memberId,
          type: 'member',
          activityType: 'removeBoardMember',
          boardId: doc._id,
        });
      });
    }
  });
}

//BOARDS REST API
if (Meteor.isServer) {
  /**
   * @operation get_boards_from_user
   * @summary Get all boards attached to a user
   *
   * @param {string} userId the ID of the user to retrieve the data
   * @return_type [{_id: string,
                    title: string}]
                    */
  JsonRoutes.add('GET', '/api/users/:userId/boards', function(req, res) {
    try {
      Authentication.checkLoggedIn(req.userId);
      const paramUserId = req.params.userId;
      // A normal user should be able to see their own boards,
      // admins can access boards of any user
      Authentication.checkAdminOrCondition(
        req.userId,
        req.userId === paramUserId,
      );

      const data = ReactiveCache.getBoards(
        {
          archived: false,
          'members.userId': paramUserId,
        },
        {
          sort: { sort: 1 /* boards default sorting */ },
        },
      ).map(function(board) {
        return {
          _id: board._id,
          title: board.title,
        };
      });

      JsonRoutes.sendResult(res, { code: 200, data });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation get_public_boards
   * @summary Get all public boards
   *
   * @return_type [{_id: string,
                    title: string}]
                    */
  JsonRoutes.add('GET', '/api/boards', function(req, res) {
    try {
      Authentication.checkUserId(req.userId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: ReactiveCache.getBoards(
          { permission: 'public' },
          {
            sort: { sort: 1 /* boards default sorting */ },
          },
        ).map(function(doc) {
          return {
            _id: doc._id,
            title: doc.title,
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
   * @operation get_boards_count
   * @summary Get public and private boards count
   *
   * @return_type {private: integer, public: integer}
   */
  JsonRoutes.add('GET', '/api/boards_count', function(req, res) {
    try {
      Authentication.checkUserId(req.userId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          private: ReactiveCache.getBoards({ permission: 'private' }).length,
          public: ReactiveCache.getBoards({ permission: 'public' }).length,
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
   * @operation get_board
   * @summary Get the board with that particular ID
   *
   * @param {string} boardId the ID of the board to retrieve the data
   * @return_type Boards
   */
  JsonRoutes.add('GET', '/api/boards/:boardId', function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: ReactiveCache.getBoard(paramBoardId),
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation new_board
   * @summary Create a board
   *
   * @description This allows to create a board.
   *
   * The color has to be chosen between `belize`, `nephritis`, `pomegranate`,
   * `pumpkin`, `wisteria`, `moderatepink`, `strongcyan`,
   * `limegreen`, `midnight`, `dark`, `relax`, `corteza`:
   *
   * <img src="https://wekan.github.io/board-colors.png" width="40%" alt="Wekan logo" />
   *
   * @param {string} title the new title of the board
   * @param {string} owner "ABCDE12345" <= User ID in Wekan.
   *                 (Not username or email)
   * @param {boolean} [isAdmin] is the owner an admin of the board (default true)
   * @param {boolean} [isActive] is the board active (default true)
   * @param {boolean} [isNoComments] disable comments (default false)
   * @param {boolean} [isCommentOnly] only enable comments (default false)
   * @param {boolean} [isWorker] only move cards, assign himself to card and comment (default false)
   * @param {string} [permission] "private" board <== Set to "public" if you
   *                 want public Wekan board
   * @param {string} [color] the color of the board
   *
   * @return_type {_id: string,
                   defaultSwimlaneId: string}
                   */
  JsonRoutes.add('POST', '/api/boards', function(req, res) {
    try {
      Authentication.checkLoggedIn(req.userId);
      const id = Boards.insert({
        title: req.body.title,
        members: [
          {
            userId: req.body.owner,
            isAdmin: req.body.isAdmin || true,
            isActive: req.body.isActive || true,
            isNoComments: req.body.isNoComments || false,
            isCommentOnly: req.body.isCommentOnly || false,
            isWorker: req.body.isWorker || false,
          },
        ],
        permission: req.body.permission || 'private',
        color: req.body.color || 'belize',
      });
      const swimlaneId = Swimlanes.insert({
        title: TAPi18n.__('default'),
        boardId: id,
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
          defaultSwimlaneId: swimlaneId,
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
   * @operation delete_board
   * @summary Delete a board
   *
   * @param {string} boardId the ID of the board
   */
  JsonRoutes.add('DELETE', '/api/boards/:boardId', function(req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.boardId;
      Boards.remove({ _id: id });
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
  * @operation update_board_title
  * @summary Update the title of a board
  *
  * @param {string} boardId the ID of the board to update
  * @param {string} title the new title for the board
  */
  JsonRoutes.add('PUT', '/api/boards/:boardId/title', function(req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const boardId = req.params.boardId;
      const title = req.body.title;

      Boards.direct.update({ _id: boardId }, { $set: { title } });

      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: boardId,
          title,
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
   * @operation add_board_label
   * @summary Add a label to a board
   *
   * @description If the board doesn't have the name/color label, this function
   * adds the label to the board.
   *
   * @param {string} boardId the board
   * @param {string} color the color of the new label
   * @param {string} name the name of the new label
   *
   * @return_type string
   */
  JsonRoutes.add('PUT', '/api/boards/:boardId/labels', function(req, res) {
    const id = req.params.boardId;
    Authentication.checkBoardAccess(req.userId, id);
    try {
      if (req.body.hasOwnProperty('label')) {
        const board = ReactiveCache.getBoard(id);
        const color = req.body.label.color;
        const name = req.body.label.name;
        const labelId = Random.id(6);
        if (!board.getLabel(name, color)) {
          Boards.direct.update(
            { _id: id },
            { $push: { labels: { _id: labelId, name, color } } },
          );
          JsonRoutes.sendResult(res, {
            code: 200,
            data: labelId,
          });
        } else {
          JsonRoutes.sendResult(res, {
            code: 200,
          });
        }
      }
    } catch (error) {
      JsonRoutes.sendResult(res, {
        data: error,
      });
    }
  });

  /**
   * @operation copy_board
   * @summary Copy a board to a new one
   *
   * @description If your are board admin or wekan admin, this copies the
   * given board to a new one.
   *
   * @param {string} boardId the board
   * @param {string} title the title of the new board (default to old one)
   *
   * @return_type string
   */
JsonRoutes.add('POST', '/api/boards/:boardId/copy', function(req, res) {
  const id = req.params.boardId;
  const board = ReactiveCache.getBoard(id);
  const adminAccess = board.members.some(e => e.userId === req.userId && e.isAdmin);
  Authentication.checkAdminOrCondition(req.userId, adminAccess);
  try {
    board['title'] = req.body.title || Boards.uniqueTitle(board.title);
    ret = board.copy();
    JsonRoutes.sendResult(res, {
      code: 200,
      data: ret,
    });
  } catch (error) {
    JsonRoutes.sendResult(res, {
      data: error,
    });
  }
});

  /**
   * @operation set_board_member_permission
   * @tag Users
   * @summary Change the permission of a member of a board
   *
   * @param {string} boardId the ID of the board that we are changing
   * @param {string} memberId the ID of the user to change permissions
   * @param {boolean} isAdmin admin capability
   * @param {boolean} isNoComments NoComments capability
   * @param {boolean} isCommentOnly CommentsOnly capability
   * @param {boolean} isWorker Worker capability
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/members/:memberId', function(
    req,
    res,
  ) {
    try {
      Authentication.checkUserId(req.userId);
      const boardId = req.params.boardId;
      const memberId = req.params.memberId;
      const { isAdmin, isNoComments, isCommentOnly, isWorker } = req.body;
      const board = ReactiveCache.getBoard(boardId);
      function isTrue(data) {
        try {
          return data.toLowerCase() === 'true';
        } catch (error) {
          return data;
        }
      }
      const query = board.setMemberPermission(
        memberId,
        isTrue(isAdmin),
        isTrue(isNoComments),
        isTrue(isCommentOnly),
        isTrue(isWorker),
        req.userId,
      );

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

  //ATTACHMENTS REST API
  /**
   * @operation get_board_attachments
   * @summary Get the list of attachments of a board
   *
   * @param {string} boardId the board ID
   * @return_type [{attachmentId: string,
   *                attachmentName: string,
   *                attachmentType: string,
   *                url: string,
   *                urlDownload: string,
   *                boardId: string,
   *                swimlaneId: string,
   *                listId: string,
   *                cardId: string
   * }]
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/attachments', function(req, res) {
    const paramBoardId = req.params.boardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: ReactiveCache
        .getAttachments({'meta.boardId': paramBoardId }, {}, true)
        .each()
        .map(function(attachment) {
          return {
            attachmentId: attachment._id,
            attachmentName: attachment.name,
            attachmentType: attachment.type,
            url: attachment.link(),
            urlDownload: `${attachment.link()}?download=true&token=`,
            boardId: attachment.meta.boardId,
            swimlaneId: attachment.meta.swimlaneId,
            listId: attachment.meta.listId,
            cardId: attachment.meta.cardId
          };
        }),
    });
  });
}

export default Boards;
