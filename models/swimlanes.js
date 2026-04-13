import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { SWIMLANE_COLORS } from '/models/metadata/colors';
import PositionHistory from './positionHistory';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
const { SimpleSchema } = require('/imports/simpleSchema');

const Swimlanes = new Mongo.Collection('swimlanes');

/**
 * A swimlane is an line in the kaban board.
 */
Swimlanes.attachSchema(
  new SimpleSchema({
    title: {
      /**
       * the title of the swimlane
       */
      type: String,
    },
    archived: {
      /**
       * is the swimlane archived?
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
       * latest archiving date of the swimlane
       */
      type: Date,
      optional: true,
    },
    boardId: {
      /**
       * the ID of the board the swimlane is attached to
       */
      type: String,
    },
    createdAt: {
      /**
       * creation date of the swimlane
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
       * the sort value of the swimlane
       */
      type: Number,
      // XXX We should probably provide a default
      optional: true,
    },
    color: {
      /**
       * the color of the swimlane
       */
      type: String,
      optional: true,
      // silver is the default
      allowedValues: SWIMLANE_COLORS,
    },
    updatedAt: {
      /**
       * when was the swimlane last edited
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
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    type: {
      /**
       * The type of swimlane
       */
      type: String,
      defaultValue: 'swimlane',
    },
    height: {
      /**
       * The height of the swimlane in pixels.
       * -1 = auto-height (default)
       * 50-2000 = fixed height in pixels
       */
      type: Number,
      optional: true,
      defaultValue: -1,
      custom() {
        const h = this.value;
        if (h !== -1 && (h < 50 || h > 2000)) {
          return 'heightOutOfRange';
        }
      },
    },
    // NOTE: collapsed state is per-user only, stored in user profile.collapsedSwimlanes
    // and localStorage for non-logged-in users
    // NOTE: height is per-board (shared with all users), stored in swimlanes.height
  }),
);

