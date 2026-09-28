'use strict';
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { notDeleted } = require('../../models/lib/softDelete');
const { buildCustomFieldsWD, filterAdminOnlyDefinitions } = require('../../models/lib/customFieldsWD');
const { formatStringTemplate } = require('../../models/lib/customFieldStringTemplate');
const { appendRuleCardVoting, votingVisibility } = require('./ruleCardVoting');
const scalar = value => value instanceof Date ? (Number.isFinite(+value) ? value.toISOString() : '') :
  ['string', 'number', 'boolean'].includes(typeof value) ? String(value) : '';
const values = value => Array.isArray(value) ? value.map(scalar).filter(Boolean).join(', ') : scalar(value);

async function prepareRuleCardDetails({ activity, cache, canReadBoard }) {
  const canRead = (card, board) => !!(activity.userId && card && !card.deletedAt &&
    canReadBoard(activity.userId, board) &&
    (!isAssignedOnlyMember(board, activity.userId) || card.assignees?.includes(activity.userId)));
  const source = async () => {
    const card = await cache.getCard(activity.cardId);
    const board = card && await cache.getBoard(card.boardId);
    if (!canRead(card, board) || card.boardId !== activity.boardId) throw new Error('rule-email-details-not-authorized');
    return { card, board };
  };
  const { card, board } = await source();
  const visibility = JSON.stringify(votingVisibility(card, board));
  const admin = !!board.hasAdmin?.(activity.userId);
  const lines = [], related = new Set(), relatedBoards = new Map();
  let size = 0;
  const add = (label, value) => {
    const text = values(value);
    if (!text) return;
    const line = `${label}: ${text}`;
    size += Buffer.byteLength(line, 'utf8') + 1;
    if (size > 768 * 1024) throw new Error('rule-email-details-too-large');
    lines.push(line);
  };
  const relation = async (label, id) => {
    if (typeof id !== 'string' || !id) return;
    const target = await cache.getCard(id);
    const targetBoard = target && await cache.getBoard(target.boardId);
    if (!canRead(target, targetBoard)) return;
    related.add(id);
    add(label, target.title);
  };
  // A link's cached fields may be copied from a now-private source. Never
  // export those snapshots as if they were authorized local metadata.
  if (card.type === 'cardType-linkedCard') {
    await relation('Linked card', card.linkedId);
  } else if (card.type === 'cardType-linkedBoard') {
    const target = typeof card.linkedId === 'string' && card.linkedId ? await cache.getBoard(card.linkedId) : null;
    if (canReadBoard(activity.userId, target)) {
      add('Linked board', target.title);
      add('Description', target.description);
      for (const [field, label] of [['receivedAt', 'Received'], ['startAt', 'Start'], ['dueAt', 'Due'], ['endAt', 'End'], ['spentTime', 'Spent time (hours)']]) add(label, target[field]);
      const presentationBoard = { allowsVote: board.allowsVote !== false && target.allowsVote !== false,
        allowsPoker: board.allowsPoker !== false && target.allowsPoker !== false };
      const policy = JSON.stringify(votingVisibility(target, target));
      await appendRuleCardVoting({ card: target, board: presentationBoard, cache, add });
      relatedBoards.set(card.linkedId, policy);
    }
  } else {
    const [list, lane, definitions, notes] = await Promise.all([
      card.listId ? cache.getList(card.listId) : null, card.swimlaneId ? cache.getSwimlane(card.swimlaneId) : null,
      cache.getCustomFields({ boardIds: { $in: [card.boardId] } }, { sort: { _id: 1 } }),
      cache.getCardTextNotes(notDeleted({ cardId: card._id, boardId: card.boardId }), { sort: { createdAt: 1, _id: 1 } }),
    ]);
    add('Board', board.title);
    if (list?.boardId === card.boardId) add('List', list.title);
    if (lane?.boardId === card.boardId) add('Swimlane', lane.title);
    for (const [field, label] of Object.entries({ cardNumber: 'Card number', color: 'Color', archived: 'Archived',
      createdAt: 'Created', modifiedAt: 'Modified', listEnteredAt: 'Entered list', receivedAt: 'Received',
      startAt: 'Start', dueAt: 'Due', endAt: 'End', dueComplete: 'Due complete',
      requestedBy: 'Requested by', assignedBy: 'Assigned by', spentTime: 'Spent time (hours)', isOvertime: 'Overtime',
      recurrenceInterval: 'Recurrence', lastRecurrenceAt: 'Last recurrence',
      flowStartAt: 'Flowtime started', flowInterruptions: 'Flowtime interruptions',
      pomodoroStartAt: 'Pomodoro started', pomodoroPhase: 'Pomodoro phase',
      pomodoroCount: 'Pomodoro completed intervals', pomodoroWorkMinutes: 'Pomodoro work interval (minutes)',
      locationName: 'Location', locationAddress: 'Address', locationLatitude: 'Latitude', locationLongitude: 'Longitude' })) add(label, card[field]);
    // Export the persisted session snapshot, not a ticking elapsed duration
    // that could be mistaken for completed spent time. Resolve only public names.
    for (const [field, label] of [['flowUserId', 'Flowtime user'], ['pomodoroUserId', 'Pomodoro user']]) {
      if (typeof card[field] !== 'string' || !card[field]) continue;
      const user = await cache.getUser(card[field]);
      add(label, user?.profile?.fullname || user?.username || 'Unknown user');
    }
    await appendRuleCardVoting({ card, board, cache, add });
    const labels = new Map((board.labels || []).map(label => [label._id, label.name || label.color]));
    add('Labels', (card.labelIds || []).map(id => labels.get(id)).filter(Boolean));
    for (const [field, label] of [['members', 'Members'], ['assignees', 'Assignees'], ['requesters', 'Requesters'], ['assigners', 'Assigners']]) {
      const names = [];
      for (const id of card[field] || []) {
        const user = await cache.getUser(id);
        if (user) names.push(user.profile?.fullname || user.username || 'Unknown user');
      }
      add(label, names);
    }
    for (const location of card.locations || []) {
      add('Location', [location.name, location.address, scalar(location.latitude), scalar(location.longitude)].filter(Boolean));
    }
    const visible = filterAdminOnlyDefinitions(definitions.filter(def => Array.isArray(def.boardIds) && def.boardIds.includes(card.boardId)), admin);
    for (const field of buildCustomFieldsWD(card.customFields, visible)) {
      let value = field.trueValue;
      if (field.definition.type === 'stringtemplate') value = formatStringTemplate(field.value,
        field.definition.settings?.stringtemplateFormat, field.definition.settings?.stringtemplateSeparator,
        { 'card.title': card.title || '', 'board.title': board.title || '',
          'list.title': list?.boardId === card.boardId ? list.title : '', 'swimlane.title': lane?.boardId === card.boardId ? lane.title : '' });
      if (field.definition.type === 'currency') value = `${scalar(field.value)} ${field.definition.settings?.currencyCode || ''}`.trim();
      add(field.definition.name, value);
    }
    for (const note of notes) if (note.cardId === card._id && note.boardId === card.boardId && !note.deletedAt) add(note.title || 'Note', note.text);
    await relation('Parent', card.parentId);
    for (const dependency of card.cardDependencies || []) await relation(dependency.type || 'Related card', dependency.cardId);
    for (const subtask of await cache.getCards(notDeleted({ parentId: card._id }))) await relation('Subtask', subtask._id);
    const latestDefinitions = await cache.getCustomFields({ boardIds: { $in: [card.boardId] } }, { sort: { _id: 1 } });
    if (JSON.stringify(latestDefinitions) !== JSON.stringify(definitions)) throw new Error('rule-email-details-changed');
  }
  const latest = await source();
  if (JSON.stringify(votingVisibility(latest.card, latest.board)) !== visibility) throw new Error('rule-email-details-changed');
  if (admin && !latest.board.hasAdmin?.(activity.userId)) throw new Error('rule-email-details-not-authorized');
  for (const id of related) {
    const target = await cache.getCard(id), targetBoard = target && await cache.getBoard(target.boardId);
    if (!canRead(target, targetBoard)) throw new Error('rule-email-details-not-authorized');
  }
  for (const [id, policy] of relatedBoards) {
    const target = await cache.getBoard(id);
    if (!canReadBoard(activity.userId, target)) throw new Error('rule-email-details-not-authorized');
    if (JSON.stringify(votingVisibility(target, target)) !== policy) throw new Error('rule-email-details-changed');
  }
  return lines.join('\n');
}
module.exports = { prepareRuleCardDetails };
