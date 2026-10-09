/* eslint-disable max-classes-per-file */
const colCache = require('../utils/col-cache');
const _ = require('../utils/under-dash');
const Enums = require('./enums');
const {slideFormula} = require('../utils/shared-formula');
const Note = require('./note');
// Cell requirements
//  Operate inside a worksheet
//  Store and retrieve a value with a range of types: text, number, date, hyperlink, reference, formula, etc.
//  Manage/use and manipulate cell format either as local to cell or inherited from column or row.

class Cell {
  constructor(row, column, address) {
    if (!row || !column) {
      throw new Error('A Cell needs a Row');
    }

    this._row = row;
    this._column = column;

    colCache.validateAddress(address);
    this._address = address;

    // TODO: lazy evaluation of this._value
    this._value = Value.create(Cell.Types.Null, this);

    this.style = this._mergeStyle(row.style, column.style, {});

    this._mergeCount = 0;
  }

  get worksheet() {
    return this._row.worksheet;
  }

  get workbook() {
    return this._row.worksheet.workbook;
  }

  // help GC by removing cyclic (and other) references
  destroy() {
    delete this.style;
    delete this._value;
    delete this._row;
    delete this._column;
    delete this._address;
  }

  // =========================================================================
  // Styles stuff
  get numFmt() {
    return this.style.numFmt;
  }

  set numFmt(value) {
    this.style.numFmt = value;
  }

  get font() {
    return this.style.font;
  }

  set font(value) {
    this.style.font = value;
  }

  get alignment() {
    return this.style.alignment;
  }

  set alignment(value) {
    this.style.alignment = value;
  }

  get border() {
    return this.style.border;
  }

  set border(value) {
    this.style.border = value;
  }

  get fill() {
    return this.style.fill;
  }

  set fill(value) {
    this.style.fill = value;
  }

  get protection() {
    return this.style.protection;
  }

  set protection(value) {
    this.style.protection = value;
  }

  _mergeStyle(rowStyle, colStyle, style) {
    const numFmt = (rowStyle && rowStyle.numFmt) || (colStyle && colStyle.numFmt);
    if (numFmt) style.numFmt = numFmt;

    const font = (rowStyle && rowStyle.font) || (colStyle && colStyle.font);
    if (font) style.font = font;

    const alignment = (rowStyle && rowStyle.alignment) || (colStyle && colStyle.alignment);
    if (alignment) style.alignment = alignment;

    const border = (rowStyle && rowStyle.border) || (colStyle && colStyle.border);
    if (border) style.border = border;

    const fill = (rowStyle && rowStyle.fill) || (colStyle && colStyle.fill);
    if (fill) style.fill = fill;

    const protection = (rowStyle && rowStyle.protection) || (colStyle && colStyle.protection);
    if (protection) style.protection = protection;

    return style;
  }

  // =========================================================================
  // return the address for this cell
  get address() {
    return this._address;
  }

  get row() {
    return this._row.number;
  }

  get col() {
    return this._column.number;
  }

  get $col$row() {
    return `$${this._column.letter}$${this.row}`;
  }

  // =========================================================================
  // Value stuff

  get type() {
    return this._value.type;
  }

  get effectiveType() {
    return this._value.effectiveType;
  }

  toCsvString() {
    return this._value.toCsvString();
  }

  // =========================================================================
  // Merge stuff

  addMergeRef() {
    this._mergeCount++;
  }

  releaseMergeRef() {
    this._mergeCount--;
  }

  get isMerged() {
    return this._mergeCount > 0 || this.type === Cell.Types.Merge;
  }

  merge(master, ignoreStyle) {
    this._value.release();
    this._value = Value.create(Cell.Types.Merge, this, master);
    if (!ignoreStyle) {
      this.style = master.style;
    }
  }

  unmerge() {
    if (this.type === Cell.Types.Merge) {
      this._value.release();
      this._value = Value.create(Cell.Types.Null, this);
      this.style = this._mergeStyle(this._row.style, this._column.style, {});
    }
  }

  isMergedTo(master) {
    if (this._value.type !== Cell.Types.Merge) return false;
    return this._value.isMergedTo(master);
  }

  get master() {
    if (this.type === Cell.Types.Merge) {
      return this._value.master;
    }
    return this; // an unmerged cell is its own master
  }

  get isHyperlink() {
    return this._value.type === Cell.Types.Hyperlink;
  }

  get hyperlink() {
    return this._value.hyperlink;
  }

  // return the value
  get value() {
    return this._value.value;
  }

  // set the value - can be number, string or raw
  set value(v) {
    // special case - merge cells set their master's value
    if (this.type === Cell.Types.Merge) {
      this._value.master.value = v;
      return;
    }

    this._value.release();

    // assign value
    this._value = Value.create(Value.getType(v), this, v);
  }

