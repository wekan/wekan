BlazeComponent.extendComponent({
  onCreated() {

  },

  events() {
    return [{
      'click .js-add-gen-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const boardId = Session.get('currentBoard');
        datas.triggerVar.set({
            activityType: 'createCard',
            boardId,
            'listName': '*',
            desc,
          });

      },
      'click .js-add-create-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const listName = this.find('#create-list-name').value;
        const swimlaneName = this.find('#create-swimlane-name').value;
        if(swimlaneName == undefined || swimlaneName == ""){
          swimlaneName = "*";
        }
        const boardId = Session.get('currentBoard');
        datas.triggerVar.set({
            activityType: 'createCard',
            boardId,
            swimlaneName,
            listName,
            desc,
          });
      },
      'click .js-add-moved-trigger' (event) {
        const datas = this.data();
        const desc = Utils.getTriggerActionDesc(event, this);
        const swimlaneName = this.find('#create-swimlane-name').value;
        const actionSelected = this.find('#move-action').value;
        const listName = this.find('#move-list-name').value;
        const boardId = Session.get('currentBoard');
        if(swimlaneName == undefined || swimlaneName == ""){
          swimlaneName = "*";
        }
        if (actionSelected === 'moved-to') {
          datas.triggerVar.set({
            activityType: 'moveCard',
            boardId,
            listName,
            swimlaneName,
            'oldListName': '*',
            desc,
          });
        }
        if (actionSelected === 'moved-from') {
          datas.triggerVar.set({
            activityType: 'moveCard',
            boardId,
            swimlaneName,
            'listName': '*',
            'oldListName': listName,
            desc,
          });
        }
      },
      'click .js-add-gen-moved-trigger' (event){
        const datas = this.data();
        const desc = Utils.getTriggerActionDesc(event, this);
        const boardId = Session.get('currentBoard');

        datas.triggerVar.set({
          activityType: 'moveCard',
          boardId,
          'listName':'*',
          'oldListName': '*',
          desc,
        });
      },
      'click .js-add-arc-trigger' (event) {
        const datas = this.data();
        const desc = Utils.getTriggerActionDesc(event, this);
        const actionSelected = this.find('#arch-action').value;
        const boardId = Session.get('currentBoard');
        if (actionSelected === 'archived') {
          datas.triggerVar.set({
            activityType: 'archivedCard',
            boardId,
            desc,
          });
        }
        if (actionSelected === 'unarchived') {
          datas.triggerVar.set({
            activityType: 'restoredCard',
            boardId,
            desc,
          });
        }
      },

    }];
  },

}).register('boardTriggers');
