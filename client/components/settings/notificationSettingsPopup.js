import { ReactiveCache } from '/imports/reactiveCache';
import { NOTIFICATION_SERVICES } from '/models/lib/notificationSettings';
import { Utils } from '/client/lib/utils';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { parseDueReminderInput } from '/models/lib/dueNotificationConfig';
import { GROUP_KEYS, cleanMutedGroups } from '/models/lib/notificationActivityGroups';

// The 3-tier Notification Settings popup (see notificationSettingsPopup.jade
// and models/lib/notificationSettings.js). `this.data().scope` is one of
// 'admin' | 'board' | 'member', set by whichever menu entry opened it
// (Popup.open('notificationSettings', { scope }) in userHeader.js/sidebar.js,
// or passed directly as the pane's data context in peopleBody.jade).
//
// At 'board' scope the board id comes from Utils.getCurrentBoardId() - the
// popup is only ever opened from the currently open board's sidebar.

function currentBoard() {
  return ReactiveCache.getBoard(Utils.getCurrentBoardId());
}

function currentValue(scope, service) {
  const field = service === 'email' ? 'notifyOverrideEmail' : 'notifyOverrideTray';
  const adminField = service === 'email' ? 'notifyDefaultEmail' : 'notifyDefaultTray';
  if (scope === 'admin') {
    const setting = ReactiveCache.getCurrentSetting();
    const value = setting && setting[adminField];
    return value === false ? false : true; // defaultValue: true
  }
  if (scope === 'board') {
    const board = currentBoard();
    return board ? board[field] : undefined;
  }
  // member
  const user = ReactiveCache.getCurrentUser();
  const profileField = service === 'email' ? 'notifyOverrideEmail' : 'notifyOverrideTray';
  return user && user.profile ? user.profile[profileField] : undefined;
}

Template.notificationSettingsPopup.onCreated(function () {
  this.dueReminderMessage = new ReactiveVar('');
  // Toggle state starts from the board and changes locally until Save.
  const board = this.data.scope === 'board' ? currentBoard() : null;
  this.dueRemindersOff = new ReactiveVar(Boolean(board && Array.isArray(board.dueReminderDays)
    && board.dueReminderDays.length === 0));
  this.dueReminderWebhook = new ReactiveVar(Boolean(board && board.dueReminderWebhook));
});

Template.notificationSettingsPopup.helpers({
  // #5323: per-board due-date reminder offsets and webhook delivery.
  isBoardScope() {
    return Template.instance().data.scope === 'board';
  },
  dueReminderDaysText() {
    const board = currentBoard();
    return board && Array.isArray(board.dueReminderDays) ? board.dueReminderDays.join(', ') : '';
  },
  dueRemindersOff() {
    return Template.instance().dueRemindersOff.get();
  },
  dueReminderWebhook() {
    return Template.instance().dueReminderWebhook.get();
  },
  dueReminderMessage() {
    return Template.instance().dueReminderMessage.get();
  },
  isAdminScope() {
    return Template.instance().data.scope === 'admin';
  },
  // #3695 / #5171: the delivery sections. At board scope only a board admin
  // can change them (the server method checks that too).
  showDelivery() {
    const scope = Template.instance().data.scope;
    if (scope !== 'board') return scope === 'admin' || scope === 'member';
    const user = ReactiveCache.getCurrentUser();
    return !!(user && (user.isBoardAdmin() || user.isAdmin));
  },
  deliveryTargetId() {
    return Template.instance().data.scope === 'board' ? Utils.getCurrentBoardId() : null;
  },
  deliveryChannels() {
    return ['email', 'tray', 'webhook'].map(channel => ({ channel }));
  },
  // #572: every kind of card activity, ticked unless this member muted it.
  isMemberScope() {
    return Template.instance().data.scope === 'member';
  },
  activityGroupRows() {
    const user = ReactiveCache.getCurrentUser();
    const muted = cleanMutedGroups(user && user.profile && user.profile.notifyMutedActivities);
    return GROUP_KEYS.map(key => ({ key, labelKey: `notification-activity-${key}`, enabled: !muted.includes(key) }));
  },
  notifyServiceRows() {
    const scope = Template.instance().data.scope;
    return Object.keys(NOTIFICATION_SERVICES).map(service => {
      const value = currentValue(scope, service);
      return {
        service,
        icon: service === 'email' ? 'fa-envelope' : 'fa-bell',
        labelKey: service === 'email' ? 'email' : 'notification-settings-tray',
        onSelected: value === true,
        offSelected: value === false,
        inheritSelected: value !== true && value !== false,
      };
    });
  },
});

Template.notificationSettingsPopup.events({
  'click .js-due-reminder-off'(event, instance) {
    event.preventDefault();
    instance.dueRemindersOff.set(!instance.dueRemindersOff.get());
  },
  'click .js-due-reminder-webhook'(event, instance) {
    event.preventDefault();
    instance.dueReminderWebhook.set(!instance.dueReminderWebhook.get());
  },
  'submit .js-due-reminder-form'(event, instance) {
    event.preventDefault();
    const board = currentBoard();
    if (!board) return;
    const off = instance.dueRemindersOff.get();
    const days = off ? [] : parseDueReminderInput(instance.$('.js-due-reminder-days').val());
    if (days === undefined) {
      instance.dueReminderMessage.set(TAPi18n.__('due-reminder-invalid'));
      return;
    }
    const webhook = instance.dueReminderWebhook.get();
    Meteor.call('setBoardDueReminders', board._id, days, webhook, error => {
      instance.dueReminderMessage.set(TAPi18n.__(error ? 'due-reminder-invalid' : 'due-reminder-saved'));
    });
  },
  'click .js-notify-activity'(event) {
    event.preventDefault();
    const user = ReactiveCache.getCurrentUser();
    if (!user) return;
    const group = event.currentTarget.dataset.group;
    const muted = cleanMutedGroups(user.profile && user.profile.notifyMutedActivities);
    user.setNotifyMutedActivities(muted.includes(group) ? muted.filter(key => key !== group) : [...muted, group]);
  },
  'click .js-notify-option'(event, instance) {
    event.preventDefault();
    const target = event.currentTarget;
    const service = target.dataset.service;
    const rawValue = target.dataset.value;
    const value = rawValue === 'true' ? true : rawValue === 'false' ? false : null;
    const scope = instance.data.scope;

    if (scope === 'admin') {
      // Inherit is not offered at admin scope - it IS the base default - so
      // only true/false ever reach here.
      Meteor.call('setAdminNotifyDefault', service, value === true);
      return;
    }
    if (scope === 'board') {
      const board = currentBoard();
      if (board) board.setNotifyOverride(service, value);
      return;
    }
    const user = ReactiveCache.getCurrentUser();
    if (user) user.setNotifyOverride(service, value);
  },
});
