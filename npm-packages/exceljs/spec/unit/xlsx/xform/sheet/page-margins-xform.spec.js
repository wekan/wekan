const testXformHelper = require('../test-xform-helper');

const PageMarginsXform = verquire('xlsx/xform/sheet/page-margins-xform');

const expectations = [
  {
    title: 'normal',
    create() {
      return new PageMarginsXform();
    },
    preparedModel: {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
    xml:
      '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>',
    parsedModel: {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('PageMarginsXform', () => {
  testXformHelper(expectations);
});
