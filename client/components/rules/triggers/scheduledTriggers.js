import { Utils } from '/client/lib/utils';

// All triggers here are time-based: they are evaluated by the server SyncedCron
// scanner in server/scheduledRules.js rather than by activity matching. They all
// share activityType 'scheduledTrigger' with a `scheduleKind` discriminator.

Template.scheduledTriggers.events({
  'click .js-add-scheduled-trigger'(event, tpl) {
    const datas = Template.currentData();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    const scheduleType = tpl.find('#schedule-type').value;
    const atTime = tpl.find('#schedule-time').value || '09:00';
    const weekday = parseInt(tpl.find('#schedule-weekday').value, 10);
    const dayOfMonth = parseInt(tpl.find('#schedule-dom').value, 10) || 1;
    const onDate = tpl.find('#schedule-date').value || '';
    const listName = tpl.find('#schedule-list-name').value || '*';
    datas.triggerVar.set({
      activityType: 'scheduledTrigger',
      scheduleKind: 'calendar',
      scheduleType,
      atTime,
      weekday,
      dayOfMonth,
      onDate,
      listName,
      swimlaneName: '*',
      boardId,
      desc,
    });
  },
  'click .js-add-due-trigger'(event, tpl) {
    const datas = Template.currentData();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    const dueCondition = tpl.find('#due-condition').value;
    const days = parseInt(tpl.find('#due-days').value, 10) || 0;
    const atTime = tpl.find('#due-time').value || '09:00';
    datas.triggerVar.set({
      activityType: 'scheduledTrigger',
      scheduleKind: 'due',
      dueCondition,
      days,
      atTime,
      listName: '*',
      swimlaneName: '*',
      boardId,
      desc,
    });
  },
  'click .js-add-aging-trigger'(event, tpl) {
    const datas = Template.currentData();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    const listName = tpl.find('#aging-list-name').value || '*';
    const days = parseInt(tpl.find('#aging-days').value, 10) || 7;
    const atTime = tpl.find('#aging-time').value || '09:00';
    datas.triggerVar.set({
      activityType: 'scheduledTrigger',
      scheduleKind: 'aging',
      days,
      atTime,
      listName,
      swimlaneName: '*',
      boardId,
      desc,
    });
  },
});
