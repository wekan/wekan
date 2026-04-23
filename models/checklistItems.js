import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
const { SimpleSchema } = require('/imports/simpleSchema');

const ChecklistItems = new Mongo.Collection('checklistItems');

/**
 * An item in a checklist
 */
ChecklistItems.attachSchema(
  new SimpleSchema({
    title: {
      /**
       * the text of the item
       */
      type: String,
    },
    sort: {
      /**
       * the sorting field of the item
       */
      type: Number,
    },
    isFinished: {
      /**
       * Is the item checked?
       */
      type: Boolean,
      defaultValue: false,
    },
    checklistId: {
      /**
       * the checklist ID the item is attached to
       */
      type: String,
    },
    cardId: {
      /**
       * the card ID the item is attached to
       */
      type: String,
    },
    createdAt: {
      type: Date,
      optional: true,
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
  }),
);

ChecklistItems.before.insert((userId, doc) => {
  if (!doc.userId) {
    doc.userId = userId;
  }
});

ChecklistItems.helpers({
  async setTitle(title) {
    return await ChecklistItems.updateAsync(this._id, { $set: { title } });
  },
  async check() {
    return await ChecklistItems.updateAsync(this._id, { $set: { isFinished: true } });
  },
  async uncheck() {
    return await ChecklistItems.updateAsync(this._id, { $set: { isFinished: false } });
  },
  async toggleItem() {
    return await ChecklistItems.updateAsync(this._id, { $set: { isFinished: !this.isFinished } });
  },
  async move(checklistId, sortIndex) {
    const checklist = await ReactiveCache.getChecklist(checklistId);
    const cardId = checklist.cardId;
    return await ChecklistItems.updateAsync(this._id, {
      $set: { cardId, checklistId, sort: sortIndex },
    });
  },
});

// Activities helper
export async function itemCreation(userId, doc) {
  const card = await ReactiveCache.getCard(doc.cardId);
  const boardId = card.boardId;
  await Activities.insertAsync({
    userId,
    activityType: 'addChecklistItem',
    cardId: doc.cardId,
    boardId,
    checklistId: doc.checklistId,
    checklistItemId: doc._id,
    checklistItemName: doc.title,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
}

export async function itemRemover(userId, doc) {
  await Activities.removeAsync({
    checklistItemId: doc._id,
  });
}

export async function publishCheckActivity(userId, doc) {
  const card = await ReactiveCache.getCard(doc.cardId);
  const boardId = card.boardId;
  let activityType;
  if (doc.isFinished) {
    activityType = 'checkedItem';
  } else {
    activityType = 'uncheckedItem';
  }
  const act = {
    userId,
    activityType,
    cardId: doc.cardId,
    boardId,
    checklistId: doc.checklistId,
    checklistItemId: doc._id,
    checklistItemName: doc.title,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  };
  await Activities.insertAsync(act);
}

export async function publishChekListCompleted(userId, doc) {
  const card = await ReactiveCache.getCard(doc.cardId);
  const boardId = card.boardId;
  const checklistId = doc.checklistId;
  const checkList = await ReactiveCache.getChecklist(checklistId);
  const checklistItems = await ReactiveCache.getChecklistItems({ checklistId });
  const isChecklistFinished = checkList.hideAllChecklistItems ||
    (checklistItems.length > 0 && checklistItems.length === checklistItems.filter(i => i.isFinished).length);
  if (isChecklistFinished) {
    const act = {
      userId,
      activityType: 'completeChecklist',
      cardId: doc.cardId,
      boardId,
      checklistId: doc.checklistId,
      checklistName: checkList.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    };
    await Activities.insertAsync(act);
  }
}

export async function publishChekListUncompleted(userId, doc) {
  const card = await ReactiveCache.getCard(doc.cardId);
  const boardId = card.boardId;
  const checklistId = doc.checklistId;
  const checkList = await ReactiveCache.getChecklist(checklistId);
  // BUGS in IFTTT Rules: https://github.com/wekan/wekan/issues/1972
  //       Currently in checklist all are set as uncompleted/not checked,
  //       IFTTT Rule does not move card to other list.
  //       If following line is negated/changed to:
  //         if(!isChecklistFinished){
  //       then unchecking of any checkbox will move card to other list,
  //       even when all checkboxes are not yet unchecked.
  //       What is correct code for only moving when all in list is unchecked?
  // TIPS: Finding  files, ignoring some directories with grep -v:
  //         cd wekan
  //         find . | xargs grep 'count' -sl | grep -v .meteor | grep -v node_modules | grep -v .build
  //       Maybe something related here?
  //         wekan/client/components/rules/triggers/checklistTriggers.js
  const uncheckItems = await ReactiveCache.getChecklistItems({ checklistId });
  const isChecklistFinished = checkList.hideAllChecklistItems ||
    (uncheckItems.length > 0 && uncheckItems.length === uncheckItems.filter(i => i.isFinished).length);
  if (isChecklistFinished) {
    const act = {
      userId,
      activityType: 'uncompleteChecklist',
      cardId: doc.cardId,
      boardId,
      checklistId: doc.checklistId,
      checklistName: checkList.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    };
    await Activities.insertAsync(act);
  }
}

export default ChecklistItems;
