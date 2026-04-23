import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache, ReactiveMiniMongoIndex } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import {
  formatDateTime,
  formatDate,
  formatTime,
  getISOWeek,
  isValidDate,
  isBefore,
  isAfter,
  isSame,
  add,
  subtract,
  startOf,
  endOf,
  format,
  parseDate,
  now,
  createDate,
  fromNow,
  calendar
} from '/imports/lib/dateUtils';
import {
  TYPE_CARD,
  TYPE_LINKED_BOARD,
  TYPE_LINKED_CARD,
} from '../config/const';
import { CARD_COLORS } from '/models/metadata/colors';
import Attachments from "./attachments";
import PositionHistory from './positionHistory';
import Activities from '/models/activities';
import Boards from '/models/boards';
import CardComments from '/models/cardComments';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import Lists from '/models/lists';
import { debounce } from '/imports/lib/collectionHelpers';
const { SimpleSchema } = require('/imports/simpleSchema');

const Cards = new Mongo.Collection('cards');

// XXX To improve pub/sub performances a card document should include a
// de-normalized number of comments so we don't have to publish the whole list
// of comments just to display the number of them in the board view.
Cards.attachSchema(
  new SimpleSchema({
    title: {
      /**
       * the title of the card
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    archived: {
      /**
       * is the card archived
       */
      type: Boolean,
      // eslint-disable-next-line consistent-return
      autoValue() {
        // eslint-disable-line consistent-return
        if (this.isInsert && !this.isSet) {
          return false;
        }
      },
    },
    archivedAt: {
      /**
       * latest archiving date
       */
      type: Date,
      optional: true,
    },
    parentId: {
      /**
       * ID of the parent card
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    listId: {
      /**
       * List ID where the card is
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    swimlaneId: {
      /**
       * Swimlane ID where the card is
       */
      type: String,
    },
    // The system could work without this `boardId` information (we could deduce
    // the board identifier from the card), but it would make the system more
    // difficult to manage and less efficient.
    boardId: {
      /**
       * Board ID of the card
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    coverId: {
      /**
       * Cover ID of the card
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    color: {
      type: String,
      optional: true,
      allowedValues: CARD_COLORS,
    },
    createdAt: {
      /**
       * creation date
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
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    customFields: {
      /**
       * list of custom fields
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'customFields.$': {
      type: new SimpleSchema({
        _id: {
          /**
           * the ID of the related custom field
           */
          type: String,
          optional: true,
          defaultValue: '',
        },
        value: {
          /**
           * value attached to the custom field
           */
          type: Match.OneOf(String, Number, Boolean, Date, [String]),
          optional: true,
          defaultValue: '',
        },
        'value.$': {
          type: String,
          optional: true,
        },
      }),
    },
    dateLastActivity: {
      /**
       * Date of last activity
       */
      type: Date,
      autoValue() {
        return new Date();
      },
    },
    description: {
      /**
       * description of the card
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    requestedBy: {
      /**
       * who requested the card (ID of the user)
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    assignedBy: {
      /**
       * who assigned the card (ID of the user)
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    labelIds: {
      /**
       * list of labels ID the card has
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'labelIds.$': {
      type: String,
    },
    members: {
      /**
       * list of members (user IDs)
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'members.$': {
      type: String,
    },
    assignees: {
      /**
       * who is assignee of the card (user ID),
       * maximum one ID of assignee in array.
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'assignees.$': {
      type: String,
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
       * Date the card was started to be worked on
       */
      type: Date,
      optional: true,
    },
    dueAt: {
      /**
       * Date the card is due
       */
      type: Date,
      optional: true,
    },
    endAt: {
      /**
       * Date the card ended
       */
      type: Date,
      optional: true,
    },
    spentTime: {
      /**
       * How much time has been spent on this
       */
      type: Number,
      optional: true,
      defaultValue: 0,
    },
    isOvertime: {
      /**
       * is the card over time?
       */
      type: Boolean,
      defaultValue: false,
      optional: true,
    },
    // XXX Should probably be called `authorId`. Is it even needed since we have
    // the `members` field?
    userId: {
      /**
       * user ID of the author of the card
       */
      type: String,
      // eslint-disable-next-line consistent-return
      autoValue() {
        // eslint-disable-line consistent-return
        if (this.isInsert && !this.isSet) {
          return this.userId;
        }
      },
    },
    sort: {
      /**
       * Sort value
       */
      type: Number,
      defaultValue: 0,
      optional: true,
    },
    subtaskSort: {
      /**
       * subtask sort value
       */
      type: Number,
      defaultValue: -1,
      optional: true,
    },
    type: {
      /**
       * type of the card
       */
      type: String,
      defaultValue: TYPE_CARD,
      // allowedValues: [TYPE_CARD, TYPE_LINKED_CARD, TYPE_LINKED_BOARD, TYPE_TEMPLATE_CARD],
    },
    linkedId: {
      /**
       * ID of the linked card
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    vote: {
      /**
       * vote object, see below
       */
      type: Object,
      optional: true,
    },
    'vote.question': {
      type: String,
      defaultValue: '',
    },
    'vote.positive': {
      /**
       * list of members (user IDs)
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'vote.positive.$': {
      type: String,
    },
    'vote.negative': {
      /**
       * list of members (user IDs)
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'vote.negative.$': {
      type: String,
    },
    'vote.end': {
      type: Date,
      optional: true,
      defaultValue: null,
    },
    'vote.public': {
      type: Boolean,
      defaultValue: false,
    },
    'vote.allowNonBoardMembers': {
      type: Boolean,
      defaultValue: false,
    },
    poker: {
      /**
       * poker object, see below
       */
      type: Object,
      optional: true,
    },
    'poker.question': {
      type: Boolean,
      optional: true,
    },
    'poker.one': {
      /**
       * poker card one
       */
      type: Array,
      optional: true,
    },
    'poker.one.$': {
      type: String,
    },
    'poker.two': {
      /**
       * poker card two
       */
      type: Array,
      optional: true,
    },
    'poker.two.$': {
      type: String,
    },
    'poker.three': {
      /**
       * poker card three
       */
      type: Array,
      optional: true,
    },
    'poker.three.$': {
      type: String,
    },
    'poker.five': {
      /**
       * poker card five
       */
      type: Array,
      optional: true,
    },
    'poker.five.$': {
      type: String,
    },
    'poker.eight': {
      /**
       * poker card eight
       */
      type: Array,
      optional: true,
    },
    'poker.eight.$': {
      type: String,
    },
    'poker.thirteen': {
      /**
       * poker card thirteen
       */
      type: Array,
      optional: true,
    },
    'poker.thirteen.$': {
      type: String,
    },
    'poker.twenty': {
      /**
       * poker card twenty
       */
      type: Array,
      optional: true,
    },
    'poker.twenty.$': {
      type: String,
    },
    'poker.forty': {
      /**
       * poker card forty
       */
      type: Array,
      optional: true,
    },
    'poker.forty.$': {
      type: String,
    },
    'poker.oneHundred': {
      /**
       * poker card oneHundred
       */
      type: Array,
      optional: true,
    },
    'poker.oneHundred.$': {
      type: String,
    },
    'poker.unsure': {
      /**
       * poker card unsure
       */
      type: Array,
      optional: true,
    },
    'poker.unsure.$': {
      type: String,
    },
    'poker.end': {
      type: Date,
      optional: true,
    },
    'poker.allowNonBoardMembers': {
      type: Boolean,
      optional: true,
    },
    'poker.estimation': {
      /**
       * poker estimation value
       */
      type: Number,
      optional: true,
    },
    targetId_gantt: {
      /**
       * ID of card which is the child link in gantt view
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'targetId_gantt.$': {
      type: String,
    },
    linkType_gantt: {
      /**
       * ID of card which is the parent link in gantt view
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'linkType_gantt.$': {
      type: Number,
    },
    linkId_gantt: {
      /**
       * ID of card which is the parent link in gantt view
       */
      type: Array,
      optional: true,
      defaultValue: [],
    },
    'linkId_gantt.$': {
      type: String,
    },
    cardNumber: {
      /**
       * A boardwise sequentially increasing number that is assigned
       * to every newly created card
       */
      type: Number,
      optional: true,
      defaultValue: 0,
    },
    showActivities: {
      type: Boolean,
      defaultValue: false,
    },
    showListOnMinicard: {
      /**
       * show list name on minicard?
       */
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    showChecklistAtMinicard: {
      /**
       * show checklist on minicard?
       */
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    hideFinishedChecklistIfItemsAreHidden: {
      /**
       * hide completed checklist sections when checklist items are hidden?
       */
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
  }),
);

