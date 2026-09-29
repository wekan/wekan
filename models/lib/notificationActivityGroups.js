'use strict';

// wekan/wekan#572 (maintainer decision 2026-09-29): per-activity notification
// options. The 3-tier Notification Settings (models/lib/notificationSettings.js)
// choose WHERE a notification goes - the bell and email. These choose WHICH
// kinds of card activity a member is told about at all: somebody who does not
// want a notification every time a label is added can turn off "Labels" and
// keep everything else.
//
// Muting is the member's own choice (profile.notifyMutedActivities, a list of
// the keys below); an empty list is the old behaviour. Due-date reminders and
// @mentions are never muted here: a reminder has its own per-board setting
// (#5323), and a mention is addressed to the member by name.

const NOTIFICATION_ACTIVITY_GROUPS = {
  labels: ['addedLabel', 'removedLabel'],
  members: ['joinMember', 'unjoinMember', 'addBoardMember', 'removeBoardMember'],
  assignees: ['joinAssignee', 'unjoinAssignee'],
  comments: ['addComment', 'editComment', 'deleteComment'],
  moves: ['moveCard', 'moveCardToOtherBoard'],
  dates: ['a-dueAt', 'a-endAt', 'a-startAt', 'a-receivedAt'],
  checklists: ['addChecklist', 'addChecklistItem', 'removeChecklist', 'removeChecklistItem',
    'checkedItem', 'uncheckedItem', 'completeChecklist', 'uncompleteChecklist'],
  attachments: ['addAttachment', 'deleteAttachment'],
  customFields: ['setCustomField'],
  archive: ['archivedCard', 'restoredCard', 'archivedList', 'archivedSwimlane', 'deleteCard'],
  created: ['createCard', 'createList', 'createSwimlane', 'addSubtask', 'importCard', 'importList'],
};

const GROUP_KEYS = Object.keys(NOTIFICATION_ACTIVITY_GROUPS);

// The group an activity type belongs to, or null (never muted).
function notificationGroupOf(activityType) {
  for (const key of GROUP_KEYS) {
    if (NOTIFICATION_ACTIVITY_GROUPS[key].includes(activityType)) return key;
  }
  return null;
}

// Keep only known keys, once each, in catalog order.
function cleanMutedGroups(value) {
  const list = Array.isArray(value) ? value : [];
  return GROUP_KEYS.filter(key => list.includes(key));
}

// Has this member muted notifications about this kind of activity?
function isActivityMuted(activityType, mutedGroups) {
  const group = notificationGroupOf(activityType);
  return !!group && cleanMutedGroups(mutedGroups).includes(group);
}

module.exports = { NOTIFICATION_ACTIVITY_GROUPS, GROUP_KEYS, notificationGroupOf, cleanMutedGroups, isActivityMuted };
