import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';
import './boardSettingsColumnActions.jade';
import './boardSettingsColumnActions.css';
Template.boardSettingsColumnActions.onCreated(function () {
  this.busy = new ReactiveVar(false);
  this.error = new ReactiveVar('');
});
Template.boardSettingsColumnActions.helpers({
  canSetColumn() {
    const user = ReactiveCache.getCurrentUser();
    return Boolean(user?.isAdmin || user?.isBoardAdmin(Session.get('currentBoard')));
  },
  busy() { return Template.instance().busy.get(); },
  error() { return Template.instance().error.get(); },
});
Template.boardSettingsColumnActions.events({
  async 'click .js-set-settings-column'(event, instance) {
    event.preventDefault();
    event.stopPropagation();
    if (instance.busy.get()) return;
    instance.busy.set(true);
    instance.error.set('');
    try {
      await Meteor.callAsync('setBoardSettingsColumn', Session.get('currentBoard'),
        instance.data.section, instance.data.column, event.currentTarget.dataset.enabled === 'true');
    } catch (error) {
      instance.error.set(error.reason || error.message);
    } finally { instance.busy.set(false); }
  },
});
