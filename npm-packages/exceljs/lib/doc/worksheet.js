const _ = require('../utils/under-dash');

const colCache = require('../utils/col-cache');
const Range = require('./range');
const Row = require('./row');
const Column = require('./column');
const Enums = require('./enums');
const Image = require('./image');
const Table = require('./table');
const DataValidations = require('./data-validations');
const {makePivotTable} = require('./pivot-table');
const Encryptor = require('../utils/encryptor');
const {copyStyle} = require('../utils/copy-style');

// Worksheet requirements
//  Operate as sheet inside workbook or standalone
//  Load and Save from file and stream
//  Access/Add/Delete individual cells
//  Manage column widths and row heights

class Worksheet {
  constructor(options) {
    options = options || {};
    this._workbook = options.workbook;

    // in a workbook, each sheet will have a number
    this.id = options.id;
    this.orderNo = options.orderNo;

    // and a name
    this.name = options.name;

    // add a state
    this.state = options.state || 'visible';

    // rows allows access organised by row. Sparse array of arrays indexed by row-1, col
    // Note: _rows is zero based. Must subtract 1 to go from cell.row to index
    this._rows = [];

    // column definitions
    this._columns = null;

    // column keys (addRow convenience): key ==> this._collumns index
    this._keys = {};

    // keep record of all merges
    this._merges = {};

    // record of all row and column pageBreaks
    this.rowBreaks = [];

    // for tabColor, default row height, outline levels, etc
    this.properties = Object.assign(
      {},
      {
        defaultRowHeight: 15,
        dyDescent: 55,
        outlineLevelCol: 0,
        outlineLevelRow: 0,
      },
      options.properties
    );

    // for all things printing
    this.pageSetup = Object.assign(
      {},
      {
        margins: {left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3},
        orientation: 'portrait',
        horizontalDpi: 4294967295,
        verticalDpi: 4294967295,
        fitToPage: !!(
          options.pageSetup &&
          (options.pageSetup.fitToWidth || options.pageSetup.fitToHeight) &&
          !options.pageSetup.scale
        ),
        pageOrder: 'downThenOver',
        blackAndWhite: false,
        draft: false,
        cellComments: 'None',
        errors: 'displayed',
        scale: 100,
        fitToWidth: 1,
        fitToHeight: 1,
        paperSize: undefined,
        showRowColHeaders: false,
        showGridLines: false,
        firstPageNumber: undefined,
        horizontalCentered: false,
        verticalCentered: false,
        rowBreaks: null,
        colBreaks: null,
      },
      options.pageSetup
    );

    this.headerFooter = Object.assign(
      {},
      {
        differentFirst: false,
        differentOddEven: false,
        oddHeader: null,
        oddFooter: null,
        evenHeader: null,
        evenFooter: null,
        firstHeader: null,
        firstFooter: null,
      },
      options.headerFooter
    );

    this.dataValidations = new DataValidations();

    // for freezepanes, split, zoom, gridlines, etc
    this.views = options.views || [];

    this.autoFilter = options.autoFilter || null;

    // for images, etc
    this._media = [];

    // worksheet protection
    this.sheetProtection = null;

    // for tables
    this.tables = {};

    this.pivotTables = [];

    this.conditionalFormattings = [];
  }

  get name() {
    return this._name;
  }