Cards.helpers({
  // Gantt https://github.com/wekan/wekan/issues/2870#issuecomment-857171127
  async setGanttTargetId(sourceId, targetId, linkType, linkId){
    return await Cards.updateAsync({ _id: sourceId}, {
      $push: {
        targetId_gantt: targetId,
        linkType_gantt : linkType,
        linkId_gantt: linkId
      }
    });
  },

  async removeGanttTargetId(sourceId, targetId, linkType, linkId){
    return await Cards.updateAsync({ _id: sourceId}, {
      $pull: {
        targetId_gantt: targetId,
        linkType_gantt : linkType,
        linkId_gantt: linkId
      }
    });
  },

  mapCustomFieldsToBoard(boardId) {
    // Guard against undefined/null customFields
    if (!this.customFields || !Array.isArray(this.customFields)) {
      return [];
    }
    // Map custom fields to new board
    const result = [];
    for (const cf of this.customFields) {
        const oldCf = ReactiveCache.getCustomField(cf._id);

        // Check if oldCf is undefined or null
        if (!oldCf) {
            //console.error(`Custom field with ID ${cf._id} not found.`);
            result.push(cf);  // Skip this field if oldCf is not found
            continue;
        }

        const newCf = ReactiveCache.getCustomField({
            boardIds: boardId,
            name: oldCf.name,
            type: oldCf.type,
        });

        if (newCf) {
            cf._id = newCf._id;
        } else if (!(oldCf.boardIds || []).includes(boardId)) {
            oldCf.addBoard(boardId);
        }

        result.push(cf);
    }
    return result;
},


  async copy(boardId, swimlaneId, listId) {
    const oldId = this._id;
    const oldCard = await ReactiveCache.getCard(oldId);

    // Work on a shallow copy to avoid mutating the source card in ReactiveCache
    const cardData = { ...this };
    delete cardData._id;

    // Normalize customFields to ensure it's always an array
    if (!Array.isArray(cardData.customFields)) {
      cardData.customFields = [];
    }

    // we must only copy the labels and custom fields if the target board
    // differs from the source board
    if (this.boardId !== boardId) {
      const oldBoard = await ReactiveCache.getBoard(this.boardId);
      const oldBoardLabels = oldBoard.labels;

      // Get old label names
      const oldCardLabels = oldBoardLabels.filter(label => {
          return (this.labelIds || []).includes(label._id);
        }).map(x => x.name);

      const newBoard = await ReactiveCache.getBoard(boardId);
      const newBoardLabels = newBoard.labels;
      const newCardLabels = newBoardLabels.filter(label => {
          return oldCardLabels.includes(label.name);
        }).map(x => x._id);
      cardData.labelIds = newCardLabels;

      this.customFields = this.mapCustomFieldsToBoard(newBoard._id);
    }

    delete this._id;
    this.boardId = boardId;
    const board = await ReactiveCache.getBoard(boardId);
    this.cardNumber = await board.getNextCardNumber();
    this.swimlaneId = swimlaneId;
    this.listId = listId;
    const _id = await Cards.insertAsync(this);

    // Copy attachments (server-only — requires filesystem access)
    if (Meteor.isServer) {
      const { copyFile } = require('./lib/fileStoreStrategy.js');
      const { fileStoreStrategyFactory } = require('./attachments.server');
      const attachmentList = await ReactiveCache.getAttachments({ 'meta.cardId': oldId });
      for (const att of attachmentList) {
        copyFile(att, _id, fileStoreStrategyFactory);
      }
    }

    // copy checklists
    const checklists = await ReactiveCache.getChecklists({ cardId: oldId });
    for (const ch of checklists) {
      await ch.copy(_id);
    }

    // copy subtasks
    const subtasks = await ReactiveCache.getCards({ parentId: oldId });
    for (const subtask of subtasks) {
      subtask.parentId = _id;
      subtask._id = null;
      await Cards.insertAsync(subtask);
    }

    // copy card comments
    const comments = await ReactiveCache.getCardComments({ cardId: oldId });
    for (const cmt of comments) {
      await cmt.copy(_id);
    }
    // restore the id, otherwise new copies will fail
    this._id = oldId;

    return _id;
  },

  async link(boardId, swimlaneId, listId) {
    // TODO is there a better method to create a deepcopy?
    linkCard = JSON.parse(JSON.stringify(this));
    // TODO is this how it is meant to be?
    linkCard.linkedId = linkCard.linkedId || linkCard._id;
    linkCard.boardId = boardId;
    linkCard.swimlaneId = swimlaneId;
    linkCard.listId = listId;
    linkCard.type = 'cardType-linkedCard';
    delete linkCard._id;
    // TODO shall we copy the labels for a linked card?!
    delete linkCard.labelIds;
    return await Cards.insertAsync(linkCard);
  },

  list() {
    return ReactiveCache.getList(this.listId);
  },

  swimlane() {
    return ReactiveCache.getSwimlane(this.swimlaneId);
  },

  board() {
    const ret = ReactiveCache.getBoard(this.boardId);
    return ret;
  },

  getRealId() {
    if (!this.__id) {
      if (this.isLinkedCard()) {
        this.__id = this.linkedId;
      } else {
        this.__id = this._id;
      }
    }
    return this.__id;
  },

  getList() {
    const list = this.list();
    if (!list) {
      return {
        _id: this.listId,
        title: 'Undefined List',
        archived: false,
        colorClass: '',
      };
    }
    return list;
  },

  getSwimlane() {
    const swimlane = this.swimlane();
    if (!swimlane) {
      return {
        _id: this.swimlaneId,
        title: 'Undefined Swimlane',
        archived: false,
        colorClass: '',
      };
    }
    return swimlane;
  },

  getBoard() {
    const board = this.board();
    if (!board) {
      return {
        _id: this.boardId,
        title: 'Undefined Board',
        archived: false,
        colorClass: '',
      };
    }
    return board;
  },

  labels() {
    const boardLabels = this.board().labels;
    const cardLabels = (boardLabels || []).filter(label => {
      return (this.labelIds || []).includes(label._id);
    });
    return cardLabels;
  },

  hasLabel(labelId) {
    return (this.labelIds || []).includes(labelId);
  },

  /** returns the sort number of a list
   * @param listId a list id
   * @param swimlaneId a swimlane id
   * top sorting of the card at the top if true, or from the bottom if false
   */
  async getSort(listId, swimlaneId, top) {
    if (typeof top !== 'boolean') {
      top = true;
    }
    if (!listId) {
      listId = this.listId;
    }
    if (!swimlaneId) {
      swimlaneId = this.swimlaneId;
    }
    const selector = {
      listId: listId,
      swimlaneId: swimlaneId,
      archived: false,
    };
    const sorting = top ? 1 : -1;
    const card = await ReactiveCache.getCard(selector, { sort: { sort: sorting } }, true);
    let ret = null
    if (card) {
      ret = card.sort;
    }
    return ret;
  },

  /** returns the sort number of a list from the card at the top
   * @param listId a list id
   * @param swimlaneId a swimlane id
   */
  async getMinSort(listId, swimlaneId) {
    const ret = await this.getSort(listId, swimlaneId, true);
    return ret;
  },

  /** returns the sort number of a list from the card at the bottom
   * @param listId a list id
   * @param swimlaneId a swimlane id
   */
  async getMaxSort(listId, swimlaneId) {
    const ret = await this.getSort(listId, swimlaneId, false);
    return ret;
  },

  user() {
    return ReactiveCache.getUser(this.userId);
  },

  isAssigned(memberId) {
    return (this.getMembers() || []).includes(memberId);
  },

  isAssignee(assigneeId) {
    return (this.getAssignees() || []).includes(assigneeId);
  },

  activities() {
    let ret;
    if (this.isLinkedBoard()) {
      ret = ReactiveCache.getActivities(
        { boardId: this.linkedId },
        { sort: { createdAt: -1 } },
      );
    } else {
      ret = ReactiveCache.getActivities({ cardId: this.getRealId() }, { sort: { createdAt: -1 } });
    }
    return ret;
  },

  comments() {
    let ret
    if (this.isLinkedBoard()) {
      ret = ReactiveCache.getCardComments(
        { boardId: this.linkedId },
        { sort: { createdAt: -1 } },
      );
    } else {
      ret = ReactiveMiniMongoIndex.getCardCommentsWithCardId(
        this.getRealId(),
        {},
        { sort: { createdAt: -1 } },
      );
    }
    return ret;
  },

  attachments() {
    const ret = ReactiveCache.getAttachments(
      { 'meta.cardId': this.getRealId() },
      { sort: { uploadedAt: -1 } },
      true,
    ).each();
    return ret;
  },

  cover() {
    if (!this.coverId) return false;
    const cover = ReactiveCache.getAttachment(this.coverId);
    // if we return a cover before it is fully stored, we will get errors when we try to display it
    // todo XXX we could return a default "upload pending" image in the meantime?
    return cover && cover.link() && cover;
  },

  checklists() {
    const ret = ReactiveMiniMongoIndex.getChecklistsWithCardId(this.getRealId(), {}, { sort: { sort: 1 } });
    return ret;
  },

  firstChecklist() {
    const checklists = this.checklists();
    const ret = checklists[0];
    return ret;
  },

  lastChecklist() {
    const checklists = this.checklists();
    const ret = checklists.at(-1);
    return ret;
  },

  checklistItemCount() {
    const checklists = this.checklists();
    const ret = checklists
      .map(checklist => {
        return checklist.itemCount();
      })
      .reduce((prev, next) => {
        return prev + next;
      }, 0);
    return ret;
  },

  checklistFinishedCount() {
    const checklists = this.checklists();
    const ret = checklists
      .map(checklist => {
        return checklist.finishedCount();
      })
      .reduce((prev, next) => {
        return prev + next;
      }, 0);
    return ret;
  },

  checklistFinished() {
    return (
      this.hasChecklist() &&
      this.checklistItemCount() === this.checklistFinishedCount()
    );
  },

  hasChecklist() {
    return this.checklistItemCount() !== 0;
  },

  subtasks() {
    const ret = ReactiveMiniMongoIndex.getSubTasksWithParentId(this._id, {
        archived: false,
      }, {
        sort: {
          sort: 1,
        },
      },
    );
    return ret;
  },

  subtasksFinished() {
    const ret = ReactiveMiniMongoIndex.getSubTasksWithParentId(this._id, {
      archived: true,
    });
    return ret;
  },

  allSubtasks() {
    const ret = ReactiveMiniMongoIndex.getSubTasksWithParentId(this._id);
    return ret;
  },

  subtasksCount() {
    const subtasks = this.subtasks();
    return subtasks.length;
  },

  subtasksFinishedCount() {
    const subtasksArchived = this.subtasksFinished();
    return subtasksArchived.length;
  },

  allSubtasksCount() {
    const allSubtasks = this.allSubtasks();
    return allSubtasks.length;
  },

  allowsSubtasks() {
    return this.subtasksCount() !== 0;
  },

  customFieldIndex(customFieldId) {
    return (this.customFields || []).map(x => x._id).indexOf(customFieldId);
  },

  // customFields with definitions
  customFieldsWD() {
    // get all definitions
    const definitions = ReactiveCache.getCustomFields({
      boardIds: { $in: [this.boardId] },
    });
    if (!definitions) {
      return {};
    }
    // match right definition to each field
    if (!this.customFields) return [];
    const ret = this.customFields.map(customField => {
      const definition = definitions.find(definition => {
        return definition._id === customField._id;
      });
      if (!definition) {
        return {};
      }
      //search for "True Value" which is for DropDowns other then the Value (which is the id)
      let trueValue = customField.value;
      if (
        definition.settings.dropdownItems &&
        definition.settings.dropdownItems.length > 0
      ) {
        for (let i = 0; i < definition.settings.dropdownItems.length; i++) {
          if (definition.settings.dropdownItems[i]._id === customField.value) {
            trueValue = definition.settings.dropdownItems[i].name;
          }
        }
      }
      return {
        _id: customField._id,
        value: customField.value,
        trueValue,
        definition,
      };
    });
    // at linked cards custom fields definition is not found
    ret.sort(
      (a, b) =>
        a.definition !== undefined &&
        b.definition !== undefined &&
        a.definition.name !== undefined &&
        b.definition.name !== undefined &&
        a.definition.name.localeCompare(b.definition.name),
    );
    return ret;
  },

  colorClass() {
    if (this.color) return this.color;
    return '';
  },

  absoluteUrl() {
    const board = this.board();
    if (!board) return undefined;
    return FlowRouter.url('card', {
      boardId: board._id,
      slug: board.slug || 'board',
      cardId: this._id,
      swimlaneId: this.swimlaneId,
      listId: this.listId,
    });
  },
  originRelativeUrl() {
    const board = this.board();
    if (!board) return undefined;
    return FlowRouter.path('card', {
      boardId: board._id,
      slug: board.slug || 'board',
      cardId: this._id,
      swimlaneId: this.swimlaneId,
      listId: this.listId,
    });
  },

  canBeRestored() {
    const list = ReactiveCache.getList(this.listId);
    if (
      !list.getWipLimit('soft') &&
      list.getWipLimit('enabled') &&
      list.getWipLimit('value') === list.cards().length
    ) {
      return false;
    }
    return true;
  },

  parentCard() {
    let ret = null;
    if (this.parentId) {
      ret = ReactiveCache.getCard(this.parentId);
    }
    return ret;
  },

  parentCardName() {
    let result = '';
    if (this.parentId) {
      const card = ReactiveCache.getCard(this.parentId);
      if (card) {
        result = card.title;
      }
    }
    return result;
  },

  parentListId() {
    const result = [];
    let crtParentId = this.parentId;
    while (crtParentId) {
      const crt = ReactiveCache.getCard(crtParentId);
      if (crt === null || crt === undefined) {
        // maybe it has been deleted
        break;
      }
      if (crtParentId in result) {
        // circular reference
        break;
      }
      result.unshift(crtParentId);
      crtParentId = crt.parentId;
    }
    return result;
  },

  parentList() {
    const resultId = [];
    const result = [];
    let crtParentId = this.parentId;
    while (crtParentId) {
      const crt = ReactiveCache.getCard(crtParentId);
      if (crt === null || crt === undefined) {
        // maybe it has been deleted
        break;
      }
      if (crtParentId in resultId) {
        // circular reference
        break;
      }
      resultId.unshift(crtParentId);
      result.unshift(crt);
      crtParentId = crt.parentId;
    }
    return result;
  },

  parentString(sep) {
    return (this.parentList())
      .map(function(elem) {
        return elem.title;
      })
      .join(sep);
  },

  isTopLevel() {
    let ret = false;
    if (this.parentId) {
      ret = true;
    }
    return ret;
  },

  isLinkedCard() {
    return this.type === 'cardType-linkedCard';
  },

  isLinkedBoard() {
    return this.type === 'cardType-linkedBoard';
  },

  isLinked() {
    return this.isLinkedCard() || this.isLinkedBoard();
  },

  setDescription(description) {
    if (this.isLinkedBoard()) {
      return Boards.updateAsync({ _id: this.linkedId }, { $set: { description } });
    } else {
      return Cards.updateAsync({ _id: this.getRealId() }, { $set: { description } });
    }
  },

  getDescription() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card && card.description) return card.description;
      else return null;
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board && board.description) return board.description;
      else return null;
    } else if (this.description) {
      return this.description;
    } else {
      return null;
    }
  },

  getMembers() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.members;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.activeMembers().map(member => {
          return member.userId;
        });
      }
    } else {
      return this.members;
    }
  },

  getAssignees() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.assignees;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.activeMembers().map(assignee => {
          return assignee.userId;
        });
      }
    } else {
      return this.assignees;
    }
  },

  assignMember(memberId) {
    let ret;
    if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      ret = board.addMember(memberId);
    } else {
      ret = Cards.updateAsync(
        { _id: this.getRealId() },
        { $addToSet: { members: memberId } },
      );
    }
    return ret;
  },

  assignAssignee(assigneeId) {
    if (this.isLinkedCard()) {
      return Cards.updateAsync(
        { _id: this.linkedId },
        { $addToSet: { assignees: assigneeId } },
      );
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      return board.addAssignee(assigneeId);
    } else {
      return Cards.updateAsync(
        { _id: this._id },
        { $addToSet: { assignees: assigneeId } },
      );
    }
  },

  unassignMember(memberId) {
    if (this.isLinkedCard()) {
      return Cards.updateAsync(
        { _id: this.linkedId },
        { $pull: { members: memberId } },
      );
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      return board.removeMember(memberId);
    } else {
      return Cards.updateAsync({ _id: this._id }, { $pull: { members: memberId } });
    }
  },

  unassignAssignee(assigneeId) {
    if (this.isLinkedCard()) {
      return Cards.updateAsync(
        { _id: this.linkedId },
        { $pull: { assignees: assigneeId } },
      );
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      return board.removeAssignee(assigneeId);
    } else {
      return Cards.updateAsync(
        { _id: this._id },
        { $pull: { assignees: assigneeId } },
      );
    }
  },

  toggleMember(memberId) {
    const members = this.getMembers();
    if (members && members.indexOf(memberId) > -1) {
      return this.unassignMember(memberId);
    } else {
      return this.assignMember(memberId);
    }
  },

  toggleAssignee(assigneeId) {
    const assignees = this.getAssignees();
    if (assignees && assignees.indexOf(assigneeId) > -1) {
      return this.unassignAssignee(assigneeId);
    } else {
      return this.assignAssignee(assigneeId);
    }
  },

  getReceived() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.receivedAt;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.receivedAt;
      }
    } else {
      return this.receivedAt;
    }
  },

  setReceived(receivedAt) {
    if (this.isLinkedBoard()) {
      return Boards.updateAsync({ _id: this.linkedId }, { $set: { receivedAt } });
    } else {
      return Cards.updateAsync({ _id: this.getRealId() }, { $set: { receivedAt } });
    }
  },

  getStart() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.startAt;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.startAt;
      }
    } else {
      return this.startAt;
    }
  },

  setStart(startAt) {
    if (this.isLinkedBoard()) {
      return Boards.updateAsync({ _id: this.linkedId }, { $set: { startAt } });
    } else {
      return Cards.updateAsync({ _id: this.getRealId() }, { $set: { startAt } });
    }
  },

  getDue() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.dueAt;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.dueAt;
      }
    } else {
      return this.dueAt;
    }
  },

  setDue(dueAt) {
    if (this.isLinkedBoard()) {
      return Boards.updateAsync({ _id: this.linkedId }, { $set: { dueAt } });
    } else {
      return Cards.updateAsync({ _id: this.getRealId() }, { $set: { dueAt } });
    }
  },

  getEnd() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.endAt;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.endAt;
      }
    } else {
      return this.endAt;
    }
  },

  setEnd(endAt) {
    if (this.isLinkedBoard()) {
      return Boards.updateAsync({ _id: this.linkedId }, { $set: { endAt } });
    } else {
      return Cards.updateAsync({ _id: this.getRealId() }, { $set: { endAt } });
    }
  },

  getIsOvertime() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.isOvertime;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.isOvertime;
      }
    } else {
      return this.isOvertime;
    }
  },

  setIsOvertime(isOvertime) {
    if (this.isLinkedBoard()) {
      return Boards.updateAsync({ _id: this.linkedId }, { $set: { isOvertime } });
    } else {
      return Cards.updateAsync({ _id: this.getRealId() }, { $set: { isOvertime } });
    }
  },

  getSpentTime() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.spentTime;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.spentTime;
      }
    } else {
      return this.spentTime;
    }
  },

  setSpentTime(spentTime) {
    if (this.isLinkedBoard()) {
      return Boards.updateAsync({ _id: this.linkedId }, { $set: { spentTime } });
    } else {
      return Cards.updateAsync({ _id: this.getRealId() }, { $set: { spentTime } });
    }
  },

  getVoteQuestion() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else if (card && card.vote) {
        return card.vote.question;
      } else {
        return null;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else if (board && board.vote) {
        return board.vote.question;
      } else {
        return null;
      }
    } else if (this.vote) {
      return this.vote.question;
    } else {
      return null;
    }
  },

  getVotePublic() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else if (card && card.vote) {
        return card.vote.public;
      } else {
        return null;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else if (board && board.vote) {
        return board.vote.public;
      } else {
        return null;
      }
    } else if (this.vote) {
      return this.vote.public;
    } else {
      return null;
    }
  },

  getVoteEnd() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else if (card && card.vote) {
        return card.vote.end;
      } else {
        return null;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else if (board && board.vote) {
        return board.vote.end;
      } else {
        return null;
      }
    } else if (this.vote) {
      return this.vote.end;
    } else {
      return null;
    }
  },
  expiredVote() {
    let end = this.getVoteEnd();
    if (end) {
      end = new Date(end);
      return isBefore(end, new Date());
    }
    return false;
  },
  voteMemberPositive() {
    if (this.vote && this.vote.positive)
      return ReactiveCache.getUsers({ _id: { $in: this.vote.positive } });
    return [];
  },

  voteMemberNegative() {
    if (this.vote && this.vote.negative)
      return ReactiveCache.getUsers({ _id: { $in: this.vote.negative } });
    return [];
  },
  voteState() {
    const userId = Meteor.userId();
    let state;
    if (this.vote) {
      if (this.vote.positive) {
        state = this.vote.positive.includes(userId);
        if (state === true) return true;
      }
      if (this.vote.negative) {
        state = this.vote.negative.includes(userId);
        if (state === true) return false;
      }
    }
    return null;
  },

  getPokerQuestion() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else if (card && card.poker) {
        return card.poker.question;
      } else {
        return null;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else if (board && board.poker) {
        return board.poker.question;
      } else {
        return null;
      }
    } else if (this.poker) {
      return this.poker.question;
    } else {
      return null;
    }
  },

  getPokerEstimation() {
    if (this.poker) {
      return this.poker.estimation;
    } else {
      return null;
    }
  },

  getPokerEnd() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else if (card && card.poker) {
        return card.poker.end;
      } else {
        return null;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else if (board && board.poker) {
        return board.poker.end;
      } else {
        return null;
      }
    } else if (this.poker) {
      return this.poker.end;
    } else {
      return null;
    }
  },
  expiredPoker() {
    let end = this.getPokerEnd();
    if (end) {
      end = new Date(end);
      return isBefore(end, new Date());
    }
    return false;
  },
  pokerMemberOne() {
    if (this.poker && this.poker.one)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.one } });
    return [];
  },
  pokerMemberTwo() {
    if (this.poker && this.poker.two)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.two } });
    return [];
  },
  pokerMemberThree() {
    if (this.poker && this.poker.three)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.three } });
    return [];
  },
  pokerMemberFive() {
    if (this.poker && this.poker.five)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.five } });
    return [];
  },
  pokerMemberEight() {
    if (this.poker && this.poker.eight)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.eight } });
    return [];
  },
  pokerMemberThirteen() {
    if (this.poker && this.poker.thirteen)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.thirteen } });
    return [];
  },
  pokerMemberTwenty() {
    if (this.poker && this.poker.twenty)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.twenty } });
    return [];
  },
  pokerMemberForty() {
    if (this.poker && this.poker.forty)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.forty } });
    return [];
  },
  pokerMemberOneHundred() {
    if (this.poker && this.poker.oneHundred)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.oneHundred } });
    return [];
  },
  pokerMemberUnsure() {
    if (this.poker && this.poker.unsure)
      return ReactiveCache.getUsers({ _id: { $in: this.poker.unsure } });
    return [];
  },
  pokerState() {
    const userId = Meteor.userId();
    let state;
    if (this.poker) {
      if (this.poker.one) {
        state = this.poker.one.includes(userId);
        if (state === true) {
          return 'one';
        }
      }
      if (this.poker.two) {
        state = this.poker.two.includes(userId);
        if (state === true) {
          return 'two';
        }
      }
      if (this.poker.three) {
        state = this.poker.three.includes(userId);
        if (state === true) {
          return 'three';
        }
      }
      if (this.poker.five) {
        state = this.poker.five.includes(userId);
        if (state === true) {
          return 'five';
        }
      }
      if (this.poker.eight) {
        state = this.poker.eight.includes(userId);
        if (state === true) {
          return 'eight';
        }
      }
      if (this.poker.thirteen) {
        state = this.poker.thirteen.includes(userId);
        if (state === true) {
          return 'thirteen';
        }
      }
      if (this.poker.twenty) {
        state = this.poker.twenty.includes(userId);
        if (state === true) {
          return 'twenty';
        }
      }
      if (this.poker.forty) {
        state = this.poker.forty.includes(userId);
        if (state === true) {
          return 'forty';
        }
      }
      if (this.poker.oneHundred) {
        state = this.poker.oneHundred.includes(userId);
        if (state === true) {
          return 'oneHundred';
        }
      }
      if (this.poker.unsure) {
        state = this.poker.unsure.includes(userId);
        if (state === true) {
          return 'unsure';
        }
      }
    }
    return null;
  },

  getTitle() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.title;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.title;
      }
    } else if (this.title === undefined) {
      return null;
    } else {
      return this.title;
    }
  },

  getCardNumber() {
    return this.cardNumber;
  },

  getBoardTitle() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      }
      const board = ReactiveCache.getBoard(card.boardId);
      if (board === undefined) {
        return null;
      } else {
        return board.title;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.title;
      }
    } else {
      const board = ReactiveCache.getBoard(this.boardId);
      if (board === undefined) {
        return null;
      } else {
        return board.title;
      }
    }
  },

  setTitle(title) {
    // Basic client-side validation - server will handle full sanitization
    let sanitizedTitle = title;
    if (typeof title === 'string') {
      // Basic length check to prevent abuse
      sanitizedTitle = title.length > 1000 ? title.substring(0, 1000) : title;
      if (process.env.DEBUG === 'true' && sanitizedTitle !== title) {
        console.warn('Client-side sanitized card title:', title, '->', sanitizedTitle);
      }
    }

    if (this.isLinkedBoard()) {
      return Boards.updateAsync({ _id: this.linkedId }, { $set: { title: sanitizedTitle } });
    } else {
      return Cards.updateAsync({ _id: this.getRealId() }, { $set: { title: sanitizedTitle } });
    }
  },

  getArchived() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.archived;
      }
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      if (board === undefined) {
        return null;
      } else {
        return board.archived;
      }
    } else {
      return this.archived;
    }
  },

  setRequestedBy(requestedBy) {
    return Cards.updateAsync({ _id: this.getRealId() }, { $set: { requestedBy } });
  },

  getRequestedBy() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.requestedBy;
      }
    } else {
      return this.requestedBy;
    }
  },

  setAssignedBy(assignedBy) {
    return Cards.updateAsync({ _id: this.getRealId() }, { $set: { assignedBy } });
  },

  getAssignedBy() {
    if (this.isLinkedCard()) {
      const card = ReactiveCache.getCard(this.linkedId);
      if (card === undefined) {
        return null;
      } else {
        return card.assignedBy;
      }
    } else {
      return this.assignedBy;
    }
  },

  isTemplateCard() {
    return this.type === 'template-card';
  },

  votePublic() {
    if (this.vote) return this.vote.public;
    return null;
  },
  voteAllowNonBoardMembers() {
    if (this.vote) return this.vote.allowNonBoardMembers;
    return null;
  },
  voteCountNegative() {
    if (this.vote && this.vote.negative) return this.vote.negative.length;
    return null;
  },
  voteCountPositive() {
    if (this.vote && this.vote.positive) return this.vote.positive.length;
    return null;
  },
  voteCount() {
    return this.voteCountPositive() + this.voteCountNegative();
  },

  pokerAllowNonBoardMembers() {
    if (this.poker) return this.poker.allowNonBoardMembers;
    return null;
  },
  pokerCountOne() {
    if (this.poker && this.poker.one) return this.poker.one.length;
    return null;
  },
  pokerCountTwo() {
    if (this.poker && this.poker.two) return this.poker.two.length;
    return null;
  },
  pokerCountThree() {
    if (this.poker && this.poker.three) return this.poker.three.length;
    return null;
  },
  pokerCountFive() {
    if (this.poker && this.poker.five) return this.poker.five.length;
    return null;
  },
  pokerCountEight() {
    if (this.poker && this.poker.eight) return this.poker.eight.length;
    return null;
  },
  pokerCountThirteen() {
    if (this.poker && this.poker.thirteen) return this.poker.thirteen.length;
    return null;
  },
  pokerCountTwenty() {
    if (this.poker && this.poker.twenty) return this.poker.twenty.length;
    return null;
  },
  pokerCountForty() {
    if (this.poker && this.poker.forty) return this.poker.forty.length;
    return null;
  },
  pokerCountOneHundred() {
    if (this.poker && this.poker.oneHundred) return this.poker.oneHundred.length;
    return null;
  },
  pokerCountUnsure() {
    if (this.poker && this.poker.unsure) return this.poker.unsure.length;
    return null;
  },
  pokerCount() {
    return (
      this.pokerCountOne() +
      this.pokerCountTwo() +
      this.pokerCountThree() +
      this.pokerCountFive() +
      this.pokerCountEight() +
      this.pokerCountThirteen() +
      this.pokerCountTwenty() +
      this.pokerCountForty() +
      this.pokerCountOneHundred() +
      this.pokerCountUnsure()
    );
  },
  pokerWinner() {
    const pokerListMaps = [];
    let pokerWinnersListMap = [];
    if (this.expiredPoker()) {
      const one = { count: this.pokerCountOne(), pokerCard: 1 };
      const two = { count: this.pokerCountTwo(), pokerCard: 2 };
      const three = { count: this.pokerCountThree(), pokerCard: 3 };
      const five = { count: this.pokerCountFive(), pokerCard: 5 };
      const eight = { count: this.pokerCountEight(), pokerCard: 8 };
      const thirteen = { count: this.pokerCountThirteen(), pokerCard: 13 };
      const twenty = { count: this.pokerCountTwenty(), pokerCard: 20 };
      const forty = { count: this.pokerCountForty(), pokerCard: 40 };
      const oneHundred = { count: this.pokerCountOneHundred(), pokerCard: 100 };
      const unsure = { count: this.pokerCountUnsure(), pokerCard: 'Unsure' };
      pokerListMaps.push(one);
      pokerListMaps.push(two);
      pokerListMaps.push(three);
      pokerListMaps.push(five);
      pokerListMaps.push(eight);
      pokerListMaps.push(thirteen);
      pokerListMaps.push(twenty);
      pokerListMaps.push(forty);
      pokerListMaps.push(oneHundred);
      pokerListMaps.push(unsure);

      pokerListMaps.sort(function(a, b) {
        return b.count - a.count;
      });
      const max = pokerListMaps[0].count;
      pokerWinnersListMap = pokerListMaps.filter(task => task.count >= max);
      pokerWinnersListMap.sort(function(a, b) {
        return b.pokerCard - a.pokerCard;
      });
    }
    return pokerWinnersListMap[0].pokerCard;
  },

  async applyToChildren(funct) {
    const cards = await ReactiveCache.getCards({ parentId: this._id });
    if (!cards) return;
    for (const card of cards) {
      await funct(card);
    }
  },

  async archive() {
    await this.applyToChildren(async card => {
      await card.archive();
    });
    return Cards.updateAsync(this._id, {
      $set: { archived: true, archivedAt: new Date() },
    });
  },

  async restore() {
    await this.applyToChildren(async card => {
      await card.restore();
    });
    return Cards.updateAsync(this._id, {
      $set: { archived: false },
    });
  },

  moveToEndOfList({ listId, swimlaneId } = {}) {
    swimlaneId = swimlaneId || this.swimlaneId;
    const boardId = this.boardId;
    let sortIndex = 0;

    if (!swimlaneId) {
      const board = ReactiveCache.getBoard(boardId);
      swimlaneId = board.getDefaultSwimline()._id;
    }
    let parentElementDom = $(`#swimlane-${swimlaneId}`).get(0);
    if (!parentElementDom) parentElementDom = $(':root');

    const lastCardDom = $(parentElementDom)
      .find(`#js-list-${listId} .js-minicard:last`)
      .get(0);
    if (lastCardDom) sortIndex = Utils.calculateIndex(lastCardDom, null).base;

    return this.moveOptionalArgs({
      boardId,
      swimlaneId,
      listId,
      sort: sortIndex,
    });
  },

  moveOptionalArgs({ boardId, swimlaneId, listId, sort } = {}) {
    boardId = boardId || this.boardId;
    swimlaneId = swimlaneId || this.swimlaneId;
    if (!swimlaneId) {
      const board = ReactiveCache.getBoard(boardId);
      swimlaneId = board.getDefaultSwimline()._id;
    }
    listId = listId || this.listId;
    if (sort === undefined || sort === null) sort = this.sort;
    return this.move(boardId, swimlaneId, listId, sort);
  },

  async move(boardId, swimlaneId, listId, sort = null) {
    const previousState = {
      boardId: this.boardId,
      swimlaneId: this.swimlaneId,
      listId: this.listId,
      sort: this.sort,
    };

    const mutatedFields = { boardId, swimlaneId, listId };

    if (sort !== null) {
      mutatedFields.sort = sort;
    }

    if (this.boardId !== boardId) {
      const oldBoard = ReactiveCache.getBoard(this.boardId);
      const oldBoardLabels = Array.isArray(oldBoard?.labels) ? oldBoard.labels : [];
      const oldCardLabels = oldBoardLabels.filter(label => {
          return (this.labelIds || []).includes(label._id);
        }).map(x => x.name);

      const newBoard = ReactiveCache.getBoard(boardId);
      if (!newBoard) {
        throw new Meteor.Error('board-not-found', 'Destination board not found while moving card.');
      }
      const allowedMemberIds = (newBoard.members || []).filter(member => member.isActive === true).map(x => x.userId);
      const newBoardLabels = Array.isArray(newBoard.labels) ? newBoard.labels : [];
      const newCardLabelIds = newBoardLabels.filter(label => {
          return label.name && oldCardLabels.includes(label.name);
        }).map(x => x._id);

      const newCardNumber = await newBoard.getNextCardNumber();

      Object.assign(mutatedFields, {
        labelIds: newCardLabelIds,
        cardNumber: newCardNumber
      });

      mutatedFields.customFields = this.mapCustomFieldsToBoard(newBoard._id);

      // Ensure customFields is always an array (guards against legacy {} data)
      if (!Array.isArray(mutatedFields.customFields)) {
        mutatedFields.customFields = [];
      }

      const currentMembers = Array.isArray(this.members) ? this.members : [];
      const filteredMembers = currentMembers.filter(memberId => allowedMemberIds.includes(memberId));
      if (currentMembers.filter(x => !filteredMembers.includes(x)).length > 0) {
        mutatedFields.members = filteredMembers;
      }

      const currentWatchers = Array.isArray(this.watchers) ? this.watchers : [];
      const filteredWatchers = currentWatchers.filter(watcherId => allowedMemberIds.includes(watcherId));
      if (currentWatchers.filter(x => !filteredWatchers.includes(x)).length > 0) {
        mutatedFields.watchers = filteredWatchers;
      }
    }

    Cards.updateAsync(this._id, { $set: mutatedFields });

    if (Meteor.isServer && Meteor.userId() && typeof UserPositionHistory !== 'undefined') {
      try {
        UserPositionHistory.trackChange({
          userId: Meteor.userId(),
          boardId: this.boardId,
          entityType: 'card',
          entityId: this._id,
          actionType: 'move',
          previousState,
          newState: {
            boardId,
            swimlaneId,
            listId,
            sort: sort !== null ? sort : this.sort,
          },
        });
      } catch (e) {
        console.warn('Failed to track card move in history:', e);
      }
    }

    if (Meteor.isServer) {
      const updateMeta = {};
      if (mutatedFields.boardId !== undefined) updateMeta['meta.boardId'] = mutatedFields.boardId;
      if (mutatedFields.listId !== undefined) updateMeta['meta.listId'] = mutatedFields.listId;
      if (mutatedFields.swimlaneId !== undefined) updateMeta['meta.swimlaneId'] = mutatedFields.swimlaneId;

      if (Object.keys(updateMeta).length > 0) {
        try {
          Attachments.collection.updateAsync(
            { 'meta.cardId': this._id },
            { $set: updateMeta },
            { multi: true },
          );
        } catch (err) {
          console.error('Failed to update attachments metadata after moving card', this._id, err);
        }
      }
    }
  },

  addLabel(labelId) {
    this.labelIds.push(labelId);
    return Cards.updateAsync(this._id, { $addToSet: { labelIds: labelId } });
  },

  removeLabel(labelId) {
    this.labelIds = (this.labelIds || []).filter(x => x !== labelId);
    return Cards.updateAsync(this._id, { $pull: { labelIds: labelId } });
  },

  toggleLabel(labelId) {
    if (this.labelIds && this.labelIds.indexOf(labelId) > -1) {
      return this.removeLabel(labelId);
    } else {
      return this.addLabel(labelId);
    }
  },

  setColor(newColor) {
    if (newColor === 'white') {
      newColor = null;
    }
    return Cards.updateAsync(this._id, { $set: { color: newColor } });
  },

  assignMember(memberId) {
    return Cards.updateAsync(this._id, { $addToSet: { members: memberId } });
  },

  assignAssignee(assigneeId) {
    return Cards.updateAsync(this._id, { $addToSet: { assignees: assigneeId } });
  },

  unassignMember(memberId) {
    return Cards.updateAsync(this._id, { $pull: { members: memberId } });
  },

  unassignAssignee(assigneeId) {
    return Cards.updateAsync(this._id, { $pull: { assignees: assigneeId } });
  },

  toggleMember(memberId) {
    if (this.members && this.members.indexOf(memberId) > -1) {
      return this.unassignMember(memberId);
    } else {
      return this.assignMember(memberId);
    }
  },

  toggleAssignee(assigneeId) {
    if (this.assignees && this.assignees.indexOf(assigneeId) > -1) {
      return this.unassignAssignee(assigneeId);
    } else {
      return this.assignAssignee(assigneeId);
    }
  },

  assignCustomField(customFieldId) {
    return Cards.updateAsync(this._id, {
      $addToSet: { customFields: { _id: customFieldId, value: null } },
    });
  },

  unassignCustomField(customFieldId) {
    return Cards.updateAsync(this._id, {
      $pull: { customFields: { _id: customFieldId } },
    });
  },

  toggleCustomField(customFieldId) {
    if (this.customFields && this.customFieldIndex(customFieldId) > -1) {
      return this.unassignCustomField(customFieldId);
    } else {
      return this.assignCustomField(customFieldId);
    }
  },

  toggleShowActivities() {
    return Cards.updateAsync(this._id, {
      $set: { showActivities: !this.showActivities },
    });
  },

  toggleShowChecklistAtMinicard() {
    return Cards.updateAsync(this._id, {
      $set: { showChecklistAtMinicard: !this.showChecklistAtMinicard },
    });
  },

  toggleHideFinishedChecklist() {
    return Cards.updateAsync(this._id, {
      $set: {
        hideFinishedChecklistIfItemsAreHidden:
          !this.hideFinishedChecklistIfItemsAreHidden,
      },
    });
  },

  setCustomField(customFieldId, value) {
    const index = this.customFieldIndex(customFieldId);
    if (index > -1) {
      const update = { $set: {} };
      update.$set[`customFields.${index}.value`] = value;
      return Cards.updateAsync(this._id, update);
    }
    return null;
  },

  setCover(coverId) {
    return Cards.updateAsync(this._id, { $set: { coverId } });
  },

  unsetCover() {
    return Cards.updateAsync(this._id, { $unset: { coverId: '' } });
  },

  unsetReceived() {
    return Cards.updateAsync(this._id, { $unset: { receivedAt: '' } });
  },

  unsetStart() {
    return Cards.updateAsync(this._id, { $unset: { startAt: '' } });
  },

  unsetDue() {
    return Cards.updateAsync(this._id, { $unset: { dueAt: '' } });
  },

  unsetEnd() {
    return Cards.updateAsync(this._id, { $unset: { endAt: '' } });
  },

  setOvertime(isOvertime) {
    return Cards.updateAsync(this._id, { $set: { isOvertime } });
  },

  setSpentTime(spentTime) {
    return Cards.updateAsync(this._id, { $set: { spentTime } });
  },

  unsetSpentTime() {
    return Cards.updateAsync(this._id, { $unset: { spentTime: '', isOvertime: false } });
  },

  setParentId(parentId) {
    return Cards.updateAsync(this._id, { $set: { parentId } });
  },

  setVoteQuestion(question, publicVote, allowNonBoardMembers) {
    return Cards.updateAsync(this._id, {
      $set: {
        vote: {
          question,
          public: publicVote,
          allowNonBoardMembers,
          positive: [],
          negative: [],
        },
      },
    });
  },

  unsetVote() {
    return Cards.updateAsync(this._id, { $unset: { vote: '' } });
  },

  setVoteEnd(end) {
    return Cards.updateAsync(this._id, { $set: { 'vote.end': end } });
  },

  unsetVoteEnd() {
    return Cards.updateAsync(this._id, { $unset: { 'vote.end': '' } });
  },

  setVote(userId, forIt) {
    switch (forIt) {
      case true:
        return Cards.updateAsync(this._id, {
          $pull: { 'vote.negative': userId },
          $addToSet: { 'vote.positive': userId },
        });
      case false:
        return Cards.updateAsync(this._id, {
          $pull: { 'vote.positive': userId },
          $addToSet: { 'vote.negative': userId },
        });
      default:
        return Cards.updateAsync(this._id, {
          $pull: { 'vote.positive': userId, 'vote.negative': userId },
        });
    }
  },

  setPokerQuestion(question, allowNonBoardMembers) {
    return Cards.updateAsync(this._id, {
      $set: {
        poker: {
          question,
          allowNonBoardMembers,
          one: [],
          two: [],
          three: [],
          five: [],
          eight: [],
          thirteen: [],
          twenty: [],
          forty: [],
          oneHundred: [],
          unsure: [],
        },
      },
    });
  },

  setPokerEstimation(estimation) {
    return Cards.updateAsync(this._id, { $set: { 'poker.estimation': estimation } });
  },

  unsetPokerEstimation() {
    return Cards.updateAsync(this._id, { $unset: { 'poker.estimation': '' } });
  },

  unsetPoker() {
    return Cards.updateAsync(this._id, { $unset: { poker: '' } });
  },

  setPokerEnd(end) {
    return Cards.updateAsync(this._id, { $set: { 'poker.end': end } });
  },

  unsetPokerEnd() {
    return Cards.updateAsync(this._id, { $unset: { 'poker.end': '' } });
  },

  setPoker(userId, state) {
    const pokerFields = ['one', 'two', 'three', 'five', 'eight', 'thirteen', 'twenty', 'forty', 'oneHundred', 'unsure'];
    const pullFields = {};
    pokerFields.forEach(f => { pullFields[`poker.${f}`] = userId; });

    if (pokerFields.includes(state)) {
      delete pullFields[`poker.${state}`];
      return Cards.updateAsync(this._id, {
        $pull: pullFields,
        $addToSet: { [`poker.${state}`]: userId },
      });
    } else {
      return Cards.updateAsync(this._id, { $pull: pullFields });
    }
  },

  replayPoker() {
    return Cards.updateAsync(this._id, {
      $set: {
        'poker.one': [],
        'poker.two': [],
        'poker.three': [],
        'poker.five': [],
        'poker.eight': [],
        'poker.thirteen': [],
        'poker.twelve': [],
        'poker.forty': [],
        'poker.oneHundred': [],
        'poker.unsure': [],
      },
    });
  },
});

