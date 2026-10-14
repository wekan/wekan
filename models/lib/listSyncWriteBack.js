'use strict';

// #2698: List Sync's write-back to GitLab (syncSource.writeBack). Before a
// GitLab list is synced, what members changed on its cards in WeKan goes to
// the issues, so the reconcile that follows finds GitLab already agreeing:
//
//   text      a title or description changed in WeKan while the issue still
//             has the text both sides last agreed on (syncLastSource) -
//             the same "local-only edit" the reconcile keeps. When both
//             changed, nothing is written: that stays a conflict to resolve.
//   close     a card archived in WeKan (after write-back was switched on)
//             whose issue is open closes the issue;
//   reopen    a card WeKan closed that is restored reopens its issue;
//   comments  a comment written in WeKan (after write-back was switched on)
//             becomes a note on the issue, and remembers the note's id
//             (syncCommentId), so the issue's comments sync does not bring
//             it back a second time.
//
// Pure and plain Node: server/lib/listSyncWriteBack.js reads, writes and
// fences; tests/listSyncWriteBack.test.cjs runs this with GitLab's shapes.

const WRITE_BACK_SOURCES = ['gitlab'];
const MAX_WRITES_PER_RUN = 100;

// The footer models/lib/externalParsers.js parseGitlab appends to a card's
// description: "Source: <reference> <web_url>".
function gitlabDescriptionFooter(issue) {
  const reference = (issue && issue.references && issue.references.full) || (issue && issue.iid != null ? `#${issue.iid}` : null);
  return [reference ? `Source: ${reference}` : null, (issue && issue.web_url) || null].filter(Boolean).join(' ');
}
// The card description parseGitlab makes of an issue description.
function gitlabCardDescription(issue, description) {
  return [description || '', gitlabDescriptionFooter(issue)].filter(Boolean).join('\n\n').trim();
}
// The issue description a card description stands for: without the footer
// sync added. A member who removed the footer sends the text as it is.
function gitlabIssueDescription(issue, cardDescription) {
  const text = typeof cardDescription === 'string' ? cardDescription : '';
  const footer = gitlabDescriptionFooter(issue);
  if (!footer) return text;
  if (text === footer) return '';
  if (text.endsWith(`\n\n${footer}`)) return text.slice(0, -(footer.length + 2));
  return text;
}

const time = value => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

/**
 * What to write to GitLab this run.
 *   issues    GitLab's issues, as fetched now
 *   cards     the list's cards of this source:
 *             { _id, syncExternalId, title, description, archived, archivedAt, syncLastSource, syncClosedByWeKan }
 *   comments  their comments without a syncCommentId: { _id, cardId, text, createdAt }
 *   since     when write-back was switched on; nothing older is written
 * Returns { operations, skipped }: operations in order, at most
 * MAX_WRITES_PER_RUN, each { kind: 'text' | 'close' | 'reopen' | 'comment', cardId, iid, ... }.
 */
function planGitlabWriteBack({ issues, cards, comments = [], since }) {
  const start = time(since);
  const operations = [];
  let skipped = 0;
  const push = operation => { if (operations.length < MAX_WRITES_PER_RUN) operations.push(operation); else skipped += 1; };
  if (start === null) return { operations, skipped };
  const byIid = new Map();
  for (const issue of Array.isArray(issues) ? issues : []) {
    if (issue && Number.isSafeInteger(Number(issue.iid)) && Number(issue.iid) > 0) byIid.set(String(issue.iid), issue);
  }
  const cardById = new Map();
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!card || !card.syncExternalId) continue;
    const issue = byIid.get(String(card.syncExternalId));
    if (!issue) continue;
    cardById.set(card._id, { card, issue });
    const iid = Number(issue.iid);
    const baseline = card.syncLastSource || {};
    if (!card.archived) {
      const set = {};
      const incomingTitle = issue.title || 'Imported issue';
      if (typeof card.title === 'string' && card.title.trim() && Object.hasOwn(baseline, 'title') &&
          card.title !== baseline.title && incomingTitle === baseline.title) set.title = card.title;
      const incomingDescription = gitlabCardDescription(issue, issue.description);
      if (typeof card.description === 'string' && Object.hasOwn(baseline, 'description') &&
          card.description !== baseline.description && incomingDescription === baseline.description) {
        set.description = gitlabIssueDescription(issue, card.description);
      }
      if (Object.keys(set).length) push({ kind: 'text', cardId: card._id, iid, set, card: { title: card.title, description: card.description } });
    }
    const archivedAt = time(card.archivedAt);
    if (card.archived === true && issue.state === 'opened' && archivedAt !== null && archivedAt >= start) {
      push({ kind: 'close', cardId: card._id, iid });
    } else if (card.archived !== true && issue.state === 'closed' && card.syncClosedByWeKan === true) {
      push({ kind: 'reopen', cardId: card._id, iid });
    }
  }
  for (const comment of [...(Array.isArray(comments) ? comments : [])].sort((a, b) => (time(a.createdAt) || 0) - (time(b.createdAt) || 0))) {
    const target = comment && cardById.get(comment.cardId);
    const created = comment && time(comment.createdAt);
    if (!target || comment.syncCommentId || created === null || created < start) continue;
    if (typeof comment.text !== 'string' || !comment.text.trim()) continue;
    push({ kind: 'comment', cardId: comment.cardId, iid: Number(target.issue.iid), commentId: comment._id, body: comment.text });
  }
  return { operations, skipped };
}

// The GitLab request for one operation: [method, path below the project, body].
function gitlabRequest(operation) {
  const issue = `issues/${Number(operation.iid)}`;
  switch (operation.kind) {
    case 'text': return ['PUT', issue, { ...operation.set }];
    case 'close': return ['PUT', issue, { state_event: 'close' }];
    case 'reopen': return ['PUT', issue, { state_event: 'reopen' }];
    case 'comment': return ['POST', `${issue}/notes`, { body: operation.body }];
    default: throw new Error('Unknown write-back operation');
  }
}

module.exports = {
  WRITE_BACK_SOURCES, MAX_WRITES_PER_RUN,
  gitlabDescriptionFooter, gitlabCardDescription, gitlabIssueDescription, planGitlabWriteBack, gitlabRequest,
};
