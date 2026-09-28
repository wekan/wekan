'use strict';
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { appendRuleCardScrum, scrumVisibility } = require('./ruleCardScrum');

// Only local presentation fields: linkCard() copied source content into the
// wrapper, so never serialize its title, description, stickers or custom fields.
async function prepareRuleCardWrapper({ activity, cache, canReadBoard, readScrumRecord }) {
  const read = async () => {
    const card = await cache.getCard(activity.cardId);
    const board = card && await cache.getBoard(card.boardId);
    if (!activity.userId || !card || card.deletedAt || card.boardId !== activity.boardId ||
        !canReadBoard(activity.userId, board) ||
        (isAssignedOnlyMember(board, activity.userId) && !card.assignees?.includes(activity.userId))) {
      throw new Error('rule-email-wrapper-not-authorized');
    }
    return { card, board };
  };
  const { card, board } = await read();
  if (!['cardType-linkedCard', 'cardType-linkedBoard'].includes(card.type)) return '';
  const policy = JSON.stringify(scrumVisibility(board));
  const lines = ['Linked card local details:'];
  let bytes = 0;
  const add = (label, value) => {
    if (Array.isArray(value)) value = value.filter(item => typeof item === 'string').join(', ');
    if (value instanceof Date) value = Number.isFinite(+value) ? value.toISOString() : '';
    if (!['string', 'number', 'boolean'].includes(typeof value) || value === '') return;
    const line = `${label}: ${value}`;
    bytes += Buffer.byteLength(line) + 1;
    if (bytes > 768 * 1024) throw new Error('rule-email-wrapper-too-large');
    lines.push(line);
  };
  add('Board', board.title);
  const [list, lane] = await Promise.all([
    card.listId ? cache.getList(card.listId) : null,
    card.swimlaneId ? cache.getSwimlane(card.swimlaneId) : null,
  ]);
  if (list?.boardId === card.boardId) add('List', list.title);
  if (lane?.boardId === card.boardId) add('Swimlane', lane.title);
  for (const [field, label] of Object.entries({
    sort: 'Sort', subtaskSort: 'Subtask sort', listEnteredAt: 'Entered list', lastMoveReason: 'Last move reason',
    flowStartAt: 'Flowtime started', flowInterruptions: 'Flowtime interruptions',
    pomodoroStartAt: 'Pomodoro started', pomodoroPhase: 'Pomodoro phase',
    pomodoroCount: 'Pomodoro completed intervals', pomodoroWorkMinutes: 'Pomodoro work interval (minutes)',
  })) add(label, card[field]);
  for (const [field, label] of [['flowUserId', 'Flowtime user'], ['pomodoroUserId', 'Pomodoro user']]) {
    if (typeof card[field] !== 'string' || !card[field]) continue;
    const user = await cache.getUser(card[field]);
    add(label, user?.profile?.fullname || user?.username || 'Unknown user');
  }
  const assertScrum = await appendRuleCardScrum({ card, board, readRecord: readScrumRecord, add });
  await assertScrum();
  const latest = await read();
  if (latest.card.type !== card.type || latest.card.linkedId !== card.linkedId ||
      JSON.stringify(scrumVisibility(latest.board)) !== policy) throw new Error('rule-email-wrapper-changed');
  return lines.join('\n');
}
module.exports = { prepareRuleCardWrapper };
