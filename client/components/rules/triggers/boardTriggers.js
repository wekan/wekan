BlazeComponent.extendComponent({
  onCreated() {
    this.provaVar = new ReactiveVar('');
    this.currentPopupTriggerId = 'def';
    this.cardTitleFilters = {};
  },
  setNameFilter(name){
    this.cardTitleFilters[this.currentPopupTriggerId] =  name;
  },

  events() {
    return [{
      'click .js-open-card-title-popup'(event){
        const funct = Popup.open('boardCardTitle');
        const divId = $(event.currentTarget.parentNode.parentNode).attr('id');
        //console.log('current popup');
        //console.log(this.currentPopupTriggerId);
        this.currentPopupTriggerId = divId;
        funct.call(this, event);
      },
      'click .js-add-create-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        const datas = this.data();
        const listName = this.find('#create-list-name').value;
        const swimlaneName = this.find('#create-swimlane-name').value;
        const boardId = Session.get('currentBoard');
        const divId = $(event.currentTarget.parentNode).attr('id');
        const cardTitle = this.cardTitleFilters[divId];
        // move to generic funciont
        datas.triggerVar.set({
          activityType: 'createCard',
          boardId,
          cardTitle,
          swimlaneName,
          listName,
          desc,
        });
      },
      'click .js-add-moved-trigger' (event) {
        const datas = this.data();
        const desc = Utils.getTriggerActionDesc(event, this);
        const swimlaneName = this.find('#create-swimlane-name-2').value;
        const actionSelected = this.find('#move-action').value;
        const listName = this.find('#move-list-name').value;
        const boardId = Session.get('currentBoard');
        const divId = $(event.currentTarget.parentNode).attr('id');
        const cardTitle = this.cardTitleFilters[divId];
        if (actionSelected === 'moved-to') {
          datas.triggerVar.set({
            activityType: 'moveCard',
            boardId,
            listName,
            cardTitle,
            swimlaneName,
            'oldListName': '*',
            desc,
          });
        }
        if (actionSelected === 'moved-from') {
          datas.triggerVar.set({
            activityType: 'moveCard',
            boardId,
            cardTitle,
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
          'activityType': 'moveCard',
          boardId,
          'swimlaneName': '*',
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


Template.boardCardTitlePopup.events({
  submit(evt, tpl) {
    const title = tpl.$('.js-card-filter-name').val().trim();
    Popup.getOpenerComponent().setNameFilter(title);
    evt.preventDefault();
    Popup.close();
  },
});
