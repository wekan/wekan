import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { LIST_COLORS } from '/models/metadata/colors';
import { isHexColor, contrastText } from '/models/lib/contrastColor';
import PositionHistory from './positionHistory';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { listCardsSelector } from '/models/lib/swimlaneFilter';
const { SimpleSchema } = require('/imports/simpleSchema');

const Lists = new Mongo.Collection('lists');

// Pure, dependency-free helper for scoping a set of cards to a list and
// (optionally) a swimlane (#5623). Defined here (an isomorphic model file) so
// client and server share identical logic; re-exported from
// server/lib/cardScope.js for unit testing.
//
// - When `swimlaneId` is undefined (no swimlane context), every card in the
//   list is returned (preserves the historical "select all in list" behavior).
// - When `swimlaneId` is provided, a card matches when its `swimlaneId` equals
//   the given value, OR the card has no swimlane at all (null / '' / missing),
//   mirroring `cards()` so orphaned/pre-migration cards stay selectable in
//   every swimlane.
// - #6443: when `otherSwimlaneIds` is provided (the board's OTHER swimlane ids,
//   i.e. this is the FIRST swimlane), a card also matches when its swimlaneId is
//   "orphaned" — a non-empty value that is not one of the board's existing
//   swimlanes — so cards left pointing at a deleted swimlane stay visible. This
//   mirrors swimlaneMembershipSelector's `$nin` branch: match everything not
//   owned by another existing swimlane.
export function filterCardsByListAndSwimlane(cards, listId, swimlaneId, otherSwimlaneIds) {
  if (!Array.isArray(cards)) {
    return [];
  }
  const surfaceOrphaned = Array.isArray(otherSwimlaneIds);
  return cards.filter(card => {
    if (!card || card.listId !== listId) {
      return false;
    }
    if (swimlaneId === undefined) {
      return true;
    }
    const cardSwimlaneId = card.swimlaneId;
    if (surfaceOrphaned) {
      // First swimlane: match unless the card belongs to another existing
      // swimlane (own id, null/'', missing, or orphaned all pass).
      return !otherSwimlaneIds.includes(cardSwimlaneId);
    }
    return (
      cardSwimlaneId === swimlaneId ||
      cardSwimlaneId === null ||
      cardSwimlaneId === undefined ||
      cardSwimlaneId === ''
    );
  });
}

// Pure, dependency-free helper for list / swimlane colors (#5382). Defined here
// (an isomorphic model file) so client and server share identical logic;
// re-exported from server/lib/listColors.js for unit testing.
//
// `ALLOWED_LIST_COLORS` is the single canonical list of colors allowed for
// lists and swimlanes (the same `LIST_COLORS` the schema allowedValues uses,
// which includes `silver`). `normalizeListColor` returns the color when allowed
// and '' (None) otherwise, so an offered-but-unsupported color is normalized
// rather than silently saved as None or rejected by the schema.
export const ALLOWED_LIST_COLORS = [...LIST_COLORS];

const ALLOWED_LIST_COLOR_SET = new Set(ALLOWED_LIST_COLORS);

