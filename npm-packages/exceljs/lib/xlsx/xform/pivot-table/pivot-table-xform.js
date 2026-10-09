const XmlStream = require('../../../utils/xml-stream');
const BaseXform = require('../base-xform');

class PivotTableXform extends BaseXform {
  constructor() {
    super();

    this.map = {};
  }

  prepare(model) {
    // TK
  }

  get tag() {
    // http://www.datypic.com/sc/ooxml/e-ssml_pivotTableDefinition.html
    return 'pivotTableDefinition';
  }

  render(xmlStream, model) {
    // eslint-disable-next-line no-unused-vars
    const {rows, columns, values, metric, cacheFields, cacheId} = model;

    // Examples
    // --------
    // rows: [0, 1], // only 2 items possible for now
    // columns: [2], // only 1 item possible for now
    // values: [4], // only 1 item possible for now
    // metric: 'sum', // only 'sum' possible for now
    //
    // the numbers are indices into `cacheFields`.

    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode(this.tag, {
      ...PivotTableXform.PIVOT_TABLE_ATTRIBUTES,
      'xr:uid': '{267EE50F-B116-784D-8DC2-BA77DE3F4F4A}',
      name: 'PivotTable2',
      cacheId,
      applyNumberFormats: '0',
      applyBorderFormats: '0',
      applyFontFormats: '0',
      applyPatternFormats: '0',
      applyAlignmentFormats: '0',
      applyWidthHeightFormats: '1',
      dataCaption: 'Values',
      updatedVersion: '8',
      minRefreshableVersion: '3',
      useAutoFormatting: '1',
      itemPrintTitles: '1',
      createdVersion: '8',
      indent: '0',
      compact: '0',
      compactData: '0',
      multipleFieldFilters: '0',
    });

    // Note: keeping this pretty-printed and verbose for now to ease debugging.
    //
    // location: ref="A3:E15"
    // pivotFields
    // rowFields and rowItems
    // colFields and colItems
    // dataFields
    // pivotTableStyleInfo
    xmlStream.writeXml(`
      <location ref="A3:E15" firstHeaderRow="1" firstDataRow="2" firstDataCol="1" />
      <pivotFields count="${cacheFields.length}">
        ${renderPivotFields(model)}
      </pivotFields>
      <rowFields count="${rows.length}">
        ${rows.map(rowIndex => `<field x="${rowIndex}" />`).join('\n    ')}
      </rowFields>
      <rowItems count="1">
        <i t="grand"><x /></i>
      </rowItems>
      <colFields count="${columns.length}">
        ${columns.map(columnIndex => `<field x="${columnIndex}" />`).join('\n    ')}
      </colFields>
      <colItems count="1">
        <i t="grand"><x /></i>
      </colItems>
      <dataFields count="${values.length}">
        <dataField
          name="Sum of ${cacheFields[values[0]].name}"
          fld="${values[0]}"
          baseField="0"
          baseItem="0"
        />
      </dataFields>
      <pivotTableStyleInfo
        name="PivotStyleLight16"
        showRowHeaders="1"
        showColHeaders="1"
        showRowStripes="0"
        showColStripes="0"
        showLastColumn="1"
      />
      <extLst>
        <ext
          uri="{962EF5D1-5CA2-4c93-8EF4-DBF5C05439D2}"
          xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"
        >
          <x14:pivotTableDefinition
            hideValuesRow="1"
            xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main"
          />
        </ext>
        <ext
          uri="{747A6164-185A-40DC-8AA5-F01512510D54}"
          xmlns:xpdl="http://schemas.microsoft.com/office/spreadsheetml/2016/pivotdefaultlayout"
        >
          <xpdl:pivotTableDefinition16
            EnabledSubtotalsDefault="0"
            SubtotalsOnTopDefault="0"
          />
        </ext>
      </extLst>
    `);

    xmlStream.closeNode();
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

// Helpers

function renderPivotFields(pivotTable) {
  /* eslint-disable no-nested-ternary */
  return pivotTable.cacheFields
    .map((cacheField, fieldIndex) => {
      const fieldType =
        pivotTable.rows.indexOf(fieldIndex) >= 0
          ? 'row'
          : pivotTable.columns.indexOf(fieldIndex) >= 0
          ? 'column'
          : pivotTable.values.indexOf(fieldIndex) >= 0
          ? 'value'
          : null;
      return renderPivotField(fieldType, cacheField.sharedItems);
    })
    .join('');
}

function renderPivotField(fieldType, sharedItems) {
  // fieldType: 'row', 'column', 'value', null

  const defaultAttributes = 'compact="0" outline="0" showAll="0" defaultSubtotal="0"';

  if (fieldType === 'row' || fieldType === 'column') {
    const axis = fieldType === 'row' ? 'axisRow' : 'axisCol';
    return `
      <pivotField axis="${axis}" ${defaultAttributes}>
        <items count="${sharedItems.length + 1}">
          ${sharedItems.map((item, index) => `<item x="${index}" />`).join('\n              ')}
        </items>
      </pivotField>
    `;
  }
  return `
    <pivotField
      ${fieldType === 'value' ? 'dataField="1"' : ''}
      ${defaultAttributes}
    />
  `;
}

PivotTableXform.PIVOT_TABLE_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'mc:Ignorable': 'xr',
  'xmlns:xr': 'http://schemas.microsoft.com/office/spreadsheetml/2014/revision',
};

module.exports = PivotTableXform;
