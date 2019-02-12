Cards = new Mongo.Collection('cards');

// XXX To improve pub/sub performances a card document should include a
// de-normalized number of comments so we don't have to publish the whole list
// of comments just to display the number of them in the board view.
Cards.attachSchema(new SimpleSchema({
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
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
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
    allowedValues: [
      'white', 'green', 'yellow', 'orange', 'red', 'purple',
      'blue', 'sky', 'lime', 'pink', 'black',
      'silver', 'peachpuff', 'crimson', 'plum', 'darkgreen',
      'slateblue', 'magenta', 'gold', 'navy', 'gray',
      'saddlebrown', 'paleturquoise', 'mistyrose', 'indigo',
    ],
  },
  createdAt: {
    /**
     * creation date
     */
    type: Date,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
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
        type: Match.OneOf(String, Number, Boolean, Date),
        optional: true,
        defaultValue: '',
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
    autoValue() { // eslint-disable-line consistent-return
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
    defaultValue: '',
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
    defaultValue: '',
  },
  linkedId: {
    /**
     * ID of the linked card
     */
    type: String,
    optional: true,
    defaultValue: '',
  },
}));

Cards.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

Cards.helpers({
  list() {
    return Lists.findOne(this.listId);
  },

  board() {
    return Boards.findOne(this.boardId);
  },

  labels() {
    const boardLabels = this.board().labels;
    const cardLabels = _.filter(boardLabels, (label) => {
      return _.contains(this.labelIds, label._id);
    });
    return cardLabels;
  },

  hasLabel(labelId) {
    return _.contains(this.labelIds, labelId);
  },

  user() {
    return Users.findOne(this.userId);
  },

  isAssigned(memberId) {
    return _.contains(this.getMembers(), memberId);
  },

  activities() {
    if (this.isLinkedCard()) {
      return Activities.find({cardId: this.linkedId}, {sort: {createdAt: -1}});
    } else if (this.isLinkedBoard()) {
      return Activities.find({boardId: this.linkedId}, {sort: {createdAt: -1}});
    } else {
      return Activities.find({cardId: this._id}, {sort: {createdAt: -1}});
    }
  },

  comments() {
    if (this.isLinkedCard()) {
      return CardComments.find({cardId: this.linkedId}, {sort: {createdAt: -1}});
    } else {
      return CardComments.find({cardId: this._id}, {sort: {createdAt: -1}});
    }
  },

  attachments() {
    if (this.isLinkedCard()) {
      return Attachments.find({cardId: this.linkedId}, {sort: {uploadedAt: -1}});
    } else {
      return Attachments.find({cardId: this._id}, {sort: {uploadedAt: -1}});
    }
  },

  cover() {
    const cover = Attachments.findOne(this.coverId);
    // if we return a cover before it is fully stored, we will get errors when we try to display it
    // todo XXX we could return a default "upload pending" image in the meantime?
    return cover && cover.url() && cover;
  },

  checklists() {
    if (this.isLinkedCard()) {
      return Checklists.find({cardId: this.linkedId}, {sort: { sort: 1 } });
    } else {
      return Checklists.find({cardId: this._id}, {sort: { sort: 1 } });
    }
  },

  checklistItemCount() {
    const checklists = this.checklists().fetch();
    return checklists.map((checklist) => {
      return checklist.itemCount();
    }).reduce((prev, next) => {
      return prev + next;
    }, 0);
  },

  checklistFinishedCount() {
    const checklists = this.checklists().fetch();
    return checklists.map((checklist) => {
      return checklist.finishedCount();
    }).reduce((prev, next) => {
      return prev + next;
    }, 0);
  },

  checklistFinished() {
    return this.hasChecklist() && this.checklistItemCount() === this.checklistFinishedCount();
  },

  hasChecklist() {
    return this.checklistItemCount() !== 0;
  },

  subtasks() {
    return Cards.find({
      parentId: this._id,
      archived: false,
    }, {
      sort: {
        sort: 1,
      },
    });
  },

  allSubtasks() {
    return Cards.find({
      parentId: this._id,
      archived: false,
    }, {
      sort: {
        sort: 1,
      },
    });
  },

  subtasksCount() {
    return Cards.find({
      parentId: this._id,
      archived: false,
    }).count();
  },

  subtasksFinishedCount() {
    return Cards.find({
      parentId: this._id,
      archived: true,
    }).count();
  },

  subtasksFinished() {
    const finishCount = this.subtasksFinishedCount();
    return finishCount > 0 && this.subtasksCount() === finishCount;
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
    const definitions = CustomFields.find({
      boardId: this.boardId,
    }).fetch();

    // match right definition to each field
    if (!this.customFields) return [];
    return this.customFields.map((customField) => {
      const definition = definitions.find((definition) => {
        return definition._id === customField._id;
      });
      //search for "True Value" which is for DropDowns other then the Value (which is the id)
      let trueValue = customField.value;
      if (definition.settings.dropdownItems && definition.settings.dropdownItems.length > 0) {
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
  },

  colorClass() {
    if (this.color)
      return this.color;
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

  canBeRestored() {
    const list = Lists.findOne({
      _id: this.listId,
    });
    if (!list.getWipLimit('soft') && list.getWipLimit('enabled') && list.getWipLimit('value') === list.cards().count()) {
      return false;
    }
    return true;
  },

  parentCard() {
    if (this.parentId === '') {
      return null;
    }
    return Cards.findOne(this.parentId);
  },

  parentCardName() {
    let result = '';
    if (this.parentId !== '') {
      const card = Cards.findOne(this.parentId);
      if (card) {
        result = card.title;
      }
    }
    return result;
  },

  parentListId() {
    const result = [];
    let crtParentId = this.parentId;
    while (crtParentId !== '') {
      const crt = Cards.findOne(crtParentId);
      if ((crt === null) || (crt === undefined)) {
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
    while (crtParentId !== '') {
      const crt = Cards.findOne(crtParentId);
      if ((crt === null) || (crt === undefined)) {
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
    return this.parentList().map(function(elem) {
      return elem.title;
    }).join(sep);
  },

  isTopLevel() {
    return this.parentId === '';
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
    if (this.isLinkedCard()) {
      return Cards.update({_id: this.linkedId}, {$set: {description}});
    } else if (this.isLinkedBoard()) {
      return Boards.update({_id: this.linkedId}, {$set: {description}});
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {description}}
      );
    }
  },

  getDescription() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({_id: this.linkedId});
      if (card && card.description)
        return card.description;
      else
        return null;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({_id: this.linkedId});
      if (board && board.description)
        return board.description;
      else
        return null;
    } else if (this.description) {
      return this.description;
    } else {
      return null;
    }
  },

  getMembers() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({_id: this.linkedId});
      return card.members;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({_id: this.linkedId});
      return board.activeMembers().map((member) => {
        return member.userId;
      });
    } else {
      return this.members;
    }
  },

  assignMember(memberId) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        { $addToSet: { members: memberId }}
      );
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({_id: this.linkedId});
      return board.addMember(memberId);
    } else {
      return Cards.update(
        { _id: this._id },
        { $addToSet: { members: memberId}}
      );
    }
  },

  unassignMember(memberId) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        { $pull: { members: memberId }}
      );
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({_id: this.linkedId});
      return board.removeMember(memberId);
    } else {
      return Cards.update(
        { _id: this._id },
        { $pull: { members: memberId}}
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

  getReceived() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({_id: this.linkedId});
      return card.receivedAt;
    } else {
      return this.receivedAt;
    }
  },

  setReceived(receivedAt) {
    if (this.isLinkedCard()) {
      return Cards.update(
        {_id: this.linkedId},
        {$set: {receivedAt}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {receivedAt}}
      );
    }
  },

  getStart() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({_id: this.linkedId});
      return card.startAt;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({_id: this.linkedId});
      return board.startAt;
    } else {
      return this.startAt;
    }
  },

  setStart(startAt) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        {$set: {startAt}}
      );
    } else if (this.isLinkedBoard()) {
      return Boards.update(
        {_id: this.linkedId},
        {$set: {startAt}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {startAt}}
      );
    }
  },

  getDue() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({_id: this.linkedId});
      return card.dueAt;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({_id: this.linkedId});
      return board.dueAt;
    } else {
      return this.dueAt;
    }
  },

  setDue(dueAt) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        {$set: {dueAt}}
      );
    } else if (this.isLinkedBoard()) {
      return Boards.update(
        {_id: this.linkedId},
        {$set: {dueAt}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {dueAt}}
      );
    }
  },

  getEnd() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({_id: this.linkedId});
      return card.endAt;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({_id: this.linkedId});
      return board.endAt;
    } else {
      return this.endAt;
    }
  },

  setEnd(endAt) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        {$set: {endAt}}
      );
    } else if (this.isLinkedBoard()) {
      return Boards.update(
        {_id: this.linkedId},
        {$set: {endAt}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {endAt}}
      );
    }
  },

  getIsOvertime() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({ _id: this.linkedId });
      return card.isOvertime;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({ _id: this.linkedId});
      return board.isOvertime;
    } else {
      return this.isOvertime;
    }
  },

  setIsOvertime(isOvertime) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        {$set: {isOvertime}}
      );
    } else if (this.isLinkedBoard()) {
      return Boards.update(
        {_id: this.linkedId},
        {$set: {isOvertime}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {isOvertime}}
      );
    }
  },

  getSpentTime() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({ _id: this.linkedId });
      return card.spentTime;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({ _id: this.linkedId});
      return board.spentTime;
    } else {
      return this.spentTime;
    }
  },

  setSpentTime(spentTime) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        {$set: {spentTime}}
      );
    } else if (this.isLinkedBoard()) {
      return Boards.update(
        {_id: this.linkedId},
        {$set: {spentTime}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {spentTime}}
      );
    }
  },

  getId() {
    if (this.isLinked()) {
      return this.linkedId;
    } else {
      return this._id;
    }
  },

  getTitle() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({ _id: this.linkedId });
      return card.title;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({ _id: this.linkedId});
      return board.title;
    } else {
      return this.title;
    }
  },

  getBoardTitle() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({ _id: this.linkedId });
      const board = Boards.findOne({ _id: card.boardId });
      return board.title;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({ _id: this.linkedId});
      return board.title;
    } else {
      const board = Boards.findOne({ _id: this.boardId });
      return board.title;
    }
  },

  setTitle(title) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        {$set: {title}}
      );
    } else if (this.isLinkedBoard()) {
      return Boards.update(
        {_id: this.linkedId},
        {$set: {title}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {title}}
      );
    }
  },

  getArchived() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({ _id: this.linkedId });
      return card.archived;
    } else if (this.isLinkedBoard()) {
      const board = Boards.findOne({ _id: this.linkedId});
      return board.archived;
    } else {
      return this.archived;
    }
  },

  setRequestedBy(requestedBy) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        {$set: {requestedBy}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {requestedBy}}
      );
    }
  },

  getRequestedBy() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({ _id: this.linkedId });
      return card.requestedBy;
    } else  {
      return this.requestedBy;
    }
  },

  setAssignedBy(assignedBy) {
    if (this.isLinkedCard()) {
      return Cards.update(
        { _id: this.linkedId },
        {$set: {assignedBy}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {assignedBy}}
      );
    }
  },

  getAssignedBy() {
    if (this.isLinkedCard()) {
      const card = Cards.findOne({ _id: this.linkedId });
      return card.assignedBy;
    } else  {
      return this.assignedBy;
    }
  },
});

