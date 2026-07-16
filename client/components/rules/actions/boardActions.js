import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Actions from '/models/actions';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import { Utils } from '/client/lib/utils';
import { canSelectBoardInRules } from '/models/lib/rulesBoardSelector';

Template.boardActions.onCreated(function () {
  this.subscribe('boards');
});

Template.boardActions.helpers({
  boards() {
    // #5698: don't restrict to boards where the user is a DIRECT member — that
    // hid every board reached through an Organization / Team / email-domain
    // share (the reporter's whole board dropdown was empty, current board
    // included). Filter the already access-scoped client cache with the same
    // visibility rule as Boards.userBoards() so org/team/domain boards show too.
    const user = ReactiveCache.getCurrentUser();
    if (!user) return [];
    const ctx = {
      userId: user._id,
      orgIds: typeof user.orgIds === 'function' ? user.orgIds() : [],
      teamIds: typeof user.teamIds === 'function' ? user.teamIds() : [],
      emailDomains:
        typeof user.emailDomains === 'function' ? user.emailDomains() : [],
    };
    const templatesBoardId = user.getTemplatesBoardId();
    const boards = ReactiveCache.getBoards(
      { archived: false },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return boards.filter(board =>
      canSelectBoardInRules(board, ctx, templatesBoardId),
    );
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
    // #5536: create the rule on the server (see server/rulesButton.js →
    // rules.createRule) instead of three optimistic client Collection.insert()
    // calls. The optimistic writes landed in minimongo limbo once the wizard
    // subscription stopped, so the cross-board move action rendered BLANK; and
    // the client allow/deny rules rejected them outright for non-owner members.
    // The action keeps its own destination `boardId` (the board to move to).
    Meteor.call('rules.createRule', boardId, ruleName, trigger, {
      actionType: actionSelected === 'bottom' ? 'moveCardToBottom' : 'moveCardToTop',
      listName,
      swimlaneName,
      boardId: destBoardId,
      desc,
    });
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
      // #6472: was `listTitle: '*'` since the original rules implementation,
      // but performAction reads action.listName/action.swimlaneName — so every
      // generic "move to top/bottom" rule created by this wizard did nothing.
      listName: '*',
      swimlaneName: '*',
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
    // #5536: create on the server so the cross-board link action does not land
    // blank in minimongo limbo / get rejected by client allow/deny. The action
    // keeps its own destination `boardId` (the board to link the card into).
    Meteor.call('rules.createRule', boardId, ruleName, trigger, {
      actionType: 'linkCard',
      listName,
      swimlaneName,
      boardId: destBoardId,
      desc,
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
