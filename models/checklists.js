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
    const newChecklistId = await Checklists.insertAsync(copyObj);
    const items = await ReactiveCache.getChecklistItems({ checklistId: this._id });
    for (const item of items) {
      item._id = null;
      item.checklistId = newChecklistId;
      item.cardId = newCardId;
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
  showChecklist(hideFinishedChecklistIfItemsAreHidden) {
    let ret = true;
    if (this.isFinished() && hideFinishedChecklistIfItemsAreHidden === true && (this.hideCheckedChecklistItems === true || this.hideAllChecklistItems)) {
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
