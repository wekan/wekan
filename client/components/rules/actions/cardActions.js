import Actions from '/models/actions';
import { CARD_COLORS } from '/models/metadata/colors';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import { Utils } from '/client/lib/utils';

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
    const triggerId = Triggers.insert(trigger);
    const actionSelected = tpl.find('#setdate-action').value;
    const dateFieldSelected = tpl.find('#setdate-datefield').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);

    const actionId = Actions.insert({
      actionType: actionSelected,
      dateField: dateFieldSelected,
      boardId,
      desc,
    });

    Rules.insert({
      title: ruleName,
      triggerId,
      actionId,
      boardId,
      desc,
    });
  },

  'click .js-remove-datevalue-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const triggerId = Triggers.insert(trigger);
    const dateFieldSelected = tpl.find('#setdate-removedatefieldvalue')
      .value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);

    const actionId = Actions.insert({
      actionType: 'removeDate',
      dateField: dateFieldSelected,
      boardId,
      desc,
    });

    Rules.insert({
      title: ruleName,
      triggerId,
      actionId,
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
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'addLabel',
        labelId,
        boardId,
        desc,
      });
      Rules.insert({
        title: ruleName,
        triggerId,
        actionId,
        boardId,
      });
    }
    if (actionSelected === 'remove') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'removeLabel',
        labelId,
        boardId,
        desc,
      });
      Rules.insert({
        title: ruleName,
        triggerId,
        actionId,
        boardId,
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
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'addMember',
        username,
        boardId,
        desc,
      });
      Rules.insert({
        title: ruleName,
        triggerId,
        actionId,
        boardId,
        desc,
      });
    }
    if (actionSelected === 'remove') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'removeMember',
        username,
        boardId,
        desc,
      });
      Rules.insert({
        title: ruleName,
        triggerId,
        actionId,
        boardId,
      });
    }
  },
  'click .js-add-removeall-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const triggerId = Triggers.insert(trigger);
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    const actionId = Actions.insert({
      actionType: 'removeMember',
      //  deepcode ignore NoHardcodedCredentials: it's no credential
      username: '*',
      boardId,
      desc,
    });
    Rules.insert({
      title: ruleName,
      triggerId,
      actionId,
      boardId,
    });
  },
  'click .js-show-color-palette'(event, tpl) {
    const funct = Popup.open('setCardActionsColor');
    const colorButton = tpl.find('#color-action');
    if (colorButton.value === '') {
      colorButton.value = 'green';
    }
    funct.call(this, event);
  },
  'click .js-set-color-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const selectedColor = tpl.cardColorButtonValue.get();
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const triggerId = Triggers.insert(trigger);
    const actionId = Actions.insert({
      actionType: 'setColor',
      selectedColor,
      boardId,
      desc,
    });
    Rules.insert({
      title: ruleName,
      triggerId,
      actionId,
      boardId,
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
  'click .js-palette-color'(event, tpl) {
    tpl.currentColor.set(Template.currentData().color);
  },
  'click .js-submit'(event, tpl) {
    tpl.colorButtonValue.set(tpl.currentColor.get());
    Popup.back();
  },
});
