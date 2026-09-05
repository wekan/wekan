import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
const { SimpleSchema } = require('/imports/simpleSchema');

/**
 * The universal change history — one append-only row per change a user makes.
 * docs/Features/Reports/History/History.md §4 is the specification; this is
 * phase 1 of §10 (the store, the write helper, and the undo/redo stack that the
 * shipped position history moves onto).
 *
 * THIS FILE IMPORTS NO OTHER MODEL, DELIBERATELY. Its predecessor,
 * models/userPositionHistory.js, imports Cards, Lists, Swimlanes, Checklists and
 * ChecklistItems so that its undo() can write to them — which makes it
 * unimportable from those same files. models/cards.js therefore could not import
 * it, guarded on `typeof UserPositionHistory !== 'undefined'` instead, and
 * recorded nothing at all for years (#6478, and the card half of it survived
 * that fix). Keeping this file dependency-free means every mutation path can
 * import it normally. Applying a change back to a document is the server's job
 * and lives in server/models/changeHistory.js, which may import whatever it
 * likes because nothing imports IT.
 */
const ChangeHistory = new Mongo.Collection('changeHistory');

/* The entity kinds a row can describe (History.md §4). */
export const ENTITY_TYPES = [
  'card', 'list', 'swimlane', 'board',
  'checklist', 'checklistItem', 'comment', 'attachment', 'customField',
];

/* The logical groups of the card details view (History.md §3). */
export const GROUPS = [
  'title', 'description', 'labels', 'members', 'assignees', 'dates',
  'checklists', 'subtasks', 'attachments', 'comments', 'customFields',
  'position', 'lifecycle',
];

/* A small closed set, each with an i18n key `history-change-<type>`. */
export const CHANGE_TYPES = ['added', 'removed', 'edited', 'moved', 'restored'];

ChangeHistory.attachSchema(
  new SimpleSchema({
    boardId: {
      /** the board this change belongs to — permission scoping and the board view */
      type: String,
      optional: true,
      defaultValue: null,
    },
    // The id columns below are what makes a container scope a plain equality
    // instead of a join: a row carries every container it sits inside, so a
    // swimlane's history is `{ swimlaneId }` and includes its lists' and cards'
    // rows without walking the tree (History.md §6).
    swimlaneId: { type: String, optional: true, defaultValue: null },
    listId: { type: String, optional: true, defaultValue: null },
    cardId: { type: String, optional: true, defaultValue: null },

    entityType: {
      /** what kind of thing changed */
      type: String,
      allowedValues: ENTITY_TYPES,
    },
    entityId: {
      /** the changed entity's _id */
      type: String,
    },
    group: {
      /** which group of the card details view this belongs to */
      type: String,
      optional: true,
      defaultValue: null,
    },
    changeType: {
      /** added | removed | edited | moved | restored */
      type: String,
      allowedValues: CHANGE_TYPES,
    },
    previousContent: {
      /** what it was — null for 'added'. Blackbox: each group stores its own shape. */
      type: Object,
      optional: true,
      blackbox: true,
      defaultValue: null,
    },
    newContent: {
      /** what it became — null for 'removed' */
      type: Object,
      optional: true,
      blackbox: true,
      defaultValue: null,
    },
    userId: {
      /** who made the change — the axis the Member-settings view filters on */
      type: String,
    },
    createdAt: {
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) return new Date();
        if (this.isUpsert) return { $setOnInsert: new Date() };
        if (!this.isInsert) this.unset();
      },
    },
    // The undo/redo stack, folded in from userPositionHistory (History.md §7c).
    undone: { type: Boolean, defaultValue: false },
    undoneAt: { type: Date, optional: true, defaultValue: null },
    isCheckpoint: { type: Boolean, defaultValue: false },
    batchId: {
      /** groups one logical multi-entity change so it undoes as a unit */
      type: String,
      optional: true,
      defaultValue: null,
    },
    // Restore provenance, set only when changeType === 'restored' (§8.3).
    restoredFromId: { type: String, optional: true, defaultValue: null },
    restoredByUserId: { type: String, optional: true, defaultValue: null },
    previousHash: { type: String, optional: true, defaultValue: null },
    integrityHash: { type: String, optional: true, defaultValue: null },
    superseded: { type: Boolean, optional: true, defaultValue: false },
  }),
);

/**
 * Append one change. Best-effort by contract: a history failure must never fail
 * the mutation it describes, so this resolves rather than throws (History.md §5).
 *
 * Returns the new row's _id, or null when nothing was recorded.
 */
ChangeHistory.record = async function record(options) {
  const {
    boardId = null,
    swimlaneId = null,
    listId = null,
    cardId = null,
    entityType,
    entityId,
    group = null,
    changeType,
    previousContent = null,
    newContent = null,
    userId,
    batchId = null,
    restoredFromId = null,
    restoredByUserId = null,
  } = options || {};

  // A row nobody can attribute or locate is not history, it is noise.
  if (!userId || !entityType || !entityId || !changeType) return null;
  if (!ENTITY_TYPES.includes(entityType)) return null;
  if (!CHANGE_TYPES.includes(changeType)) return null;

  try {
    // A NEW change clears this user's redo stack on this board (History.md §7c):
    // an undone change that has since been superseded must never be redoable
    // back over the newer work. Retain and flag the rows so the integrity chain
    // remains auditable without allowing redo to resurrect stale content.
    if (changeType !== 'restored') {
      await ChangeHistory.updateAsync(
        { userId, boardId, undone: true },
        { $set: { superseded: true } },
        { multi: true },
      );
    }
    const previous = await ChangeHistory.findOneAsync(
      { boardId, integrityHash: { $nin: [null, ''] } },
      { sort: { createdAt: -1 } },
    );
    const createdAt = new Date();
    const row = {
      boardId,
      swimlaneId,
      listId,
      cardId,
      entityType,
      entityId,
      group,
      changeType,
      previousContent,
      newContent,
      userId,
      undone: false,
      undoneAt: null,
      isCheckpoint: false,
      batchId,
      restoredFromId,
      restoredByUserId,
      createdAt,
      previousHash: previous ? previous.integrityHash : null,
      superseded: false,
    };
    const { hashHistoryRow } = require('/models/lib/changeHistoryIntegrity');
    row.integrityHash = hashHistoryRow(row);
    return await ChangeHistory.insertAsync(row);
  } catch (error) {
    // Deliberately swallowed. The alternative is that a schema slip in a history
    // row stops a user moving a card.
    if (Meteor.isServer) {
      console.warn('changeHistory: failed to record a change:', error && error.message);
    }
    return null;
  }
};

export default ChangeHistory;
