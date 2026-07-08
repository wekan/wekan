'use strict';

// Pure helper for building a single CSV/TSV row from a card during board export.
// Extracted from Exporter.buildCsv (models/exporter.js) so the row/lookup logic
// is unit-testable in plain Node without Meteor (mirrors models/lib/cardSearch.js
// and models/lib/boardSortReorder.js).
//
// #5604 (CSV export of large boards fails: "Cannot read property 'title' of
// undefined"): buildCsv resolved a card's list/swimlane/owner/members/assignees/
// labels/voters by id and read .title/.username/.name/.color directly on the
// result of Array.find(). On large/old boards a card can reference a list,
// swimlane, user, label or customField id that no longer exists (dangling
// reference), so find() returns undefined and the property read throws — an
// unhandled error that crashes the whole export request. Every lookup below is
// now null-safe: a missing reference exports a blank cell instead of throwing,
// while well-formed cards produce exactly the same cells as before.

// Look up a document by _id in a list and return one of its properties, or a
// fallback ('' by default) when the id is missing / the document was deleted.
function lookupProp(list, id, prop, fallback = '') {
  const doc = (list || []).find(item => item && item._id === id);
  const value = doc && doc[prop];
  return value === undefined || value === null ? fallback : value;
}

// Build the array of cells for one card, in the same column order buildCsv uses.
// `result` is the exported board bundle (result.lists / .swimlanes / .users /
// .labels / .customFields). `customFieldMap` maps customField _id -> { position,
// type }. Returns a plain array (no Meteor / no i18n involved).
function buildCsvCardRow(card, result, customFieldMap) {
  const res = result || {};
  const currentRow = [];

  currentRow.push(card.title);
  currentRow.push(card.description);
  currentRow.push(lookupProp(res.lists, card.listId, 'title'));
  currentRow.push(lookupProp(res.swimlanes, card.swimlaneId, 'title'));
  currentRow.push(lookupProp(res.users, card.userId, 'username'));
  currentRow.push(card.requestedBy ? card.requestedBy : ' ');
  currentRow.push(card.assignedBy ? card.assignedBy : ' ');

  let usernames = '';
  (card.members || []).forEach((memberId) => {
    const username = lookupProp(res.users, memberId, 'username');
    if (username) usernames = `${usernames + username} `;
  });
  currentRow.push(usernames.trim());

  let assignees = '';
  (card.assignees || []).forEach((assigneeId) => {
    const username = lookupProp(res.users, assigneeId, 'username');
    if (username) assignees = `${assignees + username} `;
  });
  currentRow.push(assignees.trim());

  let labels = '';
  (card.labelIds || []).forEach((labelId) => {
    const label = (res.labels || []).find(item => item && item._id === labelId);
    if (label) labels = `${labels + (label.name || '')}-${label.color || ''} `;
  });
  currentRow.push(labels.trim());

  currentRow.push(card.startAt ? new Date(card.startAt).toISOString() : ' ');
  currentRow.push(card.dueAt ? new Date(card.dueAt).toISOString() : ' ');
  currentRow.push(card.endAt ? new Date(card.endAt).toISOString() : ' ');
  currentRow.push(card.isOvertime ? 'true' : 'false');
  currentRow.push(card.spentTime);
  currentRow.push(card.createdAt ? new Date(card.createdAt).toISOString() : ' ');
  currentRow.push(card.modifiedAt ? new Date(card.modifiedAt).toISOString() : ' ');
  currentRow.push(
    card.dateLastActivity ? new Date(card.dateLastActivity).toISOString() : ' ',
  );

  if (card.vote && card.vote.question !== '') {
    let positiveVoters = '';
    let negativeVoters = '';
    (card.vote.positive || []).forEach((userId) => {
      const username = lookupProp(res.users, userId, 'username');
      if (username) positiveVoters = `${positiveVoters + username} `;
    });
    (card.vote.negative || []).forEach((userId) => {
      const username = lookupProp(res.users, userId, 'username');
      if (username) negativeVoters = `${negativeVoters + username} `;
    });
    const votingResult = `${
      card.vote.public
        ? `yes-${
            (card.vote.positive || []).length
          }-${positiveVoters.trimRight()}-no-${
            (card.vote.negative || []).length
          }-${negativeVoters.trimRight()}`
        : `yes-${(card.vote.positive || []).length}-no-${(card.vote.negative || []).length}`
    }`;
    currentRow.push(`${card.vote.question}-${votingResult}`);
  } else {
    currentRow.push(' ');
  }
  currentRow.push(card.archived ? 'true' : 'false');

  // Custom fields
  const cfMap = customFieldMap || {};
  const customFieldValuesToPush = new Array((res.customFields || []).length);
  (card.customFields || []).forEach((field) => {
    if (field.value !== null) {
      const mapEntry = cfMap[field._id];
      // Card references a customField that no longer exists on the board: skip
      // it rather than dereferencing an undefined map entry.
      if (!mapEntry) return;
      if (mapEntry.type === 'date') {
        customFieldValuesToPush[mapEntry.position] =
          new Date(field.value).toISOString();
      } else if (mapEntry.type === 'dropdown') {
        const customField = (res.customFields || []).find(
          item => item && item._id === field._id,
        );
        const dropdownOptions =
          (customField && customField.settings && customField.settings.dropdownItems) || [];
        const fieldObj = dropdownOptions.find(
          item => item && item._id === field.value,
        );
        const fieldValue = (fieldObj && fieldObj.name) || null;
        customFieldValuesToPush[mapEntry.position] = fieldValue;
      } else {
        customFieldValuesToPush[mapEntry.position] = field.value;
      }
    }
  });
  for (
    let valueIndex = 0;
    valueIndex < customFieldValuesToPush.length;
    valueIndex++
  ) {
    if (!(valueIndex in customFieldValuesToPush)) {
      currentRow.push(' ');
    } else {
      currentRow.push(customFieldValuesToPush[valueIndex]);
    }
  }

  return currentRow;
}

module.exports = {
  lookupProp,
  buildCsvCardRow,
};
