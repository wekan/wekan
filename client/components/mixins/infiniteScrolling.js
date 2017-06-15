const peakAnticipation = 200;

Mixins.InfiniteScrolling = BlazeComponent.extendComponent({
  onCreated() {
    this._nextPeak = Infinity;
  },

  setNextPeak(v) {
    this._nextPeak = v;
  },

  getNextPeak() {
    return this._nextPeak;
  },

  resetNextPeak() {
    this._nextPeak = Infinity;
  },

  events() {
    return [{
      scroll(evt) {
        const domElement = evt.currentTarget;
        let altitude = domElement.scrollTop + domElement.offsetHeight;
        altitude += peakAnticipation;
        if (altitude >= this.callFirstWith(null, 'getNextPeak')) {
          this.mixinParent().callFirstWith(null, 'reachNextPeak');
        }
      },
    }];
  },
});
