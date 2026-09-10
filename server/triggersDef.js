// Maps each event `activityType` to the trigger fields used to match rules.
// NOTE: two trigger kinds are intentionally NOT listed here because they are not
// driven by activities:
//   - 'scheduledTrigger' (time/due/aging) is evaluated by server/scheduledRules.js
//     via SyncedCron.
//   - 'button' (card/board manual buttons) runs only via the rules.runButton method.
//   - 'advancedFilterTrigger' and 'textContainsTrigger' (#2194 "card title/
//     description contains {value}") are not exact/wildcard field matches
//     either - server/rulesHelper.js re-reads the card's current state and
//     evaluates them directly (see cardMatchesAdvancedFilter /
//     cardTextContainsMatch) on createCard/a-changedTitle/a-changedDescription.
export const TriggersDef = {
  createCard: {
    matchingFields: [
      'boardId',
      'listName',
      'userId',
      'swimlaneName',
      'cardTitle',
    ],
  },
  moveCard: {
    matchingFields: [
      'boardId',
      'listName',
      'oldListName',
      'userId',
      'swimlaneName',
      'cardTitle',
    ],
  },
  archivedCard: {
    matchingFields: ['boardId', 'userId', 'cardTitle'],
  },
  restoredCard: {
    matchingFields: ['boardId', 'userId', 'cardTitle'],
  },
  joinMember: {
    matchingFields: ['boardId', 'username', 'userId'],
  },
  unjoinMember: {
    matchingFields: ['boardId', 'username', 'userId'],
  },
  joinAssignee: {
    matchingFields: ['boardId', 'username', 'userId'],
  },
  unjoinAssignee: {
    matchingFields: ['boardId', 'username', 'userId'],
  },
  addChecklist: {
    matchingFields: ['boardId', 'checklistName', 'userId'],
  },
  removeChecklist: {
    matchingFields: ['boardId', 'checklistName', 'userId'],
  },
  completeChecklist: {
    matchingFields: ['boardId', 'checklistName', 'userId'],
  },
  uncompleteChecklist: {
    matchingFields: ['boardId', 'checklistName', 'userId'],
  },
  addedChecklistItem: {
    matchingFields: ['boardId', 'checklistItemName', 'userId'],
  },
  removedChecklistItem: {
    matchingFields: ['boardId', 'checklistItemName', 'userId'],
  },
  checkedItem: {
    matchingFields: ['boardId', 'checklistItemName', 'userId'],
  },
  uncheckedItem: {
    matchingFields: ['boardId', 'checklistItemName', 'userId'],
  },
  addAttachment: {
    matchingFields: ['boardId', 'userId'],
  },
  deleteAttachment: {
    matchingFields: ['boardId', 'userId'],
  },
  addedLabel: {
    matchingFields: ['boardId', 'labelId', 'userId'],
  },
  removedLabel: {
    matchingFields: ['boardId', 'labelId', 'userId'],
  },
  // #2474: "a card's due/start/end/received date is set or changed" triggers.
  // These activityTypes ('a-dueAt'/'a-startAt'/'a-endAt'/'a-receivedAt') are
  // NOT new - models/cards.js's setDue/setStart/setEnd/setReceived already go
  // through server/models/cards.js's Cards.before.update timing-field hook,
  // which logs one of these activities (with timeKey/timeValue/timeOldValue)
  // on every SET (the hook reads modifier.$set, so it only ever fires for a
  // real value, never for unsetDue/unsetStart/unsetEnd/unsetReceived's
  // $unset). Registering them here just wires the existing activity into the
  // same TriggersDef-driven matcher every other trigger already uses - no new
  // detection mechanism.
  'a-receivedAt': {
    matchingFields: ['boardId', 'userId'],
  },
  'a-startAt': {
    matchingFields: ['boardId', 'userId'],
  },
  'a-dueAt': {
    matchingFields: ['boardId', 'userId'],
  },
  'a-endAt': {
    matchingFields: ['boardId', 'userId'],
  },
};
