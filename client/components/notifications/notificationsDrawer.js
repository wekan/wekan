import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { toggleNotificationsDrawer } from './notifications.js';
import Users from '/models/users';
import { ReactiveVar } from 'meteor/reactive-var';
import { trayDeliveryFor, trayEntryVisible } from '/client/lib/notificationTray';
const { groupEntries } = require('/models/lib/notificationDelivery');

// #5171: the entries the drawer shows now - an entry scheduled for later
// (showAt) waits for its time.
function visibleNotifications() {
  const user = ReactiveCache.getCurrentUser();
  return (user ? user.notifications() : []).filter(entry => trayEntryVisible(entry));
}

Template.notificationsDrawer.onCreated(function() {
  this.expandedGroups = new ReactiveVar([]);
  Meteor.subscribe('notificationActivities');
  Meteor.subscribe('notificationCards');
  Meteor.subscribe('notificationUsers');
  Meteor.subscribe('notificationsAttachments');
  Meteor.subscribe('notificationChecklistItems');
  Meteor.subscribe('notificationChecklists');
  Meteor.subscribe('notificationComments');
  Meteor.subscribe('notificationLists');
  Meteor.subscribe('notificationSwimlanes');
});

Template.notificationsDrawer.helpers({
  notifications() {
    return visibleNotifications();
  },
  // #5171: the drawer rows - single entries, or one card's / board's entries
  // together, by each entry's tray grouping (member -> board -> Admin Panel).
  notificationGroups() {
    const expanded = Template.instance().expandedGroups.get();
    return groupEntries(visibleNotifications(),
      entry => trayDeliveryFor(entry.activityObj && entry.activityObj.boardId).grouping,
      entry => ({ boardId: entry.activityObj && entry.activityObj.boardId, cardId: entry.activityObj && entry.activityObj.cardId }))
      .map(group => {
        const first = group.entries[0];
        const activity = first.activityObj || {};
        const card = group.key.startsWith('card:') && activity.card ? activity.card() : null;
        const board = activity.board ? activity.board() : null;
        return {
          ...group,
          firstEntry: first,
          isCollapsible: group.entries.length > 1,
          expanded: expanded.includes(group.key),
          groupLabel: card
            ? TAPi18n.__('notification-group-card', { count: group.entries.length, card: card.title || '' })
            : TAPi18n.__('notification-group-board', { count: group.entries.length, board: (board && board.title) || '' }),
        };
      });
  },
  transformedProfile() {
    return ReactiveCache.getCurrentUser();
  },
  readNotifications() {
    const list = visibleNotifications();
    const readNotifications = list.filter(v => !!v.read);
    return readNotifications.length;
  },
});

Template.notificationsDrawer.events({
  'click .js-toggle-notification-group'(event, instance) {
    event.preventDefault();
    event.stopPropagation();
    const key = event.currentTarget.dataset.key;
    const expanded = instance.expandedGroups.get();
    instance.expandedGroups.set(expanded.includes(key) ? expanded.filter(k => k !== key) : [...expanded, key]);
  },
  'click .notification-menu-toggle'(event) {
    event.stopPropagation();
    Session.set('showNotificationMenu', !Session.get('showNotificationMenu'));
  },
  async 'click .notification-menu .menu-item'(event) {
    const target = event.currentTarget;

    if (target.classList.contains('mark-all-read')) {
      const notifications = ReactiveCache.getCurrentUser().profile.notifications;
      for (const index in notifications) {
        if (notifications.hasOwnProperty(index) && !notifications[index].read) {
          const update = {};
          update[`profile.notifications.${index}.read`] = new Date();
          await Users.updateAsync(Meteor.userId(), { $set: update }).catch((error) => {
            console.error('Error marking notification as read:', error);
          });
        }
      }
      Session.set('showNotificationMenu', false);
    } else if (target.classList.contains('mark-all-unread')) {
      const notifications = ReactiveCache.getCurrentUser().profile.notifications;
      for (const index in notifications) {
        if (notifications.hasOwnProperty(index) && notifications[index].read) {
          const update = {};
          update[`profile.notifications.${index}.read`] = null;
          await Users.updateAsync(Meteor.userId(), { $set: update }).catch((error) => {
            console.error('Error marking notification as unread:', error);
          });
        }
      }
      Session.set('showNotificationMenu', false);
    } else if (target.classList.contains('delete-read')) {
      const user = ReactiveCache.getCurrentUser();
      for (const notification of user.profile.notifications) {
        if (notification.read) {
          user.removeNotification(notification.activity);
        }
      }
      Session.set('showNotificationMenu', false);
    } else if (target.classList.contains('delete-all')) {
      if (confirm(TAPi18n.__('delete-all-notifications-confirm'))) {
        const user = ReactiveCache.getCurrentUser();
        const notificationsCopy = [...user.profile.notifications];
        for (const notification of notificationsCopy) {
          user.removeNotification(notification.activity);
        }
      }
      Session.set('showNotificationMenu', false);
    } else if (target.classList.contains('selected')) {
      // Already selected, do nothing
      Session.set('showNotificationMenu', false);
    } else {
      // Toggle view
      Session.set('showReadNotifications', !Session.get('showReadNotifications'));
      Session.set('showNotificationMenu', false);
    }
  },
  'click .close'() {
    Session.set('showNotificationMenu', false);
    toggleNotificationsDrawer();
  },
  'click'(event) {
    // Close menu when clicking outside
    if (!event.target.closest('.notification-menu') && !event.target.closest('.notification-menu-toggle')) {
      Session.set('showNotificationMenu', false);
    }
  },
});
