'use strict';

// Parameter-free rule building blocks shared by the HTML5 drag-and-drop
// workflow and the HTML4 native form. Callers submit an index, never a document;
// the server chooses the stored fields from this catalogue.
const WORKFLOW_TRIGGERS = [
  { labelKey: 'r-w-card-created', doc: { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' } },
  { labelKey: 'r-when-a-card-is-moved', doc: { activityType: 'moveCard', listName: '*', oldListName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' } },
  { labelKey: 'r-w-card-archived', doc: { activityType: 'archivedCard', userId: '*' } },
  { labelKey: 'r-w-card-unarchived', doc: { activityType: 'restoredCard', userId: '*' } },
  { labelKey: 'r-w-label-added', doc: { activityType: 'addedLabel', labelId: '*', userId: '*' } },
  { labelKey: 'r-w-label-removed', doc: { activityType: 'removedLabel', labelId: '*', userId: '*' } },
  { labelKey: 'r-w-member-added', doc: { activityType: 'joinMember', username: '*', userId: '*' } },
  { labelKey: 'r-w-member-removed', doc: { activityType: 'unjoinMember', username: '*', userId: '*' } },
  { labelKey: 'r-w-checklist-added', doc: { activityType: 'addChecklist', checklistName: '*', userId: '*' } },
  { labelKey: 'r-w-attachment-added', doc: { activityType: 'addAttachment', userId: '*' } },
  { labelKey: 'r-w-every-day-at', labelParams: { time: '09:00' }, doc: { activityType: 'scheduledTrigger', scheduleKind: 'calendar', scheduleType: 'daily', atTime: '09:00', listName: '*', swimlaneName: '*' } },
];

const WORKFLOW_ACTIONS = [
  { labelKey: 'r-d-move-to-top-gen', doc: { actionType: 'moveCardToTop', listName: '*', swimlaneName: '*' } },
  { labelKey: 'r-d-move-to-bottom-gen', doc: { actionType: 'moveCardToBottom', listName: '*', swimlaneName: '*' } },
  { labelKey: 'r-d-archive', doc: { actionType: 'archive' } },
  { labelKey: 'r-d-unarchive', doc: { actionType: 'unarchive' } },
  { labelKey: 'r-mark-complete', doc: { actionType: 'markCardComplete' } },
  { labelKey: 'r-mark-incomplete', doc: { actionType: 'markCardIncomplete' } },
  { labelKey: 'r-remove-all', doc: { actionType: 'removeMember', username: '*' } },
  { labelKey: 'r-w-set-received-now', doc: { actionType: 'setDate', dateField: 'receivedAt' } },
];

function workflowEntry(entries, index) {
  const parsed = typeof index === 'number' ? index : Number(index);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed >= entries.length) return null;
  const entry = entries[parsed];
  return { ...entry, doc: { ...entry.doc } };
}

function workflowSourceLabel(entry, sources) {
  if (!entry) return '';
  let value = String((sources || {})[entry.labelKey] || entry.labelKey);
  for (const [name, replacement] of Object.entries(entry.labelParams || {})) {
    value = value.split(`__${name}__`).join(String(replacement));
  }
  return value;
}

module.exports = {
  WORKFLOW_ACTIONS,
  WORKFLOW_TRIGGERS,
  workflowAction: index => workflowEntry(WORKFLOW_ACTIONS, index),
  workflowTrigger: index => workflowEntry(WORKFLOW_TRIGGERS, index),
  workflowSourceLabel,
};