//FUNCTIONS FOR creation of Activities

async function updateActivities(doc, fieldNames, modifier) {
  if (fieldNames.includes('labelIds') && fieldNames.includes('boardId')) {
    const activities = await ReactiveCache.getActivities({
      activityType: 'addedLabel',
      cardId: doc._id,
    });
    for (const a of activities) {
      const lidx = doc.labelIds.indexOf(a.labelId);
      if (lidx !== -1 && modifier.$set.labelIds.length > lidx) {
        await Activities.updateAsync(a._id, {
          $set: {
            labelId: modifier.$set.labelIds[doc.labelIds.indexOf(a.labelId)],
            boardId: modifier.$set.boardId,
          },
        });
      } else {
        await Activities.removeAsync(a._id);
      }
    }
  } else if (fieldNames.includes('boardId')) {
    await Activities.removeAsync({
      activityType: 'addedLabel',
      cardId: doc._id,
    });
  }
}

async function cardMove(
  userId,
  doc,
  fieldNames,
  oldListId,
  oldSwimlaneId,
  oldBoardId,
) {
  if (fieldNames.includes('boardId') && doc.boardId !== oldBoardId) {
    const newBoard = await ReactiveCache.getBoard(doc.boardId);
    const oldBoard = await ReactiveCache.getBoard(oldBoardId);
    const swimlane = await ReactiveCache.getSwimlane(doc.swimlaneId);
    await Activities.insertAsync({
      userId,
      activityType: 'moveCardBoard',
      boardName: newBoard.title,
      boardId: doc.boardId,
      oldBoardId,
      oldBoardName: oldBoard.title,
      cardId: doc._id,
      swimlaneName: swimlane.title,
      swimlaneId: doc.swimlaneId,
      oldSwimlaneId,
    });
  } else if (
    (fieldNames.includes('listId') && doc.listId !== oldListId) ||
    (fieldNames.includes('swimlaneId') && doc.swimlaneId !== oldSwimlaneId)
  ) {
    const list = await ReactiveCache.getList(doc.listId);
    const swimlane = await ReactiveCache.getSwimlane(doc.swimlaneId);
    await Activities.insertAsync({
      userId,
      oldListId,
      activityType: 'moveCard',
      listName: list.title,
      listId: doc.listId,
      boardId: doc.boardId,
      cardId: doc._id,
      cardTitle: doc.title,
      swimlaneName: swimlane.title,
      swimlaneId: doc.swimlaneId,
      oldSwimlaneId,
    });
  }
}

