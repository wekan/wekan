// a map of notification service, like email, web, IM, qq, etc.
import { ReactiveCache } from '/imports/reactiveCache';

// serviceName -> callback(user, title, description, params)
// expected arguments to callback:
// - user: Meteor user object
// - title: String, TAPi18n key
// - description, String, TAPi18n key
// - params: Object, values extracted from context, to used for above two TAPi18n keys
//   see example call to Notifications.notify() in models/activities.js
const notifyServices = {};

export const Notifications = {
  subscribe: (serviceName, callback) => {
    notifyServices[serviceName] = callback;
  },

  unsubscribe: serviceName => {
    if (typeof notifyServices[serviceName] === 'function')
      delete notifyServices[serviceName];
  },

  getUsers: async watchers => {
    const users = [];
    for (const userId of watchers) {
      const user = await ReactiveCache.getUser(userId);
      if (user && user._id) users.push(user);
    }
    return users;
  },

  // Internal recovery callers need failures and must wait for every started
  // subscriber before advancing. Resolution confirms subscriber completion,
  // not SMTP/webhook delivery or an operation's durable receipt.
  notifyAndWait: async (user, title, description, params) => {
    if (!user || typeof user._id !== 'string' || !user._id ||
        typeof params?.activityId !== 'string' || !params.activityId) {
      throw new Error('notification-delivery-identity-required');
    }
    const services = Object.entries(notifyServices).filter(([, callback]) => typeof callback === 'function');
    if (!services.length) throw new Error('notification-services-unavailable');
    const results = await Promise.allSettled(services.map(([, callback]) =>
      Promise.resolve().then(() => callback(user, title, description, params))));
    const failures = results.flatMap((result, index) => result.status === 'rejected'
      ? [{ service: services[index][0], error: result.reason }] : []);
    if (failures.length) {
      const error = new AggregateError(failures.map(failure => failure.error), 'notification-delivery-incomplete');
      error.services = failures.map(failure => failure.service);
      throw error;
    }
    return services.map(([name]) => name);
  },

  notify: (user, title, description, params) => {
    // Skip if user is invalid
    if (!user || !user._id) return;

    for (const k in notifyServices) {
      const notifyImpl = notifyServices[k];
      if (notifyImpl && typeof notifyImpl === 'function') {
        try {
          Promise.resolve(
            notifyImpl(user, title, description, params),
          ).catch(error => {
            console.error(`Notification service "${k}" failed:`, error);
          });
        } catch (error) {
          console.error(`Notification service "${k}" failed:`, error);
        }
      }
    }
  },
};
