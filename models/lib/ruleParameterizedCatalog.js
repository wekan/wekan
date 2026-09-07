'use strict';

const MAX_RULE_PARAMETER_LENGTH = 500;
const DATE_FIELDS = new Set(['startAt', 'dueAt', 'endAt', 'receivedAt']);
const DATE_UNITS = new Set(['minutes', 'hours', 'days', 'weeks', 'months']);
const SORT_FIELDS = new Set(['due', 'name', 'created', 'modified']);
const SCHEDULE_TYPES = new Set(['once', 'daily', 'weekday', 'weekly', 'monthly']);
const DUE_CONDITIONS = new Set(['set', 'soon', 'overdue']);

const PARAMETERIZED_TRIGGERS = [
  ['card-created', 'r-w-card-created', 'Card is created'],
  ['card-moved-any', 'r-when-a-card-is-moved', 'Card is moved'],
  ['card-moved-to', 'r-moved-to', 'Card is moved to a list'],
  ['card-moved-from', 'r-moved-from', 'Card is moved from a list'],
  ['card-archived', 'r-w-card-archived', 'Card is archived'],
  ['card-restored', 'r-w-card-unarchived', 'Card is restored'],
  ['label-added', 'r-w-label-added', 'Label is added'],
  ['label-removed', 'r-w-label-removed', 'Label is removed'],
  ['member-added', 'r-w-member-added', 'Member is added'],
  ['member-removed', 'r-w-member-removed', 'Member is removed'],
  ['attachment-added', 'r-w-attachment-added', 'Attachment is added'],
  ['attachment-removed', 'r-removed-from', 'Attachment is removed'],
  ['checklist-added', 'r-w-checklist-added', 'Checklist is added'],
  ['checklist-removed', 'r-removed-from', 'Checklist is removed'],
  ['checklist-completed', 'r-completed', 'Checklist is completed'],
  ['checklist-uncompleted', 'r-made-incomplete', 'Checklist is made incomplete'],
  ['item-checked', 'r-checked', 'Checklist item is checked'],
  ['item-unchecked', 'r-unchecked', 'Checklist item is unchecked'],
  ['scheduled-calendar', 'r-schedule-daily', 'Calendar schedule'],
  ['scheduled-due', 'r-due-soon', 'Due-date schedule'],
  ['scheduled-aging', 'r-when-card-in-list', 'Card aging schedule'],
  ['card-button', 'r-card-button', 'Card button'],
  ['board-button', 'r-board-button', 'Board button'],
].map(([value, labelKey, fallback]) => ({ value, labelKey, fallback }));

const PARAMETERIZED_ACTIONS = [
  ['move-top', 'r-top-of', 'Move card to top'],
  ['move-bottom', 'r-bottom-of', 'Move card to bottom'],
  ['archive', 'r-archive', 'Archive card'],
  ['unarchive', 'r-unarchive', 'Restore card'],
  ['add-swimlane', 'r-add-swimlane', 'Add swimlane'],
  ['create-card', 'r-create-card', 'Create card'],
  ['link-card', 'r-link-card', 'Link card'],
  ['sort-list', 'r-sort-list', 'Sort list'],
  ['move-all-cards', 'r-move-all-cards', 'Move all cards in list'],
  ['set-date', 'r-set', 'Set date'],
  ['update-date', 'r-update', 'Update date'],
  ['remove-date', 'r-remove', 'Remove date'],
  ['add-label', 'r-add', 'Add label'],
  ['remove-label', 'r-remove', 'Remove label'],
  ['add-member', 'r-add', 'Add member'],
  ['remove-member', 'r-remove', 'Remove member'],
  ['remove-all-members', 'r-remove-all', 'Remove all members'],
  ['set-color', 'r-set-color', 'Set card color'],
  ['mark-complete', 'r-mark-complete', 'Mark card complete'],
  ['mark-incomplete', 'r-mark-incomplete', 'Mark card incomplete'],
  ['set-date-relative', 'r-set-date-relative', 'Set relative date'],
  ['add-checklist', 'r-add', 'Add checklist'],
  ['remove-checklist', 'r-remove', 'Remove checklist'],
  ['check-all', 'r-check-all', 'Check all checklist items'],
  ['uncheck-all', 'r-uncheck-all', 'Uncheck all checklist items'],
  ['check-item', 'r-check', 'Check checklist item'],
  ['uncheck-item', 'r-uncheck', 'Uncheck checklist item'],
  ['add-checklist-items', 'r-add-checklist', 'Add checklist with items'],
  ['send-email', 'r-send-email', 'Send email'],
].map(([value, labelKey, fallback]) => ({ value, labelKey, fallback }));

const triggerKinds = new Set(PARAMETERIZED_TRIGGERS.map(entry => entry.value));
const actionKinds = new Set(PARAMETERIZED_ACTIONS.map(entry => entry.value));

function text(value, fallback = '*', allowEmpty = false, maximum = MAX_RULE_PARAMETER_LENGTH) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (result.length > maximum) throw new Error('Rule parameter is too long');
  if (!result && !allowEmpty) return fallback;
  return result;
}

function integer(value, minimum, maximum, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) return fallback;
  return parsed;
}