async function cardState(userId, doc, fieldNames) {
  if (fieldNames.includes('archived')) {
    const list = await ReactiveCache.getList(doc.listId);
    if (doc.archived) {
      await Activities.insertAsync({
        userId,
        activityType: 'archivedCard',
        listName: list.title,
        boardId: doc.boardId,
        listId: doc.listId,
        cardId: doc._id,
        swimlaneId: doc.swimlaneId,
      });
    } else {
      await Activities.insertAsync({
        userId,
        activityType: 'restoredCard',
        boardId: doc.boardId,
        listName: list.title,
        listId: doc.listId,
        cardId: doc._id,
        swimlaneId: doc.swimlaneId,
      });
    }
  }
}

async function cardMembers(userId, doc, fieldNames, modifier) {
  if (!fieldNames.includes('members')) return;
  let memberId;
  // Say hello to the new member
  if (modifier.$addToSet && modifier.$addToSet.members) {
    memberId = modifier.$addToSet.members;
    const user = await ReactiveCache.getUser(memberId);
    const username = user.username;
    if (!(doc.members || []).includes(memberId)) {
      await Activities.insertAsync({
        userId,
        username,
        activityType: 'joinMember',
        boardId: doc.boardId,
        cardId: doc._id,
        memberId,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      });
    }
  }

  // Say goodbye to the former member
  if (modifier.$pull && modifier.$pull.members) {
    memberId = modifier.$pull.members;
    const user = await ReactiveCache.getUser(memberId);
    const username = user.username;
    // Check that the former member is member of the card
    if ((doc.members || []).includes(memberId)) {
      await Activities.insertAsync({
        userId,
        username,
        activityType: 'unjoinMember',
        boardId: doc.boardId,
        cardId: doc._id,
        memberId,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      });
    }
  }
}

