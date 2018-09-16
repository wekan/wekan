BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },
  events() {
    return [{
      'click .js-add-gen-check-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#gen-check-action').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'created') {
          datas.triggerVar.set({
            activityType: 'addChecklist',
            boardId,
            'checklistName': '*',
            desc,
          });
        }
        if (actionSelected === 'removed') {
          datas.triggerVar.set({
            activityType: 'removeChecklist',
            boardId,
            'checklistName': '*',
            desc,
          });
        }
      },
      'click .js-add-spec-check-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#spec-check-action').value;
        const checklistId = this.find('#check-name').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'created') {
          datas.triggerVar.set({
            activityType: 'addChecklist',
            boardId,
            'checklistName': checklistId,
            desc,
          });
        }
        if (actionSelected === 'removed') {
          datas.triggerVar.set({
            activityType: 'removeChecklist',
            boardId,
            'checklistName': checklistId,
            desc,
          });
        }
      },
      'click .js-add-gen-comp-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);

        const datas = this.data();
        const actionSelected = this.find('#gen-comp-check-action').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'completed') {
          datas.triggerVar.set({
            activityType: 'completeChecklist',
            boardId,
            'checklistName': '*',
            desc,
          });
        }
        if (actionSelected === 'uncompleted') {
          datas.triggerVar.set({
            activityType: 'uncompleteChecklist',
            boardId,
            'checklistName': '*',
            desc,
          });
        }
      },
      'click .js-add-spec-comp-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#spec-comp-check-action').value;
        const checklistId = this.find('#spec-comp-check-name').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'added') {
          datas.triggerVar.set({
            activityType: 'completeChecklist',
            boardId,
            'checklistName': checklistId,
            desc,
          });
        }
        if (actionSelected === 'removed') {
          datas.triggerVar.set({
            activityType: 'uncompleteChecklist',
            boardId,
            'checklistName': checklistId,
            desc,
          });
        }
      },
      'click .js-add-gen-check-item-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#check-item-gen-action').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'checked') {
          datas.triggerVar.set({
            activityType: 'checkedItem',
            boardId,
            'checklistItemName': '*',
            desc,
          });
        }
        if (actionSelected === 'unchecked') {
          datas.triggerVar.set({
            activityType: 'uncheckedItem',
            boardId,
            'checklistItemName': '*',
            desc,
          });
        }
      },
      'click .js-add-spec-check-item-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#check-item-spec-action').value;
        const checklistItemId = this.find('#check-item-name').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'checked') {
          datas.triggerVar.set({
            activityType: 'checkedItem',
            boardId,
            'checklistItemName': checklistItemId,
            desc,
          });
        }
        if (actionSelected === 'unchecked') {
          datas.triggerVar.set({
            activityType: 'uncheckedItem',
            boardId,
            'checklistItemName': checklistItemId,
            desc,
          });
        }
      },
    }];
  },

}).register('checklistTriggers');
