import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

BlazeComponent.extendComponent({
  onCreated() {
    // Ensure boards are available for the actions dropdowns. This subscription
    // is lightweight because the server publication already filters boards
    // to those visible to the user.
    this.subscribe('boards');
  },

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
    // Provide a translated label when available, otherwise fallback to English
    try {
      const txt = TAPi18n.__('loading-boards');
      if (txt && !txt.startsWith("key '")) return txt;
    } catch (e) {
      // ignore
    }
    return 'Loading boards...';
  },

  events() {
    return [
      {
        'click .js-create-card-action'(event) {
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const cardName = this.find('#card-name').value;
          const listName = this.find('#list-name').value;
          const swimlaneName = this.find('#swimlane-name2').value;
          const boardId = Session.get('currentBoard');
          const desc = Utils.getTriggerActionDesc(event, this);
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
        'click .js-add-swimlane-action'(event) {
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const swimlaneName = this.find('#swimlane-name').value;
          const boardId = Session.get('currentBoard');
          const desc = Utils.getTriggerActionDesc(event, this);
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
        'click .js-add-spec-move-action'(event) {
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const actionSelected = this.find('#move-spec-action').value;
          const swimlaneName = this.find('#swimlaneName').value || '*';
          const listName = this.find('#listName').value || '*';
          const boardId = Session.get('currentBoard');
          const destBoardId = this.find('#board-id').value;
          const desc = Utils.getTriggerActionDesc(event, this);
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
        'click .js-add-gen-move-action'(event) {
          const desc = Utils.getTriggerActionDesc(event, this);
          const boardId = Session.get('currentBoard');
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const actionSelected = this.find('#move-gen-action').value;
          if (actionSelected === 'top') {
            const triggerId = Triggers.insert(trigger);
            const actionId = Actions.insert({
              actionType: 'moveCardToTop',
              listTitle: '*',
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
          if (actionSelected === 'bottom') {
            const triggerId = Triggers.insert(trigger);
            const actionId = Actions.insert({
              actionType: 'moveCardToBottom',
              listTitle: '*',
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
        'click .js-add-arch-action'(event) {
          const desc = Utils.getTriggerActionDesc(event, this);
          const boardId = Session.get('currentBoard');
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const actionSelected = this.find('#arch-action').value;
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
        'click .js-link-card-action'(event) {
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const swimlaneName = this.find('#swimlaneName-link').value || '*';
          const listName = this.find('#listName-link').value || '*';
          const boardId = Session.get('currentBoard');
          const destBoardId = this.find('#board-id-link').value;
          const desc = Utils.getTriggerActionDesc(event, this);
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
      },
    ];
  },
}).register('boardActions');
/* eslint-no-undef */