Swimlanes.helpers({
  async copy(boardId, targetSwimlaneId = null, position = 'below', title = '') {
    const oldId = this._id;
    const oldBoardId = this.boardId;
    const desiredTitle = typeof title === 'string' && title.trim().length > 0
      ? title.trim()
      : this.title;
    this.boardId = boardId;

    if (process.env.DEBUG === 'true') {
      console.log('[copySwimlane] start', {
        oldSwimlaneId: oldId,
        oldBoardId,
        boardId,
        targetSwimlaneId,
        position,
        desiredTitle,
      });
    }

    const boardSwimlanes = (await ReactiveCache.getSwimlanes(
      { boardId, archived: false },
      { sort: { sort: 1 } },
    ))
      .sort((a, b) => a.sort - b.sort);

    let targetSort = boardSwimlanes.length;
    if (targetSwimlaneId) {
      const targetIndex = boardSwimlanes.findIndex(
        swimlane => swimlane._id === targetSwimlaneId,
      );
      if (targetIndex >= 0) {
        const selected = boardSwimlanes[targetIndex];
        if (position === 'above') {
          const prev = boardSwimlanes[targetIndex - 1];
          targetSort =
            prev && Number.isFinite(prev.sort)
              ? (prev.sort + selected.sort) / 2
              : selected.sort - 1;
        } else {
          const next = boardSwimlanes[targetIndex + 1];
          targetSort =
            next && Number.isFinite(next.sort)
              ? (selected.sort + next.sort) / 2
              : selected.sort + 1;
        }
      }
    }

    this.sort = targetSort;
    this.title = desiredTitle;
    delete this._id;
    const newSwimlaneId = await Swimlanes.insertAsync(this);

    const sourceBoard = oldBoardId ? await ReactiveCache.getBoard(oldBoardId) : null;
    const sourceDefaultSwimlaneId = sourceBoard?.getDefaultSwimline?.()?._id;
    const isDefaultSourceSwimlane = sourceDefaultSwimlaneId === oldId;

    const listQuery = {
      boardId: oldBoardId,
      archived: false,
      swimlaneId: isDefaultSourceSwimlane ? { $in: [oldId, '', null] } : oldId,
    };

    // Copy all lists in swimlane
    const sourceLists = (await ReactiveCache.getLists(listQuery, { sort: { sort: 1 } }))
      .sort((a, b) => a.sort - b.sort);

    if (process.env.DEBUG === 'true') {
      console.log('[copySwimlane] source lists found', {
        count: sourceLists.length,
        listQuery,
      });
    }

    for (const sourceList of sourceLists) {
      // Always create a new list for the copied swimlane, even if title already exists.
      const newListId = await Lists.insertAsync({
        title: sourceList.title,
        boardId,
        sort: sourceList.sort,
        type: sourceList.type || 'list',
        archived: false,
        wipLimit: sourceList.wipLimit,
        swimlaneId: newSwimlaneId,
        color: sourceList.color,
        width: sourceList.width,
      });

      const cardQuery = {
        listId: sourceList._id,
        archived: false,
        swimlaneId: isDefaultSourceSwimlane ? { $in: [oldId, '', null] } : oldId,
      };
      const cards = await ReactiveCache.getCards(cardQuery, { sort: { sort: 1 } });

      for (const card of cards) {
        await card.copy(boardId, newSwimlaneId, newListId);
      }
    }

    return newSwimlaneId;
  },

  async move(toBoardId, targetSwimlaneId = null, position = 'below', title = '') {
    const desiredTitle = typeof title === 'string' && title.trim().length > 0
      ? title.trim()
      : this.title;
    const boardSwimlanes = (await ReactiveCache.getSwimlanes(
      { boardId: toBoardId, archived: false },
      { sort: { sort: 1 } },
    ))
      .filter(swimlane => swimlane._id !== this._id)
      .sort((a, b) => a.sort - b.sort);

    let targetSort = boardSwimlanes.length;
    if (targetSwimlaneId) {
      const targetIndex = boardSwimlanes.findIndex(
        swimlane => swimlane._id === targetSwimlaneId,
      );
      if (targetIndex >= 0) {
        const selected = boardSwimlanes[targetIndex];
        if (position === 'above') {
          const prev = boardSwimlanes[targetIndex - 1];
          targetSort =
            prev && Number.isFinite(prev.sort)
              ? (prev.sort + selected.sort) / 2
              : selected.sort - 1;
        } else {
          const next = boardSwimlanes[targetIndex + 1];
          targetSort =
            next && Number.isFinite(next.sort)
              ? (selected.sort + next.sort) / 2
              : selected.sort + 1;
        }
      }
    }

    for (const list of await this.lists()) {
      const toList = await ReactiveCache.getList({
        boardId: toBoardId,
        title: list.title,
        archived: false,
      });

      let toListId;
      if (toList) {
        toListId = toList._id;
      } else {
        toListId = await Lists.insertAsync({
          title: list.title,
          boardId: toBoardId,
          type: list.type,
          archived: false,
          wipLimit: list.wipLimit,
          swimlaneId: this._id,
        });
      }

      const cards = await ReactiveCache.getCards({
        listId: list._id,
        swimlaneId: this._id,
      });
      for (const card of cards) {
        await card.move(toBoardId, this._id, toListId);
      }
    }

    await Swimlanes.updateAsync(this._id, {
      $set: {
        boardId: toBoardId,
        sort: targetSort,
        title: desiredTitle,
      },
    });

    // make sure there is a default swimlane
    (await this.board()).getDefaultSwimline();
  },

  cards() {
    const ret = ReactiveCache.getCards(
      Filter.mongoSelector({
        swimlaneId: this._id,
        archived: false,
      }),
      { sort: ['sort'] },
    );
    return ret;
  },

  lists() {
    return this.draggableLists();
  },
  newestLists() {
    // Revert to shared lists across swimlanes: filter by board only
    return ReactiveCache.getLists(
      {
        boardId: this.boardId,
        archived: false,
      },
      { sort: { modifiedAt: -1 } },
    );
  },
  draggableLists() {
    // Revert to shared lists across swimlanes: filter by board only
    return ReactiveCache.getLists(
      {
        boardId: this.boardId,
        //archived: false,
      },
      { sort: ['sort'] },
    );
  },

  myLists() {
    // Only render lists that actually belong to this swimlane.
    // Corrupted/shared list structures should be repaired through the board
    // migration flow instead of being shown as normal swimlane data.
    return ReactiveCache.getLists(
      {
        boardId: this.boardId,
        swimlaneId: this._id,
        archived: false,
      },
      { sort: ['sort'] },
    );
  },

  // Lists whose swimlaneId references a swimlane that no longer exists
  // (e.g. the swimlane was deleted after the per-swimlane migration).
  // These are collected separately so the template can display them in the
  // first swimlane as a fallback — keeping them visible without touching DB.
  orphanedSwimlaneLists(validSwimlaneIds) {
    // validSwimlaneIds: array of _id strings for currently-existing swimlanes.
    // A list is "orphaned" when its swimlaneId is a non-empty string that is
    // not among the valid IDs (so it can never appear via myLists()).
    const excluded = [...validSwimlaneIds, null, ''];
    return ReactiveCache.getLists(
      {
        boardId: this.boardId,
        archived: false,
        swimlaneId: { $nin: excluded },
      },
      { sort: ['sort'] },
    );
  },

  allCards() {
    const ret = ReactiveCache.getCards({ swimlaneId: this._id });
    return ret;
  },

  isCollapsed() {
    if (Meteor.isClient) {
      const user = ReactiveCache.getCurrentUser();
      if (user && user.getCollapsedSwimlaneFromStorage) {
        const stored = user.getCollapsedSwimlaneFromStorage(this.boardId, this._id);
        if (typeof stored === 'boolean') {
          return stored;
        }
      }
      if (!user && Users.getPublicCollapsedSwimlane) {
        const stored = Users.getPublicCollapsedSwimlane(this.boardId, this._id);
        if (typeof stored === 'boolean') {
          return stored;
        }
      }
    }
    return this.collapsed === true;
  },

  board() {
    return ReactiveCache.getBoard(this.boardId);
  },

  colorClass() {
    if (this.color) return `swimlane-${this.color}`;
    return '';
  },

  isTemplateSwimlane() {
    return this.type === 'template-swimlane';
  },

  isTemplateContainer() {
    return this.type === 'template-container';
  },

  isListTemplatesSwimlane() {
    const user = ReactiveCache.getCurrentUser();
    return (user.profile || {}).listTemplatesSwimlaneId === this._id;
  },

  isCardTemplatesSwimlane() {
    const user = ReactiveCache.getCurrentUser();
    return (user.profile || {}).cardTemplatesSwimlaneId === this._id;
  },

  isBoardTemplatesSwimlane() {
    const user = ReactiveCache.getCurrentUser();
    return (user.profile || {}).boardTemplatesSwimlaneId === this._id;
  },

  async remove() {
    return await Swimlanes.removeAsync({ _id: this._id });
  },

  async rename(title) {
    return await Swimlanes.updateAsync(this._id, { $set: { title } });
  },

  // NOTE: collapse() removed - collapsed state is per-user only
  // Use user.setCollapsedSwimlane(boardId, swimlaneId, collapsed) instead

  async archive() {
    if (this.isTemplateSwimlane()) {
      for (const list of await this.myLists()) {
        await list.archive();
      }
    }
    return await Swimlanes.updateAsync(this._id, { $set: { archived: true, archivedAt: new Date() } });
  },

  async restore() {
    if (this.isTemplateSwimlane()) {
      for (const list of await this.myLists()) {
        await list.restore();
      }
    }
    return await Swimlanes.updateAsync(this._id, { $set: { archived: false } });
  },

  async setColor(newColor) {
    return await Swimlanes.updateAsync(this._id, { $set: { color: newColor } });
  },
});