export function normalizeListColor(color) {
  if (typeof color !== 'string') {
    return '';
  }
  if (ALLOWED_LIST_COLOR_SET.has(color)) {
    return color;
  }
  // #5514: also accept a custom '#rrggbb' hex chosen from the color wheel, so
  // lists / swimlanes can store an arbitrary color alongside the named palette.
  return isHexColor(color) ? color : '';
}

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
    // Soft delete (docs/Features/Undo/Undo.md): a deleted list is MARKED, never
    // destroyed, so it can be restored/undone (#1023). `deletedAt: null` (or the
    // field being absent) means the list is live; a Date means soft-deleted.
    // deleteBatchId groups a list with the cards deleted alongside it, so restore
    // brings back exactly that set. Distinct from `archived` (a visible "set aside"
    // state with its own Archive UI).
    deletedAt: {
      // Absent (the default on insert) OR null both mean "live" — the
      // `{ deletedAt: null }` render-path filter matches both, so no defaultValue
      // is needed and none is set (a null default on a Date field would trip
      // SimpleSchema type validation on every insert).
      type: Date,
      optional: true,
    },
    deletedBy: {
      type: String,
      optional: true,
    },
    deleteBatchId: {
      type: String,
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
      // #5514: accept a named palette color OR a custom '#rrggbb' hex chosen
      // from the color wheel (instead of a fixed allowedValues enum).
      custom() {
        const v = this.value;
        if (v === undefined || v === null || v === '') return undefined;
        if (LIST_COLORS.includes(v) || isHexColor(v)) return undefined;
        return 'notAllowed';
      },
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
       * #6465: default width is 220 pixels (was 272) so more lists fit on
       * screen; kept in sync with DEFAULT_LIST_WIDTH in models/lib/listWidth.js.
       */
      type: Number,
      optional: true,
      defaultValue: 220,
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
  async copy(boardId, swimlaneId, cardIdMap = null) {
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
      await card.copy(boardId, swimlaneId, _id, cardIdMap);
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

  // #6443: the _ids of the board's OTHER non-archived swimlanes when `swimlaneId`
  // is the board's FIRST swimlane, otherwise undefined. Passed to the card
  // selector so orphaned cards (swimlaneId pointing at a deleted swimlane) are
  // surfaced in the first swimlane — mirroring Swimlanes.orphanedSwimlaneLists.
  orphanedCardsSwimlaneIds(swimlaneId) {
    if (!swimlaneId) {
      return undefined;
    }
    // Only the first swimlane surfaces orphaned cards.
    const pick = (swimlanes) => {
      if (!swimlanes || !swimlanes.length || swimlanes[0]._id !== swimlaneId) {
        return undefined;
      }
      return swimlanes.map(s => s._id).filter(id => id !== swimlaneId);
    };
    const swimlanes = ReactiveCache.getSwimlanes(
      { boardId: this.boardId, archived: false },
      { sort: ['sort'] },
    );
    // On the SERVER ReactiveCache.getSwimlanes returns a Promise; reading
    // .length off it made this always return undefined there (the orphan
    // fallback silently never applied server-side). Resolve it instead; the
    // client path stays synchronous.
    if (swimlanes && typeof swimlanes.then === 'function') {
      return swimlanes.then(pick);
    }
    return pick(swimlanes);
  },

  cards(swimlaneId) {
    // #6441: express the swimlane-membership fallback as a single `swimlaneId:
    // { $in: [...] }` clause (via the shared, unit-tested helper) instead of a
    // bare top-level `$or`, so it never competes with the board Filter's own
    // top-level `$or` when the two selectors are combined.
    // #6443: also surface orphaned cards in the first swimlane.
    const query = (orphanedIds) => {
      const selector = listCardsSelector(this._id, swimlaneId, orphanedIds);
      const filterSelector =
        typeof Filter !== 'undefined' && typeof Filter.mongoSelector === 'function'
          ? Filter.mongoSelector(selector)
          : selector;
      return ReactiveCache.getCards(filterSelector, { sort: ['sort'] });
    };
    const orphaned = this.orphanedCardsSwimlaneIds(swimlaneId);
    if (orphaned && typeof orphaned.then === 'function') {
      return orphaned.then(query); // server (async ReactiveCache)
    }
    return query(orphaned);
  },

  cardsUnfiltered(swimlaneId) {
    // Same swimlane-membership fallback as cards() (#6441/#6443), without the Filter.
    const query = (orphanedIds) =>
      ReactiveCache.getCards(listCardsSelector(this._id, swimlaneId, orphanedIds), {
        sort: ['sort'],
      });
    const orphaned = this.orphanedCardsSwimlaneIds(swimlaneId);
    if (orphaned && typeof orphaned.then === 'function') {
      return orphaned.then(query); // server (async ReactiveCache)
    }
    return query(orphaned);
  },

  allCards(swimlaneId) {
    const ret = ReactiveCache.getCards({ listId: this._id });
    // When a swimlane context is given, scope the result to that swimlane
    // (plus orphaned cards) so "select all cards" stays contained within its
    // own swimlane. Without a swimlaneId, keep the historical list-wide result.
    return filterCardsByListAndSwimlane(
      ret,
      this._id,
      swimlaneId,
      this.orphanedCardsSwimlaneIds(swimlaneId),
    );
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
    // #5514: a custom '#rrggbb' hex has no CSS class; it is applied inline via
    // colorStyle(). Named palette colors keep their `list-header-<name>` class.
    if (this.color && !isHexColor(this.color)) return `list-header-${this.color}`;
    return '';
  },

  colorStyle() {
    // #5514: for a custom hex color, set the background inline plus an
    // automatically readable text color. Empty for named colors.
    if (isHexColor(this.color)) {
      return `background-color:${this.color} !important;color:${contrastText(this.color)} !important;`;
    }
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
    // Normalize so an offered-but-unsupported color (or a removal) becomes None
    // instead of being silently saved as the wrong color or rejected (#5382).
    // normalizeListColor returns '' for None; store null so the optional,
    // allowedValues-constrained schema field accepts it (as cards do).
    const color = normalizeListColor(newColor) || null;
    return await Lists.updateAsync(this._id, { $set: { color } });
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
