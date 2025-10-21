import { ReactiveCache, ReactiveMiniMongoIndex } from '/imports/reactiveCache';
import moment from 'moment/min/moment-with-locales';
import {
  ALLOWED_COLORS,
  TYPE_CARD,
  TYPE_LINKED_BOARD,
  TYPE_LINKED_CARD,
} from '../config/const';
import Attachments, { fileStoreStrategyFactory } from "./attachments";
import { copyFile } from './lib/fileStoreStrategy.js';

Cards = new Mongo.Collection('cards');

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
      allowedValues: ALLOWED_COLORS,
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
    customFields: {
      /**
       * list of custom fields
       */
      type: [Object],
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
      type: [String],
      optional: true,
      defaultValue: [],
    },
    members: {
      /**
       * list of members (user IDs)
       */
      type: [String],
      optional: true,
      defaultValue: [],
    },
    assignees: {
      /**
       * who is assignee of the card (user ID),
       * maximum one ID of assignee in array.
       */
      type: [String],
      optional: true,
      defaultValue: [],
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
      decimal: true,
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
      decimal: true,
      defaultValue: 0,
      optional: true,
    },
    subtaskSort: {
      /**
       * subtask sort value
       */
      type: Number,
      decimal: true,
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
      type: [String],
      optional: true,
      defaultValue: [],
    },
    'vote.negative': {
      /**
       * list of members (user IDs)
       */
      type: [String],
      optional: true,
      defaultValue: [],
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
      type: [String],
      optional: true,
    },
    'poker.two': {
      /**
       * poker card two
       */
      type: [String],
      optional: true,
    },
    'poker.three': {
      /**
       * poker card three
       */
      type: [String],
      optional: true,
    },
    'poker.five': {
      /**
       * poker card five
       */
      type: [String],
      optional: true,
    },
    'poker.eight': {
      /**
       * poker card eight
       */
      type: [String],
      optional: true,
    },
    'poker.thirteen': {
      /**
       * poker card thirteen
       */
      type: [String],
      optional: true,
    },
    'poker.twenty': {
      /**
       * poker card twenty
       */
      type: [String],
      optional: true,
    },
    'poker.forty': {
      /**
       * poker card forty
       */
      type: [String],
      optional: true,
    },
    'poker.oneHundred': {
      /**
       * poker card oneHundred
       */
      type: [String],
      optional: true,
    },
    'poker.unsure': {
      /**
       * poker card unsure
       */
      type: [String],
      optional: true,
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
      type: [String],
      optional: true,
      defaultValue: [],
    },
    linkType_gantt: {
      /**
       * ID of card which is the parent link in gantt view
       */
      type: [Number],
      decimal: false,
      optional: true,
      defaultValue: [],
    },
    linkId_gantt: {
      /**
       * ID of card which is the parent link in gantt view
       */
      type: [String],
      optional: true,
      defaultValue: [],
    },
    cardNumber: {
      /**
       * A boardwise sequentially increasing number that is assigned
       * to every newly created card
       */
      type: Number,
      decimal: true,
      optional: true,
      defaultValue: 0,
    },
    showActivities: {
      type: Boolean,
      defaultValue: false,
    },
    hideFinishedChecklistIfItemsAreHidden: {
      /**
       * hide completed checklist?
       */
      type: Boolean,
      optional: true,
    },
  }),
);

Cards.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, ReactiveCache.getBoard(doc.boardId));
  },

  update(userId, doc, fields) {
    // Allow board members or logged in users if only vote get's changed
    return (
      allowIsBoardMember(userId, ReactiveCache.getBoard(doc.boardId)) ||
      (_.isEqual(fields, ['vote', 'modifiedAt', 'dateLastActivity']) &&
        !!userId)
    );
  },
  remove(userId, doc) {
    return allowIsBoardMember(userId, ReactiveCache.getBoard(doc.boardId));
  },
  fetch: ['boardId'],
});