async function cardAssignees(userId, doc, fieldNames, modifier) {
  if (!fieldNames.includes('assignees')) return;
  let assigneeId;
  // Say hello to the new assignee
  if (modifier.$addToSet && modifier.$addToSet.assignees) {
    assigneeId = modifier.$addToSet.assignees;
    const user = await ReactiveCache.getUser(assigneeId);
    const username = user.username;
    if (!(doc.assignees || []).includes(assigneeId)) {
      await Activities.insertAsync({
        userId,
        username,
        activityType: 'joinAssignee',
        boardId: doc.boardId,
        cardId: doc._id,
        assigneeId,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      });
    }
  }
  // Say goodbye to the former assignee
  if (modifier.$pull && modifier.$pull.assignees) {
    assigneeId = modifier.$pull.assignees;
    const user = await ReactiveCache.getUser(assigneeId);
    const username = user.username;
    // Check that the former assignee is assignee of the card
    if ((doc.assignees || []).includes(assigneeId)) {
      await Activities.insertAsync({
        userId,
        username,
        activityType: 'unjoinAssignee',
        boardId: doc.boardId,
        cardId: doc._id,
        assigneeId,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      });
    }
  }
}

async function cardLabels(userId, doc, fieldNames, modifier) {
  if (!fieldNames.includes('labelIds')) return;
  let labelId;
  // Say hello to the new label
  if (modifier.$addToSet && modifier.$addToSet.labelIds) {
    labelId = modifier.$addToSet.labelIds;
    //const label = labels(labelId).name;
    if (!(doc.labelIds || []).includes(labelId)) {
      const act = {
        userId,
        labelId,
        activityType: 'addedLabel',
        boardId: doc.boardId,
        cardId: doc._id,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      };
      await Activities.insertAsync(act);
    }
  }

  // Say goodbye to the label
  if (modifier.$pull && modifier.$pull.labelIds) {
    labelId = modifier.$pull.labelIds;
    // Check that the former member is member of the card
    if ((doc.labelIds || []).includes(labelId)) {
      await Activities.insertAsync({
        userId,
        labelId,
        activityType: 'removedLabel',
        boardId: doc.boardId,
        cardId: doc._id,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      });
    }
  }
}

