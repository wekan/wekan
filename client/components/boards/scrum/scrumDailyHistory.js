import './scrumDailyHistory.jade';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
const { dailyChartGroups } = require('/models/lib/scrumDailyHistory');

Template.scrumDailyHistory.onCreated(function () {
  this.history = new ReactiveVar(null);
  this.error = new ReactiveVar('');
  this.metric = new ReactiveVar('count');
  this.request = 0;
  this.stopped = false;
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    const sprintId = Template.currentData().sprintId;
    Meteor.userId();
    const request = ++this.request;
    this.history.set(null); this.error.set('');
    Meteor.callAsync('scrum.getDailyHistory', boardId, sprintId).then(result => {
      if (!this.stopped && request === this.request) this.history.set(result);
    }).catch(error => {
      if (!this.stopped && request === this.request) this.error.set(error.reason || error.message);
    });
  });
});
Template.scrumDailyHistory.onDestroyed(function () { this.stopped = true; this.request += 1; });
Template.scrumDailyHistory.events({
  'change .js-scrum-daily-metric'(event, tpl) { tpl.metric.set(event.currentTarget.value); },
});
Template.scrumDailyHistory.helpers({
  reportOptions: () => JSON.stringify({ sprintId: Template.currentData().sprintId }),
  history: () => Template.instance().history.get(),
  error: () => Template.instance().error.get(),
  groups() {
    const tpl = Template.instance();
    const labels = { scope: 'scrum-observed-scope', remaining: 'scrum-incomplete', completed: 'scrum-completed' };
    return dailyChartGroups(tpl.history.get()?.rows || [], tpl.metric.get()).map(group => ({ ...group,
      rows: group.rows.map(row => ({ ...row, capturedLabel: new Date(row.capturedAt).toISOString(),
        series: row.series.map(series => ({ ...series, label: TAPi18n.__(labels[series.key]) })) })),
    }));
  },
  formatTotal: value => TAPi18n.__('scrum-total', value),
});
