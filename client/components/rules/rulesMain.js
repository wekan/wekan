import { ReactiveCache } from '/imports/reactiveCache';
import Actions from '/models/actions';
import Rules from '/models/rules';
import Triggers from '/models/triggers';

Template.rulesMain.onCreated(function () {
  this.rulesCurrentTab = new ReactiveVar('rulesList');
  this.ruleName = new ReactiveVar('');
  this.triggerVar = new ReactiveVar();
  this.ruleId = new ReactiveVar();
});

Template.rulesMain.helpers({
  rulesCurrentTab() {
    return Template.instance().rulesCurrentTab;
  },
  ruleName() {
    return Template.instance().ruleName;
  },
  triggerVar() {
    return Template.instance().triggerVar;
  },
  ruleId() {
    return Template.instance().ruleId;
  },
});

function sanitizeObject(obj) {
  Object.keys(obj).forEach(key => {
    if (obj[key] === '' || obj[key] === undefined) {
      obj[key] = '*';
    }
  });
}

Template.rulesMain.events({
  'click .js-delete-rule'() {
    const rule = Template.currentData();
    Rules.remove(rule._id);
    Actions.remove(rule.actionId);
    Triggers.remove(rule.triggerId);
  },
  'click .js-goto-trigger'(event, tpl) {
    event.preventDefault();
    const ruleTitle = tpl.find('#ruleTitle').value;
    if (ruleTitle !== undefined && ruleTitle !== '') {
      tpl.find('#ruleTitle').value = '';
      tpl.ruleName.set(ruleTitle);
      tpl.rulesCurrentTab.set('trigger');
    }
  },
  'click .js-goto-action'(event, tpl) {
    event.preventDefault();
    // Add user to the trigger
    const username = $(event.currentTarget.offsetParent)
      .find('.user-name')
      .val();
    let trigger = tpl.triggerVar.get();
    trigger.userId = '*';
    if (username !== undefined) {
      const userFound = ReactiveCache.getUser({ username });
      if (userFound !== undefined) {
        trigger.userId = userFound._id;
        tpl.triggerVar.set(trigger);
      }
    }
    // Sanitize trigger
    trigger = tpl.triggerVar.get();
    sanitizeObject(trigger);
    tpl.triggerVar.set(trigger);
    tpl.rulesCurrentTab.set('action');
  },
  'click .js-show-user-field'(event) {
    event.preventDefault();
    $(event.currentTarget.offsetParent)
      .find('.user-details')
      .removeClass('hide-element');
  },
  'click .js-goto-rules'(event, tpl) {
    event.preventDefault();
    tpl.rulesCurrentTab.set('rulesList');
  },
  'click .js-goback'(event, tpl) {
    event.preventDefault();
    if (
      tpl.rulesCurrentTab.get() === 'trigger' ||
      tpl.rulesCurrentTab.get() === 'ruleDetails'
    ) {
      tpl.rulesCurrentTab.set('rulesList');
    }
    if (tpl.rulesCurrentTab.get() === 'action') {
      tpl.rulesCurrentTab.set('trigger');
    }
  },
  'click .js-goto-details'(event, tpl) {
    event.preventDefault();
    const rule = Template.currentData();
    tpl.ruleId.set(rule._id);
    tpl.rulesCurrentTab.set('ruleDetails');
  },
});
