import bindEnvironment from './meteor/bindEnvironment';
import Tracker from './meteor/tracker';
import ReactiveCache from './ReactiveCache';

export default class DataCache {
  constructor(getData, options) {
    this.options = {
      timeout: 60 * 1000, // 60 seconds
      ...(typeof options === 'function' ? { compare: options } : options),
    };

    this.getData = getData;
    this.cache = new ReactiveCache(this.options.compare, () => false);
    this.timeouts = {};
    this.computations = {};
  }

  ensureComputation(key) {
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
      delete this.timeouts[key];
    }
    if (this.computations[key] && !this.computations[key].stopped) return;
    this.computations[key] = Tracker.nonreactive(() => Tracker.autorun(() => {
      this.cache.set(key, this.getData(key));
    }));

    // stop the computation if the key doesn't have any dependants
    this.computations[key].onInvalidate(() => this.checkStop(key));
  }

  checkStop(key) {
    if (this.cache.ensureDependency(key).hasDependents()) return;
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
      delete this.timeouts[key];
    }
    this.timeouts[key] = setTimeout(bindEnvironment(() => {
      if (!this.computations[key]) return;
      this.computations[key].stop();
      delete this.computations[key];
      this.cache.del(key);
    }), this.options.timeout);
  }

  get(key) {
    if (!Tracker.currentComputation) {
      let data = this.cache.get(key);
      if (data == null) {
        data = this.getData(key);
        this.cache.set(key, data);
        this.checkStop(key);
      }
      return data;
    }
    this.ensureComputation(key);
    const data = this.cache.get(key);
    Tracker.currentComputation.onStop(() => this.checkStop(key));
    return data;
  }
}