Cards.helpers({
  // Gantt https://github.com/wekan/wekan/issues/2870#issuecomment-857171127
  setGanttTargetId(sourceId, targetId, linkType, linkId){
    return Cards.update({ _id: sourceId}, {
      $push: {
        targetId_gantt: targetId,
        linkType_gantt : linkType,
        linkId_gantt: linkId
      }
    });
  },

  removeGanttTargetId(sourceId, targetId, linkType, linkId){
    return Cards.update({ _id: sourceId}, {
      $pull: {
        targetId_gantt: targetId,
        linkType_gantt : linkType,
        linkId_gantt: linkId
      }
    });
  },

  mapCustomFieldsToBoard(boardId) {
    // Map custom fields to new board
    return this.customFields.map(cf => {
        const oldCf = ReactiveCache.getCustomField(cf._id);

        // Check if oldCf is undefined or null
        if (!oldCf) {
            //console.error(`Custom field with ID ${cf._id} not found.`);
            return cf;  // Skip this field if oldCf is not found
        }

        const newCf = ReactiveCache.getCustomField({
            boardIds: boardId,
            name: oldCf.name,
            type: oldCf.type,
        });

        if (newCf) {
            cf._id = newCf._id;
        } else if (!_.contains(oldCf.boardIds, boardId)) {
            oldCf.addBoard(boardId);
        }

        return cf;
    });
},


  copy(boardId, swimlaneId, listId) {
    const oldId = this._id;
    const oldCard = ReactiveCache.getCard(oldId);

    // we must only copy the labels and custom fields if the target board
    // differs from the source board
    if (this.boardId !== boardId) {
      const oldBoard = ReactiveCache.getBoard(this.boardId);
      const oldBoardLabels = oldBoard.labels;

      // Get old label names
      const oldCardLabels = _.pluck(
        _.filter(oldBoardLabels, label => {
          return _.contains(this.labelIds, label._id);
        }),
        'name',
      );

      const newBoard = ReactiveCache.getBoard(boardId);
      const newBoardLabels = newBoard.labels;
      const newCardLabels = _.pluck(
        _.filter(newBoardLabels, label => {
          return _.contains(oldCardLabels, label.name);
        }),
        '_id',
      );
      // now set the new label ids
      delete this.labelIds;
      this.labelIds = newCardLabels;

      this.customFields = this.mapCustomFieldsToBoard(newBoard._id);
    }

    delete this._id;
    this.boardId = boardId;
    this.cardNumber = ReactiveCache.getBoard(boardId).getNextCardNumber();
    this.swimlaneId = swimlaneId;
    this.listId = listId;
    const _id = Cards.insert(this);

    // Copy attachments
    oldCard.attachments()
      .forEach(att => {
        copyFile(att, _id, fileStoreStrategyFactory);
      });

    // copy checklists
    ReactiveCache.getChecklists({ cardId: oldId }).forEach(ch => {
      ch.copy(_id);
    });

    // copy subtasks
    ReactiveCache.getCards({ parentId: oldId }).forEach(subtask => {
      subtask.parentId = _id;
      subtask._id = null;
      Cards.insert(subtask);
    });

    // copy card comments
    ReactiveCache.getCardComments({ cardId: oldId }).forEach(cmt => {
      cmt.copy(_id);
    });
    // restore the id, otherwise new copies will fail
    this._id = oldId;

    return _id;
  },

  link(boardId, swimlaneId, listId) {
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
    return Cards.insert(linkCard);
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
    const cardLabels = _.filter(boardLabels, label => {
      return _.contains(this.labelIds, label._id);
    });
    return cardLabels;
  },

  hasLabel(labelId) {
    return _.contains(this.labelIds, labelId);
  },

  /** returns the sort number of a list
   * @param listId a list id
   * @param swimlaneId a swimlane id
   * top sorting of the card at the top if true, or from the bottom if false
   */
  getSort(listId, swimlaneId, top) {
    if (!_.isBoolean(top)) {
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
    const card = ReactiveCache.getCard(selector, { sort: { sort: sorting } }, true);
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
  getMinSort(listId, swimlaneId) {
    const ret = this.getSort(listId, swimlaneId, true);
    return ret;
  },

  /** returns the sort number of a list from the card at the bottom
   * @param listId a list id
   * @param swimlaneId a swimlane id
   */
  getMaxSort(listId, swimlaneId) {
    const ret = this.getSort(listId, swimlaneId, false);
    return ret;
  },

  user() {
    return ReactiveCache.getUser(this.userId);
  },

  isAssigned(memberId) {
    return _.contains(this.getMembers(), memberId);
  },

  isAssignee(assigneeId) {
    return _.contains(this.getAssignees(), assigneeId);
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
    const ret = _.first(checklists);
    return ret;
  },

  lastChecklist() {
    const checklists = this.checklists();
    const ret = _.last(checklists);
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
    return _.pluck(this.customFields, '_id').indexOf(customFieldId);
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
    return FlowRouter.url('card', {
      boardId: board._id,
      slug: board.slug,
      cardId: this._id,
    });
  },
  originRelativeUrl() {
    const board = this.board();
    return FlowRouter.path('card', {
      boardId: board._id,
      slug: board.slug,
      cardId: this._id,
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
    return this.parentList()
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
      return Boards.update({ _id: this.linkedId }, { $set: { description } });
    } else {
      return Cards.update({ _id: this.getRealId() }, { $set: { description } });
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
      ret = Cards.update(
        { _id: this.getRealId() },
        { $addToSet: { members: memberId } },
      );
    }
    return ret;
  },

  assignAssignee(assigneeId) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        { $addToSet: { assignees: assigneeId } },
      );
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      return board.addAssignee(assigneeId);
    } else {
      return Cards.update(
        { _id: this._id },
        { $addToSet: { assignees: assigneeId } },
      );
    }
  },

  unassignMember(memberId) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        { $pull: { members: memberId } },
      );
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      return board.removeMember(memberId);
    } else {
      return Cards.update({ _id: this._id }, { $pull: { members: memberId } });
    }
  },

  unassignAssignee(assigneeId) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        { $pull: { assignees: assigneeId } },
      );
    } else if (this.isLinkedBoard()) {
      const board = ReactiveCache.getBoard(this.linkedId);
      return board.removeAssignee(assigneeId);
    } else {
      return Cards.update(
        { _id: this._id },
        { $pull: { assignees: assigneeId } },
      );
    }
  },

  toggleMember(memberId) {
    if (this.getMembers() && this.getMembers().indexOf(memberId) > -1) {
      return this.unassignMember(memberId);
    } else {
      return this.assignMember(memberId);
    }
  },

  toggleAssignee(assigneeId) {
    if (this.getAssignees() && this.getAssignees().indexOf(assigneeId) > -1) {
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
      return Boards.update({ _id: this.linkedId }, { $set: { receivedAt } });
    } else {
      return Cards.update({ _id: this.getRealId() }, { $set: { receivedAt } });
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
      return Boards.update({ _id: this.linkedId }, { $set: { startAt } });
    } else {
      return Cards.update({ _id: this.getRealId() }, { $set: { startAt } });
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
      return Boards.update({ _id: this.linkedId }, { $set: { dueAt } });
    } else {
      return Cards.update({ _id: this.getRealId() }, { $set: { dueAt } });
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
      return Boards.update({ _id: this.linkedId }, { $set: { endAt } });
    } else {
      return Cards.update({ _id: this.getRealId() }, { $set: { endAt } });
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
      return Boards.update({ _id: this.linkedId }, { $set: { isOvertime } });
    } else {
      return Cards.update({ _id: this.getRealId() }, { $set: { isOvertime } });
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
      return Boards.update({ _id: this.linkedId }, { $set: { spentTime } });
    } else {
      return Cards.update({ _id: this.getRealId() }, { $set: { spentTime } });
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
      end = moment(end);
      return end.isBefore(new Date());
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
        state = _.contains(this.vote.positive, userId);
        if (state === true) return true;
      }
      if (this.vote.negative) {
        state = _.contains(this.vote.negative, userId);
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
      end = moment(end);
      return end.isBefore(new Date());
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
        state = _.contains(this.poker.one, userId);
        if (state === true) {
          return 'one';
        }
      }
      if (this.poker.two) {
        state = _.contains(this.poker.two, userId);
        if (state === true) {
          return 'two';
        }
      }
      if (this.poker.three) {
        state = _.contains(this.poker.three, userId);
        if (state === true) {
          return 'three';
        }
      }
      if (this.poker.five) {
        state = _.contains(this.poker.five, userId);
        if (state === true) {
          return 'five';
        }
      }
      if (this.poker.eight) {
        state = _.contains(this.poker.eight, userId);
        if (state === true) {
          return 'eight';
        }
      }
      if (this.poker.thirteen) {
        state = _.contains(this.poker.thirteen, userId);
        if (state === true) {
          return 'thirteen';
        }
      }
      if (this.poker.twenty) {
        state = _.contains(this.poker.twenty, userId);
        if (state === true) {
          return 'twenty';
        }
      }
      if (this.poker.forty) {
        state = _.contains(this.poker.forty, userId);
        if (state === true) {
          return 'forty';
        }
      }
      if (this.poker.oneHundred) {
        state = _.contains(this.poker.oneHundred, userId);
        if (state === true) {
          return 'oneHundred';
        }
      }
      if (this.poker.unsure) {
        state = _.contains(this.poker.unsure, userId);
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
    if (this.isLinkedBoard()) {
      return Boards.update({ _id: this.linkedId }, { $set: { title } });
    } else {
      return Cards.update({ _id: this.getRealId() }, { $set: { title } });
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
    return Cards.update({ _id: this.getRealId() }, { $set: { requestedBy } });
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
    return Cards.update({ _id: this.getRealId() }, { $set: { assignedBy } });
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
});

Cards.mutations({
  applyToChildren(funct) {
    ReactiveCache.getCards({
      parentId: this._id,
    }).forEach(card => {
      funct(card);
    });
  },

  archive() {
    this.applyToChildren(card => {
      return card.archive();
    });
    return {
      $set: {
        archived: true,
        archivedAt: new Date(),
      },
    };
  },

  restore() {
    this.applyToChildren(card => {
      return card.restore();
    });
    return {
      $set: {
        archived: false,
      },
    };
  },

  moveToEndOfList({ listId } = {}) {
    let swimlaneId = this.swimlaneId;
    const boardId = this.boardId;
    let sortIndex = 0;

    // This should never happen, but there was a bug that was fixed in commit
    // ea0239538a68e225c867411a4f3e0d27c158383.
    if (!swimlaneId) {
      const board = ReactiveCache.getBoard(boardId);
      swimlaneId = board.getDefaultSwimline()._id;
    }
    // Move the minicard to the end of the target list
    let parentElementDom = $(`#swimlane-${this.swimlaneId}`).get(0);
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
    // This should never happen, but there was a bug that was fixed in commit
    // ea0239538a68e225c867411a4f3e0d27c158383.
    if (!swimlaneId) {
      const board = ReactiveCache.getBoard(boardId);
      swimlaneId = board.getDefaultSwimline()._id;
    }
    listId = listId || this.listId;
    if (sort === undefined || sort === null) sort = this.sort;
    return this.move(boardId, swimlaneId, listId, sort);
  },

  move(boardId, swimlaneId, listId, sort = null) {
    const mutatedFields = {
      boardId,
      swimlaneId,
      listId,
    };

    if (sort !== null) {
      mutatedFields.sort = sort;
    }

    // we must only copy the labels and custom fields if the target board
    // differs from the source board
    if (this.boardId !== boardId) {
      // Get label names
      const oldBoard = ReactiveCache.getBoard(this.boardId);
      const oldBoardLabels = oldBoard.labels;
      const oldCardLabels = _.pluck(
        _.filter(oldBoardLabels, label => {
          return _.contains(this.labelIds, label._id);
        }),
        'name',
      );

      const newBoard = ReactiveCache.getBoard(boardId);
      const newBoardLabels = newBoard.labels;
      const newCardLabelIds = _.pluck(
        _.filter(newBoardLabels, label => {
          return label.name && _.contains(oldCardLabels, label.name);
        }),
        '_id',
      );

      // assign the new card number from the target board
      const newCardNumber = newBoard.getNextCardNumber();

      Object.assign(mutatedFields, {
        labelIds: newCardLabelIds,
        cardNumber: newCardNumber
      });

      mutatedFields.customFields = this.mapCustomFieldsToBoard(newBoard._id);
    }

    Cards.update(this._id, {
      $set: mutatedFields,
    });
    // Update attachments metadata so access permissions follow the card
    // Only do this on server to avoid permission issues and to keep DB updates atomic
    if (Meteor.isServer) {
      try {
        const updateMeta = {};
        if (mutatedFields.boardId !== undefined) updateMeta['meta.boardId'] = mutatedFields.boardId;
        if (mutatedFields.listId !== undefined) updateMeta['meta.listId'] = mutatedFields.listId;
        if (mutatedFields.swimlaneId !== undefined) updateMeta['meta.swimlaneId'] = mutatedFields.swimlaneId;

        if (Object.keys(updateMeta).length > 0) {
          // Attachments is a FilesCollection; underlying Mongo collection is accessible via .collection
          Attachments.collection.update(
            { 'meta.cardId': this._id },
            { $set: updateMeta },
            { multi: true },
          );
        }
      } catch (err) {
        // don't block the move if attachment update fails, but log for debugging
        // eslint-disable-next-line no-console
        console.error('Failed to update attachments metadata after moving card', this._id, err);
      }
    }
  },

  addLabel(labelId) {
    this.labelIds.push(labelId);
    return {
      $addToSet: {
        labelIds: labelId,
      },
    };
  },

  removeLabel(labelId) {
    this.labelIds = _.without(this.labelIds, labelId);
    return {
      $pull: {
        labelIds: labelId,
      },
    };
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
    return {
      $set: {
        color: newColor,
      },
    };
  },

  assignMember(memberId) {
    return {
      $addToSet: {
        members: memberId,
      },
    };
  },

  assignAssignee(assigneeId) {
    // If there is not any assignee, allow one assignee, not more.
    /*
    if (this.getAssignees().length === 0) {
      return {
        $addToSet: {
          assignees: assigneeId,
        },
      };
    */
    // Allow more that one assignee:
    // https://github.com/wekan/wekan/issues/3302
    return {
      $addToSet: {
        assignees: assigneeId,
      },
    };
    //} else {
    //  return false,
    //}
  },

  unassignMember(memberId) {
    return {
      $pull: {
        members: memberId,
      },
    };
  },

  unassignAssignee(assigneeId) {
    return {
      $pull: {
        assignees: assigneeId,
      },
    };
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
    return {
      $addToSet: {
        customFields: {
          _id: customFieldId,
          value: null,
        },
      },
    };
  },

  unassignCustomField(customFieldId) {
    return {
      $pull: {
        customFields: {
          _id: customFieldId,
        },
      },
    };
  },

  toggleCustomField(customFieldId) {
    if (this.customFields && this.customFieldIndex(customFieldId) > -1) {
      return this.unassignCustomField(customFieldId);
    } else {
      return this.assignCustomField(customFieldId);
    }
  },

  toggleShowActivities() {
    return {
      $set: {
        showActivities: !this.showActivities,
      }
    };
  },

  toggleHideFinishedChecklist() {
    return {
      $set: {
        hideFinishedChecklistIfItemsAreHidden: !this.hideFinishedChecklistIfItemsAreHidden,
      }
    };
  },

  setCustomField(customFieldId, value) {
    // todo
    const index = this.customFieldIndex(customFieldId);
    if (index > -1) {
      const update = {
        $set: {},
      };
      update.$set[`customFields.${index}.value`] = value;
      return update;
    }
    // TODO
    // Ignatz 18.05.2018: Return null to silence ESLint. No Idea if that is correct
    return null;
  },

  setCover(coverId) {
    return {
      $set: {
        coverId,
      },
    };
  },

  unsetCover() {
    return {
      $unset: {
        coverId: '',
      },
    };
  },

  //setReceived(receivedAt) {
  //  return {
  //    $set: {
  //      receivedAt,
  //    },
  //  };
  //},

  unsetReceived() {
    return {
      $unset: {
        receivedAt: '',
      },
    };
  },

  //setStart(startAt) {
  //  return {
  //    $set: {
  //      startAt,
  //    },
  //  };
  //},

  unsetStart() {
    return {
      $unset: {
        startAt: '',
      },
    };
  },

  //setDue(dueAt) {
  //  return {
  //    $set: {
  //      dueAt,
  //    },
  //  };
  //},

  unsetDue() {
    return {
      $unset: {
        dueAt: '',
      },
    };
  },

  //setEnd(endAt) {
  //  return {
  //    $set: {
  //      endAt,
  //    },
  //  };
  //},

  unsetEnd() {
    return {
      $unset: {
        endAt: '',
      },
    };
  },

  setOvertime(isOvertime) {
    return {
      $set: {
        isOvertime,
      },
    };
  },

  setSpentTime(spentTime) {
    return {
      $set: {
        spentTime,
      },
    };
  },

  unsetSpentTime() {
    return {
      $unset: {
        spentTime: '',
        isOvertime: false,
      },
    };
  },

  setParentId(parentId) {
    return {
      $set: {
        parentId,
      },
    };
  },
  setVoteQuestion(question, publicVote, allowNonBoardMembers) {
    return {
      $set: {
        vote: {
          question,
          public: publicVote,
          allowNonBoardMembers,
          positive: [],
          negative: [],
        },
      },
    };
  },
  unsetVote() {
    return {
      $unset: {
        vote: '',
      },
    };
  },
  setVoteEnd(end) {
    return {
      $set: { 'vote.end': end },
    };
  },
  unsetVoteEnd() {
    return {
      $unset: { 'vote.end': '' },
    };
  },
  setVote(userId, forIt) {
    switch (forIt) {
      case true:
        // vote for it
        return {
          $pull: {
            'vote.negative': userId,
          },
          $addToSet: {
            'vote.positive': userId,
          },
        };
      case false:
        // vote against
        return {
          $pull: {
            'vote.positive': userId,
          },
          $addToSet: {
            'vote.negative': userId,
          },
        };

      default:
        // Remove votes
        return {
          $pull: {
            'vote.positive': userId,
            'vote.negative': userId,
          },
        };
    }
  },

  setPokerQuestion(question, allowNonBoardMembers) {
    return {
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
    };
  },
  setPokerEstimation(estimation) {
    return {
      $set: { 'poker.estimation': estimation },
    };
  },
  unsetPokerEstimation() {
    return {
      $unset: { 'poker.estimation': '' },
    };
  },
  unsetPoker() {
    return {
      $unset: {
        poker: '',
      },
    };
  },
  setPokerEnd(end) {
    return {
      $set: { 'poker.end': end },
    };
  },
  unsetPokerEnd() {
    return {
      $unset: { 'poker.end': '' },
    };
  },
  setPoker(userId, state) {
    switch (state) {
      case 'one':
        // poker one
        return {
          $pull: {
            'poker.two': userId,
            'poker.three': userId,
            'poker.five': userId,
            'poker.eight': userId,
            'poker.thirteen': userId,
            'poker.twenty': userId,
            'poker.forty': userId,
            'poker.oneHundred': userId,
            'poker.unsure': userId,
          },
          $addToSet: {
            'poker.one': userId,
          },
        };
      case 'two':
        // poker two
        return {
          $pull: {
            'poker.one': userId,
            'poker.three': userId,
            'poker.five': userId,
            'poker.eight': userId,
            'poker.thirteen': userId,
            'poker.twenty': userId,
            'poker.forty': userId,
            'poker.oneHundred': userId,
            'poker.unsure': userId,
          },
          $addToSet: {
            'poker.two': userId,
          },
        };

      case 'three':
        // poker three
        return {
          $pull: {
            'poker.one': userId,
            'poker.two': userId,
            'poker.five': userId,
            'poker.eight': userId,
            'poker.thirteen': userId,
            'poker.twenty': userId,
            'poker.forty': userId,
            'poker.oneHundred': userId,
            'poker.unsure': userId,
          },
          $addToSet: {
            'poker.three': userId,
          },
        };

      case 'five':
        // poker five
        return {
          $pull: {
            'poker.one': userId,
            'poker.two': userId,
            'poker.three': userId,
            'poker.eight': userId,
            'poker.thirteen': userId,
            'poker.twenty': userId,
            'poker.forty': userId,
            'poker.oneHundred': userId,
            'poker.unsure': userId,
          },
          $addToSet: {
            'poker.five': userId,
          },
        };

      case 'eight':
        // poker eight
        return {
          $pull: {
            'poker.one': userId,
            'poker.two': userId,
            'poker.three': userId,
            'poker.five': userId,
            'poker.thirteen': userId,
            'poker.twenty': userId,
            'poker.forty': userId,
            'poker.oneHundred': userId,
            'poker.unsure': userId,
          },
          $addToSet: {
            'poker.eight': userId,
          },
        };

      case 'thirteen':
        // poker thirteen
        return {
          $pull: {
            'poker.one': userId,
            'poker.two': userId,
            'poker.three': userId,
            'poker.five': userId,
            'poker.eight': userId,
            'poker.twenty': userId,
            'poker.forty': userId,
            'poker.oneHundred': userId,
            'poker.unsure': userId,
          },
          $addToSet: {
            'poker.thirteen': userId,
          },
        };

      case 'twenty':
        // poker twenty
        return {
          $pull: {
            'poker.one': userId,
            'poker.two': userId,
            'poker.three': userId,
            'poker.five': userId,
            'poker.eight': userId,
            'poker.thirteen': userId,
            'poker.forty': userId,
            'poker.oneHundred': userId,
            'poker.unsure': userId,
          },
          $addToSet: {
            'poker.twenty': userId,
          },
        };

      case 'forty':
        // poker forty
        return {
          $pull: {
            'poker.one': userId,
            'poker.two': userId,
            'poker.three': userId,
            'poker.five': userId,
            'poker.eight': userId,
            'poker.thirteen': userId,
            'poker.twenty': userId,
            'poker.oneHundred': userId,
            'poker.unsure': userId,
          },
          $addToSet: {
            'poker.forty': userId,
          },
        };

      case 'oneHundred':
        // poker one hundred
        return {
          $pull: {
            'poker.one': userId,
            'poker.two': userId,
            'poker.three': userId,
            'poker.five': userId,
            'poker.eight': userId,
            'poker.thirteen': userId,
            'poker.twenty': userId,
            'poker.forty': userId,
            'poker.unsure': userId,
          },
          $addToSet: {
            'poker.oneHundred': userId,
          },
        };

      case 'unsure':
        // poker unsure
        return {
          $pull: {
            'poker.one': userId,
            'poker.two': userId,
            'poker.three': userId,
            'poker.five': userId,
            'poker.eight': userId,
            'poker.thirteen': userId,
            'poker.twenty': userId,
            'poker.forty': userId,
            'poker.oneHundred': userId,
          },
          $addToSet: {
            'poker.unsure': userId,
          },
        };

      default:
        // Remove pokers
        return {
          $pull: {
            'poker.one': userId,
            'poker.two': userId,
            'poker.three': userId,
            'poker.five': userId,
            'poker.eight': userId,
            'poker.thirteen': userId,
            'poker.twenty': userId,
            'poker.forty': userId,
            'poker.oneHundred': userId,
            'poker.unsure': userId,
          },
        };
    }
  },
  replayPoker() {
    return {
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
    };
  },
});

//FUNCTIONS FOR creation of Activities

function updateActivities(doc, fieldNames, modifier) {
  if (_.contains(fieldNames, 'labelIds') && _.contains(fieldNames, 'boardId')) {
    ReactiveCache.getActivities({
      activityType: 'addedLabel',
      cardId: doc._id,
    }).forEach(a => {
      const lidx = doc.labelIds.indexOf(a.labelId);
      if (lidx !== -1 && modifier.$set.labelIds.length > lidx) {
        Activities.update(a._id, {
          $set: {
            labelId: modifier.$set.labelIds[doc.labelIds.indexOf(a.labelId)],
            boardId: modifier.$set.boardId,
          },
        });
      } else {
        Activities.remove(a._id);
      }
    });
  } else if (_.contains(fieldNames, 'boardId')) {
    Activities.remove({
      activityType: 'addedLabel',
      cardId: doc._id,
    });
  }
}

function cardMove(
  userId,
  doc,
  fieldNames,
  oldListId,
  oldSwimlaneId,
  oldBoardId,
) {
  if (_.contains(fieldNames, 'boardId') && doc.boardId !== oldBoardId) {
    Activities.insert({
      userId,
      activityType: 'moveCardBoard',
      boardName: ReactiveCache.getBoard(doc.boardId).title,
      boardId: doc.boardId,
      oldBoardId,
      oldBoardName: ReactiveCache.getBoard(oldBoardId).title,
      cardId: doc._id,
      swimlaneName: ReactiveCache.getSwimlane(doc.swimlaneId).title,
      swimlaneId: doc.swimlaneId,
      oldSwimlaneId,
    });
  } else if (
    (_.contains(fieldNames, 'listId') && doc.listId !== oldListId) ||
    (_.contains(fieldNames, 'swimlaneId') && doc.swimlaneId !== oldSwimlaneId)
  ) {
    Activities.insert({
      userId,
      oldListId,
      activityType: 'moveCard',
      listName: ReactiveCache.getList(doc.listId).title,
      listId: doc.listId,
      boardId: doc.boardId,
      cardId: doc._id,
      cardTitle: doc.title,
      swimlaneName: ReactiveCache.getSwimlane(doc.swimlaneId).title,
      swimlaneId: doc.swimlaneId,
      oldSwimlaneId,
    });
  }
}

function cardState(userId, doc, fieldNames) {
  if (_.contains(fieldNames, 'archived')) {
    if (doc.archived) {
      Activities.insert({
        userId,
        activityType: 'archivedCard',
        listName: ReactiveCache.getList(doc.listId).title,
        boardId: doc.boardId,
        listId: doc.listId,
        cardId: doc._id,
        swimlaneId: doc.swimlaneId,
      });
    } else {
      Activities.insert({
        userId,
        activityType: 'restoredCard',
        boardId: doc.boardId,
        listName: ReactiveCache.getList(doc.listId).title,
        listId: doc.listId,
        cardId: doc._id,
        swimlaneId: doc.swimlaneId,
      });
    }
  }
}

function cardMembers(userId, doc, fieldNames, modifier) {
  if (!_.contains(fieldNames, 'members')) return;
  let memberId;
  // Say hello to the new member
  if (modifier.$addToSet && modifier.$addToSet.members) {
    memberId = modifier.$addToSet.members;
    const username = ReactiveCache.getUser(memberId).username;
    if (!_.contains(doc.members, memberId)) {
      Activities.insert({
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
    const username = ReactiveCache.getUser(memberId).username;
    // Check that the former member is member of the card
    if (_.contains(doc.members, memberId)) {
      Activities.insert({
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

function cardAssignees(userId, doc, fieldNames, modifier) {
  if (!_.contains(fieldNames, 'assignees')) return;
  let assigneeId;
  // Say hello to the new assignee
  if (modifier.$addToSet && modifier.$addToSet.assignees) {
    assigneeId = modifier.$addToSet.assignees;
    const username = ReactiveCache.getUser(assigneeId).username;
    if (!_.contains(doc.assignees, assigneeId)) {
      Activities.insert({
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
    const username = ReactiveCache.getUser(assigneeId).username;
    // Check that the former assignee is assignee of the card
    if (_.contains(doc.assignees, assigneeId)) {
      Activities.insert({
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

function cardLabels(userId, doc, fieldNames, modifier) {
  if (!_.contains(fieldNames, 'labelIds')) return;
  let labelId;
  // Say hello to the new label
  if (modifier.$addToSet && modifier.$addToSet.labelIds) {
    labelId = modifier.$addToSet.labelIds;
    //const label = labels(labelId).name;
    if (!_.contains(doc.labelIds, labelId)) {
      const act = {
        userId,
        labelId,
        activityType: 'addedLabel',
        boardId: doc.boardId,
        cardId: doc._id,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      };
      Activities.insert(act);
    }
  }

  // Say goodbye to the label
  if (modifier.$pull && modifier.$pull.labelIds) {
    labelId = modifier.$pull.labelIds;
    // Check that the former member is member of the card
    if (_.contains(doc.labelIds, labelId)) {
      Activities.insert({
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

function cardCustomFields(userId, doc, fieldNames, modifier) {
  if (!_.contains(fieldNames, 'customFields')) return;

  // Say hello to the new customField value
  if (modifier.$set) {
    _.each(modifier.$set, (value, key) => {
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
          Activities.insert(act);
        }
      }
    });
  }

  // Say goodbye to the former customField value
  if (modifier.$unset) {
    _.each(modifier.$unset, (value, key) => {
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
          Activities.insert(act);
        }
      }
    });
  }
}

function cardCreation(userId, doc) {
  Activities.insert({
    userId,
    activityType: 'createCard',
    boardId: doc.boardId,
    listName: ReactiveCache.getList(doc.listId).title,
    listId: doc.listId,
    cardId: doc._id,
    cardTitle: doc.title,
    swimlaneName: ReactiveCache.getSwimlane(doc.swimlaneId).title,
    swimlaneId: doc.swimlaneId,
  });
}

Meteor.methods({
  createCardWithDueDate: function(boardId, listId, title, dueDate, swimlaneId) {
    check(boardId, String);
    check(listId, String);
    check(title, String);
    check(dueDate, Date);
    check(swimlaneId, String);
    const card = {
      title,
      listId,
      boardId,
      swimlaneId,
      createdAt: new Date(),
      dueAt: dueDate,
      sort: 0,
      usedId: Meteor.userId(),
    };
    const cardId = Cards.insert(card);
    return cardId;
  },
});

function cardRemover(userId, doc) {
  ChecklistItems.remove({
    cardId: doc._id,
  });
  Checklists.remove({
    cardId: doc._id,
  });
  Cards.remove({
    parentId: doc._id,
  });
  CardComments.remove({
    cardId: doc._id,
  });
  Attachments.remove({
    cardId: doc._id,
  });
}

const findDueCards = days => {
  const seekDue = ($from, $to, activityType) => {
    ReactiveCache.getCards({
      archived: false,
      dueAt: { $gte: $from, $lt: $to },
    }).forEach(card => {
      const username = ReactiveCache.getUser(card.userId).username;
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
      Activities.insert(activity);
    });
  };
  const now = new Date(),
    aday = 3600 * 24 * 1e3,
    then = day => new Date(now.setHours(0, 0, 0, 0) + day * aday);
  if (!days) return;
  if (!days.map) days = [days];
  days.map(day => {
    let args = [];
    if (day === 0) {
      args = [then(0), then(1), 'duenow'];
    } else if (day > 0) {
      args = [then(1), then(day), 'almostdue'];
    } else {
      args = [then(day), now, 'pastdue'];
    }
    seekDue(...args);
  });
};
const addCronJob = _.debounce(
  Meteor.bindEnvironment(function findDueCardsDebounced() {
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
      findDueCards(notifydays);
    });
    scheduler();
  }),
  500,
);

if (Meteor.isServer) {
  Meteor.methods({
    /** copies a card
     * <li> this method is needed on the server because attachments can only be copied on the server (access to file system)
     * @param card id to copy
     * @param boardId copy to this board
     * @param swimlandeId copy to this swimlane id
     * @param listId copy to this list id
     * @param insertAtTop insert the card at the top?
     * @param mergeCardValues this values into the copied card
     * @return the new card id
     */
    copyCard(cardId, boardId, swimlaneId, listId, insertAtTop, mergeCardValues) {
      check(cardId, String);
      check(boardId, String);
      check(swimlaneId, String);
      check(listId, String);
      check(insertAtTop, Boolean);
      check(mergeCardValues, Object);

      const card = ReactiveCache.getCard(cardId);
      Object.assign(card, mergeCardValues);

      const sort = card.getSort(listId, swimlaneId, insertAtTop);
      if (insertAtTop) {
        card.sort = sort - 1;
      } else
      {
        card.sort = sort + 1;
      }

      const ret = card.copy(boardId, swimlaneId, listId);
      return ret;
    },
  });
  // Cards are often fetched within a board, so we create an index to make these
  // queries more efficient.
  Meteor.startup(() => {
    Cards._collection.createIndex({ modifiedAt: -1 });
    Cards._collection.createIndex({ boardId: 1, createdAt: -1 });
    // https://github.com/wekan/wekan/issues/1863
    // Swimlane added a new field in the cards collection of mongodb named parentId.
    // When loading a board, mongodb is searching for every cards, the id of the parent (in the swinglanes collection).
    // With a huge database, this result in a very slow app and high CPU on the mongodb side.
    // To correct it, add Index to parentId:
    Cards._collection.createIndex({ parentId: 1 });
    // let notifydays = parseInt(process.env.NOTIFY_DUE_DAYS_BEFORE_AND_AFTER) || 2; // default as 2 days b4 and after
    // let notifyitvl = parseInt(process.env.NOTIFY_DUE_AT_HOUR_OF_DAY) || 3600 * 24 * 1e3; // default interval as one day
    // Meteor.call("findDueCards",notifydays,notifyitvl);
    Meteor.defer(() => {
      addCronJob();
    });
  });

  Cards.after.insert((userId, doc) => {
    cardCreation(userId, doc);
  });
  // New activity for card (un)archivage
  Cards.after.update((userId, doc, fieldNames) => {
    cardState(userId, doc, fieldNames);
  });

  //New activity for card moves
  Cards.after.update(function(userId, doc, fieldNames) {
    const oldListId = this.previous.listId;
    const oldSwimlaneId = this.previous.swimlaneId;
    const oldBoardId = this.previous.boardId;
    cardMove(userId, doc, fieldNames, oldListId, oldSwimlaneId, oldBoardId);
  });

  // Add a new activity if we add or remove a member to the card
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    cardMembers(userId, doc, fieldNames, modifier);
    updateActivities(doc, fieldNames, modifier);
  });

  // Add a new activity if we add or remove a assignee to the card
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    cardAssignees(userId, doc, fieldNames, modifier);
    updateActivities(doc, fieldNames, modifier);
  });

  // Add a new activity if we add or remove a label to the card
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    cardLabels(userId, doc, fieldNames, modifier);
  });

  // Add a new activity if we edit a custom field
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    cardCustomFields(userId, doc, fieldNames, modifier);
  });

  // Add a new activity if modify time related field like dueAt startAt etc
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    const dla = 'dateLastActivity';
    const fields = fieldNames.filter(name => name !== dla);
    const timingaction = ['receivedAt', 'dueAt', 'startAt', 'endAt'];
    const action = fields[0];
    if (fields.length > 0 && _.contains(timingaction, action)) {
      // add activities for user change these attributes
      const value = modifier.$set[action];
      const oldvalue = doc[action] || '';
      const activityType = `a-${action}`;
      const card = ReactiveCache.getCard(doc._id);
      const list = card.list();
      if (list) {
        // change list modifiedAt, when user modified the key values in
        // timingaction array, if it's endAt, put the modifiedAt of list
        // back to one year ago for sorting purpose
        const modifiedAt = moment()
          .subtract(1, 'year')
          .toISOString();
        const boardId = list.boardId;
        Lists.direct.update(
          {
            _id: list._id,
          },
          {
            $set: {
              modifiedAt,
              boardId,
            },
          },
        );
      }
      const username = ReactiveCache.getUser(userId).username;
      const activity = {
        userId,
        username,
        activityType,
        boardId: doc.boardId,
        cardId: doc._id,
        cardTitle: doc.title,
        timeKey: action,
        timeValue: value,
        timeOldValue: oldvalue,
        listId: card.listId,
        swimlaneId: card.swimlaneId,
      };
      Activities.insert(activity);
    }
  });
  // Remove all activities associated with a card if we remove the card
  // Remove also card_comments / checklists / attachments
  Cards.before.remove((userId, doc) => {
    cardRemover(userId, doc);
  });
}
//SWIMLANES REST API
if (Meteor.isServer) {
  /**
   * @operation get_swimlane_cards
   * @summary get all cards attached to a swimlane
   *
   * @param {string} boardId the board ID
   * @param {string} swimlaneId the swimlane ID
   * @return_type [{_id: string,
   *                title: string,
   *                description: string,
   *                listId: string}]
   */
  JsonRoutes.add(
    'GET',
    '/api/boards/:boardId/swimlanes/:swimlaneId/cards',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramSwimlaneId = req.params.swimlaneId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: ReactiveCache.getCards({
          boardId: paramBoardId,
          swimlaneId: paramSwimlaneId,
          archived: false,
        },
        { sort: ['sort'] }).map(function(doc) {
          return {
            _id: doc._id,
            title: doc.title,
            description: doc.description,
            listId: doc.listId,
            receivedAt: doc.receivedAt,
            startAt: doc.startAt,
            dueAt: doc.dueAt,
            endAt: doc.endAt,
            assignees: doc.assignees,
            sort: doc.sort,
          };
        }),
      });
    },
  );
}
//LISTS REST API
if (Meteor.isServer) {
  /**
   * @operation get_all_cards
   * @summary Get all Cards attached to a List
   *
   * @param {string} boardId the board ID
   * @param {string} listId the list ID
   * @return_type [{_id: string,
   *                title: string,
   *                description: string}]
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId/cards', function(
    req,
    res,
  ) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: ReactiveCache.getCards({
        boardId: paramBoardId,
        listId: paramListId,
        archived: false,
      },
      { sort: ['sort'] }).map(function(doc) {
        return {
          _id: doc._id,
          title: doc.title,
          description: doc.description,
          swimlaneId: doc.swimlaneId,
          receivedAt: doc.receivedAt,
          startAt: doc.startAt,
          dueAt: doc.dueAt,
          endAt: doc.endAt,
          assignees: doc.assignees,
          sort: doc.sort,
        };
      }),
    });
  });

  /**
   * @operation get_card_by_id
   * @summary Get a Card by Card ID
   *
   * @param {string} cardId the card ID
   * @return_type Cards
   */
  JsonRoutes.add(
    'GET',
    '/api/cards/:cardId',
    function(req, res) {
      const paramCardId = req.params.cardId;
      card = ReactiveCache.getCard(paramCardId)
      Authentication.checkBoardAccess(req.userId, card.boardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: card,
      });
    },
  );

  /**
   * @operation get_card
   * @summary Get a Card
   *
   * @param {string} boardId the board ID
   * @param {string} listId the list ID of the card
   * @param {string} cardId the card ID
   * @return_type Cards
   */
  JsonRoutes.add(
    'GET',
    '/api/boards/:boardId/lists/:listId/cards/:cardId',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      const paramCardId = req.params.cardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: ReactiveCache.getCard({
          _id: paramCardId,
          listId: paramListId,
          boardId: paramBoardId,
          archived: false,
        }),
      });
    },
  );

  /**
   * @operation new_card
   * @summary Create a new Card
   *
   * @param {string} boardId the board ID of the new card
   * @param {string} listId the list ID of the new card
   * @param {string} authorID the user ID of the person owning the card
   * @param {string} parentId the parent ID of the new card
   * @param {string} title the title of the new card
   * @param {string} description the description of the new card
   * @param {string} swimlaneId the swimlane ID of the new card
   * @param {string} [members] the member IDs list of the new card
   * @param {string} [assignees] the assignee IDs list of the new card
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/lists/:listId/cards', function(
    req,
    res,
  ) {
    // Check user is logged in
    Authentication.checkLoggedIn(req.userId);
    const paramBoardId = req.params.boardId;
    // Check user has permission to add card to the board
    const board = ReactiveCache.getBoard(paramBoardId);
    const addPermission = allowIsBoardMemberCommentOnly(req.userId, board);
    Authentication.checkAdminOrCondition(req.userId, addPermission);
    const paramListId = req.params.listId;
    const paramParentId = req.params.parentId;
    const nextCardNumber = board.getNextCardNumber();

    let customFieldsArr = [];
    _.forEach(
      ReactiveCache.getCustomFields({'boardIds': paramBoardId}),
      function (field) {
        if (field.automaticallyOnCard || field.alwaysOnCard)
          customFieldsArr.push({ _id: field._id, value: null });
      },
    );

    const currentCards = ReactiveCache.getCards(
      {
        listId: paramListId,
        archived: false,
      },
      { sort: ['sort'] },
    );
    const check = ReactiveCache.getUser(req.body.authorId);
    const members = req.body.members;
    const assignees = req.body.assignees;
    if (typeof check !== 'undefined') {
      const id = Cards.direct.insert({
        title: req.body.title,
        boardId: paramBoardId,
        listId: paramListId,
        parentId: paramParentId,
        description: req.body.description,
        userId: req.body.authorId,
        swimlaneId: req.body.swimlaneId,
        sort: currentCards.length,
        cardNumber: nextCardNumber,
        customFields: customFieldsArr,
        members,
        assignees,
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });

      const card = ReactiveCache.getCard(id);
      cardCreation(req.body.authorId, card);
    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
      });
    }
  });

/**
 * @operation get_board_cards_count
 * @summary Get a cards count to a board
 *
 * @param {string} boardId the board ID
 * @return_type {board_cards_count: integer}
 */
