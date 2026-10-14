// #2698: List Sync writes what members changed in WeKan back to GitLab
// (syncSource.writeBack; models/lib/listSyncWriteBack.js decides what). Run
// by server/listSync.js before the run fetches, inside the list's Sync
// reservation, so the reconcile that follows reads GitLab as it is after
// these writes.
//
// Every write is fenced by the reservation check right before it, and what
// it changes on the WeKan side - the card's baseline, the close flag, the
// comment's note id - is written only while the card or comment is still as
// the plan read it. A write that GitLab took but WeKan could not record is
// not lost: the next run sees GitLab and WeKan agreeing (text), the issue
// closed (close) - only a comment could be sent a second time.
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import { fetchGitlabIssues, gitlabWrite } from '/server/lib/listSyncFetch';

const { WRITE_BACK_SOURCES, planGitlabWriteBack, gitlabRequest } = require('/models/lib/listSyncWriteBack');
const { parseGitlab } = require('/models/lib/externalParsers');
const { exactFieldSelector } = require('/models/lib/exactFieldSelector');

/**
 * Write one list's WeKan changes back to GitLab.
 *   list, source, sourceKey, credential   the list and its selected Sync settings
 *   assertCurrent                          the reservation check
 *   readIssues, write                      GitLab reads and writes (tests replace them)
 * Returns { text, closed, reopened, comments, skipped }.
 */
export async function writeBackToGitlab({ list, source, sourceKey, credential, assertCurrent,
  readIssues = fetchGitlabIssues, write = gitlabWrite }) {
  const counts = { text: 0, closed: 0, reopened: 0, comments: 0, skipped: 0 };
  if (!source || source.writeBack !== true || !WRITE_BACK_SOURCES.includes(source.type) || !source.writeBackSince) return counts;
  const issues = await readIssues({ ...source, issueDetails: false }, credential);
  const cards = await Cards.find({ boardId: list.boardId, listId: list._id, syncSourceKey: sourceKey, syncExternalId: { $exists: true } },
    { fields: { _id: 1, syncExternalId: 1, title: 1, description: 1, archived: 1, archivedAt: 1, syncLastSource: 1, syncClosedByWeKan: 1 } }).fetchAsync();
  if (!cards.length) return counts;
  const comments = await CardComments.find({ cardId: { $in: cards.map(card => card._id) }, syncCommentId: { $exists: false },
    createdAt: { $gte: new Date(source.writeBackSince) } }, { fields: { _id: 1, cardId: 1, text: 1, createdAt: 1 } }).fetchAsync();
  const { operations, skipped } = planGitlabWriteBack({ issues, cards, comments, since: source.writeBackSince });
  counts.skipped = skipped;
  const cardById = new Map(cards.map(card => [card._id, card]));
  for (const operation of operations) {
    const card = cardById.get(operation.cardId);
    const [method, path, body] = gitlabRequest(operation);
    await assertCurrent();
    // eslint-disable-next-line no-await-in-loop
    const answer = await write(source, credential, method, path, body);
    if (operation.kind === 'text') {
      // The text both sides agree on now, as the next fetch will parse it.
      const parsed = parseGitlab([answer]).tasks[0] || {};
      const baseline = { ...(card.syncLastSource || {}) };
      if (operation.set.title !== undefined) baseline.title = parsed.title;
      if (operation.set.description !== undefined) baseline.description = parsed.description;
      // eslint-disable-next-line no-await-in-loop
      await Cards.updateAsync({ _id: card._id, boardId: list.boardId, listId: list._id,
        ...exactFieldSelector(card, ['title', 'description', 'syncLastSource']) }, { $set: { syncLastSource: baseline } });
      card.syncLastSource = baseline;
      counts.text += 1;
    } else if (operation.kind === 'close') {
      // eslint-disable-next-line no-await-in-loop
      await Cards.updateAsync({ _id: card._id, boardId: list.boardId, listId: list._id, archived: true }, { $set: { syncClosedByWeKan: true } });
      counts.closed += 1;
    } else if (operation.kind === 'reopen') {
      // eslint-disable-next-line no-await-in-loop
      await Cards.updateAsync({ _id: card._id, boardId: list.boardId, listId: list._id, archived: { $ne: true } }, { $unset: { syncClosedByWeKan: '' } });
      counts.reopened += 1;
    } else if (operation.kind === 'comment') {
      if (answer && answer.id != null) {
        // eslint-disable-next-line no-await-in-loop
        await CardComments.updateAsync({ _id: operation.commentId, cardId: card._id, syncCommentId: { $exists: false } },
          { $set: { syncCommentId: String(answer.id) } });
      }
      counts.comments += 1;
    }
  }
  return counts;
}

export default writeBackToGitlab;