async function cardCustomFields(userId, doc, fieldNames, modifier) {
  if (!fieldNames.includes('customFields')) return;

  // Say hello to the new customField value
  if (modifier.$set) {
    for (const [key, value] of Object.entries(modifier.$set)) {
      if (key.startsWith('customFields')) {
        const dotNotation = key.split('.');

        // only individual changes are registered
        if (dotNotation.length > 1) {
          const customFieldId = doc.customFields[dotNotation[1]]._id;
          const act = {
            userId,
            customFieldId,
            value,
            activityType: 'setCustomField',
            boardId: doc.boardId,
            cardId: doc._id,
            listId: doc.listId,
            swimlaneId: doc.swimlaneId,
          };
          await Activities.insertAsync(act);
        }
      }
    }
  }

  // Say goodbye to the former customField value
  if (modifier.$unset) {
    for (const [key, value] of Object.entries(modifier.$unset)) {
      if (key.startsWith('customFields')) {
        const dotNotation = key.split('.');

        // only individual changes are registered
        if (dotNotation.length > 1) {
          const customFieldId = doc.customFields[dotNotation[1]]._id;
          const act = {
            userId,
            customFieldId,
            activityType: 'unsetCustomField',
            boardId: doc.boardId,
            cardId: doc._id,
          };
          await Activities.insertAsync(act);
        }
      }
    }
  }
}

