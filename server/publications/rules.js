import Boards from '/models/boards';
import Actions from '/models/actions';
import Triggers from '/models/triggers';
import Rules from '/models/rules';
import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('rules', async function(ruleId) {
  check(ruleId, String);

  if (!this.userId) {
    return this.ready();
  }

  const rule = await ReactiveCache.getRule(ruleId);
  if (!rule) {
    return this.ready();
  }

  const board = await ReactiveCache.getBoard(rule.boardId);
  if (!board || !board.isVisibleBy({ _id: this.userId })) {
    return this.ready();
  }

  const ret = await ReactiveCache.getRules(
    {
      _id: ruleId,
    },
    {},
    true,
  );
  return ret;
});

// Board-scoped publication of a board's rules together with their triggers and
// actions, for anyone who can see the board (not just global admins). This backs
// the fullscreen Rules page, the workflow view and card buttons.
Meteor.publish('boardRules', async function(boardId) {
  check(boardId, String);
  if (!this.userId) {
    return this.ready();
  }
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !board.isVisibleBy({ _id: this.userId })) {
    return this.ready();
  }
  return [
    Rules.find({ boardId }),
    Triggers.find({ boardId }),
    Actions.find({ boardId }),
  ];
});

Meteor.publish('allRules', async function() {
  if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
    return this.ready();
  }

  const ret = await ReactiveCache.getRules({}, {}, true);
  return ret;
});

Meteor.publish('allTriggers', async function() {
  if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
    return this.ready();
  }

  const ret = await ReactiveCache.getTriggers({}, {}, true);
  return ret;
});

Meteor.publish('allActions', async function() {
  if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
    return this.ready();
  }

  const ret = await ReactiveCache.getActions({}, {}, true);
  return ret;
});

Meteor.publish('rulesReport', async function(searchTerm = '', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));
  if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
    return this.ready();
  }

  const query = {};
  if (searchTerm) {
    query.title = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const rules = await ReactiveCache.getRules(
    query,
    { sort: { boardId: 1 }, limit, skip: skip || 0 },
    true,
  );
  const actionIds = [];
  const triggerIds = [];
  const boardIds = [];

  rules.forEach(rule => {
    actionIds.push(rule.actionId);
    triggerIds.push(rule.triggerId);
    boardIds.push(rule.boardId);
  });

  const ret = [
    rules,
    await ReactiveCache.getActions({ _id: { $in: actionIds } }, {}, true),
    await ReactiveCache.getTriggers({ _id: { $in: triggerIds } }, {}, true),
    await ReactiveCache.getBoards({ _id: { $in: boardIds } }, { fields: { title: 1 } }, true),
  ];
  return ret;
});

Meteor.methods({
  async getRulesReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const query = {};
    if (searchTerm) {
      query.title = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const cursor = await ReactiveCache.getRules(query, {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});
