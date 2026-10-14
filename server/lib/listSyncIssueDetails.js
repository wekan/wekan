// List sync, "Comments, labels, state and files" (syncSource.issueDetails):
// applied after a GitHub / GitLab / Gitea / Forgejo sync of a list has
// finished, to the cards that sync manages. What changes and what is never
// touched is decided by models/lib/listSyncIssueDetails.js (pure, tested);
// this reads the cards, labels, comments and files and writes the plan.
//
// It runs AFTER the reconcile and on its own: a failure here is recorded on
// the list and never undoes or blocks the title / description sync, and the
// next run tries again - every step is keyed by the tracker's own ids, so a
// repeated run writes nothing that is already there.
import Boards from '/models/boards';
import CardComments from '/models/cardComments';
import Cards from '/models/cards';
import Attachments from '/models/attachments';
import { fetchImportedAttachment } from '/models/lib/importAttachmentDownload';

const {
  ISSUE_DETAIL_SOURCES, MAX_DOWNLOADS_PER_RUN, issueLabelNames, labelColor, planIssueDetails,
} = require('/models/lib/listSyncIssueDetails');

// The board's label ids by name, making the labels the issues use and the
// board lacks.
async function ensureLabels(boardId, names) {
  let board = await Boards.findOneAsync(boardId);
  const byName = new Map(((board && board.labels) || []).filter(l => l && l.name).map(l => [l.name, l._id]));
  const missing = [...new Set(names)].filter(name => !byName.has(name));
  if (missing.length && board) {
    for (const name of missing) {
      // eslint-disable-next-line no-await-in-loop
      await board.addLabel(name, labelColor(name));
    }
    board = await Boards.findOneAsync(boardId);
    for (const l of (board.labels || [])) if (l && l.name && !byName.has(l.name)) byName.set(l.name, l._id);
  }
  return byName;
}

/**
 * Apply comments, labels, state and files for one finished sync run.
 *   list, source, sourceKey   the list and its saved source
 *   tasks                     the parsed issues of this run
 *   actorId                   who the run writes as (the sync actor)
 * Returns { labels, states, comments, files, failedFiles }.
 */
export async function syncIssueDetails({ list, source, sourceKey, tasks, actorId }) {
  const counts = { labels: 0, states: 0, comments: 0, files: 0, failedFiles: 0 };
  if (!source || !source.issueDetails || !ISSUE_DETAIL_SOURCES.includes(source.type)) return counts;
  const byExternalId = new Map((tasks || []).map(t => [String(t.externalId), t]));
  const cards = await Cards.find({
    boardId: list.boardId, listId: list._id, syncSourceKey: sourceKey,
    syncExternalId: { $in: [...byExternalId.keys()] },
  }, { fields: { _id: 1, syncExternalId: 1, labelIds: 1, syncLabelIds: 1, syncIssueState: 1 } }).fetchAsync();
  if (!cards.length) return counts;

  const labelIdByName = await ensureLabels(list.boardId,
    cards.flatMap(card => issueLabelNames(byExternalId.get(String(card.syncExternalId)))));
  const cardIds = cards.map(c => c._id);
  const comments = await CardComments.find({ cardId: { $in: cardIds }, syncCommentId: { $exists: true } },
    { fields: { _id: 1, cardId: 1, syncCommentId: 1, text: 1 } }).fetchAsync();
  const files = await Attachments.collection.find({ 'meta.cardId': { $in: cardIds }, 'meta.syncUrl': { $exists: true } },
    { fields: { 'meta.cardId': 1, 'meta.syncUrl': 1 } }).fetchAsync();

  let downloads = 0;
  for (const card of cards) {
    const task = byExternalId.get(String(card.syncExternalId));
    const plan = planIssueDetails({
      card, task, labelIdByName,
      comments: comments.filter(c => c.cardId === card._id),
      fileUrls: new Set(files.filter(f => f.meta && f.meta.cardId === card._id).map(f => f.meta.syncUrl)),
    });
    if (Object.keys(plan.set).length) {
      // Through the hooked collection: the change history records it, and
      // the board history's Restore can undo it like any other edit.
      // eslint-disable-next-line no-await-in-loop
      await Cards.updateAsync(card._id, { $set: plan.set });
      if (plan.set.labelIds) counts.labels += 1;
      if (plan.set.syncIssueState) counts.states += 1;
    }
    for (const comment of plan.insertComments) {
      const createdAt = comment.date && !Number.isNaN(new Date(comment.date).getTime()) ? new Date(comment.date) : new Date();
      // eslint-disable-next-line no-await-in-loop
      await CardComments.insertAsync({
        boardId: list.boardId, cardId: card._id, text: comment.text, userId: actorId, syncCommentId: comment.syncCommentId,
        createdAt,
      });
      counts.comments += 1;
    }
    for (const comment of plan.updateComments) {
      // eslint-disable-next-line no-await-in-loop
      await CardComments.updateAsync({ _id: comment._id, cardId: card._id }, { $set: { text: comment.text } });
      counts.comments += 1;
    }
    for (const file of plan.files) {
      if (downloads >= MAX_DOWNLOADS_PER_RUN) break;
      downloads += 1;
      try {
        // FollowBleed: every redirect hop is validated and DNS-pinned.
        // eslint-disable-next-line no-await-in-loop
        const downloaded = await fetchImportedAttachment(file.url);
        if (downloaded.blocked) { counts.failedFiles += 1; continue; }
        // writeAsync's after-upload hook checks the type and size and moves
        // the file to Admin Panel / Attachments / Default Storage.
        // eslint-disable-next-line no-await-in-loop
        await Attachments.writeAsync(downloaded.buffer, {
          fileName: file.name || 'attachment',
          type: downloaded.type || 'application/octet-stream',
          userId: actorId,
          meta: { boardId: list.boardId, cardId: card._id, source: 'import', syncUrl: file.url },
        }, true);
        counts.files += 1;
      } catch (error) {
        counts.failedFiles += 1;
      }
    }
  }
  return counts;
}

export default syncIssueDetails;
