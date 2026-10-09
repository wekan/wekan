const _ = require('../../lib/utils/under-dash.js');

const ColumnSum = (module.exports = function(columns) {
  this.columns = columns;
  this.sums = [];
  this.count = 0;
  _.each(this.columns, column => {
    this.sums[column] = 0;
  });
});

ColumnSum.prototype = {
  add(row) {
    _.each(this.columns, column => {
      this.sums[column] += row.getCell(column).value;
    });
    this.count++;
  },

  toString() {
    return this.sums.join(', ');
  },
  toAverages() {
    return this.sum
      .map(value => (value ? value / this.count : value))
      .join(', ');
  },
};
