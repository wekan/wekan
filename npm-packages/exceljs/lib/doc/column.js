'use strict';

const _ = require('../utils/under-dash');

const Enums = require('./enums');
const colCache = require('../utils/col-cache');

const DEFAULT_COLUMN_WIDTH = 9;

// Column defines the column properties for 1 column.
// This includes header rows, widths, key, (style), etc.
// Worksheet will condense the columns as appropriate during serialization
class Column {
  constructor(worksheet, number, defn) {
    this._worksheet = worksheet;
    this._number = number;
    if (defn !== false) {
      // sometimes defn will follow
      this.defn = defn;
    }
  }

  get number() {
    return this._number;
  }

  get worksheet() {
    return this._worksheet;
  }

  get letter() {
    return colCache.n2l(this._number);
  }

  get isCustomWidth() {
    return this.width !== undefined && this.width !== DEFAULT_COLUMN_WIDTH;
  }

  get defn() {
    return {
      header: this._header,
      key: this.key,
      width: this.width,
      style: this.style,
      hidden: this.hidden,
      outlineLevel: this.outlineLevel,
    };
  }

  set defn(value) {
    if (value) {
      this.key = value.key;
      this.width = value.width !== undefined ? value.width : DEFAULT_COLUMN_WIDTH;
      this.outlineLevel = value.outlineLevel;
      if (value.style) {
        this.style = value.style;
      } else {
        this.style = {};
      }

      // headers must be set after style
      this.header = value.header;
      this._hidden = !!value.hidden;
    } else {
      delete this._header;
      delete this._key;
      delete this.width;
      this.style = {};
      this.outlineLevel = 0;
    }
  }

  get headers() {
    return this._header && this._header instanceof Array ? this._header : [this._header];
  }

  get header() {
    return this._header;
  }

  set header(value) {
    if (value !== undefined) {
      this._header = value;
      this.headers.forEach((text, index) => {
        this._worksheet.getCell(index + 1, this.number).value = text;
      });
    } else {
      this._header = undefined;
    }
  }

  get key() {
    return this._key;
  }

  set key(value) {
    const column = this._key && this._worksheet.getColumnKey(this._key);
    if (column === this) {
      this._worksheet.deleteColumnKey(this._key);
    }

    this._key = value;
    if (value) {
      this._worksheet.setColumnKey(this._key, this);
    }
  }

  get hidden() {
    return !!this._hidden;
  }

  set hidden(value) {
    this._hidden = value;
  }

  get outlineLevel() {
    return this._outlineLevel || 0;
  }

  set outlineLevel(value) {
    this._outlineLevel = value;
  }

  get collapsed() {
    return !!(
      this._outlineLevel && this._outlineLevel >= this._worksheet.properties.outlineLevelCol
    );
  }

  toString() {
    return JSON.stringify({
      key: this.key,
      width: this.width,
      headers: this.headers.length ? this.headers : undefined,
    });
  }

  equivalentTo(other) {
    return (
      this.width === other.width &&
      this.hidden === other.hidden &&
      this.outlineLevel === other.outlineLevel &&
      _.isEqual(this.style, other.style)
    );
  }

  get isDefault() {
    if (this.isCustomWidth) {
      return false;
    }
    if (this.hidden) {
      return false;
    }
    if (this.outlineLevel) {
      return false;
    }
    const s = this.style;
    if (s && (s.font || s.numFmt || s.alignment || s.border || s.fill || s.protection)) {
      return false;
    }
    return true;
  }

  get headerCount() {
    return this.headers.length;
  }

  eachCell(options, iteratee) {
    const colNumber = this.number;
    if (!iteratee) {
      iteratee = options;
      options = null;
    }
    this._worksheet.eachRow(options, (row, rowNumber) => {
      iteratee(row.getCell(colNumber), rowNumber);
    });
  }

  get values() {
    const v = [];
    this.eachCell((cell, rowNumber) => {
      if (cell && cell.type !== Enums.ValueType.Null) {
        v[rowNumber] = cell.value;
      }
    });
    return v;
  }

  set values(v) {
    if (!v) {
      return;
    }
    const colNumber = this.number;
    let offset = 0;
    if (v.hasOwnProperty('0')) {
      // assume contiguous array, start at row 1
      offset = 1;
    }
    v.forEach((value, index) => {
      this._worksheet.getCell(index + offset, colNumber).value = value;
    });
  }

  // =========================================================================
  // styles
  _applyStyle(name, value) {
    this.style[name] = value;
    this.eachCell(cell => {
      cell[name] = value;
    });
    return value;
  }

  get numFmt() {
    return this.style.numFmt;
  }

  set numFmt(value) {
    this._applyStyle('numFmt', value);
  }

  get font() {
    return this.style.font;
  }

  set font(value) {
    this._applyStyle('font', value);
  }

  get alignment() {
    return this.style.alignment;
  }

  set alignment(value) {
    this._applyStyle('alignment', value);
  }

  get protection() {
    return this.style.protection;
  }

  set protection(value) {
    this._applyStyle('protection', value);
  }

  get border() {
    return this.style.border;
  }

  set border(value) {
    this._applyStyle('border', value);
  }

  get fill() {
    return this.style.fill;
  }

  set fill(value) {
    this._applyStyle('fill', value);
  }

  // =============================================================================
  // static functions

  static toModel(columns) {
    // Convert array of Column into compressed list cols
    const cols = [];
    let col = null;
    if (columns) {
      columns.forEach((column, index) => {
        if (column.isDefault) {
          if (col) {
            col = null;
          }
        } else if (!col || !column.equivalentTo(col)) {
          col = {
            min: index + 1,
            max: index + 1,
            width: column.width !== undefined ? column.width : DEFAULT_COLUMN_WIDTH,
            style: column.style,
            isCustomWidth: column.isCustomWidth,
            hidden: column.hidden,
            outlineLevel: column.outlineLevel,
            collapsed: column.collapsed,
          };
          cols.push(col);
        } else {
          col.max = index + 1;
        }
      });
    }
    return cols.length ? cols : undefined;
  }

  static fromModel(worksheet, cols) {
    cols = cols || [];
    const columns = [];
    let count = 1;
    let index = 0;
    /**
     * sort cols by min
     * If it is not sorted, the subsequent column configuration will be overwritten
     * */
    cols = cols.sort(function(pre, next)  {
      return pre.min - next.min;
    });
    while (index < cols.length) {
      const col = cols[index++];
      while (count < col.min) {
        columns.push(new Column(worksheet, count++));
      }
      while (count <= col.max) {
        columns.push(new Column(worksheet, count++, col));
      }
    }
    return columns.length ? columns : null;
  }
}

module.exports = Column;