JsonRoutes.add('GET', '/api/boards/:boardId/cards_count', function(
  req,
  res,
) {
  try {
    const paramBoardId = req.params.boardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        board_cards_count: ReactiveCache.getCards({
          boardId: paramBoardId,
          archived: false,
        }).length,
      }
    });
  } catch (error) {
    JsonRoutes.sendResult(res, {
      code: 200,
      data: error,
    });
  }
});

/**
 * @operation get_list_cards_count
 * @summary Get a cards count to a list
 *
 * @param {string} boardId the board ID
 * @param {string} listId the List ID
 * @return_type {list_cards_count: integer}
 */
  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId/cards_count', function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          list_cards_count: ReactiveCache.getCards({
            boardId: paramBoardId,
            listId: paramListId,
            archived: false,
          }).length,
        }
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });


  /*
   * Note for the JSDoc:
   * 'list' will be interpreted as the path parameter
   * 'listID' will be interpreted as the body parameter
   */
  /**
   * @operation edit_card
   * @summary Edit Fields in a Card
   *
   * @description Edit a card
   *
   * The color has to be chosen between `white`, `green`, `yellow`, `orange`,
   * `red`, `purple`, `blue`, `sky`, `lime`, `pink`, `black`, `silver`,
   * `peachpuff`, `crimson`, `plum`, `darkgreen`, `slateblue`, `magenta`,
   * `gold`, `navy`, `gray`, `saddlebrown`, `paleturquoise`, `mistyrose`,
   * `indigo`:
   *
   * <img src="/card-colors.png" width="40%" alt="Wekan card colors" />
   *
   * Note: setting the color to white has the same effect than removing it.
   *
   * @param {string} boardId the board ID of the card
   * @param {string} list the list ID of the card
   * @param {string} cardId the ID of the card
   * @param {string} [title] the new title of the card
   * @param {string} [sort] the new sort value of the card
   * @param {string} [listId] the new list ID of the card (move operation)
   * @param {string} [description] the new description of the card
   * @param {string} [authorId] change the owner of the card
   * @param {string} [parentId] change the parent of the card
   * @param {string} [labelIds] the new list of label IDs attached to the card
   * @param {string} [swimlaneId] the new swimlane ID of the card
   * @param {string} [members] the new list of member IDs attached to the card
   * @param {string} [assignees] the array of maximum one ID of assignee attached to the card
   * @param {string} [requestedBy] the new requestedBy field of the card
   * @param {string} [assignedBy] the new assignedBy field of the card
   * @param {string} [receivedAt] the new receivedAt field of the card
   * @param {string} [assignBy] the new assignBy field of the card
   * @param {string} [startAt] the new startAt field of the card
   * @param {string} [dueAt] the new dueAt field of the card
   * @param {string} [endAt] the new endAt field of the card
   * @param {string} [spentTime] the new spentTime field of the card
   * @param {boolean} [isOverTime] the new isOverTime field of the card
   * @param {string} [customFields] the new customFields value of the card
   * @param {string} [color] the new color of the card
   * @param {Object} [vote] the vote object
   * @param {string} vote.question the vote question
   * @param {boolean} vote.public show who voted what
   * @param {boolean} vote.allowNonBoardMembers allow all logged in users to vote?
   * @param {Object} [poker] the poker object
   * @param {string} poker.question the vote question
   * @param {boolean} poker.allowNonBoardMembers allow all logged in users to vote?
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'PUT',
    '/api/boards/:boardId/lists/:listId/cards/:cardId',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      const paramListId = req.params.listId;
      const newBoardId = req.body.newBoardId;
      const newSwimlaneId = req.body.newSwimlaneId;
      const newListId = req.body.newListId;
      let updated = false;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      if (req.body.title) {
        const newTitle = req.body.title;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              title: newTitle,
            },
          },
        );
        updated = true;
      }
      if (req.body.sort) {
        const newSort = req.body.sort;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              sort: newSort,
            },
          },
        );
        updated = true;
      }
      if (req.body.parentId) {
        const newParentId = req.body.parentId;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              parentId: newParentId,
            },
          },
        );
        updated = true;
      }
      if (req.body.description) {
        const newDescription = req.body.description;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              description: newDescription,
            },
          },
        );
        updated = true;
      }
      if (req.body.color) {
        const newColor = req.body.color;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { color: newColor } },
        );
        updated = true;
      }
      if (req.body.vote) {
        const newVote = req.body.vote;
        newVote.positive = [];
        newVote.negative = [];
        if (!newVote.hasOwnProperty('public')) newVote.public = false;
        if (!newVote.hasOwnProperty('allowNonBoardMembers'))
          newVote.allowNonBoardMembers = false;

        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { vote: newVote } },
        );
        updated = true;
      }
      if (req.body.poker) {
        const newPoker = req.body.poker;
        newPoker.one = [];
        newPoker.two = [];
        newPoker.three = [];
        newPoker.five = [];
        newPoker.eight = [];
        newPoker.thirteen = [];
        newPoker.twenty = [];
        newPoker.forty = [];
        newPoker.oneHundred = [];
        newPoker.unsure = [];
        if (!newPoker.hasOwnProperty('allowNonBoardMembers'))
          newPoker.allowNonBoardMembers = false;

        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { poker: newPoker } },
        );
        updated = true;
      }
      if (req.body.labelIds) {
        let newlabelIds = req.body.labelIds;
        if (_.isString(newlabelIds)) {
          if (newlabelIds === '') {
            newlabelIds = null;
          } else {
            newlabelIds = [newlabelIds];
          }
        }
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              labelIds: newlabelIds,
            },
          },
        );
        updated = true;
      }
      if (req.body.requestedBy) {
        const newrequestedBy = req.body.requestedBy;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { requestedBy: newrequestedBy } },
        );
        updated = true;
      }
      if (req.body.assignedBy) {
        const newassignedBy = req.body.assignedBy;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { assignedBy: newassignedBy } },
        );
        updated = true;
      }
      if (req.body.receivedAt) {
        const newreceivedAt = req.body.receivedAt;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { receivedAt: newreceivedAt } },
        );
        updated = true;
      }
      if (req.body.startAt) {
        const newstartAt = req.body.startAt;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { startAt: newstartAt } },
        );
        updated = true;
      }
      if (req.body.dueAt) {
        const newdueAt = req.body.dueAt;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { dueAt: newdueAt } },
        );
        updated = true;
      }
      if (req.body.endAt) {
        const newendAt = req.body.endAt;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { endAt: newendAt } },
        );
        updated = true;
      }
      if (req.body.spentTime) {
        const newspentTime = req.body.spentTime;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { spentTime: newspentTime } },
        );
        updated = true;
      }
      if (req.body.isOverTime) {
        const newisOverTime = req.body.isOverTime;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { isOverTime: newisOverTime } },
        );
        updated = true;
      }
      if (req.body.customFields) {
        const newcustomFields = req.body.customFields;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { customFields: newcustomFields } },
        );
        updated = true;
      }
      if (req.body.members) {
        let newmembers = req.body.members;
        if (_.isString(newmembers)) {
          if (newmembers === '') {
            newmembers = null;
          } else {
            newmembers = [newmembers];
          }
        }
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { members: newmembers } },
        );
        updated = true;
      }
      if (req.body.assignees) {
        let newassignees = req.body.assignees;
        if (_.isString(newassignees)) {
          if (newassignees === '') {
            newassignees = null;
          } else {
            newassignees = [newassignees];
          }
        }
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { assignees: newassignees } },
        );
        updated = true;
      }
      if (req.body.swimlaneId) {
        const newParamSwimlaneId = req.body.swimlaneId;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          { $set: { swimlaneId: newParamSwimlaneId } },
        );
        updated = true;
      }
      if (req.body.listId) {
        const newParamListId = req.body.listId;
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              listId: newParamListId,
            },
          },
        );
        updated = true;

        const card = ReactiveCache.getCard(paramCardId);
        cardMove(
          req.body.authorId,
          card,
          {
            fieldName: 'listId',
          },
          paramListId,
        );
      }
      if (newBoardId && newSwimlaneId && newListId) {
        // Move the card to the new board, swimlane, and list
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              boardId: newBoardId,
              swimlaneId: newSwimlaneId,
              listId: newListId,
            },
          },
        );
        updated = true;

        const card = ReactiveCache.getCard(paramCardId);
        cardMove(
          req.userId,
          card,
          ['boardId', 'swimlaneId', 'listId'],
          newListId,
          newSwimlaneId,
          newBoardId,
        );
      }
      if (req.body.archive) {
        function isTrue(data) {
          return String(data).toLowerCase() === 'true';
        }
        var archive = isTrue(req.body.archive);
        Cards.direct.update(
          {
            _id: paramCardId,
            listId: paramListId,
            boardId: paramBoardId,
            archived: !archive,
          },
          {
            $set: {
              archived: archive,
            },
          },
        );
        updated = true;
      }
    // Check if update is true or false
    if (!updated) {
      JsonRoutes.sendResult(res, {
        code: 404,
        data: {
          message: 'Error',
        },
      });
      return;
    }
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramCardId,
        },
      });
    },
  );

  /**
   * @operation delete_card
   * @summary Delete a card from a board
   *
   * @description This operation **deletes** a card, and therefore the card
   * is not put in the recycle bin.
   *
   * @param {string} boardId the board ID of the card
   * @param {string} list the list ID of the card
   * @param {string} cardId the ID of the card
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'DELETE',
    '/api/boards/:boardId/lists/:listId/cards/:cardId',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      const paramCardId = req.params.cardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      const card = ReactiveCache.getCard(paramCardId);
      Cards.direct.remove({
        _id: paramCardId,
        listId: paramListId,
        boardId: paramBoardId,
      });
      cardRemover(req.body.authorId, card);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramCardId,
        },
      });
    },
  );

  /**
   * @operation get_cards_by_custom_field
   * @summary Get all Cards that matchs a value of a specific custom field
   *
   * @param {string} boardId the board ID
   * @param {string} customFieldId the list ID
   * @param {string} customFieldValue the value to look for
   * @return_type [{_id: string,
   *                title: string,
   *                description: string,
   *                listId: string,
   *                swinlaneId: string}]
   */
  JsonRoutes.add(
    'GET',
    '/api/boards/:boardId/cardsByCustomField/:customFieldId/:customFieldValue',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramCustomFieldId = req.params.customFieldId;
      const paramCustomFieldValue = req.params.customFieldValue;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: ReactiveCache.getCards({
          boardId: paramBoardId,
          customFields: {
            $elemMatch: {
              _id: paramCustomFieldId,
              value: paramCustomFieldValue,
            },
          },
          archived: false,
        }),
      });
    },
  );

  /**
  * @operation edit_card_custom_field
  * @summary Edit Custom Field in a Card
  *
  * @description Edit a custom field value in a card
  * @param {string} boardId the board ID of the card
  * @param {string} listId the list ID of the card
  * @param {string} cardId the ID of the card
  * @param {string} customFieldId the ID of the custom field
  * @param {string} value the new custom field value
  * @return_type {_id: string, customFields: [{_id: string, value: object}]}
  */
  JsonRoutes.add(
    'POST',
    '/api/boards/:boardId/lists/:listId/cards/:cardId/customFields/:customFieldId',
    function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      const paramListId = req.params.listId;
      const paramCustomFieldId = req.params.customFieldId;
      const paramCustomFieldValue = req.body.value;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      const card = ReactiveCache.getCard({
        _id: paramCardId,
        listId: paramListId,
        boardId: paramBoardId,
        archived: false,
      });
      if (!card) {
        throw new Meteor.Error(404, 'Card not found');
      }
      const customFields = card.customFields || [];
      const updatedCustomFields = customFields.map(cf => {
        if (cf._id === paramCustomFieldId) {
          return {
            _id: cf._id,
            value: paramCustomFieldValue,
          };
        }
        return cf;
      });
      Cards.direct.update(
        {
          _id: paramCardId,
          listId: paramListId,
          boardId: paramBoardId,
          archived: false,
        },
        { $set: { customFields: updatedCustomFields } },
      );
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramCardId,
          customFields: updatedCustomFields,
        },
      });
    },
  );
}

export default Cards;