Swimlanes.userArchivedSwimlanes = async userId => {
  return await ReactiveCache.getSwimlanes({
    boardId: { $in: await Boards.userBoardIds(userId, null) },
    archived: true,
  })
};

Swimlanes.userArchivedSwimlaneIds = async () => {
  const swimlanes = await Swimlanes.userArchivedSwimlanes();
  return swimlanes.map(swim => { return swim._id; });
};

Swimlanes.archivedSwimlanes = async () => {
  return await ReactiveCache.getSwimlanes({ archived: true });
};

Swimlanes.archivedSwimlaneIds = async () => {
  const swimlanes = await Swimlanes.archivedSwimlanes();
  return swimlanes.map(swim => {
    return swim._id;
  });
};

Swimlanes.hookOptions.after.update = { fetchPrevious: false };

// Position history tracking methods
Swimlanes.helpers({
  /**
   * Track the original position of this swimlane
   */
  trackOriginalPosition() {
    const selector = {
      boardId: this.boardId,
      entityType: 'swimlane',
      entityId: this._id,
    };
    const document = {
      boardId: this.boardId,
      entityType: 'swimlane',
      entityId: this._id,
      originalPosition: {
        sort: this.sort,
        title: this.title,
      },
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
   * Get the original position history for this swimlane
   */
  getOriginalPosition() {
    const selector = {
      boardId: this.boardId,
      entityType: 'swimlane',
      entityId: this._id,
    };
    if (Meteor.isServer) {
      return PositionHistory.findOneAsync(selector);
    }
    return PositionHistory.findOne(selector);
  },

  /**
   * Check if this swimlane has moved from its original position
   */
  hasMovedFromOriginalPosition() {
    const history = this.getOriginalPosition();
    if (!history) return false;

    return history.originalPosition.sort !== this.sort;
  },

  /**
   * Get a description of the original position
   */
  getOriginalPositionDescription() {
    const history = this.getOriginalPosition();
    if (!history) return 'No original position data';

    return `Original position: ${history.originalPosition.sort || 0}`;
  },
});

export default Swimlanes;
