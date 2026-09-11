'use strict';

// The rows of Board Settings / Card (client/components/sidebar/sidebar.jade,
// boardCardSettingsPopup): one entry per thing the opened card or the
// minicard can show. The popup draws two lists from this table - "Show on
// Minicard" in the board's minicard order and "Show on Card" in its card
// order (models/lib/cardFieldOrder.js) - and every row of either list is
// `[checkbox] [up] [down] icon label`.
//
// Per entry:
//   key            - the field key of cardFieldOrder.js (the row's position)
//   icons          - Font Awesome classes drawn before the label
//   label          - i18n keys, joined with a space (every one already exists;
//                    the rows reuse the field's own name)
//   card           - { toggle, field } for the "Show on Card" column: the
//                    click-handler class and the popup helper that says
//                    whether it is checked. Absent when the card shows nothing
//                    of it.
//   minicard       - the same for "Show on Minicard". `personal: true` marks
//                    the two rows that are the user's or the card's own rather
//                    than the board's (sidebar.css .card-settings-row-personal);
//                    `after` places a row that has NO element of its own on the
//                    minicard (so no position in minicardFieldOrder) under the
//                    row it modifies, with its arrows disabled.
//
// Pure data (no Meteor) so tests/cardSettingsCoverage.test.cjs can check every
// row against the templates, the handlers and the Boards schema.

