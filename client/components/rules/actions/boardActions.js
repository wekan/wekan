import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Actions from '/models/actions';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import { Utils } from '/client/lib/utils';

Template.boardActions.onCreated(function () {
  this.subscribe('boards');
});

Template.boardActions.helpers({
  boards() {
    const ret = ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: {
          $ne: ReactiveCache.getCurrentUser().getTemplatesBoardId(),
        },
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return ret;
  },

  loadingBoardsLabel() {
    try {
      const txt = TAPi18n.__('loading-boards');
      if (txt && !txt.startsWith("key '")) return txt;
    } catch (e) {
      // ignore translation lookup errors
    }
    return 'Loading boards...';
  },
});

Template.boardActions.events({
  'click .js-create-card-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const cardName = tpl.find('#card-name').value;
    const listName = tpl.find('#list-name').value;
    const swimlaneName = tpl.find('#swimlane-name2').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const triggerId = Triggers.insert(trigger);
    const actionId = Actions.insert({
      actionType: 'createCard',
      swimlaneName,
      cardName,
      listName,
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
  'click .js-add-swimlane-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const swimlaneName = tpl.find('#swimlane-name').value;
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const triggerId = Triggers.insert(trigger);
    const actionId = Actions.insert({
      actionType: 'addSwimlane',
      swimlaneName,
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
  'click .js-add-spec-move-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const actionSelected = tpl.find('#move-spec-action').value;
    const swimlaneName = tpl.find('#swimlaneName').value || '*';
    const listName = tpl.find('#listName').value || '*';
    const boardId = Session.get('currentBoard');
    const destBoardId = tpl.find('#board-id').value;
    const desc = Utils.getTriggerActionDesc(event, tpl);
    if (actionSelected === 'top') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'moveCardToTop',
        listName,
        swimlaneName,
        boardId: destBoardId,
        desc,
      });
      Rules.insert({
        title: ruleName,
        triggerId,
        actionId,
        boardId,
      });
    }
    if (actionSelected === 'bottom') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'moveCardToBottom',
        listName,
        swimlaneName,
        boardId: destBoardId,
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
  'click .js-add-gen-move-action'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const actionSelected = tpl.find('#move-gen-action').value;
    const actionType =
      actionSelected === 'bottom' ? 'moveCardToBottom' : 'moveCardToTop';
    // Insert the rule on the server (see server/rulesButton.js → rules.createRule)
    // rather than via three optimistic client Collection.insert() calls, whose
    // documents land in minimongo limbo when the wizard subscription stops.
    Meteor.call('rules.createRule', boardId, ruleName, trigger, {
      actionType,
      listTitle: '*',
      boardId,
      desc,
    });
  },
  'click .js-add-arch-action'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const actionSelected = tpl.find('#arch-action').value;
    if (actionSelected === 'archive') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'archive',
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
    if (actionSelected === 'unarchive') {
      const triggerId = Triggers.insert(trigger);
      const actionId = Actions.insert({
        actionType: 'unarchive',
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
  'click .js-link-card-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const swimlaneName = tpl.find('#swimlaneName-link').value || '*';
    const listName = tpl.find('#listName-link').value || '*';
    const boardId = Session.get('currentBoard');
    const destBoardId = tpl.find('#board-id-link').value;
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const triggerId = Triggers.insert(trigger);
    const actionId = Actions.insert({
      actionType: 'linkCard',
      listName,
      swimlaneName,
      boardId: destBoardId,
      desc,
    });
    Rules.insert({
      title: ruleName,
      triggerId,
      actionId,
      boardId,
    });
  },
  'click .js-sort-list-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const listName = tpl.find('#sort-list-name').value || '*';
    const sortField = tpl.find('#sort-field').value;
    const triggerId = Triggers.insert(trigger);
    const actionId = Actions.insert({
      actionType: 'sortList',
      listName,
      sortField,
      boardId,
      desc,
    });
    Rules.insert({ title: ruleName, triggerId, actionId, boardId });
  },
  'click .js-move-all-cards-action'(event, tpl) {
    const data = Template.currentData();
    const ruleName = data.ruleName.get();
    const trigger = data.triggerVar.get();
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const fromListName = tpl.find('#moveall-from-list').value || '*';
    const listName = tpl.find('#moveall-to-list').value || '*';
    const triggerId = Triggers.insert(trigger);
    const actionId = Actions.insert({
      actionType: 'moveAllCardsInList',
      fromListName,
      listName,
      boardId,
      desc,
    });
    Rules.insert({ title: ruleName, triggerId, actionId, boardId });
  },
});
/* eslint-no-undef */
