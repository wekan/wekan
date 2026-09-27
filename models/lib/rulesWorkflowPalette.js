// Shared rule presets for Workflow and Blocks. These use the existing engine.
export const TRIGGER_PALETTE = [
  { labelKey: 'r-w-card-created', doc: { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' } },
  { labelKey: 'r-when-a-card-is-moved', doc: { activityType: 'moveCard', listName: '*', oldListName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' } },
  { labelKey: 'r-w-card-archived', doc: { activityType: 'archivedCard', userId: '*' } },
  { labelKey: 'r-w-card-unarchived', doc: { activityType: 'restoredCard', userId: '*' } },
  { labelKey: 'r-w-label-added', doc: { activityType: 'addedLabel', labelId: '*', userId: '*' } },
  { labelKey: 'r-w-label-removed', doc: { activityType: 'removedLabel', labelId: '*', userId: '*' } },
  { labelKey: 'r-w-member-added', doc: { activityType: 'joinMember', username: '*', userId: '*' } },
  { labelKey: 'r-w-member-removed', doc: { activityType: 'unjoinMember', username: '*', userId: '*' } },
  { labelKey: 'r-w-assignee-added', doc: { activityType: 'joinAssignee', username: '*', userId: '*' } },
  { labelKey: 'r-w-assignee-removed', doc: { activityType: 'unjoinAssignee', username: '*', userId: '*' } },
  { labelKey: 'r-w-checklist-added', doc: { activityType: 'addChecklist', checklistName: '*', userId: '*' } },
  { labelKey: 'r-w-attachment-added', doc: { activityType: 'addAttachment', userId: '*' } },
  { labelKey: 'r-w-every-day-at', labelParams: { time: '09:00' }, doc: { activityType: 'scheduledTrigger', scheduleKind: 'calendar', scheduleType: 'daily', atTime: '09:00', listName: '*', swimlaneName: '*' } },
];

export const ACTION_PALETTE = [
  { labelKey: 'r-d-move-to-top-gen', doc: { actionType: 'moveCardToTop', listName: '*', swimlaneName: '*' } },
  { labelKey: 'r-d-move-to-bottom-gen', doc: { actionType: 'moveCardToBottom', listName: '*', swimlaneName: '*' } },
  { labelKey: 'r-d-archive', doc: { actionType: 'archive' } },
  { labelKey: 'r-d-unarchive', doc: { actionType: 'unarchive' } },
  { labelKey: 'r-mark-complete', doc: { actionType: 'markCardComplete' } },
  { labelKey: 'r-mark-incomplete', doc: { actionType: 'markCardIncomplete' } },
  { labelKey: 'r-remove-all', doc: { actionType: 'removeMember', username: '*' } },
  { labelKey: 'r-w-set-received-now', doc: { actionType: 'setDate', dateField: 'receivedAt' } },
];
