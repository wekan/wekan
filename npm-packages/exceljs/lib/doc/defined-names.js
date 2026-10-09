'use strict';

const _ = require('../utils/under-dash');
const colCache = require('../utils/col-cache');
const CellMatrix = require('../utils/cell-matrix');
const Range = require('./range');

const rangeRegexp = /[$](\w+)[$](\d+)(:[$](\w+)[$](\d+))?/;

class DefinedNames {
  constructor() {
    this.matrixMap = {};
  }

  getMatrix(name) {
    const matrix = this.matrixMap[name] || (this.matrixMap[name] = new CellMatrix());
    return matrix;
  }

  // add a name to a cell. locStr in the form SheetName!$col$row or SheetName!$c1$r1:$c2:$r2
  add(locStr, name) {
    const location = colCache.decodeEx(locStr);
    this.addEx(location, name);
  }

  addEx(location, name) {
    const matrix = this.getMatrix(name);
    if (location.top) {
      for (let col = location.left; col <= location.right; col++) {
        for (let row = location.top; row <= location.bottom; row++) {
          const address = {
            sheetName: location.sheetName,
            address: colCache.n2l(col) + row,
            row,
            col,
          };

          matrix.addCellEx(address);
        }
      }
    } else {
      matrix.addCellEx(location);
    }
  }

  remove(locStr, name) {
    const location = colCache.decodeEx(locStr);
    this.removeEx(location, name);
  }

  removeEx(location, name) {
    const matrix = this.getMatrix(name);
    matrix.removeCellEx(location);
  }

  removeAllNames(location) {
    _.each(this.matrixMap, matrix => {
      matrix.removeCellEx(location);
    });
  }

  forEach(callback) {
    _.each(this.matrixMap, (matrix, name) => {
      matrix.forEach(cell => {
        callback(name, cell);
      });
    });
  }

  // get all the names of a cell
  getNames(addressStr) {
    return this.getNamesEx(colCache.decodeEx(addressStr));
  }

  getNamesEx(address) {
    return _.map(this.matrixMap, (matrix, name) => matrix.findCellEx(address) && name).filter(
      Boolean
    );
  }

  _explore(matrix, cell) {
    cell.mark = false;
    const {sheetName} = cell;

    const range = new Range(cell.row, cell.col, cell.row, cell.col, sheetName);
    let x;
    let y;

    // grow vertical - only one col to worry about
    function vGrow(yy, edge) {
      const c = matrix.findCellAt(sheetName, yy, cell.col);
      if (!c || !c.mark) {
        return false;
      }
      range[edge] = yy;
      c.mark = false;
      return true;
    }
    for (y = cell.row - 1; vGrow(y, 'top'); y--);
    for (y = cell.row + 1; vGrow(y, 'bottom'); y++);

    // grow horizontal - ensure all rows can grow
    function hGrow(xx, edge) {
      const cells = [];
      for (y = range.top; y <= range.bottom; y++) {
        const c = matrix.findCellAt(sheetName, y, xx);
        if (c && c.mark) {
          cells.push(c);
        } else {
          return false;
        }
      }
      range[edge] = xx;
      for (let i = 0; i < cells.length; i++) {
        cells[i].mark = false;
      }
      return true;
    }
    for (x = cell.col - 1; hGrow(x, 'left'); x--);
    for (x = cell.col + 1; hGrow(x, 'right'); x++);

    return range;
  }

  getRanges(name, matrix) {
    matrix = matrix || this.matrixMap[name];

    if (!matrix) {
      return {name, ranges: []};
    }

    // mark and sweep!
    matrix.forEach(cell => {
      cell.mark = true;
    });
    const ranges = matrix
      .map(cell => cell.mark && this._explore(matrix, cell))
      .filter(Boolean)
      .map(range => range.$shortRange);

    return {
      name,
      ranges,
    };
  }

  normaliseMatrix(matrix, sheetName) {
    // some of the cells might have shifted on specified sheet
    // need to reassign rows, cols
    matrix.forEachInSheet(sheetName, (cell, row, col) => {
      if (cell) {
        if (cell.row !== row || cell.col !== col) {
          cell.row = row;
          cell.col = col;
          cell.address = colCache.n2l(col) + row;
        }
      }
    });
  }

  spliceRows(sheetName, start, numDelete, numInsert) {
    _.each(this.matrixMap, matrix => {
      matrix.spliceRows(sheetName, start, numDelete, numInsert);
      this.normaliseMatrix(matrix, sheetName);
    });
  }

  spliceColumns(sheetName, start, numDelete, numInsert) {
    _.each(this.matrixMap, matrix => {
      matrix.spliceColumns(sheetName, start, numDelete, numInsert);
      this.normaliseMatrix(matrix, sheetName);
    });
  }

  get model() {
    // To get names per cell - just iterate over all names finding cells if they exist
    return _.map(this.matrixMap, (matrix, name) => this.getRanges(name, matrix)).filter(
      definedName => definedName.ranges.length
    );
  }

  set model(value) {
    // value is [ { name, ranges }, ... ]
    const matrixMap = (this.matrixMap = {});
    value.forEach(definedName => {
      const matrix = (matrixMap[definedName.name] = new CellMatrix());
      definedName.ranges.forEach(rangeStr => {
        if (rangeRegexp.test(rangeStr.split('!').pop() || '')) {
          matrix.addCell(rangeStr);
        }
      });
    });
  }
}

module.exports = DefinedNames;