async function cardCreation(userId, doc) {
  const list = await ReactiveCache.getList(doc.listId);
  const swimlane = await ReactiveCache.getSwimlane(doc.swimlaneId);
  await Activities.insertAsync({
    userId,
    activityType: 'createCard',
    boardId: doc.boardId,
    listName: list.title,
    listId: doc.listId,
    cardId: doc._id,
    cardTitle: doc.title,
    swimlaneName: swimlane.title,
    swimlaneId: doc.swimlaneId,
  });
}

async function cardRemover(userId, doc) {
  await ChecklistItems.removeAsync({
    cardId: doc._id,
  });
  await Checklists.removeAsync({
    cardId: doc._id,
  });
  await Cards.removeAsync({
    parentId: doc._id,
  });
  await CardComments.removeAsync({
    cardId: doc._id,
  });
  await Attachments.removeAsync({
    cardId: doc._id,
  });
}

const findDueCards = async days => {
  const seekDue = async ($from, $to, activityType) => {
    const cards = await ReactiveCache.getCards({
      archived: false,
      dueAt: { $gte: $from, $lt: $to },
    });
    for (const card of cards) {
      const user = await ReactiveCache.getUser(card.userId);
      const username = user.username;
      const activity = {
        userId: card.userId,
        username,
        activityType,
        boardId: card.boardId,
        cardId: card._id,
        cardTitle: card.title,
        listId: card.listId,
        timeValue: card.dueAt,
        swimlaneId: card.swimlaneId,
      };
      await Activities.insertAsync(activity);
    }
  };
  const now = new Date(),
    aday = 3600 * 24 * 1e3,
    then = day => new Date(now.setHours(0, 0, 0, 0) + day * aday);
  if (!days) return;
  if (!days.map) days = [days];
  for (const day of days) {
    let args = [];
    if (day === 0) {
      args = [then(0), then(1), 'duenow'];
    } else if (day > 0) {
      args = [then(1), then(day), 'almostdue'];
    } else {
      args = [then(day), now, 'pastdue'];
    }
    await seekDue(...args);
  }
};
const addCronJob = debounce(
  function findDueCardsDebounced() {
    const envValue = process.env.NOTIFY_DUE_DAYS_BEFORE_AND_AFTER;
    if (!envValue) {
      return;
    }
    const notifydays = envValue
      .split(',')
      .map(value => {
        const iValue = parseInt(value, 10);
        if (!(iValue > 0 && iValue < 15)) {
          // notifying due is disabled
          return false;
        } else {
          return iValue;
        }
      })
      .filter(Boolean);
    const notifyitvl = process.env.NOTIFY_DUE_AT_HOUR_OF_DAY; //passed in the itvl has to be a number standing for the hour of current time
    const defaultitvl = 8; // default every morning at 8am, if the passed env variable has parsing error use default
    const itvl = parseInt(notifyitvl, 10) || defaultitvl;
    const scheduler = (job => () => {
      const now = new Date();
      const hour = 3600 * 1e3;
      if (now.getHours() === itvl) {
        if (typeof job === 'function') {
          job();
        }
      }
      Meteor.setTimeout(scheduler, hour);
    })(() => {
      findDueCards(notifydays).catch(error => {
        console.error('Due card notification scan failed:', error);
      });
    });
    scheduler();
  },
  500,
);