function clock(value) {
  const result = text(value, '09:00');
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(result) ? result : '09:00';
}

function buildParameterizedTrigger(kind, fields = {}) {
  if (!triggerKinds.has(kind)) throw new Error('Unknown rule trigger');
  const userId = text(fields.triggerUserId, '*');
  const cardTitle = text(fields.triggerCardTitle, '*');
  const listName = text(fields.triggerListName, '*');
  const swimlaneName = text(fields.triggerSwimlaneName, '*');
  const commonCard = { cardTitle, userId };
  if (kind === 'card-created') return {
    activityType: 'createCard', listName, swimlaneName, ...commonCard,
    desc: 'When a card is created',
  };
  if (kind.startsWith('card-moved')) return {
    activityType: 'moveCard', swimlaneName, ...commonCard,
    listName: kind === 'card-moved-from' ? '*' : listName,
    oldListName: kind === 'card-moved-to' || kind === 'card-moved-any' ? '*' : listName,
    desc: kind === 'card-moved-to' ? `When a card is moved to list ${listName}`
      : kind === 'card-moved-from' ? `When a card is moved from list ${listName}`
        : 'When a card is moved',
  };
  if (kind === 'card-archived' || kind === 'card-restored') return {
    activityType: kind === 'card-archived' ? 'archivedCard' : 'restoredCard',
    ...commonCard,
    desc: kind === 'card-archived' ? 'When a card is moved to archive'
      : 'When a card is restored from archive',
  };
  if (kind === 'label-added' || kind === 'label-removed') return {
    activityType: kind === 'label-added' ? 'addedLabel' : 'removedLabel',
    labelId: text(fields.triggerLabelId, '*'), userId,
    desc: kind === 'label-added' ? 'When a label is added' : 'When a label is removed',
  };
  if (kind === 'member-added' || kind === 'member-removed') return {
    activityType: kind === 'member-added' ? 'joinMember' : 'unjoinMember',
    username: text(fields.triggerUsername, '*'), userId,
    desc: kind === 'member-added' ? 'When a member is added' : 'When a member is removed',
  };
  if (kind === 'attachment-added' || kind === 'attachment-removed') return {
    activityType: kind === 'attachment-added' ? 'addAttachment' : 'deleteAttachment', userId,
    desc: kind === 'attachment-added' ? 'When an attachment is added'
      : 'When an attachment is removed',
  };
  if (kind.startsWith('checklist-')) {
    const types = { 'checklist-added': 'addChecklist', 'checklist-removed': 'removeChecklist',
      'checklist-completed': 'completeChecklist',
      'checklist-uncompleted': 'uncompleteChecklist' };
    return { activityType: types[kind], checklistName: text(fields.triggerChecklistName, '*'),
      userId, desc: `When a checklist is ${kind.slice('checklist-'.length)}` };
  }
  if (kind === 'item-checked' || kind === 'item-unchecked') return {
    activityType: kind === 'item-checked' ? 'checkedItem' : 'uncheckedItem',
    checklistItemName: text(fields.triggerChecklistItemName, '*'), userId,
    desc: kind === 'item-checked' ? 'When a checklist item is checked'
      : 'When a checklist item is unchecked',
  };
  if (kind === 'scheduled-calendar') {
    const scheduleType = SCHEDULE_TYPES.has(fields.triggerScheduleType)
      ? fields.triggerScheduleType : 'daily';
    return { activityType: 'scheduledTrigger', scheduleKind: 'calendar', scheduleType,
      atTime: clock(fields.triggerTime), weekday: integer(fields.triggerWeekday, 0, 6, 1),
      dayOfMonth: integer(fields.triggerDayOfMonth, 1, 31, 1),
      onDate: text(fields.triggerDate, '', true), listName, swimlaneName: '*',
      desc: `On ${scheduleType} schedule at ${clock(fields.triggerTime)}` };
  }
  if (kind === 'scheduled-due') {
    const dueCondition = DUE_CONDITIONS.has(fields.triggerDueCondition)
      ? fields.triggerDueCondition : 'soon';
    return { activityType: 'scheduledTrigger', scheduleKind: 'due', dueCondition,
      days: integer(fields.triggerDays, 0, 36500, 0), atTime: clock(fields.triggerTime),
      listName: '*', swimlaneName: '*', desc: `When a card due date is ${dueCondition}` };
  }
  if (kind === 'scheduled-aging') return {
    activityType: 'scheduledTrigger', scheduleKind: 'aging',
    days: integer(fields.triggerDays, 1, 36500, 7), atTime: clock(fields.triggerTime),
    listName, swimlaneName: '*', desc: `When a card has not moved for ${integer(fields.triggerDays, 1, 36500, 7)} days`,
  };
  const buttonType = kind === 'board-button' ? 'board' : 'card';
  return { activityType: 'button', buttonType,
    buttonLabel: text(fields.triggerButtonLabel, 'Run'),
    desc: `${buttonType === 'board' ? 'Board' : 'Card'} button` };
}

