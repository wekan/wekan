'use strict';
const choices = [['one', '1'], ['two', '2'], ['three', '3'], ['five', '5'], ['eight', '8'],
  ['thirteen', '13'], ['twenty', '20'], ['forty', '40'], ['oneHundred', '100'], ['unsure', '?']];
// These fields decide whether an immutable message may expose voter names
// or completed poker results. Persist them with source evidence for retries.
function votingVisibility(card, board) {
  const end = card?.poker?.end;
  return [board?.allowsVote !== false, board?.allowsPoker !== false,
    card?.vote?.public === true, end instanceof Date && Number.isFinite(+end) ? end.toISOString() : null];
}
async function appendRuleCardVoting({ card, board, cache, add, now = new Date() }) {
  const [showVote, showPoker, publicVote, pokerEnd] = votingVisibility(card, board);
  const members = values => Array.isArray(values) ? values.filter(id => typeof id === 'string' && id) : [];
  const names = async ids => {
    const result = [];
    for (const id of [...new Set(ids)]) {
      const user = await cache.getUser(id);
      result.push(user?.profile?.fullname || user?.username || 'Unknown user');
    }
    return result;
  };
  if (showVote && typeof card.vote?.question === 'string' && card.vote.question) {
    add('Vote question', card.vote.question);
    add('Vote end', card.vote.end);
    for (const [field, label] of [['positive', 'For'], ['negative', 'Against']]) {
      const ids = members(card.vote[field]);
      add(`Votes ${label.toLowerCase()}`, ids.length);
      if (publicVote) add(`${label} voters`, await names(ids));
    }
  }
  if (showPoker && card.poker) {
    add('Poker enabled', card.poker.question);
    add('Poker end', card.poker.end);
    add('Poker estimation', card.poker.estimation);
    if (card.poker.question && pokerEnd && +new Date(pokerEnd) < +now) {
      for (const [field, label] of choices) {
        const ids = members(card.poker[field]);
        add(`Poker ${label} votes`, ids.length);
        add(`Poker ${label} voters`, await names(ids));
      }
    }
  }
}
module.exports = { appendRuleCardVoting, votingVisibility };