  set name(name) {
    if (name === undefined) {
      name = `sheet${this.id}`;
    }

    if (this._name === name) return;

    if (typeof name !== 'string') {
      throw new Error('The name has to be a string.');
    }

    if (name === '') {
      throw new Error('The name can\'t be empty.');
    }

    if (name === 'History') {
      throw new Error('The name "History" is protected. Please use a different name.');
    }

    // Illegal character in worksheet name: asterisk (*), question mark (?),
    // colon (:), forward slash (/ \), or bracket ([])
    if (/[*?:/\\[\]]/.test(name)) {
      throw new Error(`Worksheet name ${name} cannot include any of the following characters: * ? : \\ / [ ]`);
    }

    if (/(^')|('$)/.test(name)) {
      throw new Error(`The first or last character of worksheet name cannot be a single quotation mark: ${name}`);
    }

    if (name && name.length > 31) {
      // eslint-disable-next-line no-console
      console.warn(`Worksheet name ${name} exceeds 31 chars. This will be truncated`);
      name = name.substring(0, 31);
    }

    if (this._workbook._worksheets.find(ws => ws && ws.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Worksheet name already exists: ${name}`);
    }

    this._name = name;
  }

  get workbook() {
    return this._workbook;
  }

  // when you're done with this worksheet, call this to remove from workbook
  destroy() {
    this._workbook.removeWorksheetEx(this);
  }

  // Get the bounding range of the cells in this worksheet
  get dimensions() {
    const dimensions = new Range();
    this._rows.forEach(row => {
      if (row) {
        const rowDims = row.dimensions;
        if (rowDims) {
          dimensions.expand(row.number, rowDims.min, row.number, rowDims.max);
        }
      }
    });
    return dimensions;
  }

  // =========================================================================
  // Columns

  // get the current columns array.
  get columns() {
    return this._columns;
  }

  // set the columns from an array of column definitions.
  // Note: any headers defined will overwrite existing values.
  set columns(value) {
    // calculate max header row count
    this._headerRowCount = value.reduce((pv, cv) => {
      const headerCount = (cv.header && 1) || (cv.headers && cv.headers.length) || 0;
      return Math.max(pv, headerCount);
    }, 0);

    // construct Column objects
    let count = 1;
    const columns = (this._columns = []);
    value.forEach(defn => {
      const column = new Column(this, count++, false);
      columns.push(column);
      column.defn = defn;
    });
  }

  getColumnKey(key) {
    return this._keys[key];
  }

  setColumnKey(key, value) {
    this._keys[key] = value;
  }

  deleteColumnKey(key) {
    delete this._keys[key];
  }

  eachColumnKey(f) {
    _.each(this._keys, f);
  }

  // get a single column by col number. If it doesn't exist, create it and any gaps before it
  getColumn(c) {
    if (typeof c === 'string') {
      // if it matches a key'd column, return that
      const col = this._keys[c];
      if (col) return col;

      // otherwise, assume letter
      c = colCache.l2n(c);
    }
    if (!this._columns) {
      this._columns = [];
    }
    if (c > this._columns.length) {
      let n = this._columns.length + 1;
      while (n <= c) {
        this._columns.push(new Column(this, n++));
      }
    }
    return this._columns[c - 1];
  }

  spliceColumns(start, count, ...inserts) {
    const rows = this._rows;
    const nRows = rows.length;
    if (inserts.length > 0) {
      // must iterate over all rows whether they exist yet or not
      for (let i = 0; i < nRows; i++) {
        const rowArguments = [start, count];
        // eslint-disable-next-line no-loop-func
        inserts.forEach(insert => {
          rowArguments.push(insert[i] || null);
        });
        const row = this.getRow(i + 1);
        // eslint-disable-next-line prefer-spread
        row.splice.apply(row, rowArguments);
      }
    } else {
      // nothing to insert, so just splice all rows
      this._rows.forEach(r => {
        if (r) {
          r.splice(start, count);
        }
      });
    }

    // splice column definitions
    const nExpand = inserts.length - count;
    const nKeep = start + count;
    const nEnd = this._columns.length;
    if (nExpand < 0) {
      for (let i = start + inserts.length; i <= nEnd; i++) {
        this.getColumn(i).defn = this.getColumn(i - nExpand).defn;
      }
    } else if (nExpand > 0) {
      for (let i = nEnd; i >= nKeep; i--) {
        this.getColumn(i + nExpand).defn = this.getColumn(i).defn;
      }
    }
    for (let i = start; i < start + inserts.length; i++) {
      this.getColumn(i).defn = null;
    }

    // account for defined names
    this.workbook.definedNames.spliceColumns(this.name, start, count, inserts.length);
  }

  get lastColumn() {
    return this.getColumn(this.columnCount);
  }

  get columnCount() {
    let maxCount = 0;
    this.eachRow(row => {
      maxCount = Math.max(maxCount, row.cellCount);
    });
    return maxCount;
  }

  get actualColumnCount() {
    // performance nightmare - for each row, counts all the columns used
    const counts = [];
    let count = 0;
    this.eachRow(row => {
      row.eachCell(({col}) => {
        if (!counts[col]) {
          counts[col] = true;
          count++;
        }
      });
    });
    return count;
  }

  // =========================================================================
  // Rows

  _commitRow() {
    // nop - allows streaming reader to fill a document
  }

  get _lastRowNumber() {
    // need to cope with results of splice
    const rows = this._rows;
    let n = rows.length;
    while (n > 0 && rows[n - 1] === undefined) {
      n--;
    }
    return n;
  }

  get _nextRow() {
    return this._lastRowNumber + 1;
  }

  get lastRow() {
    if (this._rows.length) {
      return this._rows[this._rows.length - 1];
    }
    return undefined;
  }

  // find a row (if exists) by row number
  findRow(r) {
    return this._rows[r - 1];
  }

  // find multiple rows (if exists) by row number
  findRows(start, length) {
    return this._rows.slice(start - 1, start - 1 + length);
  }

  get rowCount() {
    return this._lastRowNumber;
  }

  get actualRowCount() {
    // counts actual rows that have actual data
    let count = 0;
    this.eachRow(() => {
      count++;
    });
    return count;
  }

  // get a row by row number.
  getRow(r) {
    let row = this._rows[r - 1];
    if (!row) {
      row = this._rows[r - 1] = new Row(this, r);
    }
    return row;
  }

  // get multiple rows by row number.
  getRows(start, length) {
    if (length < 1) return undefined;
    const rows = [];
    for (let i = start; i < start + length; i++) {
      rows.push(this.getRow(i));
    }
    return rows;
  }

  addRow(value, style = 'n') {
    const rowNo = this._nextRow;
    const row = this.getRow(rowNo);
    row.values = value;
    this._setStyleOption(rowNo, style[0] === 'i' ? style : 'n');
    return row;
  }

  addRows(value, style = 'n') {
    const rows = [];
    value.forEach(row => {
      rows.push(this.addRow(row, style));
    });
    return rows;
  }

  insertRow(pos, value, style = 'n') {
    this.spliceRows(pos, 0, value);
    this._setStyleOption(pos, style);
    return this.getRow(pos);
  }

  insertRows(pos, values, style = 'n') {
    this.spliceRows(pos, 0, ...values);
    if (style !== 'n') {
      // copy over the styles
      for (let i = 0; i < values.length; i++) {
        if (style[0] === 'o' && this.findRow(values.length + pos + i) !== undefined) {
          this._copyStyle(values.length + pos + i, pos + i, style[1] === '+');
        } else if (style[0] === 'i' && this.findRow(pos - 1) !== undefined) {
          this._copyStyle(pos - 1, pos + i, style[1] === '+');
        }
      }
    }
    return this.getRows(pos, values.length);
  }

  // set row at position to same style as of either pervious row (option 'i') or next row (option 'o')
  _setStyleOption(pos, style = 'n') {
    if (style[0] === 'o' && this.findRow(pos + 1) !== undefined) {
      this._copyStyle(pos + 1, pos, style[1] === '+');
    } else if (style[0] === 'i' && this.findRow(pos - 1) !== undefined) {
      this._copyStyle(pos - 1, pos, style[1] === '+');
    }
  }

  _copyStyle(src, dest, styleEmpty = false) {
    const rSrc = this.getRow(src);
    const rDst = this.getRow(dest);
    rDst.style = copyStyle(rSrc.style);
    // eslint-disable-next-line no-loop-func
    rSrc.eachCell({includeEmpty: styleEmpty}, (cell, colNumber) => {
      rDst.getCell(colNumber).style = copyStyle(cell.style);
    });
    rDst.height = rSrc.height;
  }

  duplicateRow(rowNum, count, insert = false) {
    // create count duplicates of rowNum
    // either inserting new or overwriting existing rows

    const rSrc = this._rows[rowNum - 1];
    const inserts = new Array(count).fill(rSrc.values);
    this.spliceRows(rowNum + 1, insert ? 0 : count, ...inserts);

    // now copy styles...
    for (let i = 0; i < count; i++) {
      const rDst = this._rows[rowNum + i];
      rDst.style = rSrc.style;
      rDst.height = rSrc.height;
      // eslint-disable-next-line no-loop-func
      rSrc.eachCell({includeEmpty: true}, (cell, colNumber) => {
        rDst.getCell(colNumber).style = cell.style;
      });
    }
  }

  spliceRows(start, count, ...inserts) {
    // same problem as row.splice, except worse.
    const nKeep = start + count;
    const nInserts = inserts.length;
    const nExpand = nInserts - count;
    const nEnd = this._rows.length;
    let i;
    let rSrc;
    if (nExpand < 0) {
      // remove rows
      if (start === nEnd) {
        this._rows[nEnd - 1] = undefined;
      }
      for (i = nKeep; i <= nEnd; i++) {
        rSrc = this._rows[i - 1];
        if (rSrc) {
          const rDst = this.getRow(i + nExpand);
          rDst.values = rSrc.values;
          rDst.style = rSrc.style;
          rDst.height = rSrc.height;
          // eslint-disable-next-line no-loop-func
          rSrc.eachCell({includeEmpty: true}, (cell, colNumber) => {
            rDst.getCell(colNumber).style = cell.style;
          });
          this._rows[i - 1] = undefined;
        } else {
          this._rows[i + nExpand - 1] = undefined;
        }
      }
    } else if (nExpand > 0) {
      // insert new cells
      for (i = nEnd; i >= nKeep; i--) {
        rSrc = this._rows[i - 1];
        if (rSrc) {
          const rDst = this.getRow(i + nExpand);
          rDst.values = rSrc.values;
          rDst.style = rSrc.style;
          rDst.height = rSrc.height;
          // eslint-disable-next-line no-loop-func
          rSrc.eachCell({includeEmpty: true}, (cell, colNumber) => {
            rDst.getCell(colNumber).style = cell.style;

            // remerge cells accounting for insert offset
            if (cell._value.constructor.name === 'MergeValue') {
              const cellToBeMerged = this.getRow(cell._row._number + nInserts).getCell(colNumber);
              const prevMaster = cell._value._master;
              const newMaster = this.getRow(prevMaster._row._number + nInserts).getCell(prevMaster._column._number);
              cellToBeMerged.merge(newMaster);
            }
          });
        } else {
          this._rows[i + nExpand - 1] = undefined;
        }
      }
    }

    // now copy over the new values
    for (i = 0; i < nInserts; i++) {
      const rDst = this.getRow(start + i);
      rDst.style = {};
      rDst.values = inserts[i];
    }

    // account for defined names
    this.workbook.definedNames.spliceRows(this.name, start, count, nInserts);
  }

  // iterate over every row in the worksheet, including maybe empty rows
  eachRow(options, iteratee) {
    if (!iteratee) {
      iteratee = options;
      options = undefined;
    }
    if (options && options.includeEmpty) {
      const n = this._rows.length;
      for (let i = 1; i <= n; i++) {
        iteratee(this.getRow(i), i);
      }
    } else {
      this._rows.forEach(row => {
        if (row && row.hasValues) {
          iteratee(row, row.number);
        }
      });
    }
  }

  // return all rows as sparse array
  getSheetValues() {
    const rows = [];
    this._rows.forEach(row => {
      if (row) {
        rows[row.number] = row.values;
      }
    });
    return rows;
  }

  // =========================================================================
  // Cells

  // returns the cell at [r,c] or address given by r. If not found, return undefined
  findCell(r, c) {
    const address = colCache.getAddress(r, c);
    const row = this._rows[address.row - 1];
    return row ? row.findCell(address.col) : undefined;
  }

  // return the cell at [r,c] or address given by r. If not found, create a new one.
  getCell(r, c) {
    const address = colCache.getAddress(r, c);
    const row = this.getRow(address.row);
    return row.getCellEx(address);
  }

  // =========================================================================
  // Merge

  // convert the range defined by ['tl:br'], [tl,br] or [t,l,b,r] into a single 'merged' cell
  mergeCells(...cells) {
    const dimensions = new Range(cells);
    this._mergeCellsInternal(dimensions);
  }

  mergeCellsWithoutStyle(...cells) {
    const dimensions = new Range(cells);
    this._mergeCellsInternal(dimensions, true);
  }

  _mergeCellsInternal(dimensions, ignoreStyle) {
    // check cells aren't already merged
    _.each(this._merges, merge => {
      if (merge.intersects(dimensions)) {
        throw new Error('Cannot merge already merged cells');
      }
    });

    // apply merge
    const master = this.getCell(dimensions.top, dimensions.left);
    for (let i = dimensions.top; i <= dimensions.bottom; i++) {
      for (let j = dimensions.left; j <= dimensions.right; j++) {
        // merge all but the master cell
        if (i > dimensions.top || j > dimensions.left) {
          this.getCell(i, j).merge(master, ignoreStyle);
        }
      }
    }

    // index merge
    this._merges[master.address] = dimensions;
  }

  _unMergeMaster(master) {
    // master is always top left of a rectangle
    const merge = this._merges[master.address];
    if (merge) {
      for (let i = merge.top; i <= merge.bottom; i++) {
        for (let j = merge.left; j <= merge.right; j++) {
          this.getCell(i, j).unmerge();
        }
      }
      delete this._merges[master.address];
    }
  }

  get hasMerges() {
    // return true if this._merges has a merge object
    return _.some(this._merges, Boolean);
  }

  // scan the range defined by ['tl:br'], [tl,br] or [t,l,b,r] and if any cell is part of a merge,
  // un-merge the group. Note this function can affect multiple merges and merge-blocks are
  // atomic - either they're all merged or all un-merged.
  unMergeCells(...cells) {
    const dimensions = new Range(cells);

    // find any cells in that range and unmerge them
    for (let i = dimensions.top; i <= dimensions.bottom; i++) {
      for (let j = dimensions.left; j <= dimensions.right; j++) {
        const cell = this.findCell(i, j);
        if (cell) {
          if (cell.type === Enums.ValueType.Merge) {
            // this cell merges to another master
            this._unMergeMaster(cell.master);
          } else if (this._merges[cell.address]) {
            // this cell is a master
            this._unMergeMaster(cell);
          }
        }
      }
    }
  }

  // ===========================================================================
  // Shared/Array Formula
  fillFormula(range, formula, results, shareType = 'shared') {
    // Define formula for top-left cell and share to rest
    const decoded = colCache.decode(range);
    const {top, left, bottom, right} = decoded;
    const width = right - left + 1;
    const masterAddress = colCache.encodeAddress(top, left);
    const isShared = shareType === 'shared';

    // work out result accessor
    let getResult;
    if (typeof results === 'function') {
      getResult = results;
    } else if (Array.isArray(results)) {
      if (Array.isArray(results[0])) {
        getResult = (row, col) => results[row - top][col - left];
      } else {
        // eslint-disable-next-line no-mixed-operators
        getResult = (row, col) => results[(row - top) * width + (col - left)];
      }
    } else {
      getResult = () => undefined;
    }
    let first = true;
    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (first) {
          this.getCell(r, c).value = {
            shareType,
            formula,
            ref: range,
            result: getResult(r, c),
          };
          first = false;
        } else {
          this.getCell(r, c).value = isShared
            ? {
                sharedFormula: masterAddress,
                result: getResult(r, c),
              }
            : getResult(r, c);
        }
      }
    }
  }

  // =========================================================================
  // Images
  addImage(imageId, range) {
    const model = {
      type: 'image',
      imageId,
      range,
    };
    this._media.push(new Image(this, model));
  }

  getImages() {
    return this._media.filter(m => m.type === 'image');
  }

  addBackgroundImage(imageId) {
    const model = {
      type: 'background',
      imageId,
    };
    this._media.push(new Image(this, model));
  }

  getBackgroundImageId() {
    const image = this._media.find(m => m.type === 'background');
    return image && image.imageId;
  }

  // =========================================================================
  // Worksheet Protection
  protect(password, options) {
    // TODO: make this function truly async
    // perhaps marshal to worker thread or something
    return new Promise(resolve => {
      this.sheetProtection = {
        sheet: true,
      };
      if (options && 'spinCount' in options) {
        // force spinCount to be integer >= 0
        options.spinCount = Number.isFinite(options.spinCount) ? Math.round(Math.max(0, options.spinCount)) : 100000;
      }
      if (password) {
        this.sheetProtection.algorithmName = 'SHA-512';
        this.sheetProtection.saltValue = Encryptor.randomBytes(16).toString('base64');
        this.sheetProtection.spinCount = options && 'spinCount' in options ? options.spinCount : 100000; // allow user specified spinCount
        this.sheetProtection.hashValue = Encryptor.convertPasswordToHash(
          password,
          'SHA512',
          this.sheetProtection.saltValue,
          this.sheetProtection.spinCount
        );
      }
      if (options) {
        this.sheetProtection = Object.assign(this.sheetProtection, options);
        if (!password && 'spinCount' in options) {
          delete this.sheetProtection.spinCount;
        }
      }
      resolve();
    });
  }

  unprotect() {
    this.sheetProtection = null;
  }

  // =========================================================================
  // Tables
  addTable(model) {
    const table = new Table(this, model);
    this.tables[model.name] = table;
    return table;
  }

  getTable(name) {
    return this.tables[name];
  }

  removeTable(name) {
    delete this.tables[name];
  }

  getTables() {
    return Object.values(this.tables);
  }

  // =========================================================================
  // Pivot Tables
  addPivotTable(model) {
    // eslint-disable-next-line no-console
    console.warn(
      `Warning: Pivot Table support is experimental.
Please leave feedback at https://github.com/exceljs/exceljs/discussions/2575`
    );

    const pivotTable = makePivotTable(this, model);

    this.pivotTables.push(pivotTable);
    this.workbook.pivotTables.push(pivotTable);

    return pivotTable;
  }

  // ===========================================================================
  // Conditional Formatting
  addConditionalFormatting(cf) {
    this.conditionalFormattings.push(cf);
  }

  removeConditionalFormatting(filter) {
    if (typeof filter === 'number') {
      this.conditionalFormattings.splice(filter, 1);
    } else if (filter instanceof Function) {
      this.conditionalFormattings = this.conditionalFormattings.filter(filter);
    } else {
      this.conditionalFormattings = [];
    }
  }

  // ===========================================================================
  // Deprecated
  get tabColor() {
    // eslint-disable-next-line no-console
    console.trace('worksheet.tabColor property is now deprecated. Please use worksheet.properties.tabColor');
    return this.properties.tabColor;
  }

  set tabColor(value) {
    // eslint-disable-next-line no-console
    console.trace('worksheet.tabColor property is now deprecated. Please use worksheet.properties.tabColor');
    this.properties.tabColor = value;
  }

  // ===========================================================================
  // Model

  get model() {
    const model = {
      id: this.id,
      name: this.name,
      dataValidations: this.dataValidations.model,
      properties: this.properties,
      state: this.state,
      pageSetup: this.pageSetup,
      headerFooter: this.headerFooter,
      rowBreaks: this.rowBreaks,
      views: this.views,
      autoFilter: this.autoFilter,
      media: this._media.map(medium => medium.model),
      sheetProtection: this.sheetProtection,
      tables: Object.values(this.tables).map(table => table.model),
      pivotTables: this.pivotTables,
      conditionalFormattings: this.conditionalFormattings,
    };

    // =================================================
    // columns
    model.cols = Column.toModel(this.columns);

    // ==========================================================
    // Rows
    const rows = (model.rows = []);
    const dimensions = (model.dimensions = new Range());
    this._rows.forEach(row => {
      const rowModel = row && row.model;
      if (rowModel) {
        dimensions.expand(rowModel.number, rowModel.min, rowModel.number, rowModel.max);
        rows.push(rowModel);
      }
    });

    // ==========================================================
    // Merges
    model.merges = [];
    _.each(this._merges, merge => {
      model.merges.push(merge.range);
    });

    return model;
  }

  _parseRows(model) {
    this._rows = [];
    model.rows.forEach(rowModel => {
      const row = new Row(this, rowModel.number);
      this._rows[row.number - 1] = row;
      row.model = rowModel;
    });
  }

  _parseMergeCells(model) {
    _.each(model.mergeCells, merge => {
      // Do not merge styles when importing an Excel file
      // since each cell may have different styles intentionally.
      this.mergeCellsWithoutStyle(merge);
    });
  }

  set model(value) {
    this.name = value.name;
    this._columns = Column.fromModel(this, value.cols);
    this._parseRows(value);

    this._parseMergeCells(value);
    this.dataValidations = new DataValidations(value.dataValidations);
    this.properties = value.properties;
    this.pageSetup = value.pageSetup;
    this.headerFooter = value.headerFooter;
    this.views = value.views;
    this.autoFilter = value.autoFilter;
    this._media = value.media.map(medium => new Image(this, medium));
    this.sheetProtection = value.sheetProtection;
    this.tables = value.tables.reduce((tables, table) => {
      // Fix the table data structure for Excel compatibility
      if (table.tableRef && !table.ref) {
        table.ref = table.tableRef; // Map tableRef to ref
      }
      // Add empty rows array if missing (Excel tables don't include row data in the table definition)
      if (!table.rows) {
        table.rows = [];
      }
      // Fix headerRow detection - if columns have names, there should be a header row
      if (!table.headerRow && table.columns && table.columns.length > 0) {
        const hasColumnNames = table.columns.some(col => col.name && col.name.length > 0);
        if (hasColumnNames) {
          table.headerRow = true;
        }
      }
      // Enable filter buttons on columns when table has autoFilterRef
      if (table.autoFilterRef && table.columns) {
        for (const column of table.columns) {
          // Set filterButton to true if not explicitly set to false
          if (column.filterButton === undefined) {
            column.filterButton = true;
          }
        }
      }
      const t = new Table(this, table);
      t.model = table;
      tables[table.name] = t;

      return tables;
    }, {});
    this.pivotTables = value.pivotTables;
    this.conditionalFormattings = value.conditionalFormattings;
  }
}

module.exports = Worksheet;
