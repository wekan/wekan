import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { CARD_TYPES } from '/config/const';

export const BROKEN_CARDS_SELECTOR = Object.freeze({
  $or: [
    { boardId: { $in: [null, ''] } },
    { swimlaneId: { $in: [null, ''] } },
    { listId: { $in: [null, ''] } },
    { type: { $nin: CARD_TYPES } },
  ],
});

async function requireAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) throw new Meteor.Error('not-authorized', 'Admin only');
}

function boundedOptions(options) {
  return {
    search: String(options.search || '').trim().slice(0, 500),
    limit: Math.min(Math.max(options.limit || 10, 1), 200),
    skip: Math.min(Math.max(options.skip || 0, 0), 1000000),
  };
}

export function brokenCardsReportQuery(search = '') {
  if (!search) return { ...BROKEN_CARDS_SELECTOR };
  const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $and: [BROKEN_CARDS_SELECTOR, { title: new RegExp(safe, 'i') }] };
}

export async function brokenCardsReportForAdmin(userId, options = {}) {
  check(options, {
    search: Match.Optional(String), limit: Match.Optional(Number),
    skip: Match.Optional(Number),
  });
  await requireAdmin(userId);
  const bounded = boundedOptions(options);
  const cards = await ReactiveCache.getCards(
    brokenCardsReportQuery(bounded.search), {
      fields: { title: 1, type: 1, boardId: 1, listId: 1,
        swimlaneId: 1, createdAt: 1 },
      sort: { boardId: 1, createdAt: -1 },
      limit: bounded.limit,
      skip: bounded.skip,
    }, false,
  );
  const ids = field => [...new Set(cards.map(card => card[field]).filter(Boolean))];
  const [boards, lists, swimlanes] = await Promise.all([
    ids('boardId').length ? ReactiveCache.getBoards(
      { _id: { $in: ids('boardId') } }, { fields: { title: 1 } }, false,
    ) : [],
    ids('listId').length ? ReactiveCache.getLists(
      { _id: { $in: ids('listId') } }, { fields: { title: 1 } }, false,
    ) : [],
    ids('swimlaneId').length ? ReactiveCache.getSwimlanes(
      { _id: { $in: ids('swimlaneId') } }, { fields: { title: 1 } }, false,
    ) : [],
  ]);
  return { cards, boards, lists, swimlanes, ...bounded };
}

export async function brokenCardsReportCountForAdmin(userId, search = '') {
  await requireAdmin(userId);
  const bounded = boundedOptions({ search });
  const cursor = await ReactiveCache.getCards(
    brokenCardsReportQuery(bounded.search), {}, true,
  );
  return typeof cursor.countAsync === 'function'
    ? await cursor.countAsync() : cursor.count();
}
