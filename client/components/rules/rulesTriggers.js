import { ReactiveCache } from '/imports/reactiveCache';

Template.rulesTriggers.onCreated(function () {
  this.showBoardTrigger = new ReactiveVar(true);
  this.showCardTrigger = new ReactiveVar(false);
  this.showChecklistTrigger = new ReactiveVar(false);
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

  rules() {
    const ret = ReactiveCache.getRules({});
    return ret;
  },

  name() {
    // console.log(Template.currentData());
  },
});

function setBoardTriggers(tpl) {
  tpl.showBoardTrigger.set(true);
  tpl.showCardTrigger.set(false);
  tpl.showChecklistTrigger.set(false);
  $('.js-set-card-triggers').removeClass('active');
  $('.js-set-board-triggers').addClass('active');
  $('.js-set-checklist-triggers').removeClass('active');
}

function setCardTriggers(tpl) {
  tpl.showBoardTrigger.set(false);
  tpl.showCardTrigger.set(true);
  tpl.showChecklistTrigger.set(false);
  $('.js-set-card-triggers').addClass('active');
  $('.js-set-board-triggers').removeClass('active');
  $('.js-set-checklist-triggers').removeClass('active');
}

function setChecklistTriggers(tpl) {
  tpl.showBoardTrigger.set(false);
  tpl.showCardTrigger.set(false);
  tpl.showChecklistTrigger.set(true);
  $('.js-set-card-triggers').removeClass('active');
  $('.js-set-board-triggers').removeClass('active');
  $('.js-set-checklist-triggers').addClass('active');
}

Template.rulesTriggers.events({
  'click .js-set-board-triggers'(event, tpl) {
    setBoardTriggers(tpl);
  },
  'click .js-set-card-triggers'(event, tpl) {
    setCardTriggers(tpl);
  },
  'click .js-set-checklist-triggers'(event, tpl) {
    setChecklistTriggers(tpl);
  },
});
