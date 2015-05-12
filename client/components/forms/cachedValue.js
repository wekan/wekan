var emptyValue = '';

Mixins.CachedValue = BlazeComponent.extendComponent({
  onCreated: function() {
    this._cachedValue = emptyValue;
  },

  setCache: function(value) {
    this._cachedValue = value;
  },

  getCache: function(defaultValue) {
    if (this._cachedValue === emptyValue)
      return defaultValue || '';
    else
      return this._cachedValue;
  },

  resetCache: function() {
    this.setCache('');
  }
});
