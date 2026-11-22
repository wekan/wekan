'use strict';

// The Board Settings a WeKan JSON import writes besides what
// models/wekanCreator.js createBoardAndLabels sets itself (title, color,
// permission, labels, members, ...). A board exported and imported back lost
// every one of these - which fields show on a card and a minicard, the flow
// policies, the board views, WIP limit groups - and came back with the
// defaults. Pure - no Meteor - so tests/wekanCardFields.test.cjs holds this
// list to the board schema (models/boards.js): every field there is copied
// here, written by the creator, or named in NOT_COPIED with the reason.

// Copied as they are: settings, not references (models/boards.js).
export const BOARD_COPIED = [
  'archivedAt', 'announcement', 'wipLimitGroups', 'customThemeColors', 'allowsCardCounterList',
  'askForMoveReason', 'showEmptyCardFields', 'cardAging', 'autoArchiveInactiveDays', 'allowsBoardMemberList',
  'rulesVisibleToMembers', 'allowsSubtasks', 'allowsSubtasksOnMinicard', 'allowsAttachments',
  'allowsAttachmentsOnMinicard', 'allowsSwimlaneDragging', 'allowsListDragging', 'allowsCardDragging',
  'allowsChecklistDragging', 'allowsChecklistItemDragging', 'allowsSubtaskDragging', 'allowsMinicardCollapse',
  'labelsAboveTitleOnMinicard', 'allowsChecklistDueDate', 'allowsChecklistTitle', 'allowsChecklists',
  'allowsChecklistsOnMinicard', 'allowsCustomFields', 'allowsCustomFieldsOnMinicard',
  'allowsChecklistCountBadgeOnMinicard', 'allowsComments', 'allowsCommentsOnMinicard',
  'allowsDescriptionTitle', 'allowsDescriptionTitleOnMinicard', 'allowsDescriptionText',
  'allowsDescriptionTextOnMinicard', 'cardFieldOrder', 'minicardFieldOrder', 'cardSettingsSectionOrder',
  'minicardSettingsSectionOrder', 'cardSettingsHiddenOnCard', 'cardSettingsHiddenOnMinicard',
  'cardFieldsAlwaysShown', 'allowsCoverAttachmentOnMinicard', 'allowsCoverAttachmentOnCard',
  'allowsBadgeAttachmentOnMinicard', 'allowsAttachmentCountOnCard', 'allowsChecklistCountBadgeOnCard',
  'allowsCardSortingByNumberOnMinicard', 'allowsCardNumber', 'notifyOverrideTray', 'notifyOverrideEmail',
  'dueReminderDays', 'dueReminderWebhook', 'allowsCardNumberOnMinicard', 'allowsActivities', 'allowsLabels',
  'allowsLabelsOnMinicard', 'allowsCreator', 'allowsCreatorOnMinicard', 'showLabelText', 'allowsAssignee',
  'allowsAssigneeOnMinicard', 'allowsMembers', 'allowsMembersOnMinicard', 'allowsRequestedBy',
  'allowsRequestedByOnMinicard', 'allowsCardSortingByNumber', 'allowsShowLists', 'allowsAssignedBy',
  'allowsAssignedByOnMinicard', 'allowsShowListsOnMinicard', 'allowsSwimlaneNameOnMinicard',
  'allowsChecklistAtMinicard', 'allowsReceivedDate', 'allowsSpentTime', 'allowsSpentTimeOnMinicard',
  'allowsStickers', 'allowsStickersOnMinicard', 'allowsLocation', 'allowsDependencies',
  'allowsDependenciesOnMinicard', 'allowsFlowtime', 'allowsPomodoro', 'allowsVote', 'allowsVoteOnMinicard',
  'allowsPoker', 'allowsPokerOnMinicard', 'allowsTextNotes', 'allowsCommentCountOnMinicard',
  'allowsCardCollapse', 'allowsChecklistTitleOnMinicard', 'allowsLabelTextOnCard', 'labelsAboveTitleOnCard',
  'allowsChecklistDueDateOnMinicard', 'allowsLocationOnMinicard', 'allowsSwimlaneNameOnCard',
  'allowsFlowtimeOnMinicard', 'allowsPomodoroOnMinicard', 'allowsAttachmentListOnMinicard',
  'allowsTextNotesOnMinicard', 'allowsCommentCountOnCard', 'allowsActivitiesOnMinicard',
  'allowsCardColorOnCard', 'allowsCardColorOnMinicard', 'allowsParentCardOnCard',
  'allowsParentCardOnMinicard', 'allowsLinkedCardOnCard', 'allowsLinkedCardOnMinicard',
  'allowsCardButtonsOnCard', 'allowsDescriptionBadgeOnMinicard', 'allowsUnreadCommentsOnMinicard',
  'allowsCardButtonsOnMinicard', 'allowsDescriptionBadgeOnCard', 'allowsUnreadCommentsOnCard',
  'allowsDueFromTitleOnCard', 'allowsDueFromTitleOnMinicard', 'allowsSimilarCardsOnCard',
  'allowsSimilarCardsOnMinicard', 'allowsAtRiskOnCard', 'allowsAtRiskOnMinicard',
  'allowsSuggestedMembersOnCard', 'allowsForecastOnCard', 'allowsForecastOnMinicard',
  'allowsChecklistFromDescriptionOnCard', 'allowsActionItemsOnCard', 'allowsListPolicies', 'commitmentListId',
  'personWipLimit', 'allowsSplitLists', 'allowsBlockedOnCard', 'allowsBlockedOnMinicard',
  'allowsClassOfServiceOnCard', 'allowsClassOfServiceOnMinicard', 'allowsMoscowOnCard',
  'allowsMoscowOnMinicard', 'allowsWsjfOnCard', 'allowsWsjfOnMinicard', 'allowsWhiteboardOnCard',
  'allowsAttachmentPreviewsOnCard', 'allowsAttachmentDetailsOnCard', 'allowsIssueTypeOnMinicard',
  'restrictCommentEditing', 'stickyListHeaders', 'listWidthResizeLocked', 'columnSets', 'sharedListHeaders',
  'swimlaneHeightResizeLocked', 'boardViewSettings', 'defaultPublicBoardView', 'defaultPrivateBoardView',
  'boardViewOrder', 'sameWidthForAllLists', 'sameWidthForAllListsValue', 'allowsReceivedDateOnMinicard',
  'dateFormatOverride', 'dateFormat', 'allowsStartDate', 'allowsStartDateOnMinicard', 'allowsEndDate',
  'allowsEndDateOnMinicard', 'allowsDueDate', 'allowsDueDateOnMinicard', 'allowsDueComplete',
  'allowsDueCompleteOnMinicard', 'showActivities', 'notificationDelivery'
];

