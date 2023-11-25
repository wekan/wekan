import { ReactiveCache } from '/imports/reactiveCache';

Template.notification.events({
  'click .read-status .materialCheckBox'() {
    const update = {};
    update[`profile.notifications.${this.index}.read`] = this.read
      ? null
      : Date.now();
    Users.update(Meteor.userId(), { $set: update });
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
});
