import { Utils } from '/client/lib/utils';
import { saveRuleTriggerAction } from '/client/components/rules/rulesSaveHelper';

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
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType: 'addChecklistWithItems',
      checklistName,
      checklistItems,
      boardId,
      desc,
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
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'addChecklist',
        checklistName,
        boardId,
        desc,
      });
    }
    if (actionSelected === 'remove') {
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'removeChecklist',
        checklistName,
        boardId,
        desc,
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
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'checkAll',
        checklistName,
        boardId,
        desc,
      });
    }
    if (actionSelected === 'uncheck') {
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'uncheckAll',
        checklistName,
        boardId,
        desc,
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
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'checkItem',
        checklistName,
        checkItemName,
        boardId,
        desc,
      });
    }
    if (actionSelected === 'uncheck') {
      saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
        actionType: 'uncheckItem',
        checklistName,
        checkItemName,
        boardId,
        desc,
      });
    }
  },
});
