import { ReactiveCache } from '/imports/reactiveCache';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';

Template.notification.events({
  'click .read-status .materialCheckBox'() {
    const update = {};
    const newReadValue = this.read ? null : Date.now();
    update[`profile.notifications.${this.index}.read`] = newReadValue;

    Users.update(Meteor.userId(), { $set: update }, (error, result) => {
      if (error) {
        console.error('Error updating notification:', error);
      }
    });
  },
  'click .remove a'() {
    ReactiveCache.getCurrentUser().removeNotification(this.activityData._id);
  },
});

Template.notification.helpers({
  mode: 'board',
  isOfActivityType(activityId, type) {
    const activity = ReactiveCache.getActivity(activityId);
    return activity && activity.activityType === type;
  },
  activityType(activityId) {
    const activity = ReactiveCache.getActivity(activityId);
    return activity ? activity.activityType : '';
  },
  activityUser(activityId) {
    const activity = ReactiveCache.getActivity(activityId);
    return activity && activity.userId;
  },
  activityDate() {
    const activity = this.activityData;
    if (!activity || !activity.createdAt) return '';

    const user = ReactiveCache.getCurrentUser();
    if (!user) return '';

    const dateObj = new Date(activity.createdAt);
    if (Number.isNaN(dateObj.getTime())) return '';

    const dateFormat = user.getDateFormat ? user.getDateFormat() : 'YYYY-MM-DD';
    const datePart = formatDateByUserPreference(dateObj, dateFormat, false);
    const timePart = dateObj.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${datePart} ${timePart}`.trim();
  },
});