export {
  updateActivities,
  cardMove,
  cardState,
  cardMembers,
  cardAssignees,
  cardLabels,
  cardCustomFields,
  cardCreation,
  cardRemover,
  addCronJob,
};

// Position history tracking methods
Cards.helpers({
  /**
   * Track the original position of this card
   */
  async trackOriginalPosition() {
    const existingHistory = await PositionHistory.findOneAsync({
      boardId: this.boardId,
      entityType: 'card',
      entityId: this._id,
    });

    if (!existingHistory) {
      await PositionHistory.insertAsync({
        boardId: this.boardId,
        entityType: 'card',
        entityId: this._id,
        originalPosition: {
          sort: this.sort,
          title: this.title,
        },
        originalSwimlaneId: this.swimlaneId || null,
        originalListId: this.listId || null,
        originalTitle: this.title,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  },

  /**
   * Get the original position history for this card
   */
  async getOriginalPosition() {
    return await PositionHistory.findOneAsync({
      boardId: this.boardId,
      entityType: 'card',
      entityId: this._id,
    });
  },

  /**
   * Check if this card has moved from its original position
   */
  async hasMovedFromOriginalPosition() {
    const history = await this.getOriginalPosition();
    if (!history) return false;

    const currentSwimlaneId = this.swimlaneId || null;
    const currentListId = this.listId || null;

    return history.originalPosition.sort !== this.sort ||
           history.originalSwimlaneId !== currentSwimlaneId ||
           history.originalListId !== currentListId;
  },

  /**
   * Get a description of the original position
   */
  getOriginalPositionDescription() {
    const history = this.getOriginalPosition();
    if (!history) return 'No original position data';

    const swimlaneInfo = history.originalSwimlaneId ?
      ` in swimlane ${history.originalSwimlaneId}` :
      ' in default swimlane';
    const listInfo = history.originalListId ?
      ` in list ${history.originalListId}` :
      '';
    return `Original position: ${history.originalPosition.sort || 0}${swimlaneInfo}${listInfo}`;
  },
});

export default Cards;
