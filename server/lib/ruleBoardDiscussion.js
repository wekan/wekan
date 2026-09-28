'use strict';
const { notDeleted } = require('../../models/lib/softDelete');
const { resolveRuleEmailSource, resolveRuleEmailReference } = require('./ruleEmailSource');
const { prepareRuleCardDiscussion } = require('./ruleCardDiscussion');

async function prepareRuleBoardDiscussion({ activity, cache, canReadBoard, onRelatedSource = () => {} }) {
  const wrapper = await cache.getCard(activity.cardId);
  if (wrapper?.type !== 'cardType-linkedBoard') return '';
  const root = await resolveRuleEmailSource({ activity, cache, canReadBoard });
  const boardId = root.binding.linkedBoardId;
  if (!boardId) return '';
  // Discover owners without reading comment prose before card authorization.
  // Oversized board discussions fail explicitly instead of silently truncating.
  const rows = await cache.getCardComments(notDeleted({ boardId }), {
    fields: { cardId: 1, boardId: 1, deletedAt: 1 }, sort: { createdAt: 1, _id: 1 }, limit: 1001,
  });
  if (rows.length > 1000) throw new Error('rule-email-board-discussion-too-large');
  const ids = [...new Set(rows.filter(row => row.boardId === boardId && !row.deletedAt &&
    typeof row.cardId === 'string' && row.cardId && row.cardId !== activity.cardId).map(row => row.cardId))];
  const lines = [], sources = [];
  let bytes = 0;
  for (const id of ids) {
    const owner = await cache.getCard(id);
    if (!owner || owner.boardId !== boardId || owner.deletedAt) continue;
    const source = await resolveRuleEmailReference({ id, activity, cache, canReadBoard });
    if (!source || source.binding.cards[0][1] !== boardId) continue;
    const text = await prepareRuleCardDiscussion({
      activity: { ...activity, cardId: id, boardId }, cache, canReadBoard, commentsOnly: true,
    });
    if (!text) continue;
    const section = `Card: ${typeof source.card.title === 'string' ? source.card.title : ''}\n${text}`;
    bytes += Buffer.byteLength(section) + 2;
    if (bytes > 768 * 1024) throw new Error('rule-email-board-discussion-too-large');
    lines.push(section); sources.push(source); onRelatedSource(source.binding);
  }
  for (const source of sources) await source.assertCurrent();
  await root.assertCurrent();
  return lines.length ? `Linked board discussion:\n${lines.join('\n\n')}` : '';
}
module.exports = { prepareRuleBoardDiscussion };
