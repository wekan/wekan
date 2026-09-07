import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Users from '/models/users';

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

export function cardsReportQuery(search = '') {
  if (!search) return {};
  const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { title: new RegExp(safe, 'i') };
}

// One bounded instance-wide source for the Meteor and Legacy HTML4 reports.
// Context documents are resolved only for the cards on the current page.
export async function cardsReportForAdmin(userId, options = {}) {
  check(options, {
    search: Match.Optional(String), limit: Match.Optional(Number),
    skip: Match.Optional(Number),
  });
  await requireAdmin(userId);
  const bounded = boundedOptions(options);
  const cards = await ReactiveCache.getCards(cardsReportQuery(bounded.search), {
    fields: { title: 1, boardId: 1, listId: 1, swimlaneId: 1,
      members: 1, assignees: 1 },
    sort: { boardId: 1, createdAt: -1 },
    limit: bounded.limit,
    skip: bounded.skip,
  }, false);
  const ids = field => [...new Set(cards.map(card => card[field]).filter(Boolean))];
  const userIds = [...new Set(cards.flatMap(card => [
    ...(card.members || []), ...(card.assignees || []),
  ]).filter(Boolean))];
  const [boards, lists, swimlanes, users] = await Promise.all([
    ids('boardId').length ? ReactiveCache.getBoards(
      { _id: { $in: ids('boardId') } }, { fields: { title: 1 } }, false,
    ) : [],
    ids('listId').length ? ReactiveCache.getLists(
      { _id: { $in: ids('listId') } }, { fields: { title: 1 } }, false,
    ) : [],
    ids('swimlaneId').length ? ReactiveCache.getSwimlanes(
      { _id: { $in: ids('swimlaneId') } }, { fields: { title: 1 } }, false,
    ) : [],
    userIds.length ? ReactiveCache.getUsers(
      { _id: { $in: userIds } }, { fields: Users.safeFields }, false,
    ) : [],
  ]);
  return { cards, boards, lists, swimlanes, users, ...bounded };
}

export async function cardsReportCountForAdmin(userId, search = '') {
  await requireAdmin(userId);
  const bounded = boundedOptions({ search });
  const cursor = await ReactiveCache.getCards(cardsReportQuery(bounded.search), {}, true);
  return typeof cursor.countAsync === 'function'
    ? await cursor.countAsync() : cursor.count();
}
