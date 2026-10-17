import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Cards from '/models/cards';
import Lists from '/models/lists';
import { boardForCardHelper } from '/server/lib/assistGate';

// Similar cards and possible duplicates (docs/Features/Cards/Similar-Cards.md).
// The ranking is models/lib/similarCards.js; this decides WHICH cards it may
// look at: a board the caller may read, its open cards, and for an
// assigned-only member only the cards assigned to them, as every other view
// of a board (GHSA-r4gm-mjj9-g3x8).
const { rankSimilarCards } = require('/models/lib/similarCards');
const { assignedOnlyCardScope, mergeCardScope, assignedOnlyAllowsCard } = require('/models/lib/boardCardScope');

// Enough for a big board; past it the newest cards are compared.
const MAX_CARDS = 5000;

Meteor.methods({
  async 'cards.similar'(boardId, query) {
    check(boardId, String);
    check(query, { title: Match.Optional(String), cardId: Match.Optional(String) });
    // The opened card's section, or the add-card form's hint: each is its own
    // Board Settings / Card side.
    const flag = query.cardId ? 'allowsSimilarCardsOnCard' : 'allowsSimilarCardsOnMinicard';
    const board = await boardForCardHelper(this.userId, boardId, 'similarCards', flag);
    if (!board) return [];

    let text = { title: String(query.title || '').slice(0, 500), description: '' };
    if (query.cardId) {
      const card = await Cards.findOneAsync({ _id: query.cardId, boardId: board._id },
        { fields: { title: 1, description: 1, assignees: 1 } });
      // A card the caller may not read compares with nothing (negative).
      if (!card || !assignedOnlyAllowsCard(board, this.userId, card)) return [];
      text = { title: card.title || '', description: card.description || '' };
    }
    if (text.title.trim().length < 3) return [];

    const selector = mergeCardScope(
      { boardId: board._id, archived: false, type: { $nin: ['template-card', 'cardType-linkedBoard'] } },
      assignedOnlyCardScope(board, this.userId),
    );
    const cards = await Cards.find(selector, {
      fields: { title: 1, description: 1, listId: 1 },
      sort: { modifiedAt: -1 },
      limit: MAX_CARDS,
    }).fetchAsync();
    const ranked = rankSimilarCards(text, cards, { limit: query.cardId ? 5 : 3, excludeId: query.cardId || null });
    if (!ranked.length) return [];
    const lists = await Lists.find({ _id: { $in: [...new Set(ranked.map(r => r.listId))] } },
      { fields: { title: 1 } }).fetchAsync();
    const listTitle = new Map(lists.map(list => [list._id, list.title]));
    return ranked.map(r => ({
      _id: r._id,
      title: r.title,
      listTitle: listTitle.get(r.listId) || '',
      percent: Math.round(r.score * 100),
      duplicate: r.duplicate,
    }));
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'cards.similar', connectionId: () => true }, 30, 10000);
