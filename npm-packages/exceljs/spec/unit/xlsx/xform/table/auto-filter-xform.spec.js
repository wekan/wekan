const testXformHelper = require('../test-xform-helper');

const AutoFilterXform = verquire('xlsx/xform/table/auto-filter-xform');

const expectations = [
  {
    title: 'showing filter',
    create() {
      return new AutoFilterXform();
    },
    initialModel: {
      autoFilterRef: 'A1:B10',
      columns: [
        {filterButton: false},
        {filterButton: true},
        {filterButton: true},
      ],
    },
    preparedModel: {
      autoFilterRef: 'A1:B10',
      columns: [
        {colId: '0', filterButton: false},
        {colId: '1', filterButton: true},
        {colId: '2', filterButton: true},
      ],
    },
    xml:
      '<autoFilter ref="A1:B10">' +
      '<filterColumn colId="0" hiddenButton="1" />' +
      '<filterColumn colId="1" hiddenButton="0" />' +
      '<filterColumn colId="2" hiddenButton="0" />' +
      '</autoFilter>',
    get parsedModel() {
      return this.initialModel;
    },
    tests: ['prepare', 'render', 'renderIn', 'parse'],
  },
];

describe('AutoFilterXform', () => {
  testXformHelper(expectations);
});
