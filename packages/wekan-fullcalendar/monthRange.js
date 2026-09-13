'use strict';

// Custom calendar months do not always span a whole Gregorian month. The
// built-in day-grid profile aligns weeks only when the inferred Gregorian
// range unit is month/year. Align these grids for every actual month length.
function monthRangeProfile(Base, addWeeks) {
  return class extends Base {
    buildRenderRange(currentRange, currentRangeUnit, isRangeAllDay) {
      const range = super.buildRenderRange(currentRange, currentRangeUnit, isRangeAllDay);
      const start = this.props.dateEnv.startOfWeek(range.start);
      const endOfWeek = this.props.dateEnv.startOfWeek(range.end);
      const end = endOfWeek.valueOf() === range.end.valueOf()
        ? endOfWeek : addWeeks(endOfWeek, 1);
      return { start, end };
    }
  };
}

module.exports = { monthRangeProfile };
