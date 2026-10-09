const HrStopwatch = (module.exports = function() {
  this.total = 0;
});

HrStopwatch.prototype = {
  start() {
    this.hrStart = process.hrtime();
  },

  stop() {
    if (this.hrStart) {
      this.total += this._span;
      delete this.hrStart;
    }
  },

  reset() {
    this.total = 0;
    delete this.hrStart;
  },

  get span() {
    if (this.hrStart) {
      return this.total + this._span;
    }
    return this.total;
  },

  get _span() {
    const hrNow = process.hrtime();
    const start = this.hrStart[0] + (this.hrStart[1] / 1e9);
    const finish = hrNow[0] + (hrNow[1] / 1e9);
    return finish - start;
  },

  toString(format) {
    switch (format) {
      case 'ms':
        return `${this.ms}ms`;
      case 'microseconds':
        return `${this.microseconds}\xB5s`;
      default:
        return `${this.span} seconds`;
    }
  },
  get ms() {
    return Math.round(this.span * 1000);
  },
  get microseconds() {
    return Math.round(this.span * 1000000);
  },
};
