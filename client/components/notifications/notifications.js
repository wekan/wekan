import { ReactiveCache } from '/imports/reactiveCache';

// this hides the notifications drawer if anyone clicks off of the panel
Template.body.events({
  click(event) {
    if (
      !$(event.target).is('#notifications *') &&
      Session.get('showNotificationsDrawer')
    ) {
      toggleNotificationsDrawer();
    }
  },
});

Template.notifications.helpers({
  unreadNotifications() {
    // Activity details are subscribed only while the drawer is open. The bell
    // must count the user's unread records before that subscription exists.
    const notifications = ReactiveCache.getCurrentUser()?.profile?.notifications || [];
    const unreadNotifications = notifications.filter(v => !v.read);
    return unreadNotifications.length;
  },
});

Template.notifications.events({
  'click .notifications-drawer-toggle'() {
    toggleNotificationsDrawer();
  },
});

export function toggleNotificationsDrawer() {
  Session.set(
    'showNotificationsDrawer',
    !Session.get('showNotificationsDrawer'),
  );
}
