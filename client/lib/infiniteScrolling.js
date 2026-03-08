const PEAK_ANTICIPATION = 200;

/**
 * Infinite scrolling utility to replace the BlazeComponent mixin.
 *
 * Usage in a Template:
 *   Template.myTemplate.onCreated(function () {
 *     this.infiniteScrolling = new InfiniteScrolling();
 *   });
 *
 * The scroll event must be wired in Template.events:
 *   'scroll .my-container'(event, tpl) {
 *     tpl.infiniteScrolling.checkScrollPosition(event.currentTarget, () => {
 *       tpl.loadNextPage();
 *     });
 *   },
 *
 * Or for components that delegate to a child for loading:
 *   tpl.infiniteScrolling.checkScrollPosition(event.currentTarget, () => {
 *     activitiesComponent.loadNextPage();
 *   });
 */
export class InfiniteScrolling {
  constructor() {
    this._nextPeak = Infinity;
  }

  setNextPeak(v) {
    this._nextPeak = v;
  }

  getNextPeak() {
    return this._nextPeak;
  }

  resetNextPeak() {
    this._nextPeak = Infinity;
  }

  checkScrollPosition(domElement, reachNextPeakCallback) {
    let altitude = domElement.scrollTop + domElement.offsetHeight;
    altitude += PEAK_ANTICIPATION;
    if (altitude >= this._nextPeak) {
      reachNextPeakCallback();
    }
  }
}
