const XmlStream = require('../../../utils/xml-stream');

const BaseXform = require('../base-xform');

class PivotCacheRecordsXform extends BaseXform {
  constructor() {
    super();

    this.map = {};
  }

  prepare(model) {
    // TK
  }

  get tag() {
    // http://www.datypic.com/sc/ooxml/e-ssml_pivotCacheRecords.html
    return 'pivotCacheRecords';
  }

  render(xmlStream, model) {
    const {sourceSheet, cacheFields} = model;
    const sourceBodyRows = sourceSheet.getSheetValues().slice(2);

    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode(this.tag, {
      ...PivotCacheRecordsXform.PIVOT_CACHE_RECORDS_ATTRIBUTES,
      count: sourceBodyRows.length,
    });
    xmlStream.writeXml(renderTable());
    xmlStream.closeNode();

    // Helpers

    function renderTable() {
      const rowsInXML = sourceBodyRows.map(row => {
        const realRow = row.slice(1);
        return [...renderRowLines(realRow)].join('');
      });
      return rowsInXML.join('');
    }

    function* renderRowLines(row) {
      // PivotCache Record: http://www.datypic.com/sc/ooxml/e-ssml_r-1.html
      // Note: pretty-printing this for now to ease debugging.
      yield '\n  <r>';
      for (const [index, cellValue] of row.entries()) {
        yield '\n    ';
        yield renderCell(cellValue, cacheFields[index].sharedItems);
      }
      yield '\n  </r>';
    }

    function renderCell(value, sharedItems) {
      // no shared items
      // --------------------------------------------------
      if (sharedItems === null) {
        if (Number.isFinite(value)) {
          // Numeric value: http://www.datypic.com/sc/ooxml/e-ssml_n-2.html
          return `<n v="${value}" />`;
        }
          // Character Value: http://www.datypic.com/sc/ooxml/e-ssml_s-2.html
          return `<s v="${value}" />`;
        
      }

      // shared items
      // --------------------------------------------------
      const sharedItemsIndex = sharedItems.indexOf(value);
      if (sharedItemsIndex < 0) {
        throw new Error(`${JSON.stringify(value)} not in sharedItems ${JSON.stringify(sharedItems)}`);
      }
      // Shared Items Index: http://www.datypic.com/sc/ooxml/e-ssml_x-9.html
      return `<x v="${sharedItemsIndex}" />`;
    }
  }

  parseOpen(node) {
    // TK
  }

  parseText(text) {
    // TK
  }

  parseClose(name) {
    // TK
  }

  reconcile(model, options) {
    // TK
  }
}

PivotCacheRecordsXform.PIVOT_CACHE_RECORDS_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'mc:Ignorable': 'xr',
  'xmlns:xr': 'http://schemas.microsoft.com/office/spreadsheetml/2014/revision',
};

module.exports = PivotCacheRecordsXform;
