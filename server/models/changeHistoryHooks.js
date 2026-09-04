import { Meteor } from 'meteor/meteor';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import ChangeHistory from '/models/changeHistory';
import { isRecordingSuppressed } from '/server/lib/historyRecordingScope';
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
// What is deliberately NOT here:
//   * card MOVES — Card.move records those itself, as one change with the whole
//     before/after position. Diffing fields would report a single drag as up to
//     four separate edits (boardId, swimlaneId, listId, sort), which is both
//     wrong in the table and unusable for undo.
//   * list soft delete/restore — server/models/lists.js records those with the
//     batchId that ties a list to the cards deleted with it.
// Both are excluded by models/lib/changeHistoryGroups.js rather than here, so
// the exclusions are testable without Meteor.

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
    if (changes.length === 0) return;
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
  try {
    const where = await locate(entityType, doc);
    if (!where || !where.boardId) return;
    const snapshot = JSON.parse(JSON.stringify(doc));
    await ChangeHistory.record({
      ...where,
      entityType,
      entityId: doc._id,
      group: entityType === 'comment' ? 'comments' : 'checklists',
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
  ];
  for (const [collection, entityType] of updates) {
    collection.after.update(async function (userId, doc, fieldNames) {
      await recordUpdate(entityType, userId, doc, fieldNames, this.previous);
    });
  }

  // Sub-entities a card can gain and lose. Cards, lists and swimlanes are not
  // here: their creation and deletion are already recorded where they happen
  // (Card.move, the list soft delete), with the batch ids that tie a container
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
});

export { recordUpdate, recordLifecycle, locate };
