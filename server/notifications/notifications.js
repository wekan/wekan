// a map of notification service, like email, web, IM, qq, etc.

// serviceName -> callback(user, title, description, params)
// expected arguments to callback:
// - user: Meteor user object
// - title: String, TAPi18n key
// - description, String, TAPi18n key
// - params: Object, values extracted from context, to used for above two TAPi18n keys
//   see example call to Notifications.notify() in models/activities.js
const notifyServices = {};

Notifications = {
  subscribe: (serviceName, callback) => {
    notifyServices[serviceName] = callback;
  },

  unsubscribe: (serviceName) => {
    if (typeof notifyServices[serviceName] === 'function')
      delete notifyServices[serviceName];
  },

  // filter recipients according to user settings for notification
  getUsers: (watchers) => {
    const users = [];
    watchers.forEach((userId) => {
      const user = Users.findOne(userId);
      if (user) users.push(user);
    });
    return users;
  },

  notify: (user, title, description, params) => {
    for(const k in notifyServices) {
      const notifyImpl = notifyServices[k];
      if (notifyImpl && typeof notifyImpl === 'function') notifyImpl(user, title, description, params);
    }
  },
};
