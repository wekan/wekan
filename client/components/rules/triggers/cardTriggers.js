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
  'click .js-add-gen-assignee-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const actionSelected = tpl.find('#gen-assignee-action').value;
    const boardId = Session.get('currentBoard');
    if (actionSelected === 'added') {
      datas.triggerVar.set({
        activityType: 'joinAssignee',
        boardId,
        username: '*',
        desc,
      });
    }
    if (actionSelected === 'removed') {
      datas.triggerVar.set({
        activityType: 'unjoinAssignee',
        boardId,
        username: '*',
        desc,
      });
    }
  },
  'click .js-add-spec-assignee-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const actionSelected = tpl.find('#spec-assignee-action').value;
    const username = tpl.find('#spec-assignee').value;
    const boardId = Session.get('currentBoard');
    if (actionSelected === 'added') {
      datas.triggerVar.set({
        activityType: 'joinAssignee',
        boardId,
        username,
        desc,
      });
    }
    if (actionSelected === 'removed') {
      datas.triggerVar.set({
        activityType: 'unjoinAssignee',
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
  // #3092: "card matches advanced filter" - the trigger stores the SAME
  // criteria string the board Filter sidebar's Advanced Filter field accepts
  // (client/components/sidebar/sidebarFilters.jade's .js-field-advanced-filter),
  // so it is evaluated server-side by the exact same selector-building
  // function (server/lib/advancedFilterMatch.js -> /imports/lib/advancedFilter.js)
  // the sidebar itself uses, not a reimplementation of the filter language.
  'click .js-add-advanced-filter-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const advancedFilter = tpl.find('.advanced-filter-trigger-value').value.trim();
    if (!advancedFilter) return;
    const boardId = Session.get('currentBoard');
    datas.triggerVar.set({
      activityType: 'advancedFilterTrigger',
      boardId,
      advancedFilter,
      desc,
    });
  },
  // #2474: "a card's due/start/end/received date is set or changed" - these
  // reuse the 'a-dueAt'/'a-startAt'/'a-endAt'/'a-receivedAt' activities that
  // models/cards.js's setDue/setStart/setEnd/setReceived already log via
  // server/models/cards.js's timing-field hook (see server/triggersDef.js),
  // the same mechanism the due-date-change-count feature (#6081) already
  // reads. No userId is stored here, matching the addAttachment trigger
  // above - server/rulesHelper.js's buildMatchingFieldsMap treats an omitted
  // field as "any", and the "by" username field (once wired up) narrows it.
  'click .js-add-due-date-changed-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const boardId = Session.get('currentBoard');
    datas.triggerVar.set({
      activityType: 'a-dueAt',
      boardId,
      desc,
    });
  },
  'click .js-add-start-date-changed-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const boardId = Session.get('currentBoard');
    datas.triggerVar.set({
      activityType: 'a-startAt',
      boardId,
      desc,
    });
  },
  'click .js-add-end-date-changed-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const boardId = Session.get('currentBoard');
    datas.triggerVar.set({
      activityType: 'a-endAt',
      boardId,
      desc,
    });
  },
  'click .js-add-received-date-changed-trigger'(event, tpl) {
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const datas = Template.currentData();
    const boardId = Session.get('currentBoard');
    datas.triggerVar.set({
      activityType: 'a-receivedAt',
      boardId,
      desc,
    });
  },
});
