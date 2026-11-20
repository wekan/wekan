'use strict';

// The fields of a WeKan board's lists, swimlanes, checklists, checklist items,
// custom fields and comments that a WeKan JSON import writes besides the ones
// models/wekanCreator.js sets itself - as models/lib/wekanCardFields.js does
// for cards and wekanBoardFields.js for the board. A list came back without
// its WIP limit, flow policy and split, a swimlane without its height, a
// checklist without its hide settings and reset schedule, an item without its
// assignee, a custom field without "admin only" and "read only", a reply
// without the comment it answers. Pure - no Meteor - so
// tests/wekanCardFields.test.cjs holds every list to its schema.

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const date = value => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const SYNC = 'Sync bookkeeping of the exporting WeKan';
const TRASH = 'trash state: an imported record is not in the trash';
const SCRUM = 'the Scrum import (server/lib/scrumTransferImport.js) writes the Scrum data';

export const RECORDS = {
  lists: {
    copied: ['wipLimit', 'policy', 'split', 'cardsUseListColor', 'starred'],
    notCopied: {
      deletedAt: TRASH, deletedBy: TRASH, deleteBatchId: TRASH,
      linkedBoardId: 'a board of the exporting WeKan', linkedListId: 'a list of another board of the exporting WeKan',
      scrum: SCRUM, scrumRevision: SCRUM,
      syncCredentialFence: SYNC, syncCredentialGeneration: SYNC, syncCredentialIncarnation: SYNC, syncRevision: SYNC,
      syncSource: SYNC, syncWriteBackError: SYNC,
    },
  },
  swimlanes: { copied: ['height'], notCopied: { scrum: SCRUM, scrumRevision: SCRUM } },
  checklists: {
    copied: ['hideAllChecklistItems', 'hideCheckedChecklistItems', 'showChecklistAtMinicard', 'resetInterval'],
    notCopied: {},
  },
  checklistItems: { copied: [], notCopied: {} },
  customFields: { copied: ['adminOnly', 'readOnly', 'cardKinds', 'showSumAtTopOfList'], notCopied: {} },
  cardComments: {
    copied: [],
    notCopied: {
      syncCommentId: SYNC,
      webhookResponsePending: 'a webhook answer of the exporting WeKan', webhookResponseRevision: 'a webhook answer of the exporting WeKan',
    },
  },
};

// The fields of one record. `maps`: { members, cards, comments } - exported
// id -> new id - and `now`, the import's time.
export function wekanRecordFields(kind, doc, { members = {}, cards = {}, comments = {}, now = new Date() } = {}) {
  const spec = RECORDS[kind];
  if (!spec || !isObject(doc)) return {};
  const out = {};
  for (const field of spec.copied) {
    if (doc[field] !== undefined && doc[field] !== null) out[field] = doc[field];
  }
  if (doc.archived && date(doc.archivedAt) && (kind === 'lists' || kind === 'swimlanes')) out.archivedAt = date(doc.archivedAt);
  // A list or swimlane template stays one. The section swimlanes of a user's
  // Templates board (template-container) are ordinary swimlanes on an
  // imported board, as that board is an ordinary template board.
  if (kind === 'lists' && doc.type === 'template-list') out.type = 'template-list';
  if (kind === 'swimlanes' && doc.type === 'template-swimlane') out.type = 'template-swimlane';

  if (kind === 'lists' && isObject(doc.roleExceptions)) {
    // A role's exception is kept where it RESTRICTS (false): a list that was
    // closed to a role stays closed. One that opens a list to a role the
    // board's rule keeps out is not set by a file.
    const kept = {};
    for (const [role, rules] of Object.entries(doc.roleExceptions)) {
      if (!isObject(rules)) continue;
      const restrictions = Object.fromEntries(Object.entries(rules).filter(([, value]) => value === false));
      if (Object.keys(restrictions).length) kept[role] = restrictions;
    }
    if (Object.keys(kept).length) out.roleExceptions = kept;
  }
  if (kind === 'checklists') {
    if (date(doc.finishedAt)) out.finishedAt = date(doc.finishedAt);
    // Counted from the import, as a card's recurrence is: from its old date
    // the reset job would empty the checklist at once.
    if (out.resetInterval) out.lastResetAt = now instanceof Date ? new Date(now.getTime()) : new Date();
  }
  if (kind === 'checklistItems') {
    if (doc.assigneeId && members[doc.assigneeId]) out.assigneeId = members[doc.assigneeId];
    if (doc.linkedCardId && cards[doc.linkedCardId]) out.linkedCardId = cards[doc.linkedCardId];
  }
  if (kind === 'cardComments' && doc.parentId && comments[doc.parentId]) out.parentId = comments[doc.parentId];
  return out;
}

// Fields the creator writes under another name, or derived.
export const SPECIAL = {
  lists: ['archivedAt', 'roleExceptions', 'type'],
  swimlanes: ['archivedAt', 'type'],
  checklists: ['finishedAt', 'lastResetAt'],
  checklistItems: ['assigneeId', 'linkedCardId'],
  customFields: [],
  cardComments: ['parentId'],
};
