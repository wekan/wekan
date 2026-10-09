const testXformHelper = require('../test-xform-helper');

const TableStyleInfoXform = verquire('xlsx/xform/table/table-style-info-xform');

const expectations = [
  {
    title: 'row',
    create() {
      return new TableStyleInfoXform();
    },
    preparedModel: {
      theme: 'TableStyle',
      showFirstColumn: false,
      showLastColumn: false,
      showRowStripes: true,
      showColumnStripes: false,
    },
    xml:
      '<tableStyleInfo name="TableStyle" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0" />',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'col',
    create() {
      return new TableStyleInfoXform();
    },
    preparedModel: {
      theme: null,
      showFirstColumn: true,
      showLastColumn: true,
      showRowStripes: false,
      showColumnStripes: true,
    },
    xml:
      '<tableStyleInfo showFirstColumn="1" showLastColumn="1" showRowStripes="0" showColumnStripes="1" />',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('TableStyleInfoXform', () => {
  testXformHelper(expectations);
});
