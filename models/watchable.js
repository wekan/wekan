// XXX defined two types of watchable here, will keep only one of them in final decision

//   While processing files with ecmascript (for target web.browser):
//   models/watchable.js:5:7: models/watchable.js: Unexpected token (5:7)

/*
// XXX: a simple version, only toggle watch / unwatch
export SimpleWatchable = (collection) => {
  collection.attachSchema({
    watchers: {
      type: [String],
      optional: true,
    },
  });

  collection.helpers({
    watcherIndex(userId) {
      return this.watchers.indexOf(userId);
    },

    findWatcher(userId) {
      return _.contains(this.watchers, userId);
    },
  });
  
  collection.mutations({
    setWatcher(userId, level) {
      // if level undefined or null or false, then remove
      if (!level) return { $pull: { watchers: userId }};
      return { $addToSet: { watchers: userId }};
    },
  });
};

// XXX: a more complex version of same interface, with 4 watching levels
export ComplexWatchable = (collection) => {
  collection.attachSchema({
    'watchers.$.userId': {
      type: String,
    },
    'watchers.$.level': {
      type: String,
      allowedValues: ['watching', 'tracking', 'normal', 'muted'],
    },
  });

  collection.helpers({
    watcherIndex(userId) {
      return _.pluck(this.watchers, 'userId').indexOf(userId);
    },

    findWatcher(userId) {
      return _.findWhere(this.watchers, { userId });
    },
  });
  
  collection.mutations({
    setWatcher(userId, level) {
      // if level undefined or null or false, then remove
      if (!level) return { $pull: { watchers: { userId }}};
      const index = this.watcherIndex(userId);
      if (index<0) return { $push: { watchers: { userId, level }}};
      return { 
        $set: {
          [`watchers.${index}.level`]: level,
        },
      };
    },
  });
};

*/