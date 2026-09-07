import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';

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

export function rulesReportQuery(search = '') {
  if (!search) return {};
  const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { title: new RegExp(safe, 'i') };
}

export async function rulesReportForAdmin(userId, options = {}) {
  check(options, {
    search: Match.Optional(String), limit: Match.Optional(Number),
    skip: Match.Optional(Number),
  });
  await requireAdmin(userId);
  const bounded = boundedOptions(options);
  const rules = await ReactiveCache.getRules(rulesReportQuery(bounded.search), {
    fields: { title: 1, boardId: 1, actionId: 1, triggerId: 1 },
    sort: { boardId: 1 }, limit: bounded.limit, skip: bounded.skip,
  }, false);
  const ids = field => [...new Set(rules.map(rule => rule[field]).filter(Boolean))];
  const [actions, triggers, boards] = await Promise.all([
    ids('actionId').length ? ReactiveCache.getActions(
      { _id: { $in: ids('actionId') } }, {}, false,
    ) : [],
    ids('triggerId').length ? ReactiveCache.getTriggers(
      { _id: { $in: ids('triggerId') } }, {}, false,
    ) : [],
    ids('boardId').length ? ReactiveCache.getBoards(
      { _id: { $in: ids('boardId') } }, { fields: { title: 1 } }, false,
    ) : [],
  ]);
  return { rules, actions, triggers, boards, ...bounded };
}

export async function rulesReportCountForAdmin(userId, search = '') {
  await requireAdmin(userId);
  const bounded = boundedOptions({ search });
  const cursor = await ReactiveCache.getRules(rulesReportQuery(bounded.search), {}, true);
  return typeof cursor.countAsync === 'function'
    ? await cursor.countAsync() : cursor.count();
}
