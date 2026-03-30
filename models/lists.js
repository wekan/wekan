import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { LIST_COLORS } from '/models/metadata/colors';
import PositionHistory from './positionHistory';
import Boards from '/models/boards';
import Cards from '/models/cards';
const { SimpleSchema } = require('/imports/simpleSchema');

const Lists = new Mongo.Collection('lists');

/**
 * A list (column) in the Wekan board.
 */
Lists.attachSchema(
  new SimpleSchema({
    title: {
      /**
       * the title of the list
       */
      type: String,
    },
    starred: {
      /**
       * if a list is stared
       * then we put it on the top
       */
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    archived: {
      /**
       * is the list archived
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
       * latest archiving date
       */
      type: Date,
      optional: true,
    },
    boardId: {
      /**
       * the board associated to this list
       */
      type: String,
    },
    swimlaneId: {
      /**
       * the swimlane associated to this list. Optional for backward compatibility
       */
      type: String,
      optional: true,
      defaultValue: '',
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
    sort: {
      /**
       * is the list sorted
       */
      type: Number,
      // XXX We should probably provide a default
      optional: true,
    },
    updatedAt: {
      /**
       * last update of the list
       */
      type: Date,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isUpdate || this.isUpsert || this.isInsert) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        // this is redundant with updatedAt
        /*if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }*/
        if (!this.isSet) {
          return new Date();
        }
      },
    },
    wipLimit: {
      /**
       * WIP object, see below
       */
      type: Object,
      optional: true,
    },
    'wipLimit.value': {
      /**
       * value of the WIP
       */
      type: Number,
      defaultValue: 1,
    },
    'wipLimit.enabled': {
      /**
       * is the WIP enabled
       */
      type: Boolean,
      defaultValue: false,
    },
    'wipLimit.soft': {
      /**
       * is the WIP a soft or hard requirement
       */
      type: Boolean,
      defaultValue: false,
    },
    color: {
      /**
       * the color of the list
       */
      type: String,
      optional: true,
      // silver is the default
      allowedValues: LIST_COLORS,
    },
    type: {
      /**
       * The type of list
       */
      type: String,
      defaultValue: 'list',
    },
    width: {
      /**
       * The width of the list in pixels (100-1000).
       * Default width is 272 pixels.
       */
      type: Number,
      optional: true,
      defaultValue: 272,
      custom() {
        const w = this.value;
        if (w < 100 || w > 1000) {
          return 'widthOutOfRange';
        }
      },
    },
    // NOTE: collapsed state is per-user only, stored in user profile.collapsedLists
    // and localStorage for non-logged-in users
    // NOTE: width is per-board (shared with all users), stored in lists.width
  }),
);

