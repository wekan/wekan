const CARD_ACTIVITY_DESCRIPTORS = Object.freeze({
  createCard: context => ['activity-added', [context.card, context.list]],
  importCard: context => ['activity-imported', [context.card, context.board, context.source]],
  moveCard: context => ['activity-moved', [context.card, context.oldList, context.list]],
  moveCardBoard: context => ['activity-moved', [context.card, context.oldBoard, context.board]],
  archivedCard: context => ['activity-archived', [context.card]],
  restoredCard: context => ['activity-sent', [context.card, context.board]],
  addAttachment: context => ['activity-attached', [context.attachment, context.card]],
  deleteAttachment: context => ['activity-delete-attach', [context.card]],
  addChecklist: context => ['activity-checklist-added', [context.card]],
  removeChecklist: context => ['activity-checklist-removed', [context.card]],
  removedChecklist: context => ['activity-checklist-removed', [context.card]],
  completeChecklist: context => ['activity-checklist-completed', [context.checklist, context.card]],
  uncompleteChecklist: context => ['activity-checklist-uncompleted', [context.checklist, context.card]],
  checkedItem: context => ['activity-checked-item', [context.item, context.checklist, context.card]],
  uncheckedItem: context => ['activity-unchecked-item', [context.item, context.checklist, context.card]],
  addChecklistItem: context => ['activity-checklist-item-added', [context.checklist, context.card]],
  removedChecklistItem: context => ['activity-checklist-item-removed', [context.checklist, context.card]],
  addComment: context => ['activity-on', [context.card]],
  editComment: context => ['activity-editComment', [context.comment]],
  deleteComment: context => ['activity-deleteComment', [context.comment]],
  'a-receivedAt': context => ['activity-receivedDate', [context.value, context.card]],
  'a-startAt': context => ['activity-startDate', [context.value, context.card]],
  'a-dueAt': context => ['activity-dueDate', [context.value, context.card]],
  'a-endAt': context => ['activity-endDate', [context.value, context.card]],
  'a-changedTitle': context => ['activity-changedTitle', [context.value, context.card]],
  'a-changedDescription': context => ['activity-changedDescription', [context.card]],
  setCustomField: context => ['activity-set-customfield', [context.customField, context.value, context.card]],
  unsetCustomField: context => ['activity-unset-customfield', [context.customField, context.card]],
  addedLabel: context => ['activity-added-label', [context.label, context.card]],
  removedLabel: context => ['activity-removed-label', [context.label, context.card]],
  joinMember: context => ['activity-added', [context.member, context.card]],
  unjoinMember: context => ['activity-removed', [context.member, context.card]],
  joinAssignee: context => ['activity-added', [context.member, context.card]],
  unjoinAssignee: context => ['activity-removed', [context.member, context.card]],
  addSubtask: context => ['activity-subtask-added', [context.card]],
});

function cleanActivityValue(value, fallback = '') {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function cardActivityDescriptor(activity, context = {}) {
  const activityType = cleanActivityValue(activity?.activityType, 'activity');
  const factory = CARD_ACTIVITY_DESCRIPTORS[activityType];
  const safeContext = Object.fromEntries(Object.entries(context)
    .map(([key, value]) => [key, cleanActivityValue(value)]));
  if (factory) {
    const [key, args] = factory(safeContext);
    return { key, args: args.map(value => cleanActivityValue(value, '?')), activityType };
  }
  return {
    key: activityType,
    args: activity?.value === undefined ? [] : [cleanActivityValue(activity.value)],
    activityType,
  };
}

module.exports = { CARD_ACTIVITY_DESCRIPTORS, cardActivityDescriptor, cleanActivityValue };
