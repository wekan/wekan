'use strict';

// What a WeKan board becomes in Trello: a plan built from the board export
// (models/exporter.js, the same data the JSON export carries and the same
// access check), which server/trelloApiExport.js then creates through Trello's
// REST API. Pure, so tests/trelloExportPlan.test.cjs runs it without Meteor.
//
// Trello has no swimlanes of its own. A board with more than one swimlane
// gets one MARKED label per swimlane - its name is SWIMLANE_LABEL_PREFIX and
// the swimlane's title - on each of that swimlane's cards. The free "Swimlanes
// by Blue Cat" Power-Up groups a Trello board into rows by label, so Trello
// shows the swimlanes again, and dragging a card between its rows moves the
// label. WeKan's Trello import reads the marker back (swimlaneFromLabelName)
// and turns those labels into swimlanes, so a board survives the round trip.
// Archived lists and cards are created and then archived, as Trello cannot
// create them closed.
const SWIMLANE_LABEL_PREFIX = 'Swimlane: ';

// The swimlane a Trello label stands for, or null for an ordinary label.
function swimlaneFromLabelName(name) {
  if (typeof name !== 'string' || !name.startsWith(SWIMLANE_LABEL_PREFIX)) return null;
  const title = name.slice(SWIMLANE_LABEL_PREFIX.length).trim();
  return title || null;
}

// Trello's label colours; a WeKan colour Trello lacks maps to its nearest,
// else to no colour at all rather than a wrong one.
const TRELLO_COLORS = new Set(['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black']);
const NEAREST_COLOR = {
  crimson: 'red', plum: 'purple', darkgreen: 'green', slateblue: 'blue', magenta: 'pink',
  gold: 'yellow', navy: 'blue', saddlebrown: 'orange', paleturquoise: 'sky', mistyrose: 'pink',
  indigo: 'purple', peachpuff: 'orange',
};
function trelloColor(color) {
  if (TRELLO_COLORS.has(color)) return color;
  return NEAREST_COLOR[color] || null;
}

const bySort = (a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0);
const iso = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
// Trello caps a card name at 16384 characters and a description at 16384.
const clip = (text, max = 16384) => String(text || '').slice(0, max);

function authorName(users, userId) {
  const user = (users || []).find(u => u._id === userId);
  if (!user) return 'Unknown';
  return (user.profile && user.profile.fullname) || user.username || 'Unknown';
}