Lists.helpers({
  async copy(boardId, swimlaneId) {
    const oldId = this._id;
    const oldSwimlaneId = this.swimlaneId || null;
    this.boardId = boardId;
    this.swimlaneId = swimlaneId;

    let _id = null;
    const existingListWithSameName = await ReactiveCache.getList({
      boardId,
      title: this.title,
      archived: false,
    });
    if (existingListWithSameName) {
      _id = existingListWithSameName._id;
    } else {
      delete this._id;
      this.swimlaneId = swimlaneId; // Set the target swimlane for the copied list
      _id = await Lists.insertAsync(this);
    }

    // Copy all cards in list
    const cards = await ReactiveCache.getCards({
      swimlaneId: oldSwimlaneId,
      listId: oldId,
      archived: false,
    });
    for (const card of cards) {
      await card.copy(boardId, swimlaneId, _id);
    }

    return _id;
  },

  async move(boardId, swimlaneId) {
    const boardList = await ReactiveCache.getList({
      boardId,
      title: this.title,
      archived: false,
    });
    let listId;
    if (boardList) {
      listId = boardList._id;
      for (const card of await this.cards()) {
        await card.move(boardId, this._id, boardList._id);
      }
    } else {
      console.log('list.title:', this.title);
      console.log('boardList:', boardList);
      listId = await Lists.insertAsync({
        title: this.title,
        boardId,
        type: this.type,
        archived: false,
        wipLimit: this.wipLimit,
        swimlaneId: swimlaneId, // Set the target swimlane for the moved list
      });
    }

    for (const card of await this.cards(swimlaneId)) {
      await card.move(boardId, swimlaneId, listId);
    }
  },

  cards(swimlaneId) {
    const selector = {
      listId: this._id,
      archived: false,
    };
    if (swimlaneId) {
      // Fallback: also surface cards with no swimlaneId (null/empty) so that
      // pre-migration / orphaned cards are always visible in every swimlane
      // without requiring a database migration.
      selector.$or = [
        { swimlaneId },
        { swimlaneId: null },  // null covers null AND missing field
        { swimlaneId: '' },    // empty string from shared-lists era
      ];
    }
    const filterSelector =
      typeof Filter !== 'undefined' && typeof Filter.mongoSelector === 'function'
        ? Filter.mongoSelector(selector)
        : selector;
    const ret = ReactiveCache.getCards(filterSelector, { sort: ['sort'] });
    return ret;
  },

  cardsUnfiltered(swimlaneId) {
    const selector = {
      listId: this._id,
      archived: false,
    };
    if (swimlaneId) {
      // Same fallback as cards(): include orphaned cards with no swimlaneId.
      selector.$or = [
        { swimlaneId },
        { swimlaneId: null },
        { swimlaneId: '' },
      ];
    }
    const ret = ReactiveCache.getCards(selector, { sort: ['sort'] });
    return ret;
  },

  allCards() {
    const ret = ReactiveCache.getCards({ listId: this._id });
    return ret;
  },

  board() {
    return ReactiveCache.getBoard(this.boardId);
  },

  getWipLimit(option) {
    const list = ReactiveCache.getList(this._id);
    if (!list || !list.wipLimit) {
      // Necessary check to avoid exceptions for the case where the doc doesn't have the wipLimit field yet set
      return 0;
    } else if (!option) {
      return list.wipLimit;
    } else {
      return list.wipLimit[option] ? list.wipLimit[option] : 0; // Necessary check to avoid exceptions for the case where the doc doesn't have the wipLimit field yet set
    }
  },

  colorClass() {
    if (this.color) return `list-header-${this.color}`;
    return '';
  },

  isTemplateList() {
    return this.type === 'template-list';
  },

  isStarred() {
    return this.starred === true;
  },

  isCollapsed() {
    if (Meteor.isClient) {
      const user = ReactiveCache.getCurrentUser();
      // Logged-in users: prefer profile/cookie-backed state
      if (user && user.getCollapsedListFromStorage) {
        const stored = user.getCollapsedListFromStorage(this.boardId, this._id);
        if (typeof stored === 'boolean') {
          return stored;
        }
      }
      // Public users: fallback to cookie if available
      if (!user && Users.getPublicCollapsedList) {
        const stored = Users.getPublicCollapsedList(this.boardId, this._id);
        if (typeof stored === 'boolean') {
          return stored;
        }
      }
    }
    return this.collapsed === true;
  },

  absoluteUrl() {
    const card = ReactiveCache.getCard({ listId: this._id });
    return card && card.absoluteUrl();
  },
  originRelativeUrl() {
    const card = ReactiveCache.getCard({ listId: this._id });
    return card && card.originRelativeUrl();
  },
  async remove() {
    return await Lists.removeAsync({ _id: this._id });
  },

  async rename(title) {
    // Basic client-side validation - server will handle full sanitization
    if (typeof title === 'string') {
      // Basic length check to prevent abuse
      const sanitizedTitle = title.length > 1000 ? title.substring(0, 1000) : title;
      return await Lists.updateAsync(this._id, { $set: { title: sanitizedTitle } });
    }
    return await Lists.updateAsync(this._id, { $set: { title } });
  },
  async star(enable = true) {
    return await Lists.updateAsync(this._id, { $set: { starred: !!enable } });
  },
  async collapse(enable = true) {
    return await Lists.updateAsync(this._id, { $set: { collapsed: !!enable } });
  },

  async archive() {
    if (this.isTemplateList()) {
      for (const card of await this.cards()) {
        await card.archive();
      }
    }
    return await Lists.updateAsync(this._id, { $set: { archived: true, archivedAt: new Date() } });
  },

  async restore() {
    if (this.isTemplateList()) {
      for (const card of await this.allCards()) {
        await card.restore();
      }
    }
    return await Lists.updateAsync(this._id, { $set: { archived: false } });
  },

  async toggleSoftLimit(toggle) {
    return await Lists.updateAsync(this._id, { $set: { 'wipLimit.soft': toggle } });
  },

  async toggleWipLimit(toggle) {
    return await Lists.updateAsync(this._id, { $set: { 'wipLimit.enabled': toggle } });
  },

  async setWipLimit(limit) {
    return await Lists.updateAsync(this._id, { $set: { 'wipLimit.value': limit } });
  },

  async setColor(newColor) {
    return await Lists.updateAsync(this._id, { $set: { color: newColor } });
  },
});

Lists.userArchivedLists = async userId => {
  return await ReactiveCache.getLists({
    boardId: { $in: await Boards.userBoardIds(userId, null) },
    archived: true,
  })
};

Lists.userArchivedListIds = async () => {
  const lists = await Lists.userArchivedLists();
  return lists.map(list => { return list._id; });
};

Lists.archivedLists = async () => {
  return await ReactiveCache.getLists({ archived: true });
};

Lists.archivedListIds = async () => {
  const lists = await Lists.archivedLists();
  return lists.map(list => {
    return list._id;
  });
};

// Position history tracking methods
Lists.helpers({
  /**
   * Track the original position of this list
   */
  trackOriginalPosition() {
    const selector = {
      boardId: this.boardId,
      entityType: 'list',
      entityId: this._id,
    };
    const document = {
      boardId: this.boardId,
      entityType: 'list',
      entityId: this._id,
      originalPosition: {
        sort: this.sort,
        title: this.title,
      },
      originalSwimlaneId: this.swimlaneId || null,
      originalTitle: this.title,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (Meteor.isServer) {
      return PositionHistory.findOneAsync(selector).then(existingHistory => {
        if (!existingHistory) {
          return PositionHistory.insertAsync(document);
        }
        return existingHistory;
      });
    }

    const existingHistory = PositionHistory.findOne(selector);
    if (!existingHistory) {
      PositionHistory.insert(document);
    }
  },

  /**
   * Get the original position history for this list
   */
  getOriginalPosition() {
    const selector = {
      boardId: this.boardId,
      entityType: 'list',
      entityId: this._id,
    };
    if (Meteor.isServer) {
      return PositionHistory.findOneAsync(selector);
    }
    return PositionHistory.findOne(selector);
  },

  /**
   * Check if this list has moved from its original position
   */
  hasMovedFromOriginalPosition() {
    const history = this.getOriginalPosition();
    if (!history) return false;

    const currentSwimlaneId = this.swimlaneId || null;
    return history.originalPosition.sort !== this.sort ||
           history.originalSwimlaneId !== currentSwimlaneId;
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
    return `Original position: ${history.originalPosition.sort || 0}${swimlaneInfo}`;
  },

  /**
   * Get the effective swimlane ID (for backward compatibility)
   */
  getEffectiveSwimlaneId() {
    return this.swimlaneId || null;
  },
});

export default Lists;
