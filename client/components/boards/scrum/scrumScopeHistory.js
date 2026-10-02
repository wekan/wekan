import './scrumScopeHistory.jade';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';

// Every recorded change to the sprint's scope and completed work, replayed
// from History (server/scrum.js getScrumScopeHistory).
Template.scrumScopeHistory.onCreated(function () {
  this.history = new ReactiveVar(null);
  this.error = new ReactiveVar('');
  this.request = 0;
  this.stopped = false;
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    const sprintId = Template.currentData().sprintId;
    Meteor.userId();
    const request = ++this.request;
    this.history.set(null); this.error.set('');
    Meteor.callAsync('scrum.getScopeHistory', boardId, sprintId).then(result => {
      if (!this.stopped && request === this.request) this.history.set(result);
    }).catch(error => {
      if (!this.stopped && request === this.request) this.error.set(error.reason || error.message);
    });
  });
});
Template.scrumScopeHistory.onDestroyed(function () { this.stopped = true; this.request += 1; });
Template.scrumScopeHistory.helpers({
  history: () => Template.instance().history.get(),
  error: () => Template.instance().error.get(),
  inconsistent: () => Template.instance().history.get()?.consistent === false,
  rows() {
    const points = Template.instance().history.get()?.points || [];
    const max = Math.max(1, ...points.map(point => point.scope));
    const labels = { scope: 'scrum-observed-scope', remaining: 'scrum-incomplete', completed: 'scrum-completed' };
    return points.map(point => ({ atLabel: new Date(point.at).toISOString(), cause: `scrum-scope-cause-${point.cause}`,
      series: ['scope', 'remaining', 'completed'].map(key => ({ key, value: point[key], label: TAPi18n.__(labels[key]),
        width: Math.round((point[key] / max) * 100) })) }));
  },
});
