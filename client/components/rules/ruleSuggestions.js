import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { TAPi18n } from '/imports/i18n';
import { allowFeature } from '/client/lib/instanceFeatures';
import './ruleSuggestions.jade';

// docs/Features/Rules/Rule-Suggestions.md. The server finds them
// (server/methods/ruleSuggestions.js); Create goes through rules.createRule
// with the same trigger and action documents the wizard builds, and the
// sentences become their descriptions, so the rule list reads the same.

function whenText(s) {
  if (s.triggerKind === 'moved') return TAPi18n.__('rule-suggestion-when-moved', { list: s.triggerName });
  if (s.triggerKind === 'created') return TAPi18n.__('rule-suggestion-when-created', { list: s.triggerName });
  return TAPi18n.__('rule-suggestion-when-label', { label: s.triggerName });
}

function thenText(s) {
  if (s.actionKind === 'addLabel') return TAPi18n.__('rule-suggestion-then-label', { label: s.actionName });
  if (s.actionKind === 'addMember') return TAPi18n.__('rule-suggestion-then-member', { member: s.actionName });
  return TAPi18n.__('rule-suggestion-then-archive');
}

Template.ruleSuggestions.onCreated(function () {
  this.suggestions = new ReactiveVar([]);
  this.load = () => {
    const boardId = Session.get('currentBoard');
    if (!boardId || !allowFeature('rule-suggestions')) {
      this.suggestions.set([]);
      return;
    }
    Meteor.call('rules.suggestions', boardId, (err, rows) => {
      if (!this.view.isDestroyed) this.suggestions.set(err ? [] : rows || []);
    });
  };
  this.autorun(() => {
    Session.get('currentBoard');
    allowFeature('rule-suggestions');
    this.load();
  });
});

Template.ruleSuggestions.helpers({
  suggestions() {
    return Template.instance().suggestions.get();
  },
  sentence() {
    return `${whenText(this)}, ${thenText(this)}.`;
  },
});

Template.ruleSuggestions.events({
  'click .js-create-suggested-rule'(event, tpl) {
    event.preventDefault();
    const s = this;
    const boardId = Session.get('currentBoard');
    Meteor.call('rules.createRule', boardId, '',
      { ...s.trigger, desc: whenText(s) }, { ...s.action, desc: thenText(s) },
      err => { if (!err) tpl.load(); else console.error('rules.createRule', err); });
  },
  'click .js-dismiss-suggested-rule'(event, tpl) {
    event.preventDefault();
    Meteor.call('rules.dismissSuggestion', Session.get('currentBoard'), this.key,
      err => { if (!err) tpl.load(); });
  },
});
