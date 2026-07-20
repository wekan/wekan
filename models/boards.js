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
import { isHexColor } from '/models/lib/contrastColor';
import { isValidCustomColors } from '/models/lib/themeCategories';
import Actions from '/models/actions';
import Cards from '/models/cards';
import Integrations from '/models/integrations';
import Lists from '/models/lists';
import Rules from '/models/rules';
import Swimlanes from '/models/swimlanes';
import Triggers from '/models/triggers';
import { Counters, incrementCounterAsync } from '/models/counters';
import { pullMemberById } from '/server/lib/removeMember';
import getSlug from 'limax';
import { findWhere, where, groupBy } from '/imports/lib/collectionHelpers';
import {
  cardsDueInBetweenSelector,
  cardsInIntervalSelector,
} from '/models/lib/calendarFilter';
import { generateUniversalAttachmentUrl } from '/models/lib/universalUrlGenerator';
import { buildCardSearchOr } from '/models/lib/cardSearch';
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
       *
       * Since #5514 a label color may also be a custom '#rrggbb' hex chosen
       * from the color wheel, in addition to the named palette colors above.
       */
      type: String,
      custom() {
        const v = this.value;
        if (v === undefined || v === null || v === '') return undefined;
        if (LABEL_COLORS.includes(v) || isHexColor(v)) return undefined;
        return 'notAllowed';
      },
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
    domains: {
      /**
       * #5850: the list of email-address domains a board is shared with. Every
       * user whose primary email is in one of these domains gets board access.
       */
      type: Array,
      optional: true,
    },
    'domains.$': {
      type: Object,
    },
    'domains.$.domain': {
      /**
       * The email-address domain, e.g. example.com
       */
      type: String,
    },
    'domains.$.isActive': {
      /**
       * Is the domain share active?
       */
      type: Boolean,
    },
    importUsernames: {
      /**
       * Usernames of imported (e.g. Trello) board members that were not mapped
       * to an existing WeKan user during import. Kept so an admin can map them
       * to real users later (People panel -> user -> Imported Usernames), after
       * which future imports of this board auto-map.
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'importUsernames.$': {
      type: String,
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
    customThemeColors: {
      /**
       * Optional custom colors for the "flat" (1 color) and "clear" (2 colors,
       * a color slide) theme categories — see docs/Theme/Theme.md. Each entry is a
       * #rrggbb hex validated on the server; dark/special themes never store these.
       * Absent = the named `color` theme's stock colors.
       */
      type: Array,
      optional: true,
    },
    'customThemeColors.$': {
      type: String,
      // Enforced on client AND server by collection2 — a value that is not a plain
      // #rrggbb hex can never be stored, so there is no CSS-injection surface.
      custom() {
        return /^#[0-9a-fA-F]{6}$/.test(this.value) ? undefined : 'notAHexColor';
      },
    },
    backgroundImageURL: {
      /**
       * The background image URL of the board.
       */
      type: String,
      optional: true,
    },
    backgroundImageId: {
      /**
       * The id of the active board background attachment (a board-level
       * Attachment with meta.source === 'board-background'), when the active
       * background is an uploaded/imported image rather than an external URL.
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
    cardAging: {
      /**
       * #3984: Visually fade cards that have not been touched for a while
       * (Trello-style "card aging"), based on the card's dateLastActivity.
       */
      type: Boolean,
      defaultValue: false,
    },
    showDependencies: {
      /**
       * #3392: PI Program Board "Red Strings". When true, draw colored
       * connection lines between cards that have cardDependencies, SAFe
       * PI-planning program board style.
       */
      type: Boolean,
      defaultValue: false,
    },
    cardAgingDays1: {
      /** #3984: days of inactivity for the first (lightest) card-aging fade tier. */
      type: Number,
      defaultValue: 7,
    },
    cardAgingDays2: {
      /** #3984: days of inactivity for the second card-aging fade tier. */
      type: Number,
      defaultValue: 14,
    },
    cardAgingDays3: {
      /** #3984: days of inactivity for the third (heaviest) card-aging fade tier. */
      type: Number,
      defaultValue: 28,
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
    allowsSubtasksOnMinicard: {
      /**
       * Does the board allows subtasks on minicard?
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
    allowsAttachmentsOnMinicard: {
      /**
       * Does the board allows attachments on minicard?
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
    allowsChecklistsOnMinicard: {
      /**
       * Does the board allows checklists on minicard?
       */
      type: Boolean,
      defaultValue: true,
    },

    allowsChecklistCountBadgeOnMinicard: {
      /**
       * Does the board show the compact checklist item-count badge
       * (finished/total, e.g. "0/156") on minicards? Issue #6431: opt-in and
       * OFF by default so the (potentially expensive) checklist counting only
       * runs when this is enabled in Card Settings > Show on Minicard.
       */
      type: Boolean,
      defaultValue: false,
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
    allowsDescriptionTitleOnMinicard: {
      /**
       * Does the board allows description title on minicard?
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

    allowsCoverAttachmentOnCard: {
      /**
       * Does the board show the cover image on the opened card? Opt-in, OFF by
       * default (new Card Settings option).
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

    allowsAttachmentCountOnCard: {
      /**
       * Does the board show the attachment count on the opened card? Opt-in,
       * OFF by default (new Card Settings option).
       */
      type: Boolean,
      defaultValue: false,
    },

    allowsChecklistCountBadgeOnCard: {
      /**
       * Does the board show the checklist item-count total (finished/total)
       * above all checklists on the opened card? Opt-in, OFF by default so the
       * checklist counting only runs when enabled (new Card Settings option).
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
    allowsCardNumberOnMinicard: {
      /**
       * Does the board allows card numbers on minicard?
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
    allowsLabelsOnMinicard: {
      /**
       * Does the board allows labels on minicard?
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
    allowsAssigneeOnMinicard: {
      /**
       * Does the board allows assignee on minicard?
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
    allowsMembersOnMinicard: {
      /**
       * Does the board allows members on minicard?
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
    allowsRequestedByOnMinicard: {
      /**
       * Does the board allows requested by on minicard?
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
    allowsAssignedByOnMinicard: {
      /**
       * Does the board allows requested by on minicard?
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
    restrictCommentEditing: {
      /**
       * When true, board admins can NOT edit or delete comments authored by
       * other users (only the comment's author can). Default false keeps the
       * historical behaviour where board admins may moderate any comment.
       */
      type: Boolean,
      defaultValue: false,
    },
    allowsPersonalListWidth: {
      /**
       * List-width scope for this board (#6409).
       * - false (default): list widths are SHARED — stored in `lists.width`,
       *   the same layout for everyone; only members with write access may
       *   change them.
       * - true: list widths are PERSONAL — each user keeps their own widths in
       *   their profile (or localStorage when not logged in).
       */
      type: Boolean,
      defaultValue: false,
    },
    autoWidth: {
      /**
       * Shared (per-board) auto-width for all lists (#6409). When true, lists
       * fit their content instead of using a fixed width. Used when the board
       * is in SHARED list-width mode (allowsPersonalListWidth = false); in
       * PERSONAL mode each user's own profile.autoWidthBoards value is used
       * instead.
       */
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    allowsReceivedDateOnMinicard: {
      /**
       * Does the board allows received date on minicard?
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
    allowsStartDateOnMinicard: {
      /**
       * Does the board allows start date on minicard?
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
    allowsEndDateOnMinicard: {
      /**
       * Does the board allows end date on minicard?
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
    allowsDueDateOnMinicard: {
      /**
       * Does the board allows due date on minicard?
       */
      type: Boolean,
      defaultValue: true,
    },
    allowsDueComplete: {
      /**
       * Does the board show the "Mark as complete" toggle on cards?
       * Issue #6381: opt-in, hidden by default.
       */
      type: Boolean,
      defaultValue: false,
    },
    allowsDueCompleteOnMinicard: {
      /**
       * Does the board show the "Mark as complete" toggle on minicards?
       * Separate from the card-details toggle (allowsDueComplete): opt-in,
       * hidden by default so it is not shown on minicards unless enabled.
       */
      type: Boolean,
      defaultValue: false,
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

    // #4494: repoint subtasks/date-settings defaults that referenced the source
    // (template) board to this copy, so subtasks created on the new board are
    // NOT dropped onto the template board.
    const { remapCopiedBoardDefaults } = require('./lib/boardCopyDefaults');
    const defaultsPatch = remapCopiedBoardDefaults(this, oldId, _id);
    if (Object.keys(defaultsPatch).length > 0) {
      await Boards.updateAsync(_id, { $set: defaultsPatch });
    }

    // Copy all swimlanes in board. cardIdMap collects old card id -> new card
    // id so card-to-card dependencies (#3392 "Red Strings") can be remapped to
    // the copies once every card has been created.
    const cardIdMap = {};
    const swimlanes = await ReactiveCache.getSwimlanes({
      boardId: oldId,
      archived: false,
    });
    for (const swimlane of swimlanes) {
      swimlane.type = 'swimlane';
      await swimlane.copy(_id, null, 'below', '', cardIdMap);
    }

    // #3392: remap card-to-card dependencies (Red Strings) from the source
    // card ids to their copies, dropping any whose target was not copied.
    const depCards = await ReactiveCache.getCards({
      boardId: _id,
      cardDependencies: { $exists: true, $ne: [] },
    });
    for (const depCard of depCards) {
      const remapped = (depCard.cardDependencies || [])
        .map(dep => {
          // Tolerate legacy bare-string entries as well as { cardId, ... }.
          const oldDepId = typeof dep === 'string' ? dep : dep.cardId;
          const newDepId = cardIdMap[oldDepId];
          if (!newDepId) return null;
          return typeof dep === 'string'
            ? { cardId: newDepId }
            : { ...dep, cardId: newDepId };
        })
        .filter(Boolean);
      await Cards.updateAsync(depCard._id, {
        $set: { cardDependencies: remapped },
      });
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

    // #5592: copy the board's webhooks (Integrations). They are per-board
    // children (boardRemover deletes them by boardId) but were not duplicated on
    // copy, so a copied board lost all its outgoing webhooks. Re-home each onto
    // the new board; the URL/token/activities carry over (the copying user is a
    // board admin and already has access to them).
    const integrations = await ReactiveCache.getIntegrations({ boardId: oldId });
    for (const integration of integrations) {
      delete integration._id;
      integration.boardId = _id;
      await Integrations.insertAsync(integration);
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
        deletedAt: null, // soft delete: hide deleted lists (docs/Features/Undo/Undo.md)
      },
      { sort: sortKey },
    );
  },

  draggableLists() {
    return ReactiveCache.getLists(
      {
        boardId: this._id,
        deletedAt: null, // soft delete: hide deleted lists
      },
      { sort: { sort: 1 } }
    );
  },

  /** returns the last list
   * @returns Document the last list
   */
  getLastList() {
    const ret = ReactiveCache.getList({ boardId: this._id, deletedAt: null }, { sort: { sort: 'desc' } });
    return ret;
  },

  nullSortLists() {
    return ReactiveCache.getLists({
      boardId: this._id,
      archived: false,
      deletedAt: null,
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

  // Active members first (sorted as above), then the inactive/imported ones appended, so
  // the sidebar member list shows EVERYONE and which are active vs not — imported
  // placeholders and members deactivated by reconciliation (e.g. not in LDAP) stay
  // visible (rendered distinguished by userAvatar) instead of silently disappearing.
  membersForSidebar() {
    const active = this.activeMembers();
    const activeIds = new Set(active.map(m => m.userId));
    const seen = new Set();
    // #6479: a REMOVED member (isActive:false) must NOT appear in the sidebar member
    // list. removeMember keeps the entry with isActive:false (#5122: role history /
    // re-activation), so if the sidebar showed inactive members too, "Remove from
    // board" looked like it did nothing — the avatar stayed. The only inactive entries
    // still worth showing here are imported placeholders pending reconciliation
    // (authenticationMethod:'imported'); a plain removed account is hidden. Removed
    // members remain visible (greyed) where they are still referenced, e.g. as a card
    // assignee, via the userAvatar 'inactive-member' styling — just not as current
    // board members in this list.
    const placeholders = (this.members || []).filter(m => {
      if (m.isActive === true || activeIds.has(m.userId) || seen.has(m.userId)) return false;
      seen.add(m.userId);
      const user = ReactiveCache.getUser(m.userId);
      return !!user && user.authenticationMethod === 'imported';
    });
    return active.concat(placeholders);
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

  // #5850: the board's active email-address domains.
  activeDomains() {
    return where(this.domains, { isActive: true });
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

  // Returns the single BOARD-level role key of an active board member (see
  // INVITE_TO_BOARD_ROLES). Returns null if the user is not an active member.
  // Note: 'board-admin' is the board administrator role and is distinct from
  // the global site-admin flag `user.isAdmin`. A member with no restriction
  // flag set is a plain 'normal' member.
  memberRole(memberId) {
    const member = findWhere(this.members, { userId: memberId, isActive: true });
    if (!member) return null;
    if (member.isAdmin) return 'board-admin';
    if (member.isWorker) return 'worker';
    if (member.isCommentOnly) return 'comment-only';
    if (member.isNoComments) return 'no-comments';
    if (member.isNormalAssignedOnly) return 'normal-assigned-only';
    if (member.isCommentAssignedOnly) return 'comment-assigned-only';
    if (member.isReadOnly) return 'read-only';
    if (member.isReadAssignedOnly) return 'read-assigned-only';
    return 'normal';
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
    // Build the URL from the relative path rather than FlowRouter.url():
    // FlowRouter is client-only, so on the server (board invitation emails,
    // activity notification emails) it has no registered routes and returns a
    // generic "/board" link without the board id. Meteor.absoluteUrl() prepends
    // ROOT_URL and works on both client and server. It expects no leading slash.
    return Meteor.absoluteUrl(this.originRelativeUrl().replace(/^\//, ''));
  },
  originRelativeUrl() {
    // Matches the 'board' route '/b/:id/:slug' (config/router.js). Built as a
    // plain string so it resolves correctly on the server too.
    return `/b/${this._id}/${this.slug || 'board'}`;
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

      // #5680: build the $or so numeric custom fields (number / currency, stored
      // as JS Numbers) match by value too — a regex alone only matches strings.
      query.$or = buildCardSearchOr(term);
      ret = ReactiveCache.getCards(query, projection);
    }
    return ret;
  },
  // A board alwasy has another board where it deposits subtasks of thasks
  // that belong to itself.
  getDefaultSubtasksBoardId() {
    // #3868 / #5788 / #2256: only the SERVER may auto-create the default
    // subtasks board (+ its swimlane) — and #6456: on Meteor 3 the server may
    // not use the sync insert/update APIs either ("insert is not available on
    // the server"), which made addSubtaskCard throw here. This is now a PURE
    // getter; the server-side creation lives in getDefaultSubtasksBoardAsync
    // (the only path the addSubtaskCard method uses).
    return this.subtasksDefaultBoardId;
  },

  getDefaultSubtasksBoard() {
    return ReactiveCache.getBoard(this.getDefaultSubtasksBoardId());
  },

  async getDefaultSubtasksBoardAsync() {
    let boardId = this.getDefaultSubtasksBoardId();

    // #6456: server-authoritative lazy creation, once, with the async APIs
    // (the sync Boards.insert/Swimlanes.insert/Boards.update this used to rely
    // on throw on the Meteor 3 server, so creating a subtask crashed with
    // "Exception while invoking method 'addSubtaskCard'").
    if (!boardId && Meteor.isServer) {
      boardId = await Boards.insertAsync({
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

      await Swimlanes.insertAsync({
        title: getTranslatedString('default', 'Default'),
        boardId,
      });
      await this.setSubtasksDefaultBoardId(boardId);
      this.subtasksDefaultBoardId = boardId;
    }

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
    // #6456 (same class): PURE getter. The lazy sync creation this used had
    // BOTH bug classes — no Meteor.isServer guard (client-side creation on
    // every reactive read, the #2256/#3868 duplicate-boards class) and the
    // sync Boards.insert/Swimlanes.insert/Boards.update APIs that throw on the
    // Meteor 3 server. Nothing in the codebase calls it today; if a feature
    // needs the dates helper board again, add an async server-side ensure like
    // getDefaultSubtasksBoardAsync.
    return this.dateSettingsDefaultBoardId;
  },

  getDefaultDateSettingsBoard() {
    return ReactiveCache.getBoard(this.getDefaultDateSettingsBoardId());
  },

  getDefaultSubtasksListId() {
    // #3868 / #5788 / #2256 / #6456: PURE getter — client-side creation
    // duplicated lists, and the sync Lists.insert this used on the server
    // throws on Meteor 3. Server-side creation lives in
    // getDefaultSubtasksListAsync.
    return this.subtasksDefaultListId;
  },

  getDefaultSubtasksList() {
    return ReactiveCache.getList(this.getDefaultSubtasksListId());
  },

  async getDefaultSubtasksListAsync() {
    let listId = this.getDefaultSubtasksListId();

    // #6456: server-authoritative lazy creation with the async APIs (the sync
    // Lists.insert + getDefaultSwimline() this relied on throw on the Meteor 3
    // server — getDefaultSwimline's sync ReactiveCache read even returns a
    // Promise there, so .._id was never valid).
    if (!listId && Meteor.isServer) {
      const swimlane = await this.getDefaultSwimlineAsync();
      listId = await Lists.insertAsync({
        title: getTranslatedString('queue', 'Queue'),
        boardId: this._id,
        swimlaneId: swimlane ? swimlane._id : undefined, // Set default swimlane for subtasks list
      });
      await this.setSubtasksDefaultListId(listId);
      this.subtasksDefaultListId = listId;
    }

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
    // #6456 (same class): PURE getter — see getDefaultDateSettingsBoardId.
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
      } else if (Meteor.isServer && this._id) {
        // Issue #6382: only the server may auto-create the default swimlane.
        // On the client this getter runs inside reactive render contexts; when a
        // board's swimlanes are not yet loaded/subscribed (e.g. the default
        // subtasks board viewed via "All boards"), getSwimlanes() is transiently
        // empty and every re-render would insert another empty swimlane —
        // producing thousands of them and freezing the browser. The server
        // creates the default swimlane at board creation and self-heals here.
        // Issue #6429: self-heal via a DETERMINISTIC _id so concurrent/repeated
        // calls are idempotent (see ensureDefaultSwimlaneId).
        result = this.ensureDefaultSwimlaneId();
      }
    }
    return result;
  },

  // Deterministic _id for a board's auto-created default swimlane. Because _id
  // carries a unique index, an upsert on it can create AT MOST ONE default
  // swimlane per board, no matter how many times (or how concurrently) the
  // self-heal runs — the fix for #6429 (a check-then-insert race in the getters
  // below produced 30 000+ empty "Default" swimlanes on some boards).
  defaultSwimlaneId() {
    const { defaultSwimlaneId } = require('./lib/defaultSwimlane');
    return defaultSwimlaneId(this._id);
  },

  ensureDefaultSwimlaneId() {
    const defaultId = this.defaultSwimlaneId();
    // Upsert keyed on the deterministic _id: concurrent self-heals collide on
    // the _id unique index, so only one insert wins instead of racing the
    // check-then-insert and each inserting a new swimlane.
    Swimlanes.upsert({ _id: defaultId }, { $setOnInsert: this.defaultSwimlaneFields() });
    return ReactiveCache.getSwimlane({ _id: defaultId });
  },

  async ensureDefaultSwimlaneIdAsync() {
    const defaultId = this.defaultSwimlaneId();
    await Swimlanes.upsertAsync(
      { _id: defaultId },
      { $setOnInsert: this.defaultSwimlaneFields() },
    );
    return ReactiveCache.getSwimlane({ _id: defaultId });
  },

  // Fields for an upsert-inserted default swimlane. archived/type must be set
  // explicitly: their schema autoValue/defaultValue only fire on isInsert, not
  // on the isUpsert path used here, so omitting them fails required validation.
  defaultSwimlaneFields() {
    const { defaultSwimlaneFields } = require('./lib/defaultSwimlane');
    // Use fallback title if i18n is not available (e.g., during migration).
    return defaultSwimlaneFields(this._id, getTranslatedString('default', 'Default'));
  },

  async getDefaultSwimlineAsync() {
    let result = await ReactiveCache.getSwimlane({ boardId: this._id });
    if (result === undefined) {
      const existingSwimlanes = await ReactiveCache.getSwimlanes({ boardId: this._id });
      if (existingSwimlanes.length > 0) {
        result = existingSwimlanes[0];
      } else if (Meteor.isServer && this._id) {
        // Issue #6382: never auto-create swimlanes from the client (see
        // getDefaultSwimline) — only the server may insert the default one.
        // Issue #6429: idempotent deterministic-_id upsert instead of a racy
        // check-then-insert that produced thousands of empty swimlanes.
        result = await this.ensureDefaultSwimlaneIdAsync();
      }
    }
    return result;
  },

  async getNextCardNumber() {
    // Issue #5813 / #4743: the previous implementation read the current max
    // cardNumber and returned max + 1. Two concurrent card creations (e.g. a
    // burst of REST API calls) both read the same max and both got the same
    // number — a read-then-increment race that gave many cards the same number
    // and, under load, pegged the CPU. We now allocate card numbers from an
    // atomic per-board counter (Counters.incrementCounterAsync), which is a
    // single atomic findOneAndUpdate($inc) and is therefore safe under
    // concurrency.
    const counterName = `cardNumber-${this._id}`;

    // rawCollection()/atomic counters are server-only. On the client (where card
    // numbers are not authoritative — the server insert recomputes them), fall
    // back to the old max + 1 read.
    if (!Meteor.isServer) {
      const boardCards = await ReactiveCache.getCard(
        { boardId: this._id },
        { sort: { cardNumber: -1 }, limit: 1 },
        true,
      );
      if (!boardCards) {
        return 1;
      }
      const maxCardNr = boardCards.cardNumber ? boardCards.cardNumber : 0;
      return maxCardNr + 1;
    }

    // Lazy seed: the counter does not exist for boards created before this
    // change (or for boards imported with existing cards). On first use, seed
    // the counter to the board's current max cardNumber so we never reissue a
    // number that an existing card already has. This runs once per board.
    const existingCounter = await Counters.rawCollection().findOne({ _id: counterName });
    if (!existingCounter) {
      const boardCards = await ReactiveCache.getCard(
        {
          boardId: this._id,
        },
        {
          sort: { cardNumber: -1 },
          limit: 1,
        },
        true,
      );
      const maxCardNr = boardCards && boardCards.cardNumber ? boardCards.cardNumber : 0;
      // Seed only if still missing, so two concurrent first-uses don't clobber
      // each other (the loser's upsert is a no-op).
      await Counters.rawCollection().updateOne(
        { _id: counterName },
        { $setOnInsert: { next_val: maxCardNr } },
        { upsert: true },
      );
    }

    return await incrementCounterAsync(counterName);
  },

  // #5656: the Calendar view must honor the active board Filter (member /
  // assignee / due-date / label / custom-field). `filterSelector` is the object
  // produced by Filter._getMongoSelector() on the client (pass a falsy/empty
  // value, e.g. from the server or when no filter is active). It is always
  // ANDed in via combineWithFilter so it can never be overwritten by — nor
  // collide with — the top-level `$or` these interval selectors use.
  cardsDueInBetween(start, end, filterSelector) {
    const ret = ReactiveCache.getCards(
      cardsDueInBetweenSelector(this._id, start, end, filterSelector),
    );
    return ret;
  },

  cardsInInterval(start, end, filterSelector) {
    const ret = ReactiveCache.getCards(
      cardsInIntervalSelector(this._id, start, end, filterSelector),
    );
    return ret;
  },

  isTemplateBoard() {
    return this.type === 'template-board';
  },

  isTemplatesBoard() {
    return this.type === 'template-container';
  },

  // #5850: any template board (a single template board or the templates
  // container). On these, sharing is group-only (orgs/teams/domains); the
  // members tab shows only the original creator as an individual.
  isAnyTemplateBoard() {
    return this.type === 'template-board' || this.type === 'template-container';
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

  async setColor(color, customThemeColors) {
    // docs/Theme/Theme.md: flat/clear themes may carry custom colors; validate the
    // count + category here and store only when valid, else clear any previous set.
    const modifier = { $set: { color } };
    if (customThemeColors && isValidCustomColors(color, customThemeColors)) {
      modifier.$set.customThemeColors = customThemeColors;
    } else {
      modifier.$unset = { customThemeColors: '' };
    }
    return await Boards.updateAsync(this._id, modifier);
  },

  async setBackgroundImageURL(backgroundImageURL) {
    const currentUser = await ReactiveCache.getCurrentUser();
    if (currentUser.isBoardAdmin() || currentUser.isAdmin()) {
      return await Boards.updateAsync(this._id, { $set: { backgroundImageURL } });
    }
    return false;
  },

  // Set a board-level background attachment as the active board background.
  async setBackgroundImage(backgroundId) {
    const currentUser = await ReactiveCache.getCurrentUser();
    if (currentUser.isBoardAdmin() || currentUser.isAdmin()) {
      const backgroundImageURL = generateUniversalAttachmentUrl(backgroundId);
      return await Boards.updateAsync(this._id, {
        $set: { backgroundImageId: backgroundId, backgroundImageURL },
      });
    }
    return false;
  },

  async unsetBackgroundImage() {
    const currentUser = await ReactiveCache.getCurrentUser();
    if (currentUser.isBoardAdmin() || currentUser.isAdmin()) {
      return await Boards.updateAsync(this._id, {
        $set: { backgroundImageId: '', backgroundImageURL: '' },
      });
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
    // #5330: a member entry whose user account has been deleted still appears
    // in board.members but has no Users document. Such an orphaned entry can
    // never be a meaningful (active) admin and the deactivate-by-index flow
    // below would only leave it lingering, so hard-remove it by userId. This
    // works whether or not the user still exists since matching is by userId.
    if (memberIndex < 0 || !ReactiveCache.getUser(memberId)) {
      return await Boards.updateAsync(this._id, {
        $set: { members: pullMemberById(this.members, memberId) },
      });
    }

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

  async setAllowsDescriptionTextOnMinicard(allowsDescriptionTextOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsDescriptionTextOnMinicard } });
  },

  async setAllowsCoverAttachmentOnMinicard(allowsCoverAttachmentOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsCoverAttachmentOnMinicard } });
  },

  async setAllowsBadgeAttachmentOnMinicard(allowsBadgeAttachmentOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsBadgeAttachmentOnMinicard } });
  },

  async setAllowsCardSortingByNumberOnMinicard(allowsCardSortingByNumberOnMinicard) {
    return await Boards.updateAsync(this._id, { $set: { allowsCardSortingByNumberOnMinicard } });
  },

  // Backward-compatible aliases for legacy call sites.
  async setallowsDescriptionTextOnMinicard(allowsDescriptionTextOnMinicard) {
    return await this.setAllowsDescriptionTextOnMinicard(allowsDescriptionTextOnMinicard);
  },

  async setallowsCoverAttachmentOnMinicard(allowsCoverAttachmentOnMinicard) {
    return await this.setAllowsCoverAttachmentOnMinicard(allowsCoverAttachmentOnMinicard);
  },

  async setallowsBadgeAttachmentOnMinicard(allowsBadgeAttachmentOnMinicard) {
    return await this.setAllowsBadgeAttachmentOnMinicard(allowsBadgeAttachmentOnMinicard);
  },

  async setallowsCardSortingByNumberOnMinicard(allowsCardSortingByNumberOnMinicard) {
    return await this.setAllowsCardSortingByNumberOnMinicard(allowsCardSortingByNumberOnMinicard);
  },

  async setAllowsActivities(allowsActivities) {
    return await Boards.updateAsync(this._id, { $set: { allowsActivities } });
  },

  async setAllowsReceivedDate(allowsReceivedDate) {
    return await Boards.updateAsync(this._id, { $set: { allowsReceivedDate } });
  },

  getRestrictCommentEditing() {
    return !!this.restrictCommentEditing;
  },

  async setRestrictCommentEditing(restrictCommentEditing) {
    return await Boards.updateAsync(this._id, {
      $set: { restrictCommentEditing: !!restrictCommentEditing },
    });
  },

  getAllowsPersonalListWidth() {
    return !!this.allowsPersonalListWidth;
  },

  async setAllowsPersonalListWidth(allowsPersonalListWidth) {
    return await Boards.updateAsync(this._id, {
      $set: { allowsPersonalListWidth: !!allowsPersonalListWidth },
    });
  },

  getAutoWidth() {
    return !!this.autoWidth;
  },

  async setAutoWidth(autoWidth) {
    return await Boards.updateAsync(this._id, {
      $set: { autoWidth: !!autoWidth },
    });
  },

  async setAllowsCardCounterList(allowsCardCounterList) {
    return await Boards.updateAsync(this._id, { $set: { allowsCardCounterList } });
  },

  async setCardAging(cardAging) {
    return await Boards.updateAsync(this._id, { $set: { cardAging } });
  },

  async setShowDependencies(showDependencies) {
    return await Boards.updateAsync(this._id, { $set: { showDependencies } });
  },

  async setCardAgingDays(cardAgingDays1, cardAgingDays2, cardAgingDays3) {
    return await Boards.updateAsync(this._id, {
      $set: { cardAgingDays1, cardAgingDays2, cardAgingDays3 },
    });
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
    // #5582: never surface internal helper boards whose title is wrapped in
    // carets (e.g. `^Subtasks^`). Only set this when the caller did not already
    // constrain the title.
    if (selector.title === undefined) {
      selector.title = { $not: { $regex: /^\^.*\^$/ } };
    }
    selector.$or = [
      { permission: 'public' },
      { members: { $elemMatch: { userId, isActive: true } } },
      { orgs: { $elemMatch: { orgId: { $in: user.orgIds() }, isActive: true } } },
      { teams: { $elemMatch: { teamId: { $in: user.teamIds() }, isActive: true } } },
      // #5850: domain-based board sharing — board shared with the user's email domain.
      { domains: { $elemMatch: { domain: { $in: user.emailDomains() }, isActive: true } } },
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
