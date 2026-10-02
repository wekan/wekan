import { Meteor } from 'meteor/meteor';
const { collectionWriteSucceeded } = require('/server/lib/collectionWriteOutcome');
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Attachments from '/models/attachments';
import ChangeHistory from '/models/changeHistory';
import { isRecordingSuppressed } from '/server/lib/historyRecordingScope';
const { deferSyncRecording, deferSyncItemRecording, deferSyncChecklistRecording, deferSyncAttachmentRecording } =
  require('/server/lib/syncRecordingScope');
import { diffFields } from '/models/lib/changeHistoryGroups';

// Phase 5 of docs/Features/Reports/History/History.md: record EVERY remaining
// group, from one place.
//
// §5 suggests "a thin, central choke point ... recording history next to
// Activities.insert avoids sprinkling calls everywhere", and this is that choke
// point taken one step further: an `after.update` hook per collection, diffing
// the fields that changed. The advantage over editing twenty setters is not
// brevity, it is COVERAGE — the REST API, the CSV/Trello importers and the rules
// engine all write through the collection and none of them go through the client
// setters, so a per-setter rollout would have recorded a description edited in
// the UI and silently missed the same edit made over the API.
//
// Card moves use one whole position snapshot, including the move reason.
// List soft delete/restore retains its own batch-aware recorder.
// REST endpoints using .direct explicitly call recordUpdate after their writes.

/*
 * Where a row sits, so the container scopes can find it (History.md §6). Each
 * entity resolves the ids of everything it lives inside; a row that cannot say
 * which board it belongs to is a row no view will ever show, so it is dropped.
 */
async function locate(entityType, doc) {
  switch (entityType) {
    case 'card':
      return {
        boardId: doc.boardId,
        swimlaneId: doc.swimlaneId,
        listId: doc.listId,
        cardId: doc._id,
      };
    case 'list':
      return { boardId: doc.boardId, swimlaneId: doc.swimlaneId, listId: doc._id };
    case 'swimlane':
      return { boardId: doc.boardId, swimlaneId: doc._id };
    case 'checklist':
    case 'comment': {
      const card = await Cards.findOneAsync(doc.cardId);
      if (!card) return null;
      return {
        boardId: card.boardId,
        swimlaneId: card.swimlaneId,
        listId: card.listId,
        cardId: card._id,
      };
    }
    case 'checklistItem': {
      const card = await Cards.findOneAsync(doc.cardId);
      if (!card) return null;
      return {
        boardId: card.boardId,
        swimlaneId: card.swimlaneId,
        listId: card.listId,
        cardId: card._id,
      };
    }
    case 'attachment': {
      // A Meteor-Files document keeps its containers under meta. A board-level
      // attachment (a background) has no card and is located by its board.
      const meta = doc.meta || {};
      const card = meta.cardId ? await Cards.findOneAsync(meta.cardId) : null;
      if (card) {
        return {
          boardId: card.boardId,
          swimlaneId: card.swimlaneId,
          listId: card.listId,
          cardId: card._id,
        };
      }
      return meta.boardId ? { boardId: meta.boardId } : null;
    }
    default:
      return null;
  }
}

/*
 * One update -> zero or more history rows. Best-effort throughout: this runs
 * inside a collection hook, so anything thrown here would fail the write that
 * triggered it, which is the one thing recording must never do.
 */
async function recordUpdate(entityType, userId, doc, fieldNames, previous) {
  if (!userId) return;               // migrations and repairs have no author
  // A restore writes through these same setters on purpose; the row describing
  // it has already been written by the restore itself.
  if (isRecordingSuppressed()) return;
  try {
    const changes = diffFields(entityType, previous || {}, doc, fieldNames);
    if (entityType === 'card') {
      const { positionChange } = require('/models/lib/timeHistory');
      const position = positionChange(previous || {}, doc, fieldNames);
      if (position) changes.push(position);
    }
    if (changes.length === 0) return;
    // A position row has no field; it is named by its group.
    if (entityType === 'card' && deferSyncRecording('history', doc, changes.map(change => change.field || change.group))) return;
    if (entityType === 'checklistItem' && deferSyncItemRecording('itemHistory', doc)) return;
    const where = await locate(entityType, doc);
    if (!where || !where.boardId) return;

    // One update can touch several groups (a card form saved at once). Each
    // group gets its own row, because each is restored independently — but they
    // share a batchId so undo puts the whole save back, not a third of it.
    const batchId = changes.length > 1
      ? `edit-${doc._id}-${Date.now()}`
      : null;

    for (const change of changes) {
      await ChangeHistory.record({
        ...where,
        entityType,
        entityId: doc._id,
        group: change.group,
        changeType: change.changeType,
        previousContent: change.previousContent,
        newContent: change.newContent,
        userId,
        batchId,
      });
    }
  } catch (error) {
    console.warn(`changeHistory: failed to record a ${entityType} update:`,
      error && error.message);
  }
}

