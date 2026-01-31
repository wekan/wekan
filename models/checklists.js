import { ReactiveCache, ReactiveMiniMongoIndex } from '/imports/reactiveCache';

Checklists = new Mongo.Collection('checklists');

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
      denyUpdate: false,
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
    sort: {
      /**
       * sorting value of the checklist
       */
      type: Number,
      decimal: true,
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
    const newChecklistId = Checklists.insert(copyObj);
    const items = await ReactiveCache.getChecklistItems({ checklistId: this._id });
    for (const item of items) {
      item._id = null;
      item.checklistId = newChecklistId;
      item.cardId = newCardId;
      ChecklistItems.insert(item);
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
    const ret = _.first(this.items());
    return ret;
  },
  lastItem() {
    const ret = _.last(this.items());
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
  async itemIndex(itemId) {
    const checklist = await ReactiveCache.getChecklist({ _id: this._id });
    const items = checklist.items;
    return _.pluck(items, '_id').indexOf(itemId);
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

Checklists.allow({
  async insert(userId, doc) {
    // ReadOnly users cannot create checklists
    return allowIsBoardMemberWithWriteAccessByCard(userId, await ReactiveCache.getCard(doc.cardId));
  },
  async update(userId, doc) {
    // ReadOnly users cannot edit checklists
    return allowIsBoardMemberWithWriteAccessByCard(userId, await ReactiveCache.getCard(doc.cardId));
  },
  async remove(userId, doc) {
    // ReadOnly users cannot delete checklists
    return allowIsBoardMemberWithWriteAccessByCard(userId, await ReactiveCache.getCard(doc.cardId));
  },
  fetch: ['userId', 'cardId'],
});

Checklists.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  if (!doc.userId) {
    doc.userId = userId;
  }
});


if (Meteor.isServer) {
  Meteor.methods({
    async moveChecklist(checklistId, newCardId) {
      check(checklistId, String);
      check(newCardId, String);

      const checklist = await ReactiveCache.getChecklist(checklistId);
      if (!checklist) {
        throw new Meteor.Error('checklist-not-found', 'Checklist not found');
      }

      const newCard = await ReactiveCache.getCard(newCardId);
      if (!newCard) {
        throw new Meteor.Error('card-not-found', 'Target card not found');
      }

      // Check permissions on both source and target cards
      const sourceCard = await ReactiveCache.getCard(checklist.cardId);
      if (!allowIsBoardMemberByCard(this.userId, sourceCard)) {
        throw new Meteor.Error('not-authorized', 'Not authorized to move checklist from source card');
      }
      if (!allowIsBoardMemberByCard(this.userId, newCard)) {
        throw new Meteor.Error('not-authorized', 'Not authorized to move checklist to target card');
      }

      // Update activities
      const activities = await ReactiveCache.getActivities({ checklistId });
      for (const activity of activities) {
        Activities.update(activity._id, {
          $set: {
            cardId: newCardId,
          },
        });
      }

      // Update checklist items
      const checklistItems = await ReactiveCache.getChecklistItems({ checklistId });
      for (const checklistItem of checklistItems) {
        ChecklistItems.update(checklistItem._id, {
          $set: {
            cardId: newCardId,
          },
        });
      }

      // Update the checklist itself
      Checklists.update(checklistId, {
        $set: {
          cardId: newCardId,
        },
      });

      return checklistId;
    },
  });

  Meteor.startup(async () => {
    await Checklists._collection.createIndexAsync({ modifiedAt: -1 });
    await Checklists._collection.createIndexAsync({ cardId: 1, createdAt: 1 });
  });

  Checklists.after.insert(async (userId, doc) => {
    const card = await ReactiveCache.getCard(doc.cardId);
    Activities.insert({
      userId,
      activityType: 'addChecklist',
      cardId: doc.cardId,
      boardId: card.boardId,
      checklistId: doc._id,
      checklistName: doc.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    });
  });

  Checklists.before.remove(async (userId, doc) => {
    const activities = await ReactiveCache.getActivities({ checklistId: doc._id });
    const card = await ReactiveCache.getCard(doc.cardId);
    if (activities) {
      for (const activity of activities) {
        Activities.remove(activity._id);
      }
    }
    Activities.insert({
      userId,
      activityType: 'removeChecklist',
      cardId: doc.cardId,
      boardId: (await ReactiveCache.getCard(doc.cardId)).boardId,
      checklistId: doc._id,
      checklistName: doc.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    });
  });
}

if (Meteor.isServer) {
  /**
   * @operation get_all_checklists
   * @summary Get the list of checklists attached to a card
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @return_type [{_id: string,
   *                title: string}]
   */
  JsonRoutes.add(
    'GET',
    '/api/boards/:boardId/cards/:cardId/checklists',
    async function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      // Verify the card belongs to the board
      const card = await ReactiveCache.getCard({
        _id: paramCardId,
        boardId: paramBoardId,
      });
      if (!card) {
        JsonRoutes.sendResult(res, {
          code: 404,
          data: { error: 'Card not found or does not belong to the specified board' },
        });
        return;
      }

      const checklists = (await ReactiveCache.getChecklists({ cardId: paramCardId })).map(function(
        doc,
      ) {
        return {
          _id: doc._id,
          title: doc.title,
        };
      });
      if (checklists) {
        JsonRoutes.sendResult(res, {
          code: 200,
          data: checklists,
        });
      } else {
        JsonRoutes.sendResult(res, {
          code: 500,
        });
      }
    },
  );

  /**
   * @operation get_checklist
   * @summary Get a checklist
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} checklistId the ID of the checklist
   * @return_type {cardId: string,
   *               title: string,
   *               finishedAt: string,
   *               createdAt: string,
   *               sort: number,
   *               items: [{_id: string,
   *                        title: string,
   *                        isFinished: boolean}]}
   */
  JsonRoutes.add(
    'GET',
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId',
    async function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramChecklistId = req.params.checklistId;
      const paramCardId = req.params.cardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      // Verify the card belongs to the board
      const card = await ReactiveCache.getCard({
        _id: paramCardId,
        boardId: paramBoardId,
      });
      if (!card) {
        JsonRoutes.sendResult(res, {
          code: 404,
          data: { error: 'Card not found or does not belong to the specified board' },
        });
        return;
      }

      const checklist = await ReactiveCache.getChecklist({
        _id: paramChecklistId,
        cardId: paramCardId,
      });
      if (checklist) {
        checklist.items = (await ReactiveCache.getChecklistItems({
          checklistId: checklist._id,
        })).map(function(doc) {
          return {
            _id: doc._id,
            title: doc.title,
            isFinished: doc.isFinished,
          };
        });
        JsonRoutes.sendResult(res, {
          code: 200,
          data: checklist,
        });
      } else {
        JsonRoutes.sendResult(res, {
          code: 500,
        });
      }
    },
  );

  /**
   * @operation new_checklist
   * @summary create a new checklist
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} title the title of the new checklist
   * @param {string} [items] the list of items on the new checklist
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'POST',
    '/api/boards/:boardId/cards/:cardId/checklists',
    async function(req, res) {
      // Check user is logged in
      //Authentication.checkLoggedIn(req.userId);
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      // Check user has permission to add checklist to the card
      const board = await ReactiveCache.getBoard(paramBoardId);
      const addPermission = allowIsBoardMemberCommentOnly(req.userId, board);
      Authentication.checkAdminOrCondition(req.userId, addPermission);
      const paramCardId = req.params.cardId;

      // Verify the card belongs to the board
      const card = await ReactiveCache.getCard({
        _id: paramCardId,
        boardId: paramBoardId,
      });
      if (!card) {
        JsonRoutes.sendResult(res, {
          code: 404,
          data: { error: 'Card not found or does not belong to the specified board' },
        });
        return;
      }

      const id = Checklists.insert({
        title: req.body.title,
        cardId: paramCardId,
        sort: 0,
      });
      if (id) {
        let items = req.body.items || [];
        if (_.isString(items)) {
          if (items === '') {
            items = [];
          } else {
            items = [items];
          }
        }
        items.forEach(function(item, idx) {
          ChecklistItems.insert({
            cardId: paramCardId,
            checklistId: id,
            title: item,
            sort: idx,
          });
        });
        JsonRoutes.sendResult(res, {
          code: 200,
          data: {
            _id: id,
          },
        });
      } else {
        JsonRoutes.sendResult(res, {
          code: 400,
        });
      }
    },
  );

  /**
   * @operation delete_checklist
   * @summary Delete a checklist
   *
   * @description The checklist will be removed, not put in the recycle bin.
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} checklistId the ID of the checklist to remove
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'DELETE',
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId',
    async function(req, res) {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      const paramChecklistId = req.params.checklistId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      // Verify the card belongs to the board
      const card = await ReactiveCache.getCard({
        _id: paramCardId,
        boardId: paramBoardId,
      });
      if (!card) {
        JsonRoutes.sendResult(res, {
          code: 404,
          data: { error: 'Card not found or does not belong to the specified board' },
        });
        return;
      }

      // Verify the checklist exists and belongs to the card
      const checklist = await ReactiveCache.getChecklist({
        _id: paramChecklistId,
        cardId: paramCardId,
      });
      if (!checklist) {
        JsonRoutes.sendResult(res, {
          code: 404,
          data: { error: 'Checklist not found or does not belong to the specified card' },
        });
        return;
      }

      Checklists.remove({ _id: paramChecklistId });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramChecklistId,
        },
      });
    },
  );
}

export default Checklists;
