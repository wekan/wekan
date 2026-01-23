// simple version, only toggle watch / unwatch
const simpleWatchable = collection => {
  collection.attachSchema({
    watchers: {
      type: [String],
      optional: true,
    },
  });

  collection.helpers({
    getWatchLevels() {
      return [true, false];
    },

    watcherIndex(userId) {
      return this.watchers.indexOf(userId);
    },

    findWatcher(userId) {
      return _.contains(this.watchers, userId);
    },

    async setWatcher(userId, level) {
      // if level undefined or null or false, then remove
      if (!level) {
        return await collection.updateAsync(this._id, { $pull: { watchers: userId } });
      }
      return await collection.updateAsync(this._id, { $addToSet: { watchers: userId } });
    },
  });
};

// more complex version of same interface, with 3 watching levels
const complexWatchOptions = ['watching', 'tracking', 'muted'];
const complexWatchDefault = 'muted';

const complexWatchable = collection => {
  collection.attachSchema({
    'watchers.$.userId': {
      type: String,
    },
    'watchers.$.level': {
      type: String,
      allowedValues: complexWatchOptions,
    },
  });

  collection.helpers({
    getWatchOptions() {
      return complexWatchOptions;
    },

    getWatchDefault() {
      return complexWatchDefault;
    },

    watcherIndex(userId) {
      return _.pluck(this.watchers, 'userId').indexOf(userId);
    },

    findWatcher(userId) {
      return _.findWhere(this.watchers, { userId });
    },

    getWatchLevel(userId) {
      const watcher = this.findWatcher(userId);
      return watcher ? watcher.level : complexWatchDefault;
    },

    async setWatcher(userId, level) {
      // if level undefined or null or false, then remove
      if (level === complexWatchDefault) level = null;
      if (!level) {
        return await collection.updateAsync(this._id, { $pull: { watchers: { userId } } });
      }
      const index = this.watcherIndex(userId);
      if (index < 0) {
        return await collection.updateAsync(this._id, { $push: { watchers: { userId, level } } });
      }
      return await collection.updateAsync(this._id, {
        $set: { [`watchers.${index}.level`]: level },
      });
    },
  });
};

complexWatchable(Boards);
simpleWatchable(Lists);
simpleWatchable(Cards);
