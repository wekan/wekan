import Actions from '/models/actions';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import { Utils } from '/client/lib/utils';

Template.checklistActions.onCreated(function () {
  this.subscribe('allRules');
});

Template.checklistActions.events({
  'click .js-add-checklist-items-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const checklistName = tpl.find('#checklist-name-3').value;
    const checklistItems = tpl.find('#checklist-items').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const triggerId = Triggers.insert(trigger);
    const actionId = Actions.insert({
      actionType: 'addChecklistWithItems',
      checklistName,
      checklistItems,
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
  'click .js-add-checklist-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const actionSelected = tpl.find('#check-action').value;
    const checklistName = tpl.find('#checklist-name').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    if (actionSelected === 'add') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'addChecklist',
        checklistName,
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
        actionType: 'removeChecklist',
        checklistName,
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
  'click .js-add-checkall-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const actionSelected = tpl.find('#checkall-action').value;
    const checklistName = tpl.find('#checklist-name2').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    if (actionSelected === 'check') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'checkAll',
        checklistName,
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
    if (actionSelected === 'uncheck') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'uncheckAll',
        checklistName,
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
  'click .js-add-check-item-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const checkItemName = tpl.find('#checkitem-name');
    const checklistName = tpl.find('#checklist-name3');
    const actionSelected = tpl.find('#check-item-action').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    if (actionSelected === 'check') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'checkItem',
        checklistName,
        checkItemName,
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
    if (actionSelected === 'uncheck') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'uncheckItem',
        checklistName,
        checkItemName,
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
});
