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
      'click .js-add-gen-label-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#label-action').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'added') {
          datas.triggerVar.set({
            activityType: 'addedLabel',
            boardId,
            'labelId': '*',
            desc,
          });
        }
        if (actionSelected === 'removed') {
          datas.triggerVar.set({
            activityType: 'removedLabel',
            boardId,
            'labelId': '*',
            desc,
          });
        }
      },
      'click .js-add-spec-label-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#spec-label-action').value;
        const labelId = this.find('#spec-label').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'added') {
          datas.triggerVar.set({
            activityType: 'addedLabel',
            boardId,
            labelId,
            desc,
          });
        }
        if (actionSelected === 'removed') {
          datas.triggerVar.set({
            activityType: 'removedLabel',
            boardId,
            labelId,
            desc,
          });
        }
      },
      'click .js-add-gen-member-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#gen-member-action').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'added') {
          datas.triggerVar.set({
            activityType: 'joinMember',
            boardId,
            'memberId': '*',
            desc,
          });
        }
        if (actionSelected === 'removed') {
          datas.triggerVar.set({
            activityType: 'unjoinMember',
            boardId,
            'memberId': '*',
            desc,
          });
        }
      },
      'click .js-add-spec-member-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#spec-member-action').value;
        const memberId = this.find('#spec-member').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'added') {
          datas.triggerVar.set({
            activityType: 'joinMember',
            boardId,
            memberId,
            desc,
          });
        }
        if (actionSelected === 'removed') {
          datas.triggerVar.set({
            activityType: 'unjoinMember',
            boardId,
            memberId,
            desc,
          });
        }
      },
      'click .js-add-attachment-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const actionSelected = this.find('#attach-action').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'added') {
          datas.triggerVar.set({
            activityType: 'addAttachment',
            boardId,
            desc,
          });
        }
        if (actionSelected === 'removed') {
          datas.triggerVar.set({
            activityType: 'deleteAttachment',
            boardId,
            desc,
          });
        }
      },
    }];
  },
}).register('cardTriggers');
