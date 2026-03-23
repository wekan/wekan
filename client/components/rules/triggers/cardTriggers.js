import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';

Template.cardTriggers.onCreated(function () {
  this.subscribe('allRules');
});

Template.cardTriggers.helpers({
  labels() {
    const labels = Utils.getCurrentBoard().labels;
    for (let i = 0; i < labels.length; i++) {
      if (labels[i].name === '' || labels[i].name === undefined) {
        labels[i].name = labels[i].color;
        labels[i].translatedname = `${TAPi18n.__(`color-${labels[i].color}`)}`;
      } else {
        labels[i].translatedname = labels[i].name;
      }
    }
    return labels;
  },
});

Template.cardTriggers.events({
  'click .js-add-gen-label-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const actionSelected = tpl.find('#label-action').value;
    const boardId = Session.get('currentBoard');
    if (actionSelected === 'added') {
      datas.triggerVar.set({
        activityType: 'addedLabel',
        boardId,
        labelId: '*',
        desc,
      });
    }
    if (actionSelected === 'removed') {
      datas.triggerVar.set({
        activityType: 'removedLabel',
        boardId,
        labelId: '*',
        desc,
      });
    }
  },
  'click .js-add-spec-label-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const actionSelected = tpl.find('#spec-label-action').value;
    const labelId = tpl.find('#spec-label').value;
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
  'click .js-add-gen-member-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const actionSelected = tpl.find('#gen-member-action').value;
    const boardId = Session.get('currentBoard');
    if (actionSelected === 'added') {
      datas.triggerVar.set({
        activityType: 'joinMember',
        boardId,
        username: '*',
        desc,
      });
    }
    if (actionSelected === 'removed') {
      datas.triggerVar.set({
        activityType: 'unjoinMember',
        boardId,
        username: '*',
        desc,
      });
    }
  },
  'click .js-add-spec-member-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const actionSelected = tpl.find('#spec-member-action').value;
    const username = tpl.find('#spec-member').value;
    const boardId = Session.get('currentBoard');
    if (actionSelected === 'added') {
      datas.triggerVar.set({
        activityType: 'joinMember',
        boardId,
        username,
        desc,
      });
    }
    if (actionSelected === 'removed') {
      datas.triggerVar.set({
        activityType: 'unjoinMember',
        boardId,
        username,
        desc,
      });
    }
  },
  'click .js-add-attachment-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const actionSelected = tpl.find('#attach-action').value;
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
});
