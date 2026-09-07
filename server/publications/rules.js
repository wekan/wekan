import Actions from '/models/actions';
import Triggers from '/models/triggers';
import Rules from '/models/rules';
import { ReactiveCache } from '/imports/reactiveCache';
import { publishReportPage } from '/models/lib/reportPageIndex';
import { rulesReportCountForAdmin, rulesReportForAdmin } from '/server/lib/rulesReport';

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
// the fullscreen Rules page, the workflow view, the board/card buttons and the
// rules-list editor.
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
  // Publish the page MANUALLY (fetch + this.added + this.ready). Returning a sorted+
  // limited cursor makes Meteor set up a LIMITED live observe, which hangs on
  // FerretDB's OpLog for this query, so the subscription never becomes ready and the
  // report is stuck on the loading spinner forever (same as attachmentsList). This
  // admin report re-subscribes on every page/search change, so it needs no live cursor.
  let report;
  try {
    report = await rulesReportForAdmin(this.userId, {
      search: searchTerm || '', limit, skip: skip || 0,
    });
  } catch (error) {
    if (error?.error === 'not-authorized') return this.ready();
    throw error;
  }

  for (const doc of report.rules) { const { _id, ...fields } = doc; this.added('rules', _id, fields); }
  for (const doc of report.actions) { const { _id, ...fields } = doc; this.added('actions', _id, fields); }
  for (const doc of report.triggers) { const { _id, ...fields } = doc; this.added('triggers', _id, fields); }
  for (const doc of report.boards) { const { _id, ...fields } = doc; this.added('boards', _id, fields); }
  // WHICH rules this page is: a board's own rules are in minimongo whenever its
  // rules editor has been opened.
  publishReportPage(this, 'report-rules', report.rules);
  this.ready();
});

Meteor.methods({
  async getRulesReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    return rulesReportCountForAdmin(this.userId, searchTerm || '');
  },
});
