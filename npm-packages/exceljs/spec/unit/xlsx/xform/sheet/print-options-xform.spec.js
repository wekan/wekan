const testXformHelper = require('../test-xform-helper');

const PrintOptionsXform = verquire('xlsx/xform/sheet/print-options-xform');

const expectations = [
  {
    title: 'empty',
    create() {
      return new PrintOptionsXform();
    },
    preparedModel: {},
    xml: '',
    parsedModel: {},
    tests: ['render', 'renderIn'],
  },
  {
    title: 'gridlines',
    create() {
      return new PrintOptionsXform();
    },
    preparedModel: {showGridLines: true},
    xml: '<printOptions gridLines="1"/>',
    parsedModel: {
      showGridLines: true,
      showRowColHeaders: false,
      horizontalCentered: false,
      verticalCentered: false,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'headers',
    create() {
      return new PrintOptionsXform();
    },
    preparedModel: {showRowColHeaders: true},
    xml: '<printOptions headings="1"/>',
    parsedModel: {
      showGridLines: false,
      showRowColHeaders: true,
      horizontalCentered: false,
      verticalCentered: false,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'centered',
    create() {
      return new PrintOptionsXform();
    },
    preparedModel: {horizontalCentered: true, verticalCentered: true},
    xml: '<printOptions horizontalCentered="1" verticalCentered="1"/>',
    parsedModel: {
      showGridLines: false,
      showRowColHeaders: false,
      horizontalCentered: true,
      verticalCentered: true,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('PrintOptionsXform', () => {
  testXformHelper(expectations);
});
