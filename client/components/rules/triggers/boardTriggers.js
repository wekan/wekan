import { Utils } from '/client/lib/utils';

Template.boardTriggers.onCreated(function () {
  this.provaVar = new ReactiveVar('');
  this.currentPopupTriggerId = 'def';
  this.cardTitleFilters = {};
  this.setNameFilter = (name) => {
    this.cardTitleFilters[this.currentPopupTriggerId] = name;
  };
});

Template.boardTriggers.events({
  'click .js-open-card-title-popup'(event, tpl) {
    const funct = Popup.open('boardCardTitle');
    const divId = $(event.currentTarget.parentNode.parentNode).attr('id');
    tpl.currentPopupTriggerId = divId;
    funct.call(this, event);
  },
  'click .js-add-create-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const listName = tpl.find('#create-list-name').value;
    const swimlaneName = tpl.find('#create-swimlane-name').value;
    const boardId = Session.get('currentBoard');
    const divId = $(event.currentTarget.parentNode).attr('id');
    const cardTitle = tpl.cardTitleFilters[divId];
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
  'click .js-add-moved-trigger'(event, tpl) {
    const datas = Template.currentData();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const swimlaneName = tpl.find('#create-swimlane-name-2').value;
    const actionSelected = tpl.find('#move-action').value;
    const listName = tpl.find('#move-list-name').value;
    const boardId = Session.get('currentBoard');
    const divId = $(event.currentTarget.parentNode).attr('id');
    const cardTitle = tpl.cardTitleFilters[divId];
    if (actionSelected === 'moved-to') {
      datas.triggerVar.set({
        activityType: 'moveCard',
        boardId,
        listName,
        cardTitle,
        swimlaneName,
        oldListName: '*',
        desc,
      });
    }
    if (actionSelected === 'moved-from') {
      datas.triggerVar.set({
        activityType: 'moveCard',
        boardId,
        cardTitle,
        swimlaneName,
        listName: '*',
        oldListName: listName,
        desc,
      });
    }
  },
  'click .js-add-gen-moved-trigger'(event, tpl) {
    const datas = Template.currentData();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');

    datas.triggerVar.set({
      activityType: 'moveCard',
      boardId,
      swimlaneName: '*',
      listName: '*',
      oldListName: '*',
      desc,
    });
  },
  'click .js-add-arc-trigger'(event, tpl) {
    const datas = Template.currentData();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const actionSelected = tpl.find('#arch-action').value;
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
});

Template.boardCardTitlePopup.events({
  submit(event) {
    const title = $(event.target)
      .find('.js-card-filter-name')
      .val()
      .trim();
    const opener = Popup.getOpenerComponent();
    if (opener?.setNameFilter) {
      opener.setNameFilter(title);
    }
    event.preventDefault();
    Popup.back();
  },
});