const CARD_SETTINGS_ROWS = [
  { key: 'dueComplete', icons: ['fa-check-square-o'], label: ['card-mark-complete'],
    card: { toggle: 'js-field-has-duecomplete', field: 'allowsDueComplete' },
    minicard: { toggle: 'js-field-has-duecomplete-on-minicard', field: 'allowsDueCompleteOnMinicard' } },
  { key: 'cardNumber', icons: ['fa-hashtag'], label: ['card', 'number'],
    card: { toggle: 'js-field-has-card-number', field: 'allowsCardNumber' },
    minicard: { toggle: 'js-field-has-card-number-on-minicard', field: 'allowsCardNumberOnMinicard' } },
  { key: 'cover', icons: ['fa-picture-o'], label: ['cover-image'],
    card: { toggle: 'js-field-has-cover-attachment-on-card', field: 'allowsCoverAttachmentOnCard' },
    minicard: { toggle: 'js-field-has-cover-attachment-on-minicard', field: 'allowsCoverAttachmentOnMinicard' } },

  { key: 'labels', icons: ['fa-tag'], label: ['labels'],
    card: { toggle: 'js-field-has-labels', field: 'allowsLabels' },
    minicard: { toggle: 'js-field-has-labels-on-minicard', field: 'allowsLabelsOnMinicard' } },
  // #4256: the labels on a minicard as coloured WORDS, or as bars with the
  // words left out. The board's default, then the user's own override of it
  // (client/lib/minicardLabelText.js). Both modify the Labels element.
  { key: 'labelText', icons: ['fa-tag', 'fa-file-text-o'], label: ['labels', 'custom-field-text'],
    minicard: { toggle: 'js-field-has-label-text', field: 'allowsLabelText', after: 'labels' } },
  { key: 'labelTextPersonal', icons: ['fa-tag', 'fa-file-text-o'], label: ['labels', 'custom-field-text'],
    minicard: { toggle: 'js-toggle-minicard-label-text', field: 'showsMinicardLabelText',
      after: 'labelText', personal: true, labelTextOverride: true } },
  { key: 'stickers', icons: ['fa-sticky-note-o'], label: ['stickers'],
    card: { toggle: 'js-field-has-stickers', field: 'allowsStickers' },
    minicard: { toggle: 'js-field-has-stickers-on-minicard', field: 'allowsStickersOnMinicard' } },
  { key: 'location', icons: ['fa-map-marker'], label: ['location'],
    card: { toggle: 'js-field-has-location', field: 'allowsLocation' } },

  { key: 'receivedDate', icons: ['fa-sign-in'], label: ['card-received'],
    card: { toggle: 'js-field-has-receiveddate', field: 'allowsReceivedDate' },
    minicard: { toggle: 'js-field-has-receiveddate-on-minicard', field: 'allowsReceivedDateOnMinicard' } },
  { key: 'startDate', icons: ['fa-hourglass'], label: ['card-start'],
    card: { toggle: 'js-field-has-startdate', field: 'allowsStartDate' },
    minicard: { toggle: 'js-field-has-startdate-on-minicard', field: 'allowsStartDateOnMinicard' } },
  { key: 'dueDate', icons: ['fa-sign-in'], label: ['card-due'],
    card: { toggle: 'js-field-has-duedate', field: 'allowsDueDate' },
    minicard: { toggle: 'js-field-has-duedate-on-minicard', field: 'allowsDueDateOnMinicard' } },
  { key: 'endDate', icons: ['fa-clock-o'], label: ['card-end'],
    card: { toggle: 'js-field-has-enddate', field: 'allowsEndDate' },
    minicard: { toggle: 'js-field-has-enddate-on-minicard', field: 'allowsEndDateOnMinicard' } },

  { key: 'members', icons: ['fa-users'], label: ['members'],
    card: { toggle: 'js-field-has-members', field: 'allowsMembers' },
    minicard: { toggle: 'js-field-has-members-on-minicard', field: 'allowsMembersOnMinicard' } },
  { key: 'assignee', icons: ['fa-user'], label: ['assignee'],
    card: { toggle: 'js-field-has-assignee', field: 'allowsAssignee' },
    minicard: { toggle: 'js-field-has-assignee-on-minicard', field: 'allowsAssigneeOnMinicard' } },
  { key: 'creator', icons: ['fa-user'], label: ['creator'],
    card: { toggle: 'js-field-has-creator', field: 'allowsCreator' },
    minicard: { toggle: 'js-field-has-creator-on-minicard', field: 'allowsCreatorOnMinicard' } },
  { key: 'requestedBy', icons: ['fa-user', 'fa-plus'], label: ['requested-by'],
    card: { toggle: 'js-field-has-requested-by', field: 'allowsRequestedBy' },
    minicard: { toggle: 'js-field-has-requested-by-on-minicard', field: 'allowsRequestedByOnMinicard', after: 'creator' } },
  { key: 'assignedBy', icons: ['fa-shopping-cart'], label: ['assigned-by'],
    card: { toggle: 'js-field-has-assigned-by', field: 'allowsAssignedBy' },
    minicard: { toggle: 'js-field-has-assigned-by-on-minicard', field: 'allowsAssignedByOnMinicard', after: 'requestedBy' } },

  { key: 'dependencies', icons: ['fa-link'], label: ['card-dependencies'],
    card: { toggle: 'js-field-has-dependencies', field: 'allowsDependencies' },
    minicard: { toggle: 'js-field-has-dependencies-on-minicard', field: 'allowsDependenciesOnMinicard' } },

  { key: 'cardSortingByNumber', icons: ['fa-sort-numeric-asc'], label: ['card-sorting-by-number'],
    card: { toggle: 'js-field-has-card-sorting-by-number', field: 'allowsCardSortingByNumber' },
    minicard: { toggle: 'js-field-has-card-sorting-by-number-on-minicard', field: 'allowsCardSortingByNumberOnMinicard' } },
  { key: 'showLists', icons: ['fa-list'], label: ['card-show-lists'],
    card: { toggle: 'js-field-has-card-show-lists', field: 'allowsShowLists' },
    minicard: { toggle: 'js-field-has-card-show-lists-on-minicard', field: 'allowsShowListsOnMinicard' } },
  // "List title": the name of the LIST this card is in, on ITS minicard - a
  // per-card setting under the board-wide "Show lists" row that turns it on
  // for every card. Only for somebody who may change the card.
  { key: 'listTitle', icons: ['fa-list'], label: ['list', 'title'],
    minicard: { toggle: 'js-toggle-show-list-on-minicard', field: 'showsListOnMinicard',
      after: 'showLists', personal: true, needsCard: true } },
  // #2426: the swimlane a card belongs to, at the bottom of the minicard. The
  // opened card shows it through its own picker, so there is no card side.
  { key: 'swimlaneName', icons: ['fa-list-alt'], label: ['swimlane'],
    minicard: { toggle: 'js-field-has-swimlane-name-on-minicard', field: 'allowsSwimlaneNameOnMinicard' } },
  { key: 'spentTime', icons: ['fa-clock-o'], label: ['spent-time-hours'],
    card: { toggle: 'js-field-has-spent-time', field: 'allowsSpentTime' },
    minicard: { toggle: 'js-field-has-spent-time-on-minicard', field: 'allowsSpentTimeOnMinicard' } },
  { key: 'flowtime', icons: ['fa-bolt'], label: ['flowtime'],
    card: { toggle: 'js-field-has-flowtime', field: 'allowsFlowtime' } },
  { key: 'pomodoro', icons: ['fa-clock-o'], label: ['pomodoro'],
    card: { toggle: 'js-field-has-pomodoro', field: 'allowsPomodoro' } },

  { key: 'customFields', icons: ['fa-list-alt'], label: ['custom-fields'],
    card: { toggle: 'js-field-has-custom-fields', field: 'allowsCustomFields' },
    minicard: { toggle: 'js-field-has-custom-fields-on-minicard', field: 'allowsCustomFieldsOnMinicard' } },
  { key: 'vote', icons: ['fa-thumbs-up'], label: ['vote-question'],
    card: { toggle: 'js-field-has-vote', field: 'allowsVote' },
    minicard: { toggle: 'js-field-has-vote-on-minicard', field: 'allowsVoteOnMinicard' } },
  { key: 'poker', icons: ['fa-check-square'], label: ['poker-question'],
    card: { toggle: 'js-field-has-poker', field: 'allowsPoker' },
    minicard: { toggle: 'js-field-has-poker-on-minicard', field: 'allowsPokerOnMinicard' } },

  { key: 'descriptionTitle', icons: ['fa-file-text-o'], label: ['description', 'title'],
    card: { toggle: 'js-field-has-description-title', field: 'allowsDescriptionTitle' },
    minicard: { toggle: 'js-field-has-description-title-on-minicard', field: 'allowsDescriptionTitleOnMinicard', after: 'descriptionText' } },
  { key: 'descriptionText', icons: ['fa-file-text-o'], label: ['description', 'custom-field-text'],
    card: { toggle: 'js-field-has-description-text', field: 'allowsDescriptionText' },
    minicard: { toggle: 'js-field-has-description-text-on-minicard', field: 'allowsDescriptionTextOnMinicard' } },

  { key: 'checklists', icons: ['fa-check'], label: ['checklists'],
    card: { toggle: 'js-field-has-checklists', field: 'allowsChecklists' },
    minicard: { toggle: 'js-field-has-checklists-on-minicard', field: 'allowsChecklistsOnMinicard' } },
  { key: 'checklistCount', icons: ['fa-check-square-o'], label: ['checklist-count'],
    card: { toggle: 'js-field-has-checklist-count', field: 'allowsChecklistCountBadgeOnCard' },
    minicard: { toggle: 'js-field-has-checklist-count-on-minicard', field: 'allowsChecklistCountBadgeOnMinicard' } },
  { key: 'subtasks', icons: ['fa-globe'], label: ['subtasks'],
    card: { toggle: 'js-field-has-subtasks', field: 'allowsSubtasks' },
    minicard: { toggle: 'js-field-has-subtasks-on-minicard', field: 'allowsSubtasksOnMinicard' } },
  { key: 'attachmentCount', icons: ['fa-paperclip'], label: ['attachment-count'],
    card: { toggle: 'js-field-has-attachment-count', field: 'allowsAttachmentCountOnCard' },
    minicard: { toggle: 'js-field-has-badge-attachment-on-minicard', field: 'allowsBadgeAttachmentOnMinicard' } },
  // On the minicard the attachment COUNT badge is the element; the Attachments
  // toggle there predates it and has no element of its own, so it follows.
  { key: 'attachments', icons: ['fa-paperclip'], label: ['attachments'],
    card: { toggle: 'js-field-has-attachments', field: 'allowsAttachments' },
    minicard: { toggle: 'js-field-has-attachments-on-minicard', field: 'allowsAttachmentsOnMinicard', after: 'attachmentCount' } },
  // #595 text notes: card only, nothing of them is on the minicard.
  { key: 'textNotes', icons: ['fa-file-text-o'], label: ['text-notes'],
    card: { toggle: 'js-field-has-text-notes', field: 'allowsTextNotes' } },
  { key: 'comments', icons: ['fa-comment-o'], label: ['card-comments-on-minicard'],
    card: { toggle: 'js-field-has-comments', field: 'allowsComments' },
    minicard: { toggle: 'js-field-has-comments-on-minicard', field: 'allowsCommentsOnMinicard' } },
  // The comment-COUNT badge, separate from the comment preview above.
  { key: 'commentCount', icons: ['fa-comment-o'], label: ['comments', 'number'],
    minicard: { toggle: 'js-field-has-comment-count-on-minicard', field: 'allowsCommentCountOnMinicard' } },
  { key: 'activities', icons: ['fa-history'], label: ['activities'],
    card: { toggle: 'js-field-has-activities', field: 'allowsActivities' } },
];

// The rows of one column, in `order` (a canonical flat order from
// cardFieldOrder.js for that side). A row with a position sits at it; a row
// with `after` follows the row it names. Rows without that side are left out.
function rowsForSide(side, order) {
  const withSide = CARD_SETTINGS_ROWS.filter(r => r[side]);
  const placed = order
    .map(key => withSide.find(r => r.key === key))
    .filter(Boolean);
  const attach = anchorKey => {
    withSide
      .filter(r => r[side].after === anchorKey)
      .forEach(r => {
        const at = placed.findIndex(p => p.key === anchorKey);
        if (at === -1) placed.push(r);
        else placed.splice(at + 1, 0, r);
        attach(r.key);
      });
  };
  order.forEach(attach);
  // Anything left (an `after` whose anchor is not positioned) goes last.
  withSide.forEach(r => {
    if (!placed.includes(r)) placed.push(r);
  });
  return placed;
}

module.exports = { CARD_SETTINGS_ROWS, rowsForSide };
