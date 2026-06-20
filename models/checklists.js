import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache, ReactiveMiniMongoIndex } from '/imports/reactiveCache';
import Activities from '/models/activities';
import ChecklistItems from '/models/checklistItems';
const { SimpleSchema } = require('/imports/simpleSchema');

const Checklists = new Mongo.Collection('checklists');

/**
 * A Checklist
 */
Checklists.attachSchema(
  new SimpleSchema({
    cardId: {
      /**
       * The ID of the card the checklist is in
       */
      type: String,
    },
    boardId: {
      /**
       * The ID of the board the checklist's card is on. Denormalized from the
       * card so the board publication can publish checklists with a single
       * reactive cursor filtered by boardId (a new checklist on a new card then
       * publishes reactively). Kept in sync on insert, on checklist move to
       * another card, and when the card moves to another board.
       */
      type: String,
      optional: true,
    },
    title: {
      /**
       * the title of the checklist
       */
      type: String,
      defaultValue: 'Checklist',
    },
    finishedAt: {
      /**
       * When was the checklist finished
       */
      type: Date,
      optional: true,
    },
    createdAt: {
      /**
       * Creation date of the checklist
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
    sort: {
      /**
       * sorting value of the checklist
       */
      type: Number,
    },
    hideCheckedChecklistItems: {
      /**
       * hide the checked checklist-items?
       */
      type: Boolean,
      optional: true,
    },
    hideAllChecklistItems: {
      /**
       * hide all checklist items ?
       */
      type: Boolean,
      optional: true,
    },
    showChecklistAtMinicard: {
      /**
       * show this checklist on minicard?
       */
      type: Boolean,
      defaultValue: false,
    },
  }),
);

Checklists.helpers({
  async copy(newCardId) {
    let copyObj = Object.assign({}, this);
    delete copyObj._id;
    copyObj.cardId = newCardId;
    // Drop the copied boardId so the server before.insert hook re-derives it
    // from the destination card (which may be on a different board).
    delete copyObj.boardId;
    const newChecklistId = await Checklists.insertAsync(copyObj);
    const items = await ReactiveCache.getChecklistItems({ checklistId: this._id });
    for (const item of items) {
      item._id = null;
      item.checklistId = newChecklistId;
      item.cardId = newCardId;
      delete item.boardId;
      await ChecklistItems.insertAsync(item);
    }
  },

  itemCount() {
    const ret = this.items().length;
    return ret;
  },
  items() {
    const ret = ReactiveMiniMongoIndex.getChecklistItemsWithChecklistId(this._id, {}, { sort: ['sort'] });
    return ret;

  },
  firstItem() {
    const ret = this.items()[0];
    return ret;
  },
  lastItem() {
    const ret = this.items().at(-1);
    return ret;
  },
  finishedCount() {
    const ret = this.items().filter(_item => _item.isFinished).length;
    return ret;
  },
  /** returns the finished percent of the checklist */
  finishedPercent() {
    const count = this.itemCount();
    const checklistItemsFinished = this.finishedCount();

    let ret = 0;

    if (count > 0) {
      ret = Math.round(checklistItemsFinished / count * 100);
    }
    return ret;
  },
  isFinished() {
    let ret = this.hideAllChecklistItems;
    if (!ret) {
      ret = 0 !== this.itemCount() && this.itemCount() === this.finishedCount();
    }
    return ret;
  },
  /** Per-checklist "hide checked items" state, read from THIS checklist only
   * (issue #5408). Never falls back to a card/global flag, so toggling one
   * checklist never affects the others. Kept in sync with the pure helper
   * checklistHideState() in server/lib/checklistHide.js (unit-tested there). */
  hideCheckedState() {
    return this.hideCheckedChecklistItems === true;
  },
  /** Should the given (checked/unchecked) item be hidden for THIS checklist?
   * An item is hidden only when it is checked and this checklist's toggle is
   * on. Mirrors the pure helper isItemHidden() in server/lib/checklistHide.js. */
  isItemHidden(isChecked) {
    return isChecked === true && this.hideCheckedState() === true;
  },
  showChecklist(hideFinishedChecklistIfItemsAreHidden) {
    let ret = true;
    if (this.isFinished() && hideFinishedChecklistIfItemsAreHidden === true && (this.hideCheckedState() === true || this.hideAllChecklistItems)) {
      ret = false;
    }
    return ret;
  },
  async checkAllItems() {
    const checkItems = await ReactiveCache.getChecklistItems({ checklistId: this._id });
    for (const item of checkItems) {
      await item.check();
    }
  },
  async uncheckAllItems() {
    const checkItems = await ReactiveCache.getChecklistItems({ checklistId: this._id });
    for (const item of checkItems) {
      await item.uncheck();
    }
  },
  itemIndex(itemId) {
    const items = ReactiveCache.getChecklist({ _id: this._id }).items;
    return items.map(item => item._id).indexOf(itemId);
  },

  async setTitle(title) {
    return await Checklists.updateAsync(this._id, { $set: { title } });
  },
  /** move the checklist to another card
   * @param newCardId move the checklist to this cardId
   */
  async move(newCardId) {
    // Note: Activities and ChecklistItems updates are now handled server-side
    // in the moveChecklist Meteor method to avoid client-side permission issues
    return await Checklists.updateAsync(this._id, { $set: { cardId: newCardId } });
  },
  async toggleHideCheckedChecklistItems() {
    return await Checklists.updateAsync(this._id, {
      $set: { hideCheckedChecklistItems: !this.hideCheckedChecklistItems },
    });
  },
  async toggleHideAllChecklistItems() {
    return await Checklists.updateAsync(this._id, {
      $set: { hideAllChecklistItems: !this.hideAllChecklistItems },
    });
  },
  async toggleShowChecklistAtMinicard() {
    return await Checklists.updateAsync(this._id, {
      $set: { showChecklistAtMinicard: !this.showChecklistAtMinicard },
    });
  },
});

Checklists.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  if (!doc.userId) {
    doc.userId = userId;
  }
});
export default Checklists;
