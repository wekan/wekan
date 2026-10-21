// How long one board import may take before it is stopped (#6792).
//
// The deadline used to be a flat two minutes whatever the file held: a Jira
// export of 25 issues imported, one of 858 ran out of time halfway - every
// issue is a card with its comments, checklists and attachments, and the
// writer was aborted while still writing. The deadline is there to free a
// client from a HUNG import, not to cap a large one, so it grows with the
// number of records the document carries.
//
// Shared by the server's deadline (models/import.js importBoard) and the
// import page's watchdog (client/components/import/import.js), so the two
// agree on how long a given file may take.

// Time allowed for each record on top of the base deadline.
const IMPORT_MS_PER_RECORD = 500;

// The records a document carries: the length of an array (CSV rows, a GitHub
// issue list), the lines of a text export, or the sum of the top-level arrays
// of an object (Jira's issues, WeKan's and Trello's cards, lists, checklists
// and actions). Anything else counts as nothing and keeps the base deadline.
function importRecordCount(doc) {
  if (Array.isArray(doc)) return doc.length;
  if (typeof doc === 'string') return doc.split('\n').length;
  if (!doc || typeof doc !== 'object') return 0;
  let count = 0;
  for (const key of Object.keys(doc)) {
    if (Array.isArray(doc[key])) count += doc[key].length;
  }
  return count;
}

// `baseMs` is WEKAN_IMPORT_TIMEOUT_MS (or its default); zero or less still
// means no deadline at all, as it always has.
function importDeadlineFor(baseMs, doc) {
  if (!(baseMs > 0)) return baseMs;
  return baseMs + importRecordCount(doc) * IMPORT_MS_PER_RECORD;
}

export { importRecordCount, importDeadlineFor, IMPORT_MS_PER_RECORD };
