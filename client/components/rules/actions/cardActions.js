import { CARD_COLORS } from '/models/metadata/colors';
import { Utils } from '/client/lib/utils';
import { saveRuleTriggerAction } from '/client/components/rules/rulesSaveHelper';
import { RULE_ACTING_USER_SENTINEL } from '/models/lib/ruleActingUser';

let cardColors;
Meteor.startup(() => {
  cardColors = CARD_COLORS;
});

// Module-level shared state so the color popup can read/write the
// cardColorButtonValue without relying on BlazeComponent.getOpenerComponent().
let sharedCardColorButtonValue;

Template.cardActions.onCreated(function () {
  this.subscribe('allRules');
  this.cardColorButtonValue = new ReactiveVar('green');
  sharedCardColorButtonValue = this.cardColorButtonValue;
});

Template.cardActions.helpers({
  cardColorButton() {
    return Template.instance().cardColorButtonValue.get();
  },

  cardColorButtonText() {
    return `color-${Template.instance().cardColorButtonValue.get()}`;
  },

  labels() {
    const labels = Utils.getCurrentBoard().labels;
    for (let i = 0; i < labels.length; i++) {
      if (labels[i].name === '' || labels[i].name === undefined) {
        labels[i].name = labels[i].color.toUpperCase();
      }
    }
    return labels;
  },
});

Template.cardActions.events({
  'click .js-set-date-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const actionSelected = tpl.find('#setdate-action').value;
    const dateFieldSelected = tpl.find('#setdate-datefield').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType: actionSelected,
      dateField: dateFieldSelected,
      boardId,
      desc,
    });
  },

  'click .js-remove-datevalue-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const dateFieldSelected = tpl.find('#setdate-removedatefieldvalue')
      .value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType: 'removeDate',
      dateField: dateFieldSelected,
      boardId,
      desc,
    });
  },
  'click .js-add-label-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const actionSelected = tpl.find('#label-action').value;
    const labelId = tpl.find('#label-id').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    if (actionSelected === 'add') {
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'addLabel',
        labelId,
        boardId,
        desc,
      });
    }
    if (actionSelected === 'remove') {
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'removeLabel',
        labelId,
        boardId,
        desc,
      });
    }
  },
  'click .js-add-member-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const actionSelected = tpl.find('#member-action').value;
    const username = tpl.find('#member-name').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    if (actionSelected === 'add') {
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'addMember',
        username,
        boardId,
        desc,
      });
    }
    if (actionSelected === 'remove') {
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'removeMember',
        username,
        boardId,
        desc,
      });
    }
  },
  // #2522: "add member" acting-user option - stores the sentinel username
  // instead of a fixed board member, resolved at execution time by
  // server/rulesHelper.js to whoever's action fired the rule.
  'click .js-add-actinguser-member-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType: 'addMember',
      username: RULE_ACTING_USER_SENTINEL,
      boardId,
      desc,
    });
  },

  'click .js-add-removeall-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType: 'removeMember',
      //  deepcode ignore NoHardcodedCredentials: it's no credential
      username: '*',
      boardId,
      desc,
    });
  },
  // #4294: assignee actions, the member actions' twins on card.assignees.
  'click .js-add-assignee-action'(event, tpl) {
    const data = Template.currentData();
    const actionSelected = tpl.find('#assignee-action').value;
    const boardId = Session.get('currentBoard');
    saveRuleTriggerAction(boardId, data.ruleId, data.ruleName.get(), data.triggerVar.get(), {
      actionType: actionSelected === 'remove' ? 'removeAssignee' : 'addAssignee',
      username: tpl.find('#assignee-name').value,
      boardId,
      desc: Utils.getTriggerActionDesc(event, tpl),
    });
  },
  'click .js-add-actinguser-assignee-action'(event, tpl) {
    const data = Template.currentData();
    const boardId = Session.get('currentBoard');
    saveRuleTriggerAction(boardId, data.ruleId, data.ruleName.get(), data.triggerVar.get(), {
      actionType: 'addAssignee',
      username: RULE_ACTING_USER_SENTINEL,
      boardId,
      desc: Utils.getTriggerActionDesc(event, tpl),
    });
  },
  'click .js-add-removeall-assignees-action'(event, tpl) {
    const data = Template.currentData();
    const boardId = Session.get('currentBoard');
    saveRuleTriggerAction(boardId, data.ruleId, data.ruleName.get(), data.triggerVar.get(), {
      actionType: 'removeAssignee',
      //  deepcode ignore NoHardcodedCredentials: it's no credential
      username: '*',
      boardId,
      desc: Utils.getTriggerActionDesc(event, tpl),
    });
  },
  'click .js-add-removealllabels-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType: 'removeAllLabels',
      boardId,
      desc,
    });
  },
  'click .js-show-color-palette'(event, tpl) {
    // The chosen color lives in cardColorButtonValue (default 'green'), not in
    // the button's value, so the popup is opened with nothing else to set up.
    Popup.open('setCardActionsColor').call(this, event);
  },
  'click .js-set-color-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const selectedColor = tpl.cardColorButtonValue.get();
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType: 'setColor',
      selectedColor,
      boardId,
      desc,
    });
  },
  'click .js-set-complete-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const actionType = tpl.find('#complete-action').value;
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType,
      boardId,
      desc,
    });
  },
  'click .js-set-reldate-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const dateField = tpl.find('#reldate-datefield').value;
    // `days` keeps its name for backward compatibility: it is the numeric
    // amount, interpreted together with `unit` (minutes/hours/days/weeks/months).
    const days = parseInt(tpl.find('#reldate-days').value, 10) || 0;
    const unit = tpl.find('#reldate-unit').value;
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType: 'setDateRelative',
      dateField,
      days,
      unit,
      boardId,
      desc,
    });
  },
});

Template.setCardActionsColorPopup.onCreated(function () {
  this.currentColor = new ReactiveVar(
    sharedCardColorButtonValue.get()
  );
  this.colorButtonValue = sharedCardColorButtonValue;
});

Template.setCardActionsColorPopup.helpers({
  colors() {
    return cardColors.map(color => ({ color, name: '' }));
  },

  isSelected(color) {
    return Template.instance().currentColor.get() === color;
  },
});

Template.setCardActionsColorPopup.events({
  // #6748: the clicked swatch's color comes from the swatch's OWN data context.
  // Template.currentData() inside an event handler is the data of the template
  // the handler is defined on - this popup, whose data is the cardActions
  // context ({ ruleName, triggerVar, ruleId }) - so it had no `color`, and the
  // picker could never leave its "green" default.
  'click .js-palette-color'(event, tpl) {
    event.preventDefault();
    const color = Blaze.getData(event.currentTarget)?.color;
    if (cardColors.includes(color)) {
      tpl.currentColor.set(color);
    }
  },
  'click .js-submit'(event, tpl) {
    event.preventDefault();
    tpl.colorButtonValue.set(tpl.currentColor.get());
    Popup.back();
  },
});