// A template board stays one. The user's own Templates board
// (template-container) is the one their profile points to, so an imported
// one is an ordinary template board (wekanCreator reports it).
export function wekanBoardType(type) {
  return type === 'template-board' || type === 'template-container' ? 'template-board' : undefined;
}

// A field that names a list of the board is remapped to the new list's id.
export const LIST_REFERENCES = ['commitmentListId'];

// What an imported file must not set on its own, and what has no meaning on
// another board.
export const NOT_COPIED = {
  orgs: 'access: who may open the board is set on the new board',
  teams: 'access: who may open the board is set on the new board',
  domains: 'access: which email domains get the board is set on the new board',
  allowsInstanceEditing: 'access: letting every signed-in user edit is a board admin\'s choice on the new board',
  emailToCard: 'opening the board to inbound email is a board admin\'s choice on the new board',
  syncEffectsEnabled: 'Sync is set up per board',
  importRunId: 'the import itself writes it',
  migrationVersion: 'the WeKan the board is imported into migrates it',
  mapImageAttachmentId: 'a board attachment, which the export does not carry',
  subtasksDefaultBoardId: 'another board of the exporting WeKan',
  subtasksDefaultListId: 'a list of another board of the exporting WeKan',
  subtasksDefaultSwimlaneId: 'a swimlane of another board of the exporting WeKan',
  dateSettingsDefaultBoardId: 'another board of the exporting WeKan',
  dateSettingsDefaultListId: 'a list of another board of the exporting WeKan',
  // Board Settings / Shop names custom fields, lists, an orders board and its
  // admin of the exporting WeKan, and a shop opens only when an admin saves it.
  shopSettings: 'the shop names custom fields, lists and an orders board of the exporting WeKan; a board admin sets it up on the new board',
};

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// board: the exported board. copied: the field names to copy (the schema's,
// less the creator's and NOT_COPIED - wekanCreator passes BOARD_COPIED).
// lists: exported list id -> new list id.
export function wekanBoardFields(board, copied, { lists = {} } = {}) {
  if (!isObject(board)) return {};
  const out = {};
  for (const field of copied) {
    if (Object.prototype.hasOwnProperty.call(NOT_COPIED, field)) continue;
    const value = board[field];
    if (value === undefined || value === null) continue;
    if (LIST_REFERENCES.includes(field)) {
      if (lists[value]) out[field] = lists[value];
      continue;
    }
    if (field === 'archivedAt') {
      const date = new Date(value);
      if (board.archived && !Number.isNaN(date.getTime())) out.archivedAt = date;
      continue;
    }
    if (field === 'announcement' && isObject(value)) {
      const date = value.updatedAt ? new Date(value.updatedAt) : null;
      out.announcement = { ...value, ...(date && !Number.isNaN(date.getTime()) ? { updatedAt: date } : {}) };
      if (date && Number.isNaN(date.getTime())) delete out.announcement.updatedAt;
      continue;
    }
    if (field === 'wipLimitGroups') {
      // A group names lists of the board: by their new ids, and a group
      // left with none is dropped.
      const groups = (Array.isArray(value) ? value : []).filter(isObject).map(group => ({
        ...group,
        listIds: [...new Set((Array.isArray(group.listIds) ? group.listIds : []).map(id => lists[id]).filter(Boolean))],
      })).filter(group => group.listIds.length);
      if (groups.length) out.wipLimitGroups = groups;
      continue;
    }
    out[field] = value;
  }
  return out;
}