Cards.mutations({
  applyToChildren(funct) {
    Cards.find({
      parentId: this._id,
    }).forEach((card) => {
      funct(card);
    });
  },

  archive() {
    this.applyToChildren((card) => {
      return card.archive();
    });
    return {
      $set: {
        archived: true,
      },
    };
  },

  restore() {
    this.applyToChildren((card) => {
      return card.restore();
    });
    return {
      $set: {
        archived: false,
      },
    };
  },

  setTitle(title) {
    return {
      $set: {
        title,
      },
    };
  },

  setDescription(description) {
    return {
      $set: {
        description,
      },
    };
  },

  setRequestedBy(requestedBy) {
    return {
      $set: {
        requestedBy,
      },
    };
  },

  setAssignedBy(assignedBy) {
    return {
      $set: {
        assignedBy,
      },
    };
  },

  move(swimlaneId, listId, sortIndex) {
    const list = Lists.findOne(listId);
    const mutatedFields = {
      swimlaneId,
      listId,
      boardId: list.boardId,
      sort: sortIndex,
    };

    return {
      $set: mutatedFields,
    };
  },

  addLabel(labelId) {
    return {
      $addToSet: {
        labelIds: labelId,
      },
    };
  },

  removeLabel(labelId) {
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

  unassignMember(memberId) {
    return {
      $pull: {
        members: memberId,
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

  setReceived(receivedAt) {
    return {
      $set: {
        receivedAt,
      },
    };
  },

  unsetReceived() {
    return {
      $unset: {
        receivedAt: '',
      },
    };
  },

  setStart(startAt) {
    return {
      $set: {
        startAt,
      },
    };
  },

  unsetStart() {
    return {
      $unset: {
        startAt: '',
      },
    };
  },

  setDue(dueAt) {
    return {
      $set: {
        dueAt,
      },
    };
  },

  unsetDue() {
    return {
      $unset: {
        dueAt: '',
      },
    };
  },

  setEnd(endAt) {
    return {
      $set: {
        endAt,
      },
    };
  },

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
});

//FUNCTIONS FOR creation of Activities

function cardMove(userId, doc, fieldNames, oldListId, oldSwimlaneId) {
  if ((_.contains(fieldNames, 'listId') && doc.listId !== oldListId) ||
      (_.contains(fieldNames, 'swimlaneId') && doc.swimlaneId !== oldSwimlaneId)){
    Activities.insert({
      userId,
      oldListId,
      activityType: 'moveCard',
      listName: Lists.findOne(doc.listId).title,
      listId: doc.listId,
      boardId: doc.boardId,
      cardId: doc._id,
      cardTitle:doc.title,
      swimlaneName: Swimlanes.findOne(doc.swimlaneId).title,
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
        listName: Lists.findOne(doc.listId).title,
        boardId: doc.boardId,
        listId: doc.listId,
        cardId: doc._id,
      });
    } else {
      Activities.insert({
        userId,
        activityType: 'restoredCard',
        boardId: doc.boardId,
        listName: Lists.findOne(doc.listId).title,
        listId: doc.listId,
        cardId: doc._id,
      });
    }
  }
}

function cardMembers(userId, doc, fieldNames, modifier) {
  if (!_.contains(fieldNames, 'members'))
    return;
  let memberId;
  // Say hello to the new member
  if (modifier.$addToSet && modifier.$addToSet.members) {
    memberId = modifier.$addToSet.members;
    const username = Users.findOne(memberId).username;
    if (!_.contains(doc.members, memberId)) {
      Activities.insert({
        userId,
        username,
        activityType: 'joinMember',
        boardId: doc.boardId,
        cardId: doc._id,
      });
    }
  }

  // Say goodbye to the former member
  if (modifier.$pull && modifier.$pull.members) {
    memberId = modifier.$pull.members;
    const username = Users.findOne(memberId).username;
    // Check that the former member is member of the card
    if (_.contains(doc.members, memberId)) {
      Activities.insert({
        userId,
        username,
        activityType: 'unjoinMember',
        boardId: doc.boardId,
        cardId: doc._id,
      });
    }
  }
}

function cardLabels(userId, doc, fieldNames, modifier) {
  if (!_.contains(fieldNames, 'labelIds'))
    return;
  let labelId;
  // Say hello to the new label
  if (modifier.$addToSet && modifier.$addToSet.labelIds) {
    labelId = modifier.$addToSet.labelIds;
    if (!_.contains(doc.labelIds, labelId)) {
      const act = {
        userId,
        labelId,
        activityType: 'addedLabel',
        boardId: doc.boardId,
        cardId: doc._id,
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
      });
    }
  }
}

function cardCreation(userId, doc) {
  Activities.insert({
    userId,
    activityType: 'createCard',
    boardId: doc.boardId,
    listName: Lists.findOne(doc.listId).title,
    listId: doc.listId,
    cardId: doc._id,
    cardTitle:doc.title,
    swimlaneName: Swimlanes.findOne(doc.swimlaneId).title,
    swimlaneId: doc.swimlaneId,
  });
}

function cardRemover(userId, doc) {
  Activities.remove({
    cardId: doc._id,
  });
  Checklists.remove({
    cardId: doc._id,
  });
  Subtasks.remove({
    cardId: doc._id,
  });
  CardComments.remove({
    cardId: doc._id,
  });
  Attachments.remove({
    cardId: doc._id,
  });
}

if (Meteor.isServer) {
  // Cards are often fetched within a board, so we create an index to make these
  // queries more efficient.
  Meteor.startup(() => {
    Cards._collection._ensureIndex({boardId: 1, createdAt: -1});
    // https://github.com/wekan/wekan/issues/1863
    // Swimlane added a new field in the cards collection of mongodb named parentId.
    // When loading a board, mongodb is searching for every cards, the id of the parent (in the swinglanes collection).
    // With a huge database, this result in a very slow app and high CPU on the mongodb side.
    // To correct it, add Index to parentId:
    Cards._collection._ensureIndex({parentId: 1});
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
    cardMove(userId, doc, fieldNames, oldListId, oldSwimlaneId);
  });

  // Add a new activity if we add or remove a member to the card
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    cardMembers(userId, doc, fieldNames, modifier);
  });

  // Add a new activity if we add or remove a label to the card
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    cardLabels(userId, doc, fieldNames, modifier);
  });

  // Remove all activities associated with a card if we remove the card
  // Remove also card_comments / checklists / attachments
  Cards.after.remove((userId, doc) => {
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
  JsonRoutes.add('GET', '/api/boards/:boardId/swimlanes/:swimlaneId/cards', function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramSwimlaneId = req.params.swimlaneId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: Cards.find({
        boardId: paramBoardId,
        swimlaneId: paramSwimlaneId,
        archived: false,
      }).map(function(doc) {
        return {
          _id: doc._id,
          title: doc.title,
          description: doc.description,
          listId: doc.listId,
        };
      }),
    });
  });
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
  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId/cards', function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: Cards.find({
        boardId: paramBoardId,
        listId: paramListId,
        archived: false,
      }).map(function(doc) {
        return {
          _id: doc._id,
          title: doc.title,
          description: doc.description,
        };
      }),
    });
  });

  /**
   * @operation get_card
   * @summary Get a Card
   *
   * @param {string} boardId the board ID
   * @param {string} listId the list ID of the card
   * @param {string} cardId the card ID
   * @return_type Cards
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId/cards/:cardId', function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    const paramCardId = req.params.cardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: Cards.findOne({
        _id: paramCardId,
        listId: paramListId,
        boardId: paramBoardId,
        archived: false,
      }),
    });
  });

  /**
   * @operation new_card
   * @summary Create a new Card
   *
   * @param {string} boardId the board ID of the new card
   * @param {string} listId the list ID of the new card
   * @param {string} authorID the user ID of the person owning the card
   * @param {string} title the title of the new card
   * @param {string} description the description of the new card
   * @param {string} swimlaneId the swimlane ID of the new card
   * @param {string} [members] the member IDs list of the new card
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/lists/:listId/cards', function(req, res) {
    Authentication.checkUserId(req.userId);
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    const currentCards = Cards.find({
      listId: paramListId,
      archived: false,
    }, { sort: ['sort'] });
    const check = Users.findOne({
      _id: req.body.authorId,
    });
    const members = req.body.members || [req.body.authorId];
    if (typeof check !== 'undefined') {
      const id = Cards.direct.insert({
        title: req.body.title,
        boardId: paramBoardId,
        listId: paramListId,
        description: req.body.description,
        userId: req.body.authorId,
        swimlaneId: req.body.swimlaneId,
        sort: currentCards.count(),
        members,
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });

      const card = Cards.findOne({
        _id: id,
      });
      cardCreation(req.body.authorId, card);

    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
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
   * @param {string} [listId] the new list ID of the card (move operation)
   * @param {string} [description] the new description of the card
   * @param {string} [authorId] change the owner of the card
   * @param {string} [labelIds] the new list of label IDs attached to the card
   * @param {string} [swimlaneId] the new swimlane ID of the card
   * @param {string} [members] the new list of member IDs attached to the card
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
   * @return_type {_id: string}
   */
  JsonRoutes.add('PUT', '/api/boards/:boardId/lists/:listId/cards/:cardId', function(req, res) {
    Authentication.checkUserId(req.userId);
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramListId = req.params.listId;

    if (req.body.hasOwnProperty('title')) {
      const newTitle = req.body.title;
      Cards.direct.update({
        _id: paramCardId,
        listId: paramListId,
        boardId: paramBoardId,
        archived: false,
      }, {
        $set: {
          title: newTitle,
        },
      });
    }
    if (req.body.hasOwnProperty('listId')) {
      const newParamListId = req.body.listId;
      Cards.direct.update({
        _id: paramCardId,
        listId: paramListId,
        boardId: paramBoardId,
        archived: false,
      }, {
        $set: {
          listId: newParamListId,
        },
      });

      const card = Cards.findOne({
        _id: paramCardId,
      });
      cardMove(req.body.authorId, card, {
        fieldName: 'listId',
      }, paramListId);

    }
    if (req.body.hasOwnProperty('description')) {
      const newDescription = req.body.description;
      Cards.direct.update({
        _id: paramCardId,
        listId: paramListId,
        boardId: paramBoardId,
        archived: false,
      }, {
        $set: {
          description: newDescription,
        },
      });
    }
    if (req.body.hasOwnProperty('color')) {
      const newColor = req.body.color;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {color: newColor}});
    }
    if (req.body.hasOwnProperty('labelIds')) {
      let newlabelIds = req.body.labelIds;
      if (_.isString(newlabelIds)) {
        if (newlabelIds === '') {
          newlabelIds = null;
        }
        else {
          newlabelIds = [newlabelIds];
        }
      }
      Cards.direct.update({
        _id: paramCardId,
        listId: paramListId,
        boardId: paramBoardId,
        archived: false,
      }, {
        $set: {
          labelIds: newlabelIds,
        },
      });
    }
    if (req.body.hasOwnProperty('requestedBy')) {
      const newrequestedBy = req.body.requestedBy;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {requestedBy: newrequestedBy}});
    }
    if (req.body.hasOwnProperty('assignedBy')) {
      const newassignedBy = req.body.assignedBy;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {assignedBy: newassignedBy}});
    }
    if (req.body.hasOwnProperty('receivedAt')) {
      const newreceivedAt = req.body.receivedAt;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {receivedAt: newreceivedAt}});
    }
    if (req.body.hasOwnProperty('startAt')) {
      const newstartAt = req.body.startAt;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {startAt: newstartAt}});
    }
    if (req.body.hasOwnProperty('dueAt')) {
      const newdueAt = req.body.dueAt;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {dueAt: newdueAt}});
    }
    if (req.body.hasOwnProperty('endAt')) {
      const newendAt = req.body.endAt;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {endAt: newendAt}});
    }
    if (req.body.hasOwnProperty('spentTime')) {
      const newspentTime = req.body.spentTime;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {spentTime: newspentTime}});
    }
    if (req.body.hasOwnProperty('isOverTime')) {
      const newisOverTime = req.body.isOverTime;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {isOverTime: newisOverTime}});
    }
    if (req.body.hasOwnProperty('customFields')) {
      const newcustomFields = req.body.customFields;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {customFields: newcustomFields}});
    }
    if (req.body.hasOwnProperty('members')) {
      let newmembers = req.body.members;
      if (_.isString(newmembers)) {
        if (newmembers === '') {
          newmembers = null;
        }
        else {
          newmembers = [newmembers];
        }
      }
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {members: newmembers}});
    }
    if (req.body.hasOwnProperty('swimlaneId')) {
      const newParamSwimlaneId = req.body.swimlaneId;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {swimlaneId: newParamSwimlaneId}});
    }
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramCardId,
      },
    });
  });

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
  JsonRoutes.add('DELETE', '/api/boards/:boardId/lists/:listId/cards/:cardId', function(req, res) {
    Authentication.checkUserId(req.userId);
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    const paramCardId = req.params.cardId;

    Cards.direct.remove({
      _id: paramCardId,
      listId: paramListId,
      boardId: paramBoardId,
    });
    const card = Cards.find({
      _id: paramCardId,
    });
    cardRemover(req.body.authorId, card);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramCardId,
      },
    });

  });
}
