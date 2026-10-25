'use strict';

// Board Settings / Card - also opened from an opened card's "+ Add" - as the
// Admin Panel's left menu and right pane (docs/Features/Cards/Card-Fields.md):
// the left menu lists these sections, the right pane the rows of the open one,
// each row with its "Show on Minicard" and "Show on Card" checkbox and order
// arrows, and - opened from a card - whether THIS card shows the field.
//
// Every row of models/lib/cardSettingsRows.js is in exactly one section
// (tests/cardSettingsSections.test.cjs). The first entry, `general`, has no
// rows: it holds what is not a field - asking for a move reason, the Draggable
// table and the select-all of each side.
//
// Pure: no Meteor.

const { CARD_SETTINGS_ROWS } = require('./cardSettingsRows');

const SECTIONS = Object.freeze([
  { id: 'general', icon: 'fa-cog', labelKey: 'card-settings', keys: [] },
  { id: 'date', icon: 'fa-calendar', labelKey: 'date',
    keys: ['receivedDate', 'startDate', 'dueDate', 'endDate', 'dueComplete', 'dueFromTitle', 'atRisk', 'forecast'] },
  { id: 'members', icon: 'fa-users', labelKey: 'members',
    keys: ['members', 'assignee', 'creator', 'requestedBy', 'assignedBy', 'suggestedMembers'] },
  { id: 'labels', icon: 'fa-tag', labelKey: 'labels',
    keys: ['labels', 'labelsAboveTitle', 'labelText', 'labelTextPersonal', 'stickers', 'location', 'cardColor'] },
  { id: 'description', icon: 'fa-file-text-o', labelKey: 'description',
    keys: ['descriptionTitle', 'descriptionText', 'descriptionBadge'] },
  { id: 'checklists', icon: 'fa-check', labelKey: 'checklists',
    keys: ['checklists', 'checklistTitle', 'checklistDueDate', 'checklistCount', 'checklistFromDescription', 'subtasks'] },
  { id: 'attachments', icon: 'fa-paperclip', labelKey: 'attachments',
    keys: ['cover', 'attachments', 'attachmentCount', 'attachmentPreviews', 'attachmentDetails', 'textNotes', 'whiteboard'] },
  { id: 'time', icon: 'fa-clock-o', labelKey: 'time',
    keys: ['spentTime', 'flowtime', 'pomodoro'] },
  { id: 'customFields', icon: 'fa-list-alt', labelKey: 'custom-fields',
    keys: ['customFields'] },
  { id: 'vote', icon: 'fa-thumbs-up', labelKey: 'vote-question',
    keys: ['vote', 'poker'] },
  { id: 'scrum', icon: 'fa-repeat', labelKey: 'scrum-settings',
    keys: ['scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumIssueType', 'scrumAcceptanceCriteria', 'scrumBacklogRank'] },
  { id: 'comments', icon: 'fa-comment-o', labelKey: 'comments',
    keys: ['comments', 'commentCount', 'unreadComments', 'activities', 'actionItems'] },
  { id: 'card', icon: 'fa-id-card-o', labelKey: 'card',
    keys: ['cardNumber', 'collapse', 'parentCard', 'linkedCard', 'dependencies', 'cardSortingByNumber',
      'showLists', 'listTitle', 'swimlaneName', 'cardButtons', 'similarCards'] },
]);

const sectionOf = key => SECTIONS.find(s => s.keys.includes(key)) || null;

// A row's label inside its section: the parts that only repeat the section's
// own name are left out - "Scrum settings: Sprint" is "Sprint" under Scrum
// settings - unless that would leave nothing.
function labelInSection(row, section) {
  const parts = (row && row.label) || [];
  if (!section || parts.length < 2) return parts;
  const rest = parts.filter(k => k !== section.labelKey);
  return rest.length ? rest : parts;
}

// The section's rows, in the table's order.
function rowsOfSection(sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  if (!section) return [];
  return section.keys
    .map(key => CARD_SETTINGS_ROWS.find(r => r.key === key))
    .filter(Boolean);
}

module.exports = { SECTIONS, sectionOf, labelInSection, rowsOfSection };