  get note() {
    return this._comment && this._comment.note;
  }

  set note(note) {
    this._comment = new Note(note);
  }

  get text() {
    return this._value.toString();
  }

  get html() {
    return _.escapeHtml(this.text);
  }

  toString() {
    return this.text;
  }

  _upgradeToHyperlink(hyperlink) {
    // if this cell is a string, turn it into a Hyperlink
    if (this.type === Cell.Types.String) {
      this._value = Value.create(Cell.Types.Hyperlink, this, {
        text: this._value.value,
        hyperlink,
      });
    }
  }

  // =========================================================================
  // Formula stuff
  get formula() {
    return this._value.formula;
  }

  get result() {
    return this._value.result;
  }

  get formulaType() {
    return this._value.formulaType;
  }

  // =========================================================================
  // Name stuff
  get fullAddress() {
    const {worksheet} = this._row;
    return {
      sheetName: worksheet.name,
      address: this.address,
      row: this.row,
      col: this.col,
    };
  }

  get name() {
    return this.names[0];
  }

  set name(value) {
    this.names = [value];
  }

  get names() {
    return this.workbook.definedNames.getNamesEx(this.fullAddress);
  }

  set names(value) {
    const {definedNames} = this.workbook;
    definedNames.removeAllNames(this.fullAddress);
    value.forEach(name => {
      definedNames.addEx(this.fullAddress, name);
    });
  }

  addName(name) {
    this.workbook.definedNames.addEx(this.fullAddress, name);
  }

  removeName(name) {
    this.workbook.definedNames.removeEx(this.fullAddress, name);
  }

  removeAllNames() {
    this.workbook.definedNames.removeAllNames(this.fullAddress);
  }

  // =========================================================================
  // Data Validation stuff
  get _dataValidations() {
    return this.worksheet.dataValidations;
  }

  get dataValidation() {
    return this._dataValidations.find(this.address);
  }

  set dataValidation(value) {
    this._dataValidations.add(this.address, value);
  }

  // =========================================================================
  // Model stuff

  get model() {
    const {model} = this._value;
    model.style = this.style;
    if (this._comment) {
      model.comment = this._comment.model;
    }
    return model;
  }

  set model(value) {
    this._value.release();
    this._value = Value.create(value.type, this);
    this._value.model = value;

    if (value.comment) {
      switch (value.comment.type) {
        case 'note':
          this._comment = Note.fromModel(value.comment);
          break;
      }
    }

    if (value.style) {
      this.style = value.style;
    } else {
      this.style = {};
    }
  }
}
Cell.Types = Enums.ValueType;

// =============================================================================
// Internal Value Types

class NullValue {
  constructor(cell) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Null,
    };
  }

  get value() {
    return null;
  }

  set value(value) {
    // nothing to do
  }

  get type() {
    return Cell.Types.Null;
  }

  get effectiveType() {
    return Cell.Types.Null;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return '';
  }

  release() {}

  toString() {
    return '';
  }
}

class NumberValue {
  constructor(cell, value) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Number,
      value,
    };
  }

  get value() {
    return this.model.value;
  }

  set value(value) {
    this.model.value = value;
  }

  get type() {
    return Cell.Types.Number;
  }

  get effectiveType() {
    return Cell.Types.Number;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return this.model.value.toString();
  }

  release() {}

  toString() {
    return this.model.value.toString();
  }
}

class StringValue {
  constructor(cell, value) {
    this.model = {
      address: cell.address,
      type: Cell.Types.String,
      value,
    };
  }

  get value() {
    return this.model.value;
  }

  set value(value) {
    this.model.value = value;
  }

  get type() {
    return Cell.Types.String;
  }

  get effectiveType() {
    return Cell.Types.String;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return `"${this.model.value.replace(/"/g, '""')}"`;
  }

  release() {}

  toString() {
    return this.model.value;
  }
}

class RichTextValue {
  constructor(cell, value) {
    this.model = {
      address: cell.address,
      type: Cell.Types.String,
      value,
    };
  }

  get value() {
    return this.model.value;
  }

  set value(value) {
    this.model.value = value;
  }

  toString() {
    return this.model.value.richText.map(t => t.text).join('');
  }

  get type() {
    return Cell.Types.RichText;
  }

  get effectiveType() {
    return Cell.Types.RichText;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return `"${this.text.replace(/"/g, '""')}"`;
  }

  release() {}
}

class DateValue {
  constructor(cell, value) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Date,
      value,
    };
  }

  get value() {
    return this.model.value;
  }

  set value(value) {
    this.model.value = value;
  }

  get type() {
    return Cell.Types.Date;
  }

  get effectiveType() {
    return Cell.Types.Date;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return this.model.value.toISOString();
  }

  release() {}

  toString() {
    return this.model.value.toString();
  }
}

