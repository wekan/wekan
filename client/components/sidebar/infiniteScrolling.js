var peakAnticipation = 200;

Mixins.InfiniteScrolling = BlazeComponent.extendComponent({
  onCreated: function() {
    this._nextPeak = Infinity;
  },

  setNextPeak: function(v) {
    this._nextPeak = v;
  },

  getNextPeak: function() {
    return this._nextPeak;
  },

  resetNextPeak: function() {
    this._nextPeak = Infinity;
  },

  // To be overwritten by consumers of this mixin
  reachNextPeak: function() {

  },

  events: function() {
    return [{
      scroll: function(evt) {
        var domElement = evt.currentTarget;
        var altitude = domElement.scrollTop + domElement.offsetHeight;
        altitude += peakAnticipation;
        if (altitude >= this.callFirstWith(null, 'getNextPeak')) {
          this.callFirstWith(null, 'reachNextPeak');
        }
      }
    }];
  }
});
