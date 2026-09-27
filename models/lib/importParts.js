'use strict';

// WHAT TO IMPORT, applied to the document before a creator sees it (#1173).
//
// The selection popup is one list, and on an export it says what goes out. On
// an IMPORT it says what comes in - and the honest way to make that true for
// every source is to take the parts out of the parsed document rather than to
// teach five creators (WeKan, Trello, Jira, CSV, Kanboard) a selection each.
// A creator that never sees a comment cannot import one.
//
// The keys are the ones a WeKan export writes, plus the names Trello and the
// Kanboard-shaped parsers use for the same things, because the pruning happens
// after parsing and before creation - the one point every source passes through.
//
// A section that is NOT in the selection is emptied, never deleted: the
// creators read `board.cards`, `board.checklists` and so on directly, and an
// undefined array is a crash where an empty one is "there were none".

// selection key -> the arrays it covers, whatever the source calls them
const PART_ARRAYS = {
  comments: ['comments', 'cardComments', 'actions'],
  checklists: ['checklists', 'checklistItems'],
  attachments: ['attachments'],
  'custom-fields': ['customFields'],
  activities: ['activities'],
  subtasks: ['subtaskItems'],
};

function pruneImportDocument(doc, fields) {
  // No selection is "everything", the same rule every exporter follows.
  if (!doc || typeof doc !== 'object' || !Array.isArray(fields) || fields.length === 0) {
    return doc;
  }
  const wanted = new Set(fields);
  if (!wanted.has('scrum') || !wanted.has('custom-fields')) delete doc.wekanScrumMapping;
  // Jira time tracking is nested in issues rather than top-level customFields.
  // Prune both supported representations so fallback fields cannot restore a
  // value the user explicitly excluded in the existing import selector.
  for (const issue of Array.isArray(doc.issues) ? doc.issues : []) {
    const values = issue?.fields;
    if (!values || typeof values !== 'object') continue;
    const tracking = values.timetracking;
    if (!wanted.has('scrum')) {
      delete values.issuetype;
      if (values.status && typeof values.status === 'object') delete values.status.statusCategory;
    }
    if (!wanted.has('custom-fields')) {
      delete values.timeoriginalestimate;
      delete values.timeestimate;
      if (tracking && typeof tracking === 'object') {
        delete tracking.originalEstimateSeconds;
        delete tracking.remainingEstimateSeconds;
        delete tracking.originalEstimate;
        delete tracking.remainingEstimate;
      }
    }
    if (!wanted.has('dates')) {
      delete values.timespent;
      if (tracking && typeof tracking === 'object') {
        delete tracking.timeSpentSeconds;
        delete tracking.timeSpent;
      }
    }
  }
  if (!wanted.has('scrum')) {
    delete doc.scrumTransfer;
    delete doc.scrumTransferLosses;
    for (const row of [doc, ...(doc.cards || []), ...(doc.lists || []), ...(doc.swimlanes || [])]) {
      delete row.scrum;
      delete row.scrumRevision;
      delete row.scrumImportLosses;
    }
  }
  // An array is only emptied when its key is a KNOWN part that was not chosen -
  // an unknown key is somebody else's data and is left alone.
  for (const [key, arrays] of Object.entries(PART_ARRAYS)) {
    if (wanted.has(key)) continue;
    for (const name of arrays) {
      if (Array.isArray(doc[name])) doc[name] = [];
    }
  }
  return doc;
}

export { pruneImportDocument, PART_ARRAYS };