function buildParameterizedAction(kind, fields = {}) {
  if (!actionKinds.has(kind)) throw new Error('Unknown rule action');
  const listName = text(fields.actionListName, '*');
  const swimlaneName = text(fields.actionSwimlaneName, '*');
  const boardId = text(fields.actionBoardId, fields.sourceBoardId || '*');
  if (kind === 'move-top' || kind === 'move-bottom') return {
    actionType: kind === 'move-top' ? 'moveCardToTop' : 'moveCardToBottom',
    boardId, listName, swimlaneName,
    desc: kind === 'move-top' ? 'Move card to top of its list' : 'Move card to bottom of its list',
  };
  if (kind === 'archive' || kind === 'unarchive') return {
    actionType: kind, desc: kind === 'archive' ? 'Move card to archive' : 'Restore card from archive',
  };
  if (kind === 'add-swimlane') return { actionType: 'addSwimlane',
    swimlaneName: text(fields.actionSwimlaneName, '', true), desc: 'Add swimlane' };
  if (kind === 'create-card') return { actionType: 'createCard',
    cardName: text(fields.actionCardName, '', true), listName, swimlaneName,
    desc: 'Create card' };
  if (kind === 'link-card') return { actionType: 'linkCard', boardId, listName, swimlaneName,
    desc: 'Link card' };
  if (kind === 'sort-list') return { actionType: 'sortList', listName,
    sortField: SORT_FIELDS.has(fields.actionSortField) ? fields.actionSortField : 'due',
    desc: 'Sort list' };
  if (kind === 'move-all-cards') return { actionType: 'moveAllCardsInList',
    fromListName: text(fields.actionFromListName, '*'), listName, desc: 'Move all cards in list' };
  if (['set-date', 'update-date', 'remove-date'].includes(kind)) return {
    actionType: { 'set-date': 'setDate', 'update-date': 'updateDate',
      'remove-date': 'removeDate' }[kind],
    dateField: DATE_FIELDS.has(fields.actionDateField) ? fields.actionDateField : 'dueAt',
    desc: `${kind.replaceAll('-', ' ')} ${fields.actionDateField || 'dueAt'}` };
  if (kind === 'add-label' || kind === 'remove-label') return {
    actionType: kind === 'add-label' ? 'addLabel' : 'removeLabel',
    labelId: text(fields.actionLabelId, ''), desc: kind.replace('-', ' '),
  };
  if (kind === 'add-member' || kind === 'remove-member') return {
    actionType: kind === 'add-member' ? 'addMember' : 'removeMember',
    username: text(fields.actionUsername, ''), desc: kind.replace('-', ' '),
  };
  if (kind === 'remove-all-members') return {
    actionType: 'removeMember', username: '*', desc: 'Remove all members from card',
  };
  if (kind === 'set-color') return { actionType: 'setColor',
    selectedColor: text(fields.actionColor, ''), desc: 'Set card color' };
  if (kind === 'mark-complete' || kind === 'mark-incomplete') return {
    actionType: kind === 'mark-complete' ? 'markCardComplete' : 'markCardIncomplete',
    desc: kind === 'mark-complete' ? 'Mark card complete' : 'Mark card incomplete',
  };
  if (kind === 'set-date-relative') return { actionType: 'setDateRelative',
    dateField: DATE_FIELDS.has(fields.actionDateField) ? fields.actionDateField : 'dueAt',
    days: integer(fields.actionAmount, -36500, 36500, 0),
    unit: DATE_UNITS.has(fields.actionUnit) ? fields.actionUnit : 'days',
    desc: 'Set relative date' };
  const checklistName = text(fields.actionChecklistName, '', true);
  if (kind === 'add-checklist' || kind === 'remove-checklist') return {
    actionType: kind === 'add-checklist' ? 'addChecklist' : 'removeChecklist', checklistName,
    desc: kind.replace('-', ' '),
  };
  if (kind === 'check-all' || kind === 'uncheck-all') return {
    actionType: kind === 'check-all' ? 'checkAll' : 'uncheckAll', checklistName,
    desc: kind.replaceAll('-', ' '),
  };
  if (kind === 'check-item' || kind === 'uncheck-item') return {
    actionType: kind === 'check-item' ? 'checkItem' : 'uncheckItem', checklistName,
    checkItemName: text(fields.actionChecklistItemName, '', true),
    desc: kind.replaceAll('-', ' '),
  };
  if (kind === 'add-checklist-items') return { actionType: 'addChecklistWithItems', checklistName,
    checklistItems: text(fields.actionChecklistItems, '', true, 10000), desc: 'Add checklist with items' };
  return { actionType: 'sendEmail', emailTo: text(fields.actionEmailTo, '', true),
    emailSubject: text(fields.actionEmailSubject, '', true),
    emailMsg: text(fields.actionEmailMessage, '', true, 10000), desc: 'Send email' };
}

module.exports = {
  DATE_FIELDS,
  DATE_UNITS,
  DUE_CONDITIONS,
  MAX_RULE_PARAMETER_LENGTH,
  PARAMETERIZED_ACTIONS,
  PARAMETERIZED_TRIGGERS,
  SCHEDULE_TYPES,
  SORT_FIELDS,
  buildParameterizedAction,
  buildParameterizedTrigger,
};
