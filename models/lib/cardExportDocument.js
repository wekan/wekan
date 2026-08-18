'use strict';

// Convert the database-shaped records loaded by an exporter into the ONE card
// document drawn by PDF and Excel. Scope does not belong here: board, swimlane,
// list and card exporters all call this for each card they contain.
const { buildCardDocument } = require('./cardDocument');

function formatExportFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log2(size) / 10), units.length - 1);
  const value = size / Math.pow(1024, index);
  return `${index === 0 ? value : value.toFixed(1)} ${units[index]}`;
}

function buildExportCardDocument(data, options = {}) {
  const {
    board = {}, list = {}, card = {}, swimlane = {}, checklists = [],
    checklistItems = [], checklistItemsByChecklistId = {}, subtasks = [],
    comments = [], attachments = [], images = [], customFieldsById = {},
  } = data || {};
  const name = options.userName || (id => id || '');
  const date = options.formatDate || (() => '');
  const translate = options.translate || ((key, fallback) => fallback || key);
  const customValue = options.customFieldValue || ((definition, value) => value);
  const fields = options.fields || [];
  const labelsById = Object.fromEntries(((board && board.labels) || [])
    .filter(label => label && label._id).map(label => [label._id, label]));
  const names = ids => (ids || []).map(name).filter(Boolean);
  const itemsFor = checklist => checklistItemsByChecklistId[checklist._id]
    || checklistItems.filter(item => item.checklistId === checklist._id);
  const vote = card.vote || {};
  const poker = card.poker || {};

  return buildCardDocument(card, {
    boardTitle: board.title || '',
    listTitle: list.title || '',
    swimlaneTitle: swimlane.title || '',
    cardNumber: card.cardNumber,
    labels: (card.labelIds || []).map(id => labelsById[id]).filter(Boolean)
      .map(label => label.name || label.color || label._id),
    labelDetails: (card.labelIds || []).map(id => labelsById[id]).filter(Boolean),
    createdBy: name(card.userId),
    members: names(card.members),
    assignees: names(card.assignees),
    requestedBy: card.requestedBy || '',
    assignedBy: card.assignedBy || '',
    requesters: names(card.requesters),
    assigners: names(card.assigners),
    createdAt: date(card.createdAt),
    modifiedAt: date(card.dateLastActivity || card.modifiedAt),
    receivedAt: date(card.receivedAt),
    startAt: date(card.startAt),
    dueAt: date(card.dueAt),
    endAt: date(card.endAt),
    spentTime: card.spentTime === undefined || card.spentTime === null
      ? '' : String(card.spentTime),
    overtime: card.spentTime
      ? (card.isOvertime ? translate('yes', 'Yes') : translate('no', 'No')) : '',
    // A card from before custom-field deletion cleanup may still carry the old
    // id. Without a definition it is not a field the board can name or render;
    // exporting the raw database id produced #6611's cryptic PDF row.
    customFields: (card.customFields || []).filter(field =>
      field && field._id && customFieldsById[field._id])
      .map(field => {
        const definition = customFieldsById[field._id];
        return {
          name: definition.name,
          value: customValue(definition, field.value),
        };
      }),
    checklists: checklists.map(checklist => ({
      title: checklist.title || '',
      items: itemsFor(checklist),
    })),
    subtasks,
    comments: comments.map(comment => ({
      date: date(comment.createdAt),
      author: name(comment.userId),
      text: comment.text || '',
    })),
    attachments: attachments.map(attachment => ({
      name: attachment.name || (attachment.meta && attachment.meta.name) || attachment._id,
      size: formatExportFileSize(attachment.size),
      type: attachment.type || '',
      uploaded: date(attachment.uploadedAt || attachment.uploadedAtOstrio
        || attachment.createdAt),
      uploader: name(attachment.userId || (attachment.meta && attachment.meta.userId)),
    })),
    images,
    voting: vote.question ? [
      [translate('vote-question', 'Vote question'), vote.question],
      [translate('vote-for-it', 'For'), String((vote.positive || []).length)],
      [translate('vote-against', 'Against'), String((vote.negative || []).length)],
    ] : null,
    poker: (poker.question || poker.estimation !== undefined) ? [
      [translate('poker-question', 'Poker'), poker.question ? translate('yes', 'Yes') : ''],
      [translate('poker-estimation', 'Estimation'),
        poker.estimation === undefined ? '' : String(poker.estimation)],
    ] : null,
  }, fields, translate);
}

module.exports = { buildExportCardDocument, formatExportFileSize };