function buildTrelloExportPlan(exported, { includeAttachments = true } = {}) {
  const swimlanes = (exported.swimlanes || []).filter(s => s.type !== 'template-container').slice().sort(bySort);
  const markSwimlanes = swimlanes.length > 1;

  const labels = (exported.labels || []).map(label => ({
    key: `label:${label._id}`,
    name: clip(label.name, 16384),
    color: trelloColor(label.color),
  }));
  if (markSwimlanes) {
    for (const swimlane of swimlanes) {
      labels.push({
        key: `swimlane:${swimlane._id}`,
        name: `${SWIMLANE_LABEL_PREFIX}${clip(swimlane.title, 16000) || 'Swimlane'}`,
        color: null,
      });
    }
  }
  const labelKeys = new Set(labels.map(l => l.key));

  const lists = (exported.lists || []).slice().sort(bySort).map(list => ({
    key: list._id,
    name: clip(list.title, 16384) || 'List',
    closed: !!list.archived,
  }));
  const listKeys = new Set(lists.map(l => l.key));
  const listOrder = new Map(lists.map((l, i) => [l.key, i]));

  // In board order: by list, then by place in the list. Each card is added at
  // the bottom of its list, so this is also the order Trello shows.
  const cards = (exported.cards || []).filter(card => listKeys.has(card.listId)).slice()
    .sort((a, b) => (listOrder.get(a.listId) - listOrder.get(b.listId)) || bySort(a, b)).map(card => {
    const keys = (card.labelIds || []).map(id => `label:${id}`).filter(k => labelKeys.has(k));
    if (markSwimlanes && labelKeys.has(`swimlane:${card.swimlaneId}`)) keys.push(`swimlane:${card.swimlaneId}`);
    const due = iso(card.dueAt);
    return {
      key: card._id,
      listKey: card.listId,
      name: clip(card.title) || 'Card',
      desc: clip(card.description),
      due,
      start: iso(card.startAt),
      // WeKan's end date says the work is done; Trello says so on the due date.
      dueComplete: !!(due && card.endAt),
      labelKeys: keys,
      closed: !!card.archived,
    };
  });
  const cardKeys = new Set(cards.map(c => c.key));

  const itemsByChecklist = new Map();
  for (const item of (exported.checklistItems || []).slice().sort(bySort)) {
    if (!itemsByChecklist.has(item.checklistId)) itemsByChecklist.set(item.checklistId, []);
    itemsByChecklist.get(item.checklistId).push({ name: clip(item.title) || 'Item', checked: !!item.isFinished });
  }
  const checklists = (exported.checklists || []).filter(c => cardKeys.has(c.cardId)).slice().sort(bySort)
    .map(checklist => ({
      cardKey: checklist.cardId,
      name: clip(checklist.title) || 'Checklist',
      items: itemsByChecklist.get(checklist._id) || [],
    }));

  // Oldest first, so Trello's activity reads in the order it happened. The
  // author and time are part of the text: in Trello every comment is by the
  // person exporting.
  const comments = (exported.comments || []).filter(c => cardKeys.has(c.cardId))
    .slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(comment => ({
      cardKey: comment.cardId,
      text: clip(`${authorName(exported.users, comment.userId)}${iso(comment.createdAt) ? ` (${iso(comment.createdAt)})` : ''}:\n\n${comment.text || ''}`),
    }));

  const attachments = includeAttachments
    ? (exported.attachments || []).filter(a => cardKeys.has(a.cardId) && a.file).map(a => ({
      cardKey: a.cardId,
      name: a.name || 'attachment',
      mimeType: a.type || 'application/octet-stream',
      file: a.file,
    }))
    : [];

  const plan = {
    board: { name: clip(exported.title, 16384) || 'WeKan board', desc: clip(exported.description) },
    labels, lists, cards, checklists, comments, attachments,
  };
  plan.total = 1 + labels.length + lists.length + cards.length
    + checklists.reduce((n, c) => n + 1 + c.items.length, 0) + comments.length + attachments.length
    + lists.filter(l => l.closed).length + cards.filter(c => c.closed).length;
  return plan;
}

// The import direction (models/trelloCreator.js): which swimlanes a Trello
// board's marked labels stand for. `labelTitles` maps a Trello label id to its
// swimlane title; `titles` is the swimlanes to create, in label order, with
// 'Default' first when some card has no marked label (and none is called
// Default already); `titleForCard` is the swimlane a card goes to. A board with
// no marked label gets the single 'Default' swimlane, as before.
function swimlanesFromTrelloBoard(board) {
  const labelTitles = {};
  const marked = [];
  for (const label of (board && board.labels) || []) {
    const title = swimlaneFromLabelName(label && label.name);
    if (!title) continue;
    labelTitles[label.id] = title;
    if (!marked.includes(title)) marked.push(title);
  }
  const titleForCard = card => {
    const id = ((card && card.idLabels) || []).find(labelId => labelTitles[labelId]);
    return id ? labelTitles[id] : 'Default';
  };
  const unlabeled = ((board && board.cards) || []).some(card => !((card.idLabels || []).some(id => labelTitles[id])));
  const titles = !marked.length ? ['Default']
    : (unlabeled && !marked.includes('Default') ? ['Default', ...marked] : marked);
  return { labelTitles, titles, titleForCard };
}

module.exports = {
  buildTrelloExportPlan, trelloColor, swimlaneFromLabelName, swimlanesFromTrelloBoard, SWIMLANE_LABEL_PREFIX,
};
