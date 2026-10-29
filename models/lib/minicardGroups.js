'use strict';

// The minicard draws Card Settings' sections (models/lib/cardSettingsSections.js)
// in the board's Show on Minicard section order, each section's fields in the
// order of its Show on Minicard rows - and, because the minicard is compact,
// with NO headings. What shares a container on the minicard still shares one:
// consecutive date fields are one `.dates` line, consecutive badges one
// `.badges` strip, also across a section boundary (the Date and Time sections
// make one dates line, as Spent time always shared the dates' line). Fields
// with no element of their own on the minicard (a row that only modifies
// another, the title row's fields, the cover under the title) are not listed.
// client/components/cards/minicard.jade `each group in minicardGroups`.
//
// Pure: no Meteor. tests/minicardSections.test.cjs.

// Drawn inside the `.dates` line.
const DATE_FIELDS = Object.freeze(['receivedDate', 'startDate', 'dueDate', 'endDate', 'spentTime',
  'atRisk', 'forecast']);
// Drawn inside the `.badges` strip. `cardKind` is not a row: the Story / Task
// badge (#2012), first of the Scrum section, where Card kind is set.
const BADGE_FIELDS = Object.freeze(['cardKind', 'scrumIssueType', 'dependencies', 'stickers', 'commentCount',
  'vote', 'poker', 'attachmentCount', 'subtasks', 'checklistCount', 'cardSortingByNumber', 'descriptionBadge']);
// Drawn as blocks of their own.
const BLOCK_FIELDS = Object.freeze(['scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumAcceptanceCriteria',
  'scrumBacklogRank', 'labels', 'customFields', 'assignee', 'members', 'creator', 'checklists', 'cardButtons',
  'descriptionText', 'comments', 'showLists', 'swimlaneName', 'location', 'requestedBy', 'assignedBy', 'flowtime',
  'pomodoro', 'attachments', 'textNotes', 'activities']);

function kindOf(field) {
  if (DATE_FIELDS.includes(field)) return 'dates';
  if (BADGE_FIELDS.includes(field)) return 'badges';
  if (BLOCK_FIELDS.includes(field)) return 'block';
  return null;
}

// `sectionIds` in the order to draw them, `fieldsOf(id)` that section's row
// keys in order. Returns [{ _id, kind, dates, badges, sections, fields }].
function minicardGroups(sectionIds, fieldsOf) {
  const groups = [];
  (Array.isArray(sectionIds) ? sectionIds : []).forEach(id => {
    const keys = (typeof fieldsOf === 'function' ? fieldsOf(id) : []) || [];
    const fields = id === 'scrum' ? ['cardKind', ...keys] : keys;
    fields.forEach(field => {
      const kind = kindOf(field);
      if (!kind) return;
      const last = groups[groups.length - 1];
      if (last && last.kind === kind && kind !== 'block') {
        last.fields.push(field);
        if (!last.sections.includes(id)) last.sections.push(id);
        return;
      }
      if (last && last.kind === 'block' && kind === 'block' && last.sections[last.sections.length - 1] === id) {
        last.fields.push(field);
        return;
      }
      groups.push({ kind, sections: [id], fields: [field] });
    });
  });
  return groups.map((g, i) => ({
    _id: `${i}:${g.kind}:${g.fields.join(',')}`,
    kind: g.kind,
    dates: g.kind === 'dates',
    badges: g.kind === 'badges',
    sections: g.sections,
    fields: g.fields,
  }));
}

module.exports = { DATE_FIELDS, BADGE_FIELDS, BLOCK_FIELDS, kindOf, minicardGroups };