class HyperlinkValue {
  constructor(cell, value) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Hyperlink,
      text: value ? value.text : undefined,
      hyperlink: value ? value.hyperlink : undefined,
    };
    if (value && value.tooltip) {
      this.model.tooltip = value.tooltip;
    }
  }

  get value() {
    const v = {
      text: this.model.text,
      hyperlink: this.model.hyperlink,
    };
    if (this.model.tooltip) {
      v.tooltip = this.model.tooltip;
    }
    return v;
  }

  set value(value) {
    this.model = {
      text: value.text,
      hyperlink: value.hyperlink,
    };
    if (value.tooltip) {
      this.model.tooltip = value.tooltip;
    }
  }

  get text() {
    return this.model.text;
  }

  set text(value) {
    this.model.text = value;
  }

  /*
  get tooltip() {
    return this.model.tooltip;
  }

  set tooltip(value) {
    this.model.tooltip = value;
  } */

  get hyperlink() {
    return this.model.hyperlink;
  }

  set hyperlink(value) {
    this.model.hyperlink = value;
  }

  get type() {
    return Cell.Types.Hyperlink;
  }

  get effectiveType() {
    return Cell.Types.Hyperlink;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return this.model.hyperlink;
  }

  release() {}

  toString() {
    return this.model.text;
  }
}

class MergeValue {
  constructor(cell, master) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Merge,
      master: master ? master.address : undefined,
    };
    this._master = master;
    if (master) {
      master.addMergeRef();
    }
  }

  get value() {
    return this._master.value;
  }

  set value(value) {
    if (value instanceof Cell) {
      if (this._master) {
        this._master.releaseMergeRef();
      }
      value.addMergeRef();
      this._master = value;
    } else {
      this._master.value = value;
    }
  }

  isMergedTo(master) {
    return master === this._master;
  }

  get master() {
    return this._master;
  }

  get type() {
    return Cell.Types.Merge;
  }

  get effectiveType() {
    return this._master.effectiveType;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return '';
  }

  release() {
    this._master.releaseMergeRef();
  }

  toString() {
    return this.value.toString();
  }
}

class FormulaValue {
  constructor(cell, value) {
    this.cell = cell;

    this.model = {
      address: cell.address,
      type: Cell.Types.Formula,
      shareType: value ? value.shareType : undefined,
      ref: value ? value.ref : undefined,
      formula: value ? value.formula : undefined,
      sharedFormula: value ? value.sharedFormula : undefined,
      result: value ? value.result : undefined,
    };
  }

  _copyModel(model) {
    const copy = {};
    const cp = name => {
      const value = model[name];
      if (value) {
        copy[name] = value;
      }
    };
    cp('formula');
    cp('result');
    cp('ref');
    cp('shareType');
    cp('sharedFormula');
    return copy;
  }

  get value() {
    return this._copyModel(this.model);
  }

  set value(value) {
    this.model = this._copyModel(value);
  }

  validate(value) {
    switch (Value.getType(value)) {
      case Cell.Types.Null:
      case Cell.Types.String:
      case Cell.Types.Number:
      case Cell.Types.Date:
        break;
      case Cell.Types.Hyperlink:
      case Cell.Types.Formula:
      default:
        throw new Error('Cannot process that type of result value');
    }
  }

  get dependencies() {
    // find all the ranges and cells mentioned in the formula
    const ranges = this.formula.match(/([a-zA-Z0-9]+!)?[A-Z]{1,3}\d{1,4}:[A-Z]{1,3}\d{1,4}/g);
    const cells = this.formula
      .replace(/([a-zA-Z0-9]+!)?[A-Z]{1,3}\d{1,4}:[A-Z]{1,3}\d{1,4}/g, '')
      .match(/([a-zA-Z0-9]+!)?[A-Z]{1,3}\d{1,4}/g);
    return {
      ranges,
      cells,
    };
  }

  get formula() {
    return this.model.formula || this._getTranslatedFormula();
  }

  set formula(value) {
    this.model.formula = value;
  }

  get formulaType() {
    if (this.model.formula) {
      return Enums.FormulaType.Master;
    }
    if (this.model.sharedFormula) {
      return Enums.FormulaType.Shared;
    }
    return Enums.FormulaType.None;
  }

  get result() {
    return this.model.result;
  }

  set result(value) {
    this.model.result = value;
  }

  get type() {
    return Cell.Types.Formula;
  }

