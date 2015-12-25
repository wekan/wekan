// eventName -> callback(context)
const _ncEvents = {};

// sender service, like email, web, IM, qq, etc.
// senderName -> callback(user, subject, text)
const _ncSenders = {};

Notifications = {
  on: (eventName, callback) => {
    _ncEvents[eventName] = callback;
  },
  off: (eventName) => {
    if (typeof _ncEvents[eventName] === 'function')
      delete _ncEvents[eventName];
  },
  events: (maps) => {
    for(const k in maps) {
      const func = maps[k];
      if (typeof func === 'function') _ncEvents[k] = func;
    }
  },

  addSender: (senderName, callback) => {
    _ncSenders[senderName] = callback;
  },
  removeSender: (senderName) => {
    if (typeof _ncSenders[senderName] === 'function')
      delete _ncSenders[senderName];
  },
  senders: (maps) => {
    for(const k in maps) {
      const func = maps[k];
      if (typeof func === 'function') _ncSenders[k] = func;
    }
  },

  // filter recipients according to user settings for notification
  getUsers: (participants, watchers) => {
    const userIds = [];
    const users = [];
    participants.forEach((userId) => {
      if (_.contains(userIds, userId)) return;
      const user = Users.findOne(userId);
      if (user && user.hasTag('notify-participate')) {
        userIds.push(userId);
        users.push(user);
      }
    });
    watchers.forEach((userId) => {
      if (_.contains(userIds, userId)) return;
      const user = Users.findOne(userId);
      if (user && user.hasTag('notify-watch')) {
        userIds.push(userId);
        users.push(user);
      }
    });
    return users;
  },

  send: (user, subject, text) => {
    for(const k in _ncSenders) {
      const sendImpl = _ncSenders[k];
      if (sendImpl && typeof sendImpl === 'function') sendImpl(user, subject, text);
    }
  },

  process: (eventKey, context) => {
    const func = _ncEvents[eventKey];
    if (func && typeof func === 'function') {
      func(context);
    }
  },
};
