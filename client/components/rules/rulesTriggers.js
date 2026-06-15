import { ReactiveCache } from '/imports/reactiveCache';

Template.rulesTriggers.onCreated(function () {
  this.showBoardTrigger = new ReactiveVar(true);
  this.showCardTrigger = new ReactiveVar(false);
  this.showChecklistTrigger = new ReactiveVar(false);
  this.showScheduledTrigger = new ReactiveVar(false);
  this.showButtonTrigger = new ReactiveVar(false);
});

Template.rulesTriggers.helpers({
  ruleNameStr() {
    const rn = Template.currentData() && Template.currentData().ruleName;
    try {
      return rn && typeof rn.get === 'function' ? rn.get() : '';
    } catch (_) {
      return '';
    }
  },

  showBoardTrigger() {
    return Template.instance().showBoardTrigger;
  },

  showCardTrigger() {
    return Template.instance().showCardTrigger;
  },

  showChecklistTrigger() {
    return Template.instance().showChecklistTrigger;
  },

  showScheduledTrigger() {
    return Template.instance().showScheduledTrigger;
  },

  showButtonTrigger() {
    return Template.instance().showButtonTrigger;
  },

  rules() {
    const ret = ReactiveCache.getRules({});
    return ret;
  },

  name() {
    // console.log(Template.currentData());
  },
});

// Show only the chosen trigger category and highlight its side-menu item.
function selectTriggerTab(tpl, active) {
  const tabs = {
    board: tpl.showBoardTrigger,
    card: tpl.showCardTrigger,
    checklist: tpl.showChecklistTrigger,
    scheduled: tpl.showScheduledTrigger,
    button: tpl.showButtonTrigger,
  };
  Object.keys(tabs).forEach(key => tabs[key].set(key === active));
  const classes = {
    board: '.js-set-board-triggers',
    card: '.js-set-card-triggers',
    checklist: '.js-set-checklist-triggers',
    scheduled: '.js-set-scheduled-triggers',
    button: '.js-set-button-triggers',
  };
  Object.keys(classes).forEach(key =>
    $(classes[key]).toggleClass('active', key === active),
  );
}

Template.rulesTriggers.events({
  'click .js-set-board-triggers'(event, tpl) {
    selectTriggerTab(tpl, 'board');
  },
  'click .js-set-card-triggers'(event, tpl) {
    selectTriggerTab(tpl, 'card');
  },
  'click .js-set-checklist-triggers'(event, tpl) {
    selectTriggerTab(tpl, 'checklist');
  },
  'click .js-set-scheduled-triggers'(event, tpl) {
    selectTriggerTab(tpl, 'scheduled');
  },
  'click .js-set-button-triggers'(event, tpl) {
    selectTriggerTab(tpl, 'button');
  },
});