  get effectiveType() {
    const v = this.model.result;
    if (v === null || v === undefined) {
      return Enums.ValueType.Null;
    }
    if (v instanceof String || typeof v === 'string') {
      return Enums.ValueType.String;
    }
    if (typeof v === 'number') {
      return Enums.ValueType.Number;
    }
    if (v instanceof Date) {
      return Enums.ValueType.Date;
    }
    if (v.text && v.hyperlink) {
      return Enums.ValueType.Hyperlink;
    }
    if (v.formula) {
      return Enums.ValueType.Formula;
    }

    return Enums.ValueType.Null;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  _getTranslatedFormula() {
    if (!this._translatedFormula && this.model.sharedFormula) {
      const {worksheet} = this.cell;
      const master = worksheet.findCell(this.model.sharedFormula);
      this._translatedFormula =
        master && slideFormula(master.formula, master.address, this.model.address);
    }
    return this._translatedFormula;
  }

  toCsvString() {
    return `${this.model.result || ''}`;
  }

  release() {}

  toString() {
    return this.model.result ? this.model.result.toString() : '';
  }
}

class SharedStringValue {
  constructor(cell, value) {
    this.model = {
      address: cell.address,
      type: Cell.Types.SharedString,
      value,
    };
  }

  get value() {
    return this.model.value;
  }

  set value(value) {
    this.model.value = value;
  }

  get type() {
    return Cell.Types.SharedString;
  }

  get effectiveType() {
    return Cell.Types.SharedString;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return this.model.value.toString();
  }

  release() {}

  toString() {
    return this.model.value.toString();
  }
}

class BooleanValue {
  constructor(cell, value) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Boolean,
      value,
    };
  }

  get value() {
    return this.model.value;
  }

  set value(value) {
    this.model.value = value;
  }

  get type() {
    return Cell.Types.Boolean;
  }

  get effectiveType() {
    return Cell.Types.Boolean;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return this.model.value ? 1 : 0;
  }

  release() {}

  toString() {
    return this.model.value.toString();
  }
}

class ErrorValue {
  constructor(cell, value) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Error,
      value,
    };
  }

  get value() {
    return this.model.value;
  }

  set value(value) {
    this.model.value = value;
  }

  get type() {
    return Cell.Types.Error;
  }

  get effectiveType() {
    return Cell.Types.Error;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return this.toString();
  }

  release() {}

  toString() {
    return this.model.value.error.toString();
  }
}

class JSONValue {
  constructor(cell, value) {
    this.model = {
      address: cell.address,
      type: Cell.Types.String,
      value: JSON.stringify(value),
      rawValue: value,
    };
  }

  get value() {
    return this.model.rawValue;
  }

  set value(value) {
    this.model.rawValue = value;
    this.model.value = JSON.stringify(value);
  }

  get type() {
    return Cell.Types.String;
  }

  get effectiveType() {
    return Cell.Types.String;
  }

  get address() {
    return this.model.address;
  }

  set address(value) {
    this.model.address = value;
  }

  toCsvString() {
    return this.model.value;
  }

  release() {}

  toString() {
    return this.model.value;
  }
}

// Value is a place to hold common static Value type functions
const Value = {
  getType(value) {
    if (value === null || value === undefined) {
      return Cell.Types.Null;
    }
    if (value instanceof String || typeof value === 'string') {
      return Cell.Types.String;
    }
    if (typeof value === 'number') {
      return Cell.Types.Number;
    }
    if (typeof value === 'boolean') {
      return Cell.Types.Boolean;
    }
    if (value instanceof Date) {
      return Cell.Types.Date;
    }
    if (value.text && value.hyperlink) {
      return Cell.Types.Hyperlink;
    }
    if (value.formula || value.sharedFormula) {
      return Cell.Types.Formula;
    }
    if (value.richText) {
      return Cell.Types.RichText;
    }
    if (value.sharedString) {
      return Cell.Types.SharedString;
    }
    if (value.error) {
      return Cell.Types.Error;
    }
    return Cell.Types.JSON;
  },

  // map valueType to constructor
  types: [
    {t: Cell.Types.Null, f: NullValue},
    {t: Cell.Types.Number, f: NumberValue},
    {t: Cell.Types.String, f: StringValue},
    {t: Cell.Types.Date, f: DateValue},
    {t: Cell.Types.Hyperlink, f: HyperlinkValue},
    {t: Cell.Types.Formula, f: FormulaValue},
    {t: Cell.Types.Merge, f: MergeValue},
    {t: Cell.Types.JSON, f: JSONValue},
    {t: Cell.Types.SharedString, f: SharedStringValue},
    {t: Cell.Types.RichText, f: RichTextValue},
    {t: Cell.Types.Boolean, f: BooleanValue},
    {t: Cell.Types.Error, f: ErrorValue},
  ].reduce((p, t) => {
    p[t.t] = t.f;
    return p;
  }, []),

  create(type, cell, value) {
    const T = this.types[type];
    if (!T) {
      throw new Error(`Could not create Value of type ${type}`);
    }
    return new T(cell, value);
  },
};

module.exports = Cell;
