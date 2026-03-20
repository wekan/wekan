import { ReactiveCache } from '/imports/reactiveCache';

Template.rulesActions.onCreated(function () {
  this.currentActions = new ReactiveVar('board');
});

Template.rulesActions.helpers({
  currentActions() {
    return Template.instance().currentActions;
  },

  data() {
    return Template.currentData();
  },

  ruleNameStr() {
    const rn = Template.currentData() && Template.currentData().ruleName;
    try {
      return rn && typeof rn.get === 'function' ? rn.get() : '';
    } catch (_) {
      return '';
    }
  },

  rules() {
    const ret = ReactiveCache.getRules({});
    return ret;
  },

  name() {
    // console.log(Template.currentData());
  },
});

function setBoardActions(tpl) {
  tpl.currentActions.set('board');
  $('.js-set-card-actions').removeClass('active');
  $('.js-set-board-actions').addClass('active');
  $('.js-set-checklist-actions').removeClass('active');
  $('.js-set-mail-actions').removeClass('active');
}

function setCardActions(tpl) {
  tpl.currentActions.set('card');
  $('.js-set-card-actions').addClass('active');
  $('.js-set-board-actions').removeClass('active');
  $('.js-set-checklist-actions').removeClass('active');
  $('.js-set-mail-actions').removeClass('active');
}

function setChecklistActions(tpl) {
  tpl.currentActions.set('checklist');
  $('.js-set-card-actions').removeClass('active');
  $('.js-set-board-actions').removeClass('active');
  $('.js-set-checklist-actions').addClass('active');
  $('.js-set-mail-actions').removeClass('active');
}

function setMailActions(tpl) {
  tpl.currentActions.set('mail');
  $('.js-set-card-actions').removeClass('active');
  $('.js-set-board-actions').removeClass('active');
  $('.js-set-checklist-actions').removeClass('active');
  $('.js-set-mail-actions').addClass('active');
}

Template.rulesActions.events({
  'click .js-set-board-actions'(event, tpl) {
    setBoardActions(tpl);
  },
  'click .js-set-card-actions'(event, tpl) {
    setCardActions(tpl);
  },
  'click .js-set-mail-actions'(event, tpl) {
    setMailActions(tpl);
  },
  'click .js-set-checklist-actions'(event, tpl) {
    setChecklistActions(tpl);
  },
});
