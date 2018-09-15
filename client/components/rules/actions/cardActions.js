BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },

  labels() {
    const labels = Boards.findOne(Session.get('currentBoard')).labels;
    for (let i = 0; i < labels.length; i++) {
      if (labels[i].name === '' || labels[i].name === undefined) {
        labels[i].name = labels[i].color.toUpperCase();
      }
    }
    return labels;
  },

  events() {
    return [{
      'click .js-add-label-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const actionSelected = this.find('#label-action').value;
        const labelId = this.find('#label-id').value;
        const boardId = Session.get('currentBoard');
        const desc = Utils.getTriggerActionDesc(event, this);
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
      'click .js-add-member-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const actionSelected = this.find('#member-action').value;
        const memberName = this.find('#member-name').value;
        const boardId = Session.get('currentBoard');
        const desc = Utils.getTriggerActionDesc(event, this);
        if (actionSelected === 'add') {
          const triggerId = Triggers.insert(trigger);
          const actionId = Actions.insert({
            actionType: 'addMember',
            memberName,
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
            memberName,
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
      'click .js-add-removeall-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const triggerId = Triggers.insert(trigger);
        const desc = Utils.getTriggerActionDesc(event, this);
        const boardId = Session.get('currentBoard');
        const actionId = Actions.insert({
          actionType: 'removeMember',
          'memberName': '*',
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
    }];
  },

}).register('cardActions');
