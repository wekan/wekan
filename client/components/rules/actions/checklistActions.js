BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },
  events() {
    return [{
      'click .js-add-checklist-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const actionSelected = this.find('#check-action').value;
        const checklistName = this.find('#checklist-name').value;
        const boardId = Session.get('currentBoard');
        const desc = Utils.getTriggerActionDesc(event, this);
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
      'click .js-add-checkall-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const actionSelected = this.find('#checkall-action').value;
        const checklistName = this.find('#checklist-name2').value;
        const boardId = Session.get('currentBoard');
        const desc = Utils.getTriggerActionDesc(event, this);
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
      'click .js-add-check-item-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const checkItemName = this.find('#checkitem-name');
        const checklistName = this.find('#checklist-name3');
        const actionSelected = this.find('#check-item-action').value;
        const boardId = Session.get('currentBoard');
        const desc = Utils.getTriggerActionDesc(event, this);
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
    }];
  },

}).register('checklistActions');
