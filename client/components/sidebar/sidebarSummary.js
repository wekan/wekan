import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
import './sidebarSummary.jade';

// Board menu -> Summary (docs/Features/General/Summary/Summary.md). The server
// builds it (server/methods/boardSummary.js, models/lib/boardSummary.js); this
// draws it and copies it as Markdown.
const { GROUPS, summaryMarkdown } = require('/models/lib/boardSummary');

const LABELS = {
  done: 'done',
  moved: 'history-change-moved',
  added: 'added',
  commented: 'summary-commented',
  overdue: 'filter-overdue',
};

function cardPath(cardId) {
  const boardId = Session.get('currentBoard');
  const board = ReactiveCache.getBoard(boardId);
  return { boardId, slug: (board && board.slug) || 'board', cardId };
}

Template.boardSummarySidebar.onCreated(function () {
  this.period = new ReactiveVar('day');
  this.rows = new ReactiveVar([]);
  this.isLoading = new ReactiveVar(true);
  this.copied = new ReactiveVar(false);
  this.autorun(() => {
    const period = this.period.get();
    const boardId = Session.get('currentBoard');
    if (!boardId) return;
    this.isLoading.set(true);
    Meteor.call('boards.summary', boardId, period, (err, rows) => {
      if (this.view.isDestroyed) return;
      this.isLoading.set(false);
      this.rows.set(err || !Array.isArray(rows) ? [] : rows);
    });
  });
});

Template.boardSummarySidebar.helpers({
  period() { return Template.instance().period.get(); },
  rows() { return Template.instance().rows.get(); },
  isLoading() { return Template.instance().isLoading.get(); },
  copied() { return Template.instance().copied.get(); },
  groupsOf(person) {
    return GROUPS.filter(key => person.groups[key].length)
      .map(key => ({ key, labelKey: LABELS[key], cards: person.groups[key] }));
  },
});

Template.boardSummarySidebar.events({
  'click .js-summary-period'(event, tpl) {
    tpl.period.set(event.currentTarget.dataset.period === 'week' ? 'week' : 'day');
  },
  'click .js-open-summary-card'(event) {
    event.preventDefault();
    FlowRouter.go('card', cardPath(event.currentTarget.dataset.cardId));
  },
  async 'click .js-summary-copy'(event, tpl) {
    event.preventDefault();
    const board = ReactiveCache.getBoard(Session.get('currentBoard'));
    const periodKey = tpl.period.get() === 'week' ? 'summary-last-week' : 'summary-last-day';
    const text = summaryMarkdown(tpl.rows.get(), {
      heading: `${board ? board.title : ''} - ${TAPi18n.__('summary')}, ${TAPi18n.__(periodKey)}`,
      label: key => TAPi18n.__(LABELS[key]),
      cardUrl: cardId => FlowRouter.url('card', cardPath(cardId)),
    });
    try {
      await navigator.clipboard.writeText(text);
      tpl.copied.set(true);
      setTimeout(() => tpl.copied.set(false), 2000);
    } catch (e) {
      console.error('summary copy', e);
    }
  },
});