/*
 * Creation and deletion of a sub-entity, so a checklist or a comment can be
 * restored rather than merely re-titled. The content is the whole document,
 * which is what a restore of a removed thing needs (History.md §11 asks whether
 * restore should re-create; storing the document is what leaves that open).
 */
async function recordLifecycle(entityType, userId, doc, changeType) {
  if (!userId) return;
  if (isRecordingSuppressed()) return;   // see recordUpdate above
  // A durable rule checklist action writes this row from its saved plan.
  if (entityType === 'checklist' && deferSyncChecklistRecording('checklistHistory', doc)) return;
  if (entityType === 'checklistItem' && deferSyncChecklistRecording('checklistItemHistory', doc)) return;
  try {
    const where = await locate(entityType, doc);
    if (!where || !where.boardId) return;
    const snapshot = JSON.parse(JSON.stringify(doc));
    const group = entityType === 'comment' ? 'comments'
      : entityType === 'attachment' ? 'attachments'
        : 'checklists';
    await ChangeHistory.record({
      ...where,
      entityType,
      entityId: doc._id,
      group,
      changeType,
      previousContent: changeType === 'removed' ? { document: snapshot } : null,
      newContent: changeType === 'added' ? { document: snapshot } : null,
      userId,
    });
  } catch (error) {
    console.warn(`changeHistory: failed to record a ${entityType} ${changeType}:`,
      error && error.message);
  }
}

Meteor.startup(() => {
  const updates = [
    [Cards, 'card'],
    [Lists, 'list'],
    [Swimlanes, 'swimlane'],
    [Checklists, 'checklist'],
    [ChecklistItems, 'checklistItem'],
    [CardComments, 'comment'],
    // The raw Meteor-Files collection: a rename goes through it (History.md
    // §12.2). The soft delete's own fields are not diffed - see ATTACHMENT_FIELDS.
    [Attachments.collection, 'attachment'],
  ];
  for (const [collection, entityType] of updates) {
    collection.after.update(async function (userId, doc, fieldNames) {
      if (!collectionWriteSucceeded(this)) return;
      await recordUpdate(entityType, userId, doc, fieldNames, this.previous);
    });
  }

  // Imports and templates may create a card with dependencies already set.
  // Record only that missing field through the same diff/undo mechanism.
  Cards.after.insert(async (userId, doc) => {
    if (doc.cardDependencies?.length) {
      await recordUpdate('card', userId || doc.userId, doc, ['cardDependencies'], { cardDependencies: [] });
    }
  });

  // Sub-entities a card can gain and lose. Cards, lists and swimlanes are not
  // here: their creation and deletion are already recorded where they happen
  // (cardRemover, the list soft delete), with the batch ids that tie a container
  // to its contents.
  const lifecycles = [
    [Checklists, 'checklist'],
    [ChecklistItems, 'checklistItem'],
    [CardComments, 'comment'],
  ];
  for (const [collection, entityType] of lifecycles) {
    collection.after.insert(async (userId, doc) => {
      await recordLifecycle(entityType, userId, doc, 'added');
    });
    collection.after.remove(async (userId, doc) => {
      await recordLifecycle(entityType, userId, doc, 'removed');
    });
  }

  // An upload is an attachment 'added' row (History.md §12.2). There is no
  // after.remove: an attachment is never removed in ordinary use - its delete
  // is the soft delete in server/attachmentSoftDelete.js, which records its own
  // lifecycle row with the filename - and the archived-board purge that does
  // remove it takes the board's whole history with it.
  Attachments.collection.after.insert(async (userId, doc) => {
    const uploader = userId || (doc && doc.userId);
    if (doc && doc.meta && doc.meta.source === 'import') return;
    // A durable rule copy writes this row from its saved plan.
    if (deferSyncAttachmentRecording('attachmentHistory', doc)) return;
    await recordLifecycle('attachment', uploader, doc, 'added');
  });
});

export { recordUpdate, recordLifecycle, locate };
