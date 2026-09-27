const { calculateObjectSize } = require('bson');
const { historyDocument } = require('../../models/lib/scrumHistory');

// Reserve 1 MiB below MongoDB's document ceiling for History/journal envelope
// fields, revision arrays and schema defaults. Count BSON bytes, not characters.
const SCRUM_DOCUMENT_BUDGET = 15 * 1024 * 1024;
function fits(document, label) {
  if (calculateObjectSize(document) > SCRUM_DOCUMENT_BUDGET) {
    const error = new Error(`Scrum ${label} exceeds the document size budget; reduce the sprint scope before retrying`);
    error.code = 'scrum-document-too-large';
    throw error;
  }
}
function assertScrumLifecycleSize(before, after) {
  fits(after, 'sprint/rollover plan');
  const entry = (type, id, document) => ({ type, id, document });
  const previousContent = { records: [entry('scrum-sprint', before._id, historyDocument('scrum-sprint', before))] };
  const newContent = { records: [entry('scrum-sprint', after._id, historyDocument('scrum-sprint', after))] };
  for (const card of after.rolloverPending || []) {
    previousContent.records.push(entry('card', card.cardId,
      { _id: card.cardId, boardId: after.boardId, scrum: card.before }));
    newContent.records.push(entry('card', card.cardId,
      { _id: card.cardId, boardId: after.boardId, scrum: card.after }));
  }
  fits({ previousContent, newContent }, 'compound History');
  // Restore can displace another snapshot as large as either side. Its pending
  // journal and timeline both store two sides, so reserve room for that too.
  const largest = calculateObjectSize(previousContent) > calculateObjectSize(newContent)
    ? previousContent : newContent;
  fits({ previousContent: largest, newContent: largest }, 'History recovery');
}
module.exports = { assertScrumLifecycleSize, SCRUM_DOCUMENT_BUDGET };
